const { Router } = require('express')
const prisma = require('../lib/prisma')
const { authMiddleware, authOpcional } = require('../middleware/auth')
const { enviarConfirmacionCompra } = require('../services/email')

const router = Router()


// POST /api/ordenes — crea una orden (guest o usuario logueado)
router.post('/', authOpcional, async (req, res, next) => {
  try {
    const { items, nombre, email, telefono, entregaId, domicilio, cuponId, aplicarDescuentoBienvenida } = req.body

    if (!items?.length) return res.status(400).json({ mensaje: 'El carrito está vacío' })
    if (!nombre || !email) return res.status(400).json({ mensaje: 'Nombre y email son requeridos' })
    if (!entregaId) return res.status(400).json({ mensaje: 'Seleccioná una opción de entrega' })

    const entrega = await prisma.entrega.findUnique({ where: { id: entregaId } })
    if (!entrega || !entrega.activo) return res.status(400).json({ mensaje: 'Opción de entrega no válida' })

    if (entrega.tipo === 'ENVIO' && (!domicilio?.calle || !domicilio?.ciudad)) {
      return res.status(400).json({ mensaje: 'Completá la dirección de envío' })
    }

    // Verificar stock y obtener variantes
    const varianteIds = items.map(i => i.varianteId)
    const variantes = await prisma.variante.findMany({ where: { id: { in: varianteIds } } })

    for (const item of items) {
      const variante = variantes.find(v => v.id === item.varianteId)
      if (!variante) return res.status(400).json({ mensaje: `Variante ${item.varianteId} no encontrada` })
      if (variante.stock < item.cantidad) {
        return res.status(400).json({ mensaje: `Stock insuficiente para el talle ${variante.talle}` })
      }
    }

    const subtotal = items.reduce((acc, i) => acc + i.precioUnit * i.cantidad, 0)
    const costoEnvio = Number(entrega.costo)

    // Descuento de bienvenida (primera compra)
    let descuentoBienvenida = 0
    if (aplicarDescuentoBienvenida) {
      const ordenesPrevias = await prisma.orden.count({
        where: {
          OR: [
            { emailGuest: email.toLowerCase() },
            { usuario: { email: email.toLowerCase() } },
          ],
          estado: { not: 'CANCELADA' },
        },
      })
      if (ordenesPrevias === 0) {
        descuentoBienvenida = Math.round(subtotal * 20 / 100)
      }
    }

    // Validar cupón si se envió
    let descuento = descuentoBienvenida
    let cuponValido = null
    if (cuponId) {
      cuponValido = await prisma.cupon.findUnique({ where: { id: cuponId } })
      if (cuponValido && cuponValido.activo) {
        const descuentoCupon = cuponValido.tipo === 'PORCENTAJE'
          ? Math.round(subtotal * Number(cuponValido.valor) / 100)
          : Math.min(Number(cuponValido.valor), subtotal)
        descuento = descuentoBienvenida + descuentoCupon
      }
    }

    const total = subtotal + costoEnvio - descuento

    // Crear orden y descontar stock en una transacción atómica
    const orden = await prisma.$transaction(async (tx) => {
      const nuevaOrden = await tx.orden.create({
        data: {
          usuarioId: req.user?.id ?? null,
          emailGuest: req.user ? null : email,
          nombreGuest: req.user ? null : nombre,
          telefonoGuest: telefono ?? null,
          entregaId,
          domicilio: entrega.tipo === 'ENVIO' ? domicilio : null,
          subtotal,
          costoEnvio,
          descuento,
          total,
          cuponId: cuponValido ? cuponId : null,
          estado: 'PENDIENTE',
          items: {
            create: items.map(i => ({
              productoId: i.productoId,
              varianteId: i.varianteId,
              cantidad: i.cantidad,
              precioUnit: i.precioUnit,
              subtotal: i.precioUnit * i.cantidad,
            })),
          },
        },
        include: { items: true },
      })

      // Descontar stock
      for (const item of items) {
        await tx.variante.update({
          where: { id: item.varianteId },
          data: { stock: { decrement: item.cantidad } },
        })
      }

      // Incrementar usos del cupón
      if (cuponValido) {
        await tx.cupon.update({ where: { id: cuponId }, data: { usosActuales: { increment: 1 } } })
      }

      return nuevaOrden
    })

    // Enviar email de confirmación (no bloqueante)
    prisma.orden.findUnique({
      where: { id: orden.id },
      include: {
        usuario: { select: { email: true, nombre: true } },
        items: {
          include: {
            producto: { select: { nombre: true } },
            variante: { select: { talle: true, color: true } },
          },
        },
        entrega: true,
      },
    }).then(ordenCompleta => {
      if (ordenCompleta) enviarConfirmacionCompra({ ...ordenCompleta, emailGuest: email, nombreGuest: nombre })
    })

    res.status(201).json({ id: orden.id, numero: orden.numero })
  } catch (err) { next(err) }
})

// GET /api/ordenes/primera-compra?email=xxx
router.get('/primera-compra', async (req, res, next) => {
  try {
    const { email } = req.query
    if (!email) return res.json({ aplica: false })
    const count = await prisma.orden.count({
      where: {
        OR: [
          { emailGuest: email.toLowerCase() },
          { usuario: { email: email.toLowerCase() } },
        ],
        estado: { not: 'CANCELADA' },
      },
    })
    res.json({ aplica: count === 0, descuentoPct: 20 })
  } catch (err) { next(err) }
})

// GET /api/ordenes/mis-ordenes — historial del usuario logueado
router.get('/mis-ordenes', authMiddleware, async (req, res, next) => {
  try {
    const ordenes = await prisma.orden.findMany({
      where: { usuarioId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            producto: { select: { nombre: true, imagenes: { take: 1, orderBy: { orden: 'asc' } } } },
            variante: { select: { talle: true, color: true } },
          },
        },
        entrega: { select: { nombre: true, tipo: true } },
      },
    })
    res.json(ordenes)
  } catch (err) { next(err) }
})

// GET /api/ordenes/:id — ver detalle de una orden (guest o usuario)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const orden = await prisma.orden.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            producto: { select: { nombre: true, imagenes: { take: 1, orderBy: { orden: 'asc' } } } },
            variante: { select: { talle: true, color: true } },
          },
        },
        entrega: true,
      },
    })
    if (!orden) return res.status(404).json({ mensaje: 'Orden no encontrada' })
    res.json(orden)
  } catch (err) { next(err) }
})

module.exports = router
