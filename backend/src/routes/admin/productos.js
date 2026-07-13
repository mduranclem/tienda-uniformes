const { Router } = require('express')
const multer = require('multer')
const sharp = require('sharp')
const prisma = require('../../lib/prisma')
const supabaseAdmin = require('../../lib/supabaseAdmin')
const { authMiddleware } = require('../../middleware/auth')
const adminOnly = require('../../middleware/adminOnly')
const { verificarAlertasStock } = require('../../services/alertasStock')

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB de entrada; se comprime igual antes de subir
})

router.use(authMiddleware, adminOnly)

// GET /api/admin/productos
router.get('/', async (_req, res, next) => {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        colegio: { select: { id: true, nombre: true } },
        imagenes: { orderBy: { orden: 'asc' } },
        colores: { orderBy: { nombre: 'asc' } },
        variantes: { orderBy: [{ talle: 'asc' }] },
      },
    })
    res.json(productos)
  } catch (err) { next(err) }
})

// POST /api/admin/productos
router.post('/', async (req, res, next) => {
  try {
    const { nombre, descripcion, tipo, precio, precioOferta, cuotas, cuotasRecargo, colegioId, imagenes, variantes } = req.body
    if (!nombre || !precio) {
      return res.status(400).json({ mensaje: 'nombre y precio son requeridos' })
    }
    const producto = await prisma.producto.create({
      data: {
        nombre,
        descripcion: descripcion ?? null,
        tipo: tipo ?? 'REMERA',
        precio,
        precioOferta: precioOferta || null,
        cuotas: cuotas || null,
        cuotasRecargo: cuotasRecargo || null,
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
    const { nombre, descripcion, tipo, precio, precioOferta, cuotas, cuotasRecargo, colegioId, activo } = req.body
    const producto = await prisma.producto.update({
      where: { id: req.params.id },
      data: {
        nombre,
        descripcion,
        tipo,
        precio: precio !== undefined ? precio : undefined,
        precioOferta: precioOferta !== undefined ? (precioOferta || null) : undefined,
        cuotas: cuotas !== undefined ? (cuotas || null) : undefined,
        cuotasRecargo: cuotasRecargo !== undefined ? (cuotasRecargo || null) : undefined,
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

const CACHE_CONTROL_1_ANIO = '31536000'
const ANCHO_MAX = 1200
const CALIDAD_WEBP = 80

// Redimensiona (máx 1200px de ancho, sin agrandar) y convierte a WebP calidad 80.
async function comprimirAWebp(buffer) {
  return sharp(buffer)
    .resize({ width: ANCHO_MAX, withoutEnlargement: true })
    .webp({ quality: CALIDAD_WEBP })
    .toBuffer()
}

// POST /api/admin/productos/:id/imagenes
// Recibe multipart/form-data con el archivo en el campo "imagen" (+ alt/orden
// opcionales). Comprime a WebP en el servidor y sube a Supabase Storage con
// cache de 1 año — el frontend nunca sube directo a Supabase.
router.post('/:id/imagenes', upload.single('imagen'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ mensaje: 'imagen es requerida (campo "imagen")' })

    const { alt, orden } = req.body
    const webpBuffer = await comprimirAWebp(req.file.buffer)
    const path = `productos/${req.params.id}/${Date.now()}.webp`

    const { error: upErr } = await supabaseAdmin.storage
      .from('productos')
      .upload(path, webpBuffer, {
        cacheControl: CACHE_CONTROL_1_ANIO,
        upsert: true,
        contentType: 'image/webp',
      })
    if (upErr) return res.status(500).json({ mensaje: `Error subiendo a Supabase: ${upErr.message}` })

    const { data: { publicUrl } } = supabaseAdmin.storage.from('productos').getPublicUrl(path)

    const imagen = await prisma.productImage.create({
      data: {
        productoId: req.params.id,
        url: publicUrl,
        alt: alt ?? null,
        orden: orden ? Number(orden) : 0,
      },
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

    const anterior = await prisma.variante.findUnique({ where: { id: req.params.varianteId } })
    if (!anterior) return res.status(404).json({ mensaje: 'Variante no encontrada' })

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

    if (stock !== undefined) {
      verificarAlertasStock(variante.id, anterior.stock, variante.stock).catch(() => {})
    }

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

// ── Colores ───────────────────────────────────────────────────────────────────

// POST /api/admin/productos/:id/colores
router.post('/:id/colores', async (req, res, next) => {
  try {
    const { nombre } = req.body
    if (!nombre?.trim()) return res.status(400).json({ mensaje: 'nombre es requerido' })
    const color = await prisma.productoColor.create({
      data: { productoId: req.params.id, nombre: nombre.trim() },
    })
    res.status(201).json(color)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ mensaje: 'Ese color ya existe en este producto' })
    next(err)
  }
})

// DELETE /api/admin/productos/colores/:colorId
router.delete('/colores/:colorId', async (req, res, next) => {
  try {
    await prisma.productoColor.delete({ where: { id: req.params.colorId } })
    res.status(204).end()
  } catch (err) { next(err) }
})

module.exports = router
