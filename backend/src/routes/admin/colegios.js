const { Router } = require('express')
const prisma = require('../../lib/prisma')
const { authMiddleware } = require('../../middleware/auth')
const adminOnly = require('../../middleware/adminOnly')

const router = Router()


router.use(authMiddleware, adminOnly)

function toSlug(nombre) {
  return nombre.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// GET /api/admin/colegios
router.get('/', async (_req, res, next) => {
  try {
    const colegios = await prisma.colegio.findMany({
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { productos: true } } },
    })
    res.json(colegios)
  } catch (err) { next(err) }
})

// POST /api/admin/colegios
router.post('/', async (req, res, next) => {
  try {
    const { nombre, logo } = req.body
    if (!nombre) return res.status(400).json({ mensaje: 'nombre es requerido' })
    const slug = toSlug(nombre)
    const colegio = await prisma.colegio.create({
      data: { nombre, slug, logo: logo || null },
    })
    res.status(201).json(colegio)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ mensaje: 'Ya existe un colegio con ese nombre' })
    next(err)
  }
})

// PUT /api/admin/colegios/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { nombre, logo, activo } = req.body
    const data = {}
    if (nombre !== undefined) { data.nombre = nombre; data.slug = toSlug(nombre) }
    if (logo !== undefined) data.logo = logo || null
    if (activo !== undefined) data.activo = activo
    const colegio = await prisma.colegio.update({ where: { id: req.params.id }, data })
    res.json(colegio)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ mensaje: 'Ya existe un colegio con ese nombre' })
    next(err)
  }
})

// DELETE /api/admin/colegios/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.colegio.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) {
    if (err.code === 'P2003' || err.code === 'P2014') {
      return res.status(409).json({ mensaje: 'No se puede eliminar: el colegio tiene productos asociados. Primero eliminá o reasigná los productos.' })
    }
    next(err)
  }
})

module.exports = router
