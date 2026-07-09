const { Router } = require('express')
const prisma = require('../lib/prisma')

const router = Router()


// GET /api/productos?colegioId=&tipo=&q=&lisos=1&colegial=1&limit=&page=
router.get('/', async (req, res, next) => {
  try {
    const { colegioId, tipo, q, lisos, colegial, limit = 20, page = 1, orden } = req.query
    const take = Math.min(Number(limit), 100)
    const skip = (Number(page) - 1) * take

    const where = { activo: true }

    if (lisos === '1') {
      where.colegioId = null
    } else if (colegial === '1') {
      where.colegioId = { not: null }
    } else if (colegioId) {
      where.colegioId = colegioId
    }

    if (tipo) where.tipo = tipo

    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { descripcion: { contains: q, mode: 'insensitive' } },
      ]
    }

    const orderBy =
      orden === 'precio_asc'  ? { precio: 'asc' } :
      orden === 'precio_desc' ? { precio: 'desc' } :
      { createdAt: 'desc' }

    const [total, data] = await Promise.all([
      prisma.producto.count({ where }),
      prisma.producto.findMany({
        where,
        take,
        skip,
        orderBy,
        include: {
          colegio: { select: { id: true, nombre: true, slug: true, logo: true } },
          imagenes: { orderBy: { orden: 'asc' }, take: 1 },
          variantes: { select: { id: true, talle: true, color: true, stock: true } },
        },
      }),
    ])

    res.json({ data, total, page: Number(page), limit: take })
  } catch (err) {
    next(err)
  }
})

// GET /api/productos/:id
router.get('/:id', async (req, res, next) => {
  try {
    const producto = await prisma.producto.findUnique({
      where: { id: req.params.id },
      include: {
        colegio: { select: { id: true, nombre: true, slug: true, logo: true } },
        imagenes: { orderBy: { orden: 'asc' } },
        variantes: { orderBy: [{ talle: 'asc' }, { color: 'asc' }] },
      },
    })
    if (!producto || !producto.activo) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' })
    }
    res.json(producto)
  } catch (err) {
    next(err)
  }
})

module.exports = router
