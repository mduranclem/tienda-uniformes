const { Router } = require('express')
const prisma = require('../../lib/prisma')
const { authMiddleware } = require('../../middleware/auth')
const adminOnly = require('../../middleware/adminOnly')

const router = Router()


router.use(authMiddleware, adminOnly)

// Un enlace es una ruta de la tienda ("/producto/…") o una dirección http(s).
// Cualquier otra cosa (javascript:, data:…) se rechaza: el link se pone tal
// cual en la portada. '' o null = sin enlace.
function leerEnlace(enlace) {
  if (enlace === undefined) return { valor: undefined }
  const texto = String(enlace ?? '').trim()
  if (!texto) return { valor: null }
  if (texto.startsWith('/') && !texto.startsWith('//')) return { valor: texto }
  try {
    const url = new URL(texto)
    if (url.protocol === 'https:' || url.protocol === 'http:') return { valor: url.href }
  } catch (_) { /* no es una URL */ }
  return { error: 'El enlace tiene que empezar con / (una página de la tienda) o con https://' }
}

// GET /api/admin/banners
router.get('/', async (_req, res, next) => {
  try {
    const slides = await prisma.bannerSlide.findMany({ orderBy: { orden: 'asc' } })
    res.json(slides)
  } catch (err) { next(err) }
})

// POST /api/admin/banners
router.post('/', async (req, res, next) => {
  try {
    const { url, titulo, orden } = req.body
    if (!url) return res.status(400).json({ mensaje: 'url es requerida' })
    const enlace = leerEnlace(req.body.enlace)
    if (enlace.error) return res.status(400).json({ mensaje: enlace.error })
    const count = await prisma.bannerSlide.count()
    const slide = await prisma.bannerSlide.create({
      data: { url, titulo: titulo ?? null, enlace: enlace.valor ?? null, orden: orden ?? count },
    })
    res.status(201).json(slide)
  } catch (err) { next(err) }
})

// PUT /api/admin/banners/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { titulo, orden, activo } = req.body
    const enlace = leerEnlace(req.body.enlace)
    if (enlace.error) return res.status(400).json({ mensaje: enlace.error })
    const slide = await prisma.bannerSlide.update({
      where: { id: req.params.id },
      data: {
        titulo: titulo !== undefined ? (titulo || null) : undefined,
        enlace: enlace.valor,
        orden: orden !== undefined ? orden : undefined,
        activo: activo !== undefined ? activo : undefined,
      },
    })
    res.json(slide)
  } catch (err) { next(err) }
})

// DELETE /api/admin/banners/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.bannerSlide.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) { next(err) }
})

module.exports = router
