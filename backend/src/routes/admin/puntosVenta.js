const { Router } = require('express')
const { randomBytes, createHash } = require('crypto')
const prisma = require('../../lib/prisma')
const { authMiddleware } = require('../../middleware/auth')
const adminOnly = require('../../middleware/adminOnly')

const router = Router()

router.use(authMiddleware, adminOnly)

function generarKey() {
  const rawKey = randomBytes(32).toString('hex')
  const apiKeyHash = createHash('sha256').update(rawKey).digest('hex')
  const apiKeyUltimos4 = rawKey.slice(-4)
  return { rawKey, apiKeyHash, apiKeyUltimos4 }
}

// GET /api/admin/puntos-venta
router.get('/', async (_req, res, next) => {
  try {
    const puntos = await prisma.puntoDeVenta.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, nombre: true, activo: true, apiKeyUltimos4: true, createdAt: true },
    })
    res.json(puntos)
  } catch (err) { next(err) }
})

// POST /api/admin/puntos-venta — { nombre }
router.post('/', async (req, res, next) => {
  try {
    const { nombre } = req.body
    if (!nombre?.trim()) return res.status(400).json({ mensaje: 'nombre es requerido' })

    const { rawKey, apiKeyHash, apiKeyUltimos4 } = generarKey()
    const punto = await prisma.puntoDeVenta.create({
      data: { nombre: nombre.trim(), apiKeyHash, apiKeyUltimos4 },
      select: { id: true, nombre: true, activo: true, createdAt: true },
    })
    res.status(201).json({ ...punto, apiKey: rawKey })
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ mensaje: 'Ya existe un punto de venta con ese nombre' })
    next(err)
  }
})

// PUT /api/admin/puntos-venta/:id — { nombre?, activo? }
router.put('/:id', async (req, res, next) => {
  try {
    const { nombre, activo } = req.body
    const punto = await prisma.puntoDeVenta.update({
      where: { id: req.params.id },
      data: {
        nombre: nombre?.trim() || undefined,
        activo: activo !== undefined ? activo : undefined,
      },
      select: { id: true, nombre: true, activo: true, apiKeyUltimos4: true, createdAt: true },
    })
    res.json(punto)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ mensaje: 'Ya existe un punto de venta con ese nombre' })
    next(err)
  }
})

// POST /api/admin/puntos-venta/:id/regenerar-key
router.post('/:id/regenerar-key', async (req, res, next) => {
  try {
    const { rawKey, apiKeyHash, apiKeyUltimos4 } = generarKey()
    await prisma.puntoDeVenta.update({
      where: { id: req.params.id },
      data: { apiKeyHash, apiKeyUltimos4 },
    })
    res.json({ apiKey: rawKey })
  } catch (err) { next(err) }
})

// DELETE /api/admin/puntos-venta/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.puntoDeVenta.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) {
    if (err.code === 'P2003' || err.code === 'P2014') {
      return res.status(409).json({ mensaje: 'No se puede eliminar: tiene movimientos de stock asociados.' })
    }
    next(err)
  }
})

module.exports = router
