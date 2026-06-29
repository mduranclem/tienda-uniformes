const { Router } = require('express')
const prisma = require('../lib/prisma')

const router = Router()

// GET /api/categorias — listado público para formularios
router.get('/', async (_req, res, next) => {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    })
    res.json(categorias)
  } catch (err) { next(err) }
})

module.exports = router
