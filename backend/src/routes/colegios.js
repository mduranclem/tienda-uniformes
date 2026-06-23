const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const router = Router()
const prisma = new PrismaClient()

// GET /api/colegios
router.get('/', async (_req, res, next) => {
  try {
    const colegios = await prisma.colegio.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    })
    res.json(colegios)
  } catch (err) {
    next(err)
  }
})

// GET /api/colegios/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const colegio = await prisma.colegio.findUnique({
      where: { slug: req.params.slug },
    })
    if (!colegio) return res.status(404).json({ mensaje: 'Colegio no encontrado' })
    res.json(colegio)
  } catch (err) {
    next(err)
  }
})

module.exports = router
