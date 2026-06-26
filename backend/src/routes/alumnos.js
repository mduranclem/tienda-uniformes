const { Router } = require('express')
const prisma = require('../lib/prisma')
const { authMiddleware } = require('../middleware/auth')

const router = Router()

const TIPOS_VALIDOS = ['REMERA', 'BUZO', 'PANTALON', 'CAMPERA', 'OTRO']
const TALLES_VALIDOS = ['2', '4', '6', '8', '10', '12', '14', 'XS', 'S', 'M', 'L', 'XL', 'XXL']

router.use(authMiddleware)

// GET /api/alumnos
router.get('/', async (req, res, next) => {
  try {
    const alumnos = await prisma.alumno.findMany({
      where: { usuarioId: req.user.id },
      include: {
        colegio: { select: { id: true, nombre: true } },
        talles: true,
      },
      orderBy: { createdAt: 'asc' },
    })
    res.json(alumnos)
  } catch (err) { next(err) }
})

// POST /api/alumnos
router.post('/', async (req, res, next) => {
  try {
    const { nombre, colegioId } = req.body
    if (!nombre?.trim()) return res.status(400).json({ mensaje: 'nombre es requerido' })

    if (colegioId) {
      const colegio = await prisma.colegio.findUnique({ where: { id: colegioId } })
      if (!colegio || !colegio.activo) return res.status(400).json({ mensaje: 'Colegio no válido' })
    }

    const alumno = await prisma.alumno.create({
      data: { usuarioId: req.user.id, nombre: nombre.trim(), colegioId: colegioId || null },
      include: {
        colegio: { select: { id: true, nombre: true } },
        talles: true,
      },
    })
    res.status(201).json(alumno)
  } catch (err) { next(err) }
})

// PUT /api/alumnos/:id
router.put('/:id', async (req, res, next) => {
  try {
    const alumno = await prisma.alumno.findUnique({ where: { id: req.params.id } })
    if (!alumno) return res.status(404).json({ mensaje: 'Alumno no encontrado' })
    if (alumno.usuarioId !== req.user.id) return res.status(403).json({ mensaje: 'Acceso denegado' })

    const { nombre, colegioId } = req.body
    if (nombre !== undefined && !nombre?.trim()) {
      return res.status(400).json({ mensaje: 'nombre no puede estar vacío' })
    }
    if (colegioId) {
      const colegio = await prisma.colegio.findUnique({ where: { id: colegioId } })
      if (!colegio || !colegio.activo) return res.status(400).json({ mensaje: 'Colegio no válido' })
    }

    const actualizado = await prisma.alumno.update({
      where: { id: req.params.id },
      data: {
        nombre: nombre?.trim() ?? undefined,
        colegioId: colegioId !== undefined ? (colegioId || null) : undefined,
      },
      include: {
        colegio: { select: { id: true, nombre: true } },
        talles: true,
      },
    })
    res.json(actualizado)
  } catch (err) { next(err) }
})

// DELETE /api/alumnos/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const alumno = await prisma.alumno.findUnique({ where: { id: req.params.id } })
    if (!alumno) return res.status(404).json({ mensaje: 'Alumno no encontrado' })
    if (alumno.usuarioId !== req.user.id) return res.status(403).json({ mensaje: 'Acceso denegado' })

    await prisma.alumno.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) { next(err) }
})

// PUT /api/alumnos/:id/talles
// Recibe { talles: [{ tipoPrenda, talle }] } y sincroniza: upserta enviados, elimina los que faltan.
router.put('/:id/talles', async (req, res, next) => {
  try {
    const alumno = await prisma.alumno.findUnique({ where: { id: req.params.id } })
    if (!alumno) return res.status(404).json({ mensaje: 'Alumno no encontrado' })
    if (alumno.usuarioId !== req.user.id) return res.status(403).json({ mensaje: 'Acceso denegado' })

    const { talles } = req.body
    if (!Array.isArray(talles)) return res.status(400).json({ mensaje: 'talles debe ser un array' })

    for (const t of talles) {
      if (!TIPOS_VALIDOS.includes(t.tipoPrenda)) {
        return res.status(400).json({ mensaje: `tipoPrenda inválido: ${t.tipoPrenda}` })
      }
      if (!TALLES_VALIDOS.includes(t.talle)) {
        return res.status(400).json({ mensaje: `talle inválido: ${t.talle}` })
      }
    }

    const tiposEnviados = talles.map(t => t.tipoPrenda)

    await prisma.$transaction(async (tx) => {
      // Eliminar los tipos que ya no están en la lista
      await tx.alumnoTalle.deleteMany({
        where: { alumnoId: req.params.id, tipoPrenda: { notIn: tiposEnviados } },
      })
      // Upsert los que vienen
      for (const t of talles) {
        await tx.alumnoTalle.upsert({
          where: { alumnoId_tipoPrenda: { alumnoId: req.params.id, tipoPrenda: t.tipoPrenda } },
          create: { alumnoId: req.params.id, tipoPrenda: t.tipoPrenda, talle: t.talle },
          update: { talle: t.talle },
        })
      }
    })

    const alumnoActualizado = await prisma.alumno.findUnique({
      where: { id: req.params.id },
      include: {
        colegio: { select: { id: true, nombre: true } },
        talles: true,
      },
    })
    res.json(alumnoActualizado)
  } catch (err) { next(err) }
})

module.exports = router
