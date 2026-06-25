const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')
const { authMiddleware } = require('../../middleware/auth')
const adminOnly = require('../../middleware/adminOnly')

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware, adminOnly)

// GET /api/admin/cupones
router.get('/', async (_req, res, next) => {
  try {
    const cupones = await prisma.cupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { colegio: { select: { nombre: true } } },
    })
    res.json(cupones)
  } catch (err) { next(err) }
})

// POST /api/admin/cupones
router.post('/', async (req, res, next) => {
  try {
    const { codigo, tipo, valor, aplicaA, colegioId, usosMax, minimoCompra, desde, hasta } = req.body
    if (!codigo || !tipo || valor === undefined || !aplicaA) {
      return res.status(400).json({ mensaje: 'codigo, tipo, valor y aplicaA son requeridos' })
    }
    const cupon = await prisma.cupon.create({
      data: {
        codigo: codigo.toUpperCase().trim(),
        tipo,
        valor,
        aplicaA,
        colegioId: colegioId || null,
        usosMax: usosMax ?? null,
        minimoCompra: minimoCompra ?? null,
        desde: desde ? new Date(desde) : null,
        hasta: hasta ? new Date(hasta) : null,
      },
    })
    res.status(201).json(cupon)
  } catch (err) { next(err) }
})

// PUT /api/admin/cupones/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { activo, usosMax, minimoCompra, desde, hasta, valor } = req.body
    const cupon = await prisma.cupon.update({
      where: { id: req.params.id },
      data: {
        activo: activo !== undefined ? activo : undefined,
        usosMax: usosMax !== undefined ? usosMax : undefined,
        minimoCompra: minimoCompra !== undefined ? minimoCompra : undefined,
        desde: desde !== undefined ? (desde ? new Date(desde) : null) : undefined,
        hasta: hasta !== undefined ? (hasta ? new Date(hasta) : null) : undefined,
        valor: valor !== undefined ? valor : undefined,
      },
    })
    res.json(cupon)
  } catch (err) { next(err) }
})

// DELETE /api/admin/cupones/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.cupon.update({ where: { id: req.params.id }, data: { activo: false } })
    res.status(204).end()
  } catch (err) { next(err) }
})

module.exports = router
