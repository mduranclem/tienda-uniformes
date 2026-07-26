const { Router } = require('express')
const prisma = require('../../lib/prisma')
const { authMiddleware } = require('../../middleware/auth')
const adminOnly = require('../../middleware/adminOnly')
const { cotizar } = require('../../services/cotizadorEnvio')

const router = Router()

router.use(authMiddleware, adminOnly)

// ── Zonas ─────────────────────────────────────────────────────────────────────

// GET /api/admin/envios/zonas
router.get('/zonas', async (_req, res, next) => {
  try {
    const zonas = await prisma.zonaEnvio.findMany({
      orderBy: { orden: 'asc' },
      include: {
        rangos: { orderBy: { desde: 'asc' } },
        tarifas: { orderBy: { pesoHastaG: 'asc' } },
      },
    })
    res.json(zonas)
  } catch (err) { next(err) }
})

// POST /api/admin/envios/zonas
router.post('/zonas', async (req, res, next) => {
  try {
    const { nombre, orden, precioKgAdicional } = req.body
    if (!nombre?.trim()) return res.status(400).json({ mensaje: 'nombre es requerido' })
    const zona = await prisma.zonaEnvio.create({
      data: {
        nombre: nombre.trim(),
        orden: Number(orden) || 0,
        precioKgAdicional: precioKgAdicional === '' || precioKgAdicional === undefined || precioKgAdicional === null
          ? null
          : precioKgAdicional,
      },
      include: { rangos: true, tarifas: true },
    })
    res.status(201).json(zona)
  } catch (err) { next(err) }
})

// PUT /api/admin/envios/zonas/:id
router.put('/zonas/:id', async (req, res, next) => {
  try {
    const { nombre, orden, activo, precioKgAdicional } = req.body
    const zona = await prisma.zonaEnvio.update({
      where: { id: req.params.id },
      data: {
        nombre: nombre?.trim() ?? undefined,
        orden: orden !== undefined ? Number(orden) : undefined,
        activo: activo !== undefined ? activo : undefined,
        precioKgAdicional: precioKgAdicional === undefined
          ? undefined
          : (precioKgAdicional === '' || precioKgAdicional === null ? null : precioKgAdicional),
      },
      include: {
        rangos: { orderBy: { desde: 'asc' } },
        tarifas: { orderBy: { pesoHastaG: 'asc' } },
      },
    })
    res.json(zona)
  } catch (err) { next(err) }
})

// DELETE /api/admin/envios/zonas/:id — rangos y tarifas caen en cascada
router.delete('/zonas/:id', async (req, res, next) => {
  try {
    await prisma.zonaEnvio.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) { next(err) }
})

// ── Rangos de CP ──────────────────────────────────────────────────────────────

// POST /api/admin/envios/zonas/:id/rangos
router.post('/zonas/:id/rangos', async (req, res, next) => {
  try {
    const desde = Number(req.body.desde)
    const hasta = Number(req.body.hasta)
    if (!Number.isInteger(desde) || !Number.isInteger(hasta)) {
      return res.status(400).json({ mensaje: 'desde y hasta deben ser números' })
    }
    if (desde > hasta) {
      return res.status(400).json({ mensaje: 'El CP "desde" no puede ser mayor que el "hasta"' })
    }
    const rango = await prisma.rangoCP.create({
      data: { zonaId: req.params.id, desde, hasta },
    })
    res.status(201).json(rango)
  } catch (err) { next(err) }
})

// DELETE /api/admin/envios/rangos/:id
router.delete('/rangos/:id', async (req, res, next) => {
  try {
    await prisma.rangoCP.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) { next(err) }
})

// ── Tarifas ───────────────────────────────────────────────────────────────────

// POST /api/admin/envios/zonas/:id/tarifas
router.post('/zonas/:id/tarifas', async (req, res, next) => {
  try {
    const pesoHastaG = Number(req.body.pesoHastaG)
    const { precio } = req.body
    if (!Number.isInteger(pesoHastaG) || pesoHastaG <= 0) {
      return res.status(400).json({ mensaje: 'pesoHastaG debe ser un número mayor a 0' })
    }
    if (precio === undefined || precio === null || precio === '') {
      return res.status(400).json({ mensaje: 'precio es requerido' })
    }
    // upsert: recargar un escalón existente es lo normal cuando aumenta la tarifa
    const tarifa = await prisma.tarifaEnvio.upsert({
      where: { zonaId_pesoHastaG: { zonaId: req.params.id, pesoHastaG } },
      create: { zonaId: req.params.id, pesoHastaG, precio },
      update: { precio },
    })
    res.status(201).json(tarifa)
  } catch (err) { next(err) }
})

// DELETE /api/admin/envios/tarifas/:id
router.delete('/tarifas/:id', async (req, res, next) => {
  try {
    await prisma.tarifaEnvio.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) { next(err) }
})

// ── Probador ──────────────────────────────────────────────────────────────────

// POST /api/admin/envios/probar — { cp, pesoGramos }
// Permite validar la carga de zonas sin tener que simular una compra entera.
router.post('/probar', async (req, res, next) => {
  try {
    const { cp } = req.body
    const pesoGramos = Number(req.body.pesoGramos)
    if (!cp) return res.status(400).json({ mensaje: 'cp es requerido' })
    if (!Number.isFinite(pesoGramos) || pesoGramos <= 0) {
      return res.status(400).json({ mensaje: 'pesoGramos debe ser un número mayor a 0' })
    }
    const opciones = await cotizar({ cp, pesoGramos, valorDeclarado: 0 })
    res.json({ opciones })
  } catch (err) {
    if (err.esErrorCotizacion) return res.status(422).json({ mensaje: err.message })
    next(err)
  }
})

module.exports = router
