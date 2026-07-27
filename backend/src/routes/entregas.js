const { Router } = require('express')
const prisma = require('../lib/prisma')
const { fechasDisponibles, FRANJAS, formatearFecha, aISO } = require('../lib/agendaEntrega')

const router = Router()

// GET /api/entregas/agenda — días y franjas para coordinar la entrega en Rosario.
// Lo calcula el backend para que el checkout y la validación de la orden usen
// exactamente la misma lista.
router.get('/agenda', (_req, res) => {
  res.json({
    fechas: fechasDisponibles().map(fecha => ({
      valor: aISO(fecha),
      etiqueta: formatearFecha(fecha),
    })),
    franjas: FRANJAS.map(f => ({
      valor: f,
      etiqueta: `${f.replace('-', ' a ')} hs`,
    })),
  })
})


// GET /api/entregas — público, lista opciones activas
router.get('/', async (_req, res, next) => {
  try {
    const entregas = await prisma.entrega.findMany({
      where: { activo: true },
      orderBy: { costo: 'asc' },
    })
    res.json(entregas)
  } catch (err) { next(err) }
})

module.exports = router
