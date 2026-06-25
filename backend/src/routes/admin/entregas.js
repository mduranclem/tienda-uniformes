const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')
const { authMiddleware } = require('../../middleware/auth')
const adminOnly = require('../../middleware/adminOnly')

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware, adminOnly)

// GET /api/admin/entregas
router.get('/', async (_req, res, next) => {
  try {
    const entregas = await prisma.entrega.findMany({ orderBy: { tipo: 'asc' } })
    res.json(entregas)
  } catch (err) { next(err) }
})

// POST /api/admin/entregas
router.post('/', async (req, res, next) => {
  try {
    const { tipo, nombre, costo } = req.body
    if (!tipo || !nombre) return res.status(400).json({ mensaje: 'tipo y nombre son requeridos' })
    const entrega = await prisma.entrega.create({ data: { tipo, nombre, costo: costo ?? 0 } })
    res.status(201).json(entrega)
  } catch (err) { next(err) }
})

// PUT /api/admin/entregas/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { nombre, costo, activo } = req.body
    const entrega = await prisma.entrega.update({
      where: { id: req.params.id },
      data: {
        nombre: nombre ?? undefined,
        costo: costo !== undefined ? costo : undefined,
        activo: activo !== undefined ? activo : undefined,
      },
    })
    res.json(entrega)
  } catch (err) { next(err) }
})

module.exports = router
