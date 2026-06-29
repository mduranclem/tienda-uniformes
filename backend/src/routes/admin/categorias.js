const { Router } = require('express')
const prisma = require('../../lib/prisma')
const { authMiddleware } = require('../../middleware/auth')
const adminOnly = require('../../middleware/adminOnly')

const router = Router()
router.use(authMiddleware, adminOnly)

// GET /api/admin/categorias
router.get('/', async (_req, res, next) => {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    })
    res.json(categorias)
  } catch (err) { next(err) }
})

// POST /api/admin/categorias
router.post('/', async (req, res, next) => {
  try {
    const { nombre, orden } = req.body
    if (!nombre?.trim()) return res.status(400).json({ mensaje: 'nombre es requerido' })
    const cat = await prisma.categoria.create({
      data: { nombre: nombre.trim().toUpperCase(), orden: orden ?? 0 },
    })
    res.status(201).json(cat)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ mensaje: 'Ya existe una categoría con ese nombre' })
    next(err)
  }
})

// PUT /api/admin/categorias/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { nombre, activo, orden } = req.body
    const cat = await prisma.categoria.update({
      where: { id: req.params.id },
      data: {
        nombre: nombre !== undefined ? nombre.trim().toUpperCase() : undefined,
        activo: activo !== undefined ? activo : undefined,
        orden: orden !== undefined ? orden : undefined,
      },
    })
    res.json(cat)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ mensaje: 'Ya existe una categoría con ese nombre' })
    next(err)
  }
})

// DELETE /api/admin/categorias/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const enUso = await prisma.producto.count({ where: { tipo: { equals: (await prisma.categoria.findUnique({ where: { id: req.params.id }, select: { nombre: true } }))?.nombre } } })
    if (enUso > 0) return res.status(409).json({ mensaje: `No se puede eliminar: hay ${enUso} producto(s) con esta categoría. Podés desactivarla en cambio.` })
    await prisma.categoria.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) { next(err) }
})

module.exports = router
