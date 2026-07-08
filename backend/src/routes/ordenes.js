const { Router } = require('express')
const prisma = require('../lib/prisma')
const { authMiddleware, authOpcional } = require('../middleware/auth')
const { enviarConfirmacionCompra } = require('../services/email')
const { notificarNuevoPedido } = require('../services/notificaciones')
const { esRosario } = require('../lib/envios')

const router = Router()

// Estados que cuentan como compra concretada: solo una compra pagada
// (o posterior) quema el descuento de bienvenida.
const ESTADOS_COMPRA = ['PAGADA', 'PREPARANDO', 'LISTA', 'ENTREGADA']
const DESCUENTO_BIENVENIDA_PCT = 20

async function esPrimeraCompra(email) {
  const emailNorm = email.trim().toLowerCase()
  const comprasPrevias = await prisma.orden.count({
    where: {
      OR: [
        // emailGuest histórico puede estar guardado sin normalizar
        { emailGuest: { equals: emailNorm, mode: 'insensitive' } },
        { usuario: { email: { equals: emailNorm, mode: 'insensitive' } } },
      ],
      estado: { in: ESTADOS_COMPRA },
    },
  })
  return comprasPrevias === 0
}


// POST /api/ordenes — crea una orden (guest o usuario logueado)
router.post('/', authOpcional, async (req, res, next) => {
  try {
    const { items, nombre, email, telefono, entregaId, domicilio, cuponId } = req.body

    if (!items?.length) return res.status(400).json({ mensaje: 'El carrito está vacío' })
    if (!nombre || !email) return res.status(400).json({ mensaje: 'Nombre y email son requeridos' })
    if (!entregaId) return res.status(400).json({ mensaje: 'Seleccioná una opción de entrega' })

    const entrega = await prisma.entrega.findUnique({ where: { id: entregaId } })
    if (!entrega || !entrega.activo) return res.status(400).json({ mensaje: 'Opción de entrega no válida' })

    if (entrega.tipo === 'ENVIO' && (!domicilio?.calle || !domicilio?.ciudad)) {
      return res.status(400).json({ mensaje: 'Completá la dirección de envío' })
    }

    // Verificar stock y obtener variantes con precio real de la DB
    const varianteIds = items.map(i => i.varianteId)
    const variantes = await prisma.variante.findMany({
      where: { id: { in: varianteIds } },
      include: { producto: { select: { precio: true, precioOferta: true, activo: true } } },
    })

    for (const item of items) {
      const variante = variantes.find(v => v.id === item.varianteId)
      if (!variante) return res.status(400).json({ mensaje: `Variante ${item.varianteId} no encontrada` })
      if (!variante.producto.activo) return res.status(400).json({ mensaje: `Producto no disponible` })
      if (variante.stock < item.cantidad) {
        return res.status(400).json({ mensaje: `Stock insuficiente para el talle ${variante.talle}` })
      }
    }

    // Precio: variante.precio > producto.precioOferta > producto.precio
    const subtotal = items.reduce((acc, i) => {
      const variante = variantes.find(v => v.id === i.varianteId)
      const precio = Number(variante.precio ?? variante.producto.precioOferta ?? variante.producto.precio)
      return acc + precio * i.cantidad
    }, 0)
    // Envío gratis dentro de Rosario, siempre
    const costoEnvio = entrega.tipo === 'ENVIO' && esRosario(domicilio?.ciudad)
      ? 0
      : Number(entrega.costo)

    // Descuento de bienvenida (primera compra): lo decide SIEMPRE el servidor
    // según el historial del email, nunca un flag del cliente.
    const descuentoBienvenida = (await esPrimeraCompra(email))
      ? Math.round(subtotal * DESCUENTO_BIENVENIDA_PCT / 100)
      : 0

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
          emailGuest: req.user ? null : email.trim().toLowerCase(),
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
            create: items.map(i => {
              const variante = variantes.find(v => v.id === i.varianteId)
              const precioUnit = Number(variante.precio ?? variante.producto.precioOferta ?? variante.producto.precio)
              return {
                productoId: variante.productoId,
                varianteId: i.varianteId,
                cantidad: i.cantidad,
                precioUnit,
                subtotal: precioUnit * i.cantidad,
              }
            }),
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

    // Notificaciones post-orden (no bloqueantes)
    prisma.orden.findUnique({
      where: { id: orden.id },
      include: {
        usuario: { select: { email: true, nombre: true, telefono: true } },
        items: {
          include: {
            producto: { select: { nombre: true } },
            variante: { select: { talle: true, color: true } },
          },
        },
        entrega: true,
      },
    }).then(ordenCompleta => {
      if (!ordenCompleta) return
      const datos = { ...ordenCompleta, emailGuest: email, nombreGuest: nombre, telefonoGuest: telefono }
      enviarConfirmacionCompra(datos)
      notificarNuevoPedido(datos)
    })

    res.status(201).json({ id: orden.id, numero: orden.numero })
  } catch (err) { next(err) }
})

// GET /api/ordenes/primera-compra?email=xxx
router.get('/primera-compra', async (req, res, next) => {
  try {
    const { email } = req.query
    if (!email) return res.json({ aplica: false })
    const aplica = await esPrimeraCompra(email)
    res.json({ aplica, descuentoPct: DESCUENTO_BIENVENIDA_PCT })
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

// GET /api/ordenes/:id — ver detalle de una orden (guest o usuario logueado)
router.get('/:id', authOpcional, async (req, res, next) => {
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
    // Si hay usuario logueado, verificar que la orden le pertenece
    if (req.user && orden.usuarioId && orden.usuarioId !== req.user.id) {
      return res.status(403).json({ mensaje: 'No tenés acceso a esta orden' })
    }
    res.json(orden)
  } catch (err) { next(err) }
})

module.exports = router
