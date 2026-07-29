const { Router } = require('express')
const prisma = require('../lib/prisma')
const pdvAuth = require('../middleware/pdvAuth')
const { registrarMovimiento, resolverVariante } = require('../lib/movimientosStock')
const { notificarStockBajo } = require('../services/notificaciones')

const router = Router()

router.use(pdvAuth)

// POST /api/stock/venta — { productoId, talle, color?, cantidad }
router.post('/venta', async (req, res, next) => {
  try {
    const { productoId, talle, color, cantidad } = req.body
    const cant = Number(cantidad)
    if (!cant || cant <= 0) return res.status(400).json({ mensaje: 'cantidad debe ser mayor a 0' })

    const variante = await resolverVariante(prisma, { productoId, talle, color })

    const { stockNuevo, movimiento } = await prisma.$transaction(tx =>
      registrarMovimiento(tx, {
        varianteId: variante.id,
        puntoDeVentaId: req.puntoDeVenta.id,
        tipo: 'VENTA',
        cantidad: -cant,
        nota: null,
      })
    )

    if (stockNuevo === 0) {
      notificarStockBajo({
        variante: { ...variante, stock: stockNuevo },
        producto: variante.producto,
        puntoDeVenta: req.puntoDeVenta,
        motivo: 'sin_stock',
      })
    }

    res.json({ ok: true, stockRestante: stockNuevo, movimientoId: movimiento.id })
  } catch (err) { next(err) }
})

// POST /api/stock/ingreso — { productoId, talle, color?, cantidad, nota? }
router.post('/ingreso', async (req, res, next) => {
  try {
    const { productoId, talle, color, cantidad, nota } = req.body
    const cant = Number(cantidad)
    if (!cant || cant <= 0) return res.status(400).json({ mensaje: 'cantidad debe ser mayor a 0' })

    const variante = await resolverVariante(prisma, { productoId, talle, color })

    const { stockAnterior, stockNuevo, movimiento } = await prisma.$transaction(tx =>
      registrarMovimiento(tx, {
        varianteId: variante.id,
        puntoDeVentaId: req.puntoDeVenta.id,
        tipo: 'INGRESO',
        cantidad: cant,
        nota: nota ?? null,
      })
    )

    if (stockAnterior === 0 && stockNuevo > 0) {
      notificarStockBajo({
        variante: { ...variante, stock: stockNuevo },
        producto: variante.producto,
        puntoDeVenta: req.puntoDeVenta,
        motivo: 'reingreso',
      })
    }

    res.json({ ok: true, stockActual: stockNuevo, movimientoId: movimiento.id })
  } catch (err) { next(err) }
})

// POST /api/stock/ajuste — { productoId, talle, color?, cantidadFinal, nota }
router.post('/ajuste', async (req, res, next) => {
  try {
    const { productoId, talle, color, cantidadFinal, nota } = req.body
    if (!nota?.trim()) return res.status(400).json({ mensaje: 'nota es requerida en ajustes' })
    const final = Number(cantidadFinal)
    if (cantidadFinal === undefined || Number.isNaN(final) || final < 0) {
      return res.status(400).json({ mensaje: 'cantidadFinal debe ser un número >= 0' })
    }

    const variante = await resolverVariante(prisma, { productoId, talle, color })

    const { stockAnterior, stockNuevo, movimiento } = await prisma.$transaction(tx =>
      registrarMovimiento(tx, {
        varianteId: variante.id,
        puntoDeVentaId: req.puntoDeVenta.id,
        tipo: 'AJUSTE',
        cantidad: final - variante.stock,
        nota,
      })
    )

    res.json({ ok: true, stockAnterior, stockActual: stockNuevo, movimientoId: movimiento.id })
  } catch (err) { next(err) }
})

// GET /api/stock/consulta?productoId=&talle=&color=
router.get('/consulta', async (req, res, next) => {
  try {
    const { productoId, talle, color } = req.query
    const variante = await resolverVariante(prisma, { productoId, talle, color })

    const movimientos = await prisma.movimientoStock.findMany({
      where: { varianteId: variante.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { puntoDeVenta: { select: { nombre: true } } },
    })

    res.json({
      producto: variante.producto,
      talle: variante.talle,
      color: variante.color,
      stockActual: variante.stock,
      movimientos,
    })
  } catch (err) { next(err) }
})

// GET /api/stock/reporte?puntoDeVentaId=&desde=&hasta=
router.get('/reporte', async (req, res, next) => {
  try {
    const { puntoDeVentaId, desde, hasta } = req.query
    const where = {
      ...(puntoDeVentaId ? { puntoDeVentaId } : {}),
      ...(desde || hasta ? {
        createdAt: {
          ...(desde ? { gte: new Date(desde) } : {}),
          ...(hasta ? { lte: new Date(hasta) } : {}),
        },
      } : {}),
    }

    const [agrupado, puntos] = await Promise.all([
      prisma.movimientoStock.groupBy({
        by: ['puntoDeVentaId', 'tipo'],
        where,
        _count: { _all: true },
        _sum: { cantidad: true },
      }),
      prisma.puntoDeVenta.findMany({ select: { id: true, nombre: true } }),
    ])

    const nombrePorId = Object.fromEntries(puntos.map(p => [p.id, p.nombre]))
    const porPunto = {}
    for (const fila of agrupado) {
      const id = fila.puntoDeVentaId
      if (!porPunto[id]) {
        porPunto[id] = {
          puntoDeVentaId: id,
          puntoDeVentaNombre: nombrePorId[id] ?? '—',
          VENTA: { movimientos: 0, unidades: 0 },
          INGRESO: { movimientos: 0, unidades: 0 },
          AJUSTE: { movimientos: 0, unidades: 0 },
          DEVOLUCION: { movimientos: 0, unidades: 0 },
        }
      }
      porPunto[id][fila.tipo] = {
        movimientos: fila._count._all,
        unidades: fila._sum.cantidad ?? 0,
      }
    }

    res.json({ desde: desde ?? null, hasta: hasta ?? null, porPuntoDeVenta: Object.values(porPunto) })
  } catch (err) { next(err) }
})

module.exports = router
