const { Router } = require('express')
const prisma = require('../../lib/prisma')
const { authMiddleware } = require('../../middleware/auth')
const adminOnly = require('../../middleware/adminOnly')
const { notificarOrdenPagada, notificarCambioEstado } = require('../../services/notificaciones')
const { DIAS_PLAZO_PAGO, calcularVencimiento, extenderVencimiento, cancelarVencidas } = require('../../lib/vencimientoOrden')

const router = Router()

router.use(authMiddleware, adminOnly)

const ESTADOS_VALIDOS = ['PENDIENTE', 'PAGADA', 'PREPARANDO', 'LISTA', 'ENTREGADA', 'CANCELADA']

// GET /api/admin/ordenes?estado=&page=&limit=
router.get('/', async (req, res, next) => {
  try {
    const { estado, page = 1, limit = 20 } = req.query
    const take = Math.min(Number(limit), 100)
    const skip = (Number(page) - 1) * take
    const where = estado ? { estado } : {}

    const [total, ordenes] = await Promise.all([
      prisma.orden.count({ where }),
      prisma.orden.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          usuario: { select: { email: true, nombre: true } },
          items: {
            include: {
              producto: { select: { nombre: true } },
              variante: { select: { talle: true, color: true } },
            },
          },
          entrega: { select: { nombre: true, tipo: true } },
        },
      }),
    ])

    res.json({ data: ordenes, total, page: Number(page), limit: take })
  } catch (err) { next(err) }
})

// GET /api/admin/ordenes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const orden = await prisma.orden.findUnique({
      where: { id: req.params.id },
      include: {
        usuario: { select: { email: true, nombre: true, telefono: true } },
        items: {
          include: {
            producto: { select: { id: true, nombre: true } },
            variante: { select: { talle: true, color: true } },
          },
        },
        entrega: true,
        cupon: { select: { codigo: true } },
        historial: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!orden) return res.status(404).json({ mensaje: 'Orden no encontrada' })
    res.json(orden)
  } catch (err) { next(err) }
})

// PUT /api/admin/ordenes/:id/estado
router.put('/:id/estado', async (req, res, next) => {
  try {
    const { estado, nota } = req.body
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ mensaje: `Estado inválido. Válidos: ${ESTADOS_VALIDOS.join(', ')}` })
    }

    const orden = await prisma.$transaction(async (tx) => {
      const actual = await tx.orden.findUnique({
        where: { id: req.params.id },
        include: { items: true },
      })
      if (!actual) throw Object.assign(new Error('Orden no encontrada'), { status: 404 })

      // Al cancelar, restaurar stock (solo si no estaba ya cancelada)
      if (estado === 'CANCELADA' && actual.estado !== 'CANCELADA') {
        for (const item of actual.items) {
          await tx.variante.update({
            where: { id: item.varianteId },
            data: { stock: { increment: item.cantidad } },
          })
        }
      }

      // Volver a PENDIENTE (por ejemplo, si se marcó pagada por error) le da
      // un plazo nuevo: con el viejo, la cancelación automática podría
      // llevárselo en la próxima pasada.
      const plazo = estado === 'PENDIENTE' && actual.estado !== 'PENDIENTE'
        ? { venceEl: calcularVencimiento() }
        : {}
      const actualizada = await tx.orden.update({
        where: { id: req.params.id },
        data: { estado, ...plazo },
      })
      await tx.historialOrden.create({
        data: { ordenId: req.params.id, estado, nota: nota ?? null },
      })
      return actualizada
    })

    // Notificar vía n8n (no bloqueante)
    prisma.orden.findUnique({
      where: { id: req.params.id },
      include: {
        usuario: { select: { email: true, nombre: true, telefono: true } },
        // entrega es imprescindible: sin ella el aviso no distingue retiro de
        // envío y le prometería un retiro a quien pidió entrega a domicilio.
        entrega: true,
        items: {
          include: {
            producto: { select: { nombre: true } },
            variante: { select: { talle: true, color: true } },
          },
        },
      },
    }).then(ordenCompleta => {
      if (!ordenCompleta) return
      notificarCambioEstado(ordenCompleta, estado).catch(() => {})
      if (estado === 'PAGADA') notificarOrdenPagada(ordenCompleta).catch(() => {})
    })

    res.json(orden)
  } catch (err) { next(err) }
})

// POST /api/admin/ordenes/:id/extender-plazo
// Le da al cliente 7 días más para pagar, cuando lo pide por WhatsApp.
router.post('/:id/extender-plazo', async (req, res, next) => {
  try {
    const actual = await prisma.orden.findUnique({
      where: { id: req.params.id },
      select: { estado: true, venceEl: true },
    })
    if (!actual) return res.status(404).json({ mensaje: 'Orden no encontrada' })
    if (actual.estado !== 'PENDIENTE') {
      return res.status(400).json({ mensaje: 'Solo se puede extender el plazo de un pedido pendiente de pago' })
    }

    const venceEl = extenderVencimiento(actual.venceEl)
    const orden = await prisma.$transaction(async (tx) => {
      const actualizada = await tx.orden.update({ where: { id: req.params.id }, data: { venceEl } })
      await tx.historialOrden.create({
        data: {
          ordenId: req.params.id,
          estado: 'PENDIENTE',
          nota: `Plazo de pago extendido ${DIAS_PLAZO_PAGO} días`,
        },
      })
      return actualizada
    })
    res.json(orden)
  } catch (err) { next(err) }
})

// POST /api/admin/ordenes/limpiar-pendientes
// Cancela ya los pendientes vencidos y restaura su stock. El backend lo hace
// solo cada hora; esto queda para forzarlo a mano.
router.post('/limpiar-pendientes', async (_req, res, next) => {
  try {
    const canceladas = await cancelarVencidas()
    res.json({ canceladas, mensaje: `${canceladas} orden(es) cancelada(s) y stock restaurado` })
  } catch (err) { next(err) }
})

module.exports = router
