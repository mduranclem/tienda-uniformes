const { Router } = require('express')
const prisma = require('../lib/prisma')

const router = Router()


// GET /api/banners — público, devuelve los slides activos ordenados
router.get('/', async (_req, res, next) => {
  try {
    const slides = await prisma.bannerSlide.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
    })
    res.json(slides)
  } catch (err) { next(err) }
})

module.exports = router
