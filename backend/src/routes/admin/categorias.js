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

// ── Bandas de precio (por talle, colegial/liso) ─────────────────────────────

function talleSolapado(bandasExistentes, talles, excluirId) {
  for (const b of bandasExistentes) {
    if (b.id === excluirId) continue
    const conflicto = b.talles.find(t => talles.includes(t))
    if (conflicto) return conflicto
  }
  return null
}

// GET /api/admin/categorias/:id/bandas
router.get('/:id/bandas', async (req, res, next) => {
  try {
    const bandas = await prisma.precioBanda.findMany({
      where: { categoriaId: req.params.id },
      orderBy: { createdAt: 'asc' },
    })
    res.json(bandas)
  } catch (err) { next(err) }
})

// POST /api/admin/categorias/:id/bandas
router.post('/:id/bandas', async (req, res, next) => {
  try {
    const { colegial, talles, precio } = req.body
    if (!Array.isArray(talles) || !talles.length) {
      return res.status(400).json({ mensaje: 'talles es requerido' })
    }
    if (!precio || Number(precio) <= 0) {
      return res.status(400).json({ mensaje: 'precio es requerido' })
    }
    const existentes = await prisma.precioBanda.findMany({
      where: { categoriaId: req.params.id, colegial: !!colegial },
    })
    const conflicto = talleSolapado(existentes, talles)
    if (conflicto) {
      return res.status(409).json({ mensaje: `El talle ${conflicto} ya está en otra banda` })
    }
    const banda = await prisma.precioBanda.create({
      data: { categoriaId: req.params.id, colegial: !!colegial, talles, precio: Number(precio) },
    })
    res.status(201).json(banda)
  } catch (err) { next(err) }
})

// PUT /api/admin/categorias/bandas/:bandaId
router.put('/bandas/:bandaId', async (req, res, next) => {
  try {
    const { talles, precio } = req.body
    const actual = await prisma.precioBanda.findUnique({ where: { id: req.params.bandaId } })
    if (!actual) return res.status(404).json({ mensaje: 'Banda no encontrada' })
    if (talles !== undefined) {
      if (!Array.isArray(talles) || !talles.length) {
        return res.status(400).json({ mensaje: 'talles no puede estar vacío' })
      }
      const existentes = await prisma.precioBanda.findMany({
        where: { categoriaId: actual.categoriaId, colegial: actual.colegial },
      })
      const conflicto = talleSolapado(existentes, talles, actual.id)
      if (conflicto) {
        return res.status(409).json({ mensaje: `El talle ${conflicto} ya está en otra banda` })
      }
    }
    const banda = await prisma.precioBanda.update({
      where: { id: req.params.bandaId },
      data: {
        talles: talles !== undefined ? talles : undefined,
        precio: precio !== undefined ? Number(precio) : undefined,
      },
    })
    res.json(banda)
  } catch (err) { next(err) }
})

// DELETE /api/admin/categorias/bandas/:bandaId
router.delete('/bandas/:bandaId', async (req, res, next) => {
  try {
    await prisma.precioBanda.delete({ where: { id: req.params.bandaId } })
    res.status(204).end()
  } catch (err) { next(err) }
})

module.exports = router
