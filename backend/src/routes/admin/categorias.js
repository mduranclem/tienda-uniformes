const { Router } = require('express')
const prisma = require('../../lib/prisma')
const { authMiddleware } = require('../../middleware/auth')
const adminOnly = require('../../middleware/adminOnly')

const router = Router()
router.use(authMiddleware, adminOnly)

// undefined = no se toca; '' o null = sin precio; si no, un número positivo.
function leerPrecio(precio) {
  if (precio === undefined) return { valor: undefined }
  if (precio === null || precio === '') return { valor: null }
  const n = Number(precio)
  if (!Number.isFinite(n) || n <= 0) return { error: 'El precio tiene que ser un número mayor a 0' }
  return { valor: n }
}

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
    const precio = leerPrecio(req.body.precio)
    if (precio.error) return res.status(400).json({ mensaje: precio.error })
    const cat = await prisma.categoria.create({
      data: { nombre: nombre.trim().toUpperCase(), orden: orden ?? 0, precio: precio.valor ?? null },
    })
    res.status(201).json(cat)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ mensaje: 'Ya existe una categoría con ese nombre' })
    next(err)
  }
})

// PUT /api/admin/categorias/:id
// Al cambiar el precio se actualizan en el mismo paso todos los productos de la
// categoría: el producto guarda una copia, que es la que se cobra.
router.put('/:id', async (req, res, next) => {
  try {
    const { nombre, activo, orden } = req.body
    const precio = leerPrecio(req.body.precio)
    if (precio.error) return res.status(400).json({ mensaje: precio.error })

    const { cat, productosActualizados } = await prisma.$transaction(async (tx) => {
      const cat = await tx.categoria.update({
        where: { id: req.params.id },
        data: {
          nombre: nombre !== undefined ? nombre.trim().toUpperCase() : undefined,
          activo: activo !== undefined ? activo : undefined,
          orden: orden !== undefined ? orden : undefined,
          precio: precio.valor,
        },
      })
      // Sin precio no se toca a los productos: quedan con el último que tuvieron.
      if (cat.precio === null || precio.valor === undefined) return { cat, productosActualizados: 0 }
      const { count } = await tx.producto.updateMany({
        where: { tipo: cat.nombre },
        data: { precio: cat.precio },
      })
      return { cat, productosActualizados: count }
    })
    res.json({ ...cat, productosActualizados })
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
