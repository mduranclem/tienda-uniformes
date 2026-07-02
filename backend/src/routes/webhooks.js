const { Router } = require('express')
const crypto = require('crypto')
const prisma = require('../lib/prisma')
const { obtenerPago } = require('../services/mercadopago')
const { notificarNuevoPedido } = require('../services/notificaciones')

const router = Router()

function validarFirmaMP(req) {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return true // Sin secret configurado, skip (solo para desarrollo)

  const xSignature = req.headers['x-signature']
  const xRequestId = req.headers['x-request-id']
  const dataId = req.query['data.id']

  if (!xSignature || !dataId) return false

  const ts = xSignature.match(/ts=([^,]+)/)?.[1]
  const v1 = xSignature.match(/v1=([^,]+)/)?.[1]
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${xRequestId ?? ''};ts:${ts};`
  const expected = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex')

  return expected === v1
}

// POST /api/webhooks/mercadopago
// Recibe notificaciones de MP — el body llega como Buffer (express.raw)
router.post('/', async (req, res) => {
  try {
    // Validar firma
    if (!validarFirmaMP(req)) {
      console.warn('[webhook MP] Firma inválida')
      return res.status(401).end()
    }

    const { type, action } = req.query
    const topic = type ?? req.query.topic

    // Solo procesar eventos de pago
    if (topic !== 'payment') {
      return res.status(200).end()
    }

    const paymentId = req.query['data.id']
    if (!paymentId) return res.status(200).end()

    console.log(`[webhook MP] Procesando pago ${paymentId}`)

    const pago = await obtenerPago(paymentId)

    if (pago.status !== 'approved') {
      console.log(`[webhook MP] Pago ${paymentId} con estado ${pago.status} — sin acción`)
      return res.status(200).end()
    }

    const ordenId = pago.external_reference
    if (!ordenId) {
      console.warn(`[webhook MP] Pago ${paymentId} sin external_reference`)
      return res.status(200).end()
    }

    // Verificar si ya fue procesado (idempotencia)
    const ordenActual = await prisma.orden.findUnique({
      where: { id: ordenId },
      select: { estado: true },
    })

    if (!ordenActual) {
      console.warn(`[webhook MP] Orden ${ordenId} no encontrada`)
      return res.status(200).end()
    }

    if (ordenActual.estado === 'PAGADA') {
      console.log(`[webhook MP] Orden ${ordenId} ya estaba PAGADA — ignorando duplicado`)
      return res.status(200).end()
    }

    // Marcar como pagada en transacción atómica
    const ordenActualizada = await prisma.$transaction(async (tx) => {
      const orden = await tx.orden.update({
        where: { id: ordenId },
        data: {
          estado: 'PAGADA',
          mpPaymentId: String(paymentId),
          metodoPago: 'mercadopago',
        },
        include: {
          usuario: { select: { email: true, nombre: true, telefono: true } },
          items: {
            include: {
              producto: { select: { nombre: true } },
              variante: { select: { talle: true, color: true } },
            },
          },
          entrega: true,
        },
      })
      await tx.historialOrden.create({
        data: {
          ordenId,
          estado: 'PAGADA',
          nota: `Pago confirmado por Mercado Pago. Payment ID: ${paymentId}`,
        },
      })
      return orden
    })

    console.log(`[webhook MP] Orden ${ordenId} marcada como PAGADA`)

    // Notificar al admin vía n8n (no bloqueante)
    notificarNuevoPedido(ordenActualizada).catch(() => {})

    res.status(200).end()
  } catch (err) {
    console.error('[webhook MP] Error:', err.message)
    // Siempre 200 para que MP no reintente en bucle
    res.status(200).end()
  }
})

module.exports = router
