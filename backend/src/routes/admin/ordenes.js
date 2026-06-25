const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')
const { authMiddleware } = require('../../middleware/auth')
const adminOnly = require('../../middleware/adminOnly')

const router = Router()
const prisma = new PrismaClient()

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

    const [orden] = await prisma.$transaction([
      prisma.orden.update({
        where: { id: req.params.id },
        data: { estado },
      }),
      prisma.historialOrden.create({
        data: { ordenId: req.params.id, estado, nota: nota ?? null },
      }),
    ])

    res.json(orden)
  } catch (err) { next(err) }
})

module.exports = router
