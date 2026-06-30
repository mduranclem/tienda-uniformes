const { Router } = require('express')
const prisma = require('../../lib/prisma')
const { authMiddleware } = require('../../middleware/auth')
const adminOnly = require('../../middleware/adminOnly')

const router = Router()

router.use(authMiddleware, adminOnly)

const ESTADOS_VALIDOS = ['PENDIENTE', 'PAGADA', 'PREPARANDO', 'LISTA', 'ENTREGADA', 'CANCELADA']

// GET /api/admin/ordenes?estado=&page=&limit=
router.get('/', async (req, res, next) => {
  try {
    const { estado, page = 1, limit = 20 } = req.query
    const take = Math.min(Number(limit), 100)
    const skip = (Number(page) - 1) * take
    const where = estado ? { estado } : {}

    const [total, ordenes] = await Promise.all([
      prisma.orden.count({ where }),
      prisma.orden.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          usuario: { select: { email: true, nombre: true } },
          items: {
            include: {
              producto: { select: { nombre: true } },
              variante: { select: { talle: true, color: true } },
            },
          },
          entrega: { select: { nombre: true, tipo: true } },
        },
      }),
    ])

    res.json({ data: ordenes, total, page: Number(page), limit: take })
  } catch (err) { next(err) }
})

// GET /api/admin/ordenes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const orden = await prisma.orden.findUnique({
      where: { id: req.params.id },
      include: {
        usuario: { select: { email: true, nombre: true, telefono: true } },
        items: {
          include: {
            producto: { select: { id: true, nombre: true } },
            variante: { select: { talle: true, color: true } },
          },
        },
        entrega: true,
        cupon: { select: { codigo: true } },
        historial: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!orden) return res.status(404).json({ mensaje: 'Orden no encontrada' })
    res.json(orden)
  } catch (err) { next(err) }
})

// PUT /api/admin/ordenes/:id/estado
router.put('/:id/estado', async (req, res, next) => {
  try {
    const { estado, nota } = req.body
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ mensaje: `Estado inválido. Válidos: ${ESTADOS_VALIDOS.join(', ')}` })
    }

    const orden = await prisma.$transaction(async (tx) => {
      const actual = await tx.orden.findUnique({
        where: { id: req.params.id },
        include: { items: true },
      })
      if (!actual) throw Object.assign(new Error('Orden no encontrada'), { status: 404 })

      // Al cancelar, restaurar stock (solo si no estaba ya cancelada)
      if (estado === 'CANCELADA' && actual.estado !== 'CANCELADA') {
        for (const item of actual.items) {
          await tx.variante.update({
            where: { id: item.varianteId },
            data: { stock: { increment: item.cantidad } },
          })
        }
      }

      const actualizada = await tx.orden.update({
        where: { id: req.params.id },
        data: { estado },
      })
      await tx.historialOrden.create({
        data: { ordenId: req.params.id, estado, nota: nota ?? null },
      })
      return actualizada
    })

    res.json(orden)
  } catch (err) { next(err) }
})

// POST /api/admin/ordenes/limpiar-pendientes?horas=48
// Cancela órdenes PENDIENTE viejas y restaura su stock
router.post('/limpiar-pendientes', async (req, res, next) => {
  try {
    const horas = Number(req.query.horas ?? 48)
    const corte = new Date(Date.now() - horas * 60 * 60 * 1000)

    const pendientes = await prisma.orden.findMany({
      where: { estado: 'PENDIENTE', createdAt: { lt: corte } },
      include: { items: true },
    })

    let canceladas = 0
    for (const orden of pendientes) {
      await prisma.$transaction(async (tx) => {
        for (const item of orden.items) {
          await tx.variante.update({
            where: { id: item.varianteId },
            data: { stock: { increment: item.cantidad } },
          })
        }
        await tx.orden.update({ where: { id: orden.id }, data: { estado: 'CANCELADA' } })
        await tx.historialOrden.create({
          data: {
            ordenId: orden.id,
            estado: 'CANCELADA',
            nota: `Cancelada automáticamente (>${horas}h sin pago)`,
          },
        })
      })
      canceladas++
    }

    res.json({ canceladas, mensaje: `${canceladas} orden(es) cancelada(s) y stock restaurado` })
  } catch (err) { next(err) }
})

module.exports = router
