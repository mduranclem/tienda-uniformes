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
    // Orden pensado para el cliente típico, que es de Rosario: primero el envío
    // local (gratis), después los retiros, y último el interior.
    const entregas = await prisma.entrega.findMany({
      where: { activo: true },
      orderBy: [{ soloRosario: 'desc' }, { tipo: 'desc' }, { costo: 'asc' }],
    })
    res.json(entregas)
  } catch (err) { next(err) }
})

module.exports = router
