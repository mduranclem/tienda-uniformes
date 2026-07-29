const { Router } = require('express')
const prisma = require('../../lib/prisma')
const { authMiddleware } = require('../../middleware/auth')
const adminOnly = require('../../middleware/adminOnly')

const router = Router()

router.use(authMiddleware, adminOnly)

// GET /api/admin/movimientos-stock?puntoDeVentaId=&productoId=&tipo=&desde=&hasta=&page=&limit=
router.get('/', async (req, res, next) => {
  try {
    const { puntoDeVentaId, productoId, tipo, desde, hasta, page = 1, limit = 20 } = req.query
    const take = Math.min(Number(limit), 100)
    const skip = (Number(page) - 1) * take

    const where = {
      ...(puntoDeVentaId ? { puntoDeVentaId } : {}),
      ...(tipo ? { tipo } : {}),
      ...(productoId ? { variante: { productoId } } : {}),
      ...(desde || hasta ? {
        createdAt: {
          ...(desde ? { gte: new Date(desde) } : {}),
          ...(hasta ? { lte: new Date(hasta) } : {}),
        },
      } : {}),
    }

    const [total, movimientos] = await Promise.all([
      prisma.movimientoStock.count({ where }),
      prisma.movimientoStock.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          variante: { select: { talle: true, color: true, producto: { select: { id: true, nombre: true } } } },
          puntoDeVenta: { select: { nombre: true } },
        },
      }),
    ])

    res.json({ data: movimientos, total, page: Number(page), limit: take })
  } catch (err) { next(err) }
})

module.exports = router
