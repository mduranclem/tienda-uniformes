const { Router } = require('express')
const prisma = require('../../lib/prisma')
const { authMiddleware } = require('../../middleware/auth')
const adminOnly = require('../../middleware/adminOnly')

const router = Router()


router.use(authMiddleware, adminOnly)

// GET /api/admin/productos
router.get('/', async (_req, res, next) => {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        colegio: { select: { id: true, nombre: true } },
        imagenes: { orderBy: { orden: 'asc' } },
        variantes: { orderBy: [{ talle: 'asc' }] },
      },
    })
    res.json(productos)
  } catch (err) { next(err) }
})

// POST /api/admin/productos
router.post('/', async (req, res, next) => {
  try {
    const { nombre, descripcion, tipo, precio, colegioId, imagenes, variantes } = req.body
    if (!nombre || !precio) {
      return res.status(400).json({ mensaje: 'nombre y precio son requeridos' })
    }
    const producto = await prisma.producto.create({
      data: {
        nombre,
        descripcion: descripcion ?? null,
        tipo: tipo ?? 'REMERA',
        precio,
        colegioId: colegioId || null,
        imagenes: imagenes?.length ? { create: imagenes } : undefined,
        variantes: variantes?.length ? { create: variantes } : undefined,
      },
      include: {
        colegio: { select: { id: true, nombre: true } },
        imagenes: { orderBy: { orden: 'asc' } },
        variantes: true,
      },
    })
    res.status(201).json(producto)
  } catch (err) { next(err) }
})

// PUT /api/admin/productos/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { nombre, descripcion, tipo, precio, precioOferta, cuotas, colegioId, activo } = req.body
    const producto = await prisma.producto.update({
      where: { id: req.params.id },
      data: {
        nombre,
        descripcion,
        tipo,
        precio: precio !== undefined ? precio : undefined,
        precioOferta: precioOferta !== undefined ? (precioOferta || null) : undefined,
        cuotas: cuotas !== undefined ? (cuotas || null) : undefined,
        colegioId: colegioId !== undefined ? (colegioId || null) : undefined,
        activo: activo !== undefined ? activo : undefined,
      },
      include: {
        colegio: { select: { id: true, nombre: true } },
        imagenes: { orderBy: { orden: 'asc' } },
        variantes: true,
      },
    })
    res.json(producto)
  } catch (err) { next(err) }
})

// DELETE /api/admin/productos/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.producto.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) {
    if (err.code === 'P2003' || err.code === 'P2014') {
      return res.status(409).json({ mensaje: 'No se puede eliminar: el producto tiene pedidos asociados. Podés ocultarlo en cambio.' })
    }
    next(err)
  }
})

// ── Imágenes ──────────────────────────────────────────────────────────────────

// POST /api/admin/productos/:id/imagenes
router.post('/:id/imagenes', async (req, res, next) => {
  try {
    const { url, alt, orden } = req.body
    if (!url) return res.status(400).json({ mensaje: 'url es requerida' })
    const imagen = await prisma.productImage.create({
      data: { productoId: req.params.id, url, alt: alt ?? null, orden: orden ?? 0 },
    })
    res.status(201).json(imagen)
  } catch (err) { next(err) }
})

// PUT /api/admin/productos/imagenes/:imagenId
router.put('/imagenes/:imagenId', async (req, res, next) => {
  try {
    const { color, alt, orden } = req.body
    const imagen = await prisma.productImage.update({
      where: { id: req.params.imagenId },
      data: {
        color: color !== undefined ? (color || null) : undefined,
        alt: alt !== undefined ? alt : undefined,
        orden: orden !== undefined ? orden : undefined,
      },
    })
    res.json(imagen)
  } catch (err) { next(err) }
})

// DELETE /api/admin/imagenes/:imagenId
router.delete('/imagenes/:imagenId', async (req, res, next) => {
  try {
    await prisma.productImage.delete({ where: { id: req.params.imagenId } })
    res.status(204).end()
  } catch (err) { next(err) }
})

// ── Variantes ──────────────────────────────────────────────────────────────────

// POST /api/admin/productos/:id/variantes
router.post('/:id/variantes', async (req, res, next) => {
  try {
    const { talle, color, stock, sku, precio } = req.body
    if (!talle) return res.status(400).json({ mensaje: 'talle es requerido' })
    const variante = await prisma.variante.create({
      data: {
        productoId: req.params.id,
        talle,
        color: color ?? null,
        stock: stock ?? 0,
        sku: sku ?? null,
        precio: precio ? parseFloat(precio) : null,
      },
    })
    res.status(201).json(variante)
  } catch (err) { next(err) }
})

// PUT /api/admin/variantes/:varianteId
router.put('/variantes/:varianteId', async (req, res, next) => {
  try {
    const { talle, color, stock, sku, precio } = req.body
    const variante = await prisma.variante.update({
      where: { id: req.params.varianteId },
      data: {
        talle: talle ?? undefined,
        color: color !== undefined ? color : undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
        sku: sku !== undefined ? sku : undefined,
        precio: precio !== undefined ? (precio ? parseFloat(precio) : null) : undefined,
      },
    })
    res.json(variante)
  } catch (err) { next(err) }
})

// DELETE /api/admin/variantes/:varianteId
router.delete('/variantes/:varianteId', async (req, res, next) => {
  try {
    await prisma.variante.delete({ where: { id: req.params.varianteId } })
    res.status(204).end()
  } catch (err) { next(err) }
})

module.exports = router
