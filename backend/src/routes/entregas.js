const { Router } = require('express')
const prisma = require('../lib/prisma')

const router = Router()


// GET /api/entregas — público, lista opciones activas
router.get('/', async (_req, res, next) => {
  try {
    const entregas = await prisma.entrega.findMany({
      where: { activo: true },
      orderBy: { costo: 'asc' },
    })
    res.json(entregas)
  } catch (err) { next(err) }
})

module.exports = router
