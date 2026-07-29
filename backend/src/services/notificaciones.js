// Notifica al admin vía webhook n8n cuando entra un pedido nuevo.
// Si N8N_WEBHOOK_PEDIDO no está configurado, no hace nada.

async function notificarNuevoPedido(orden) {
  const url = process.env.N8N_WEBHOOK_PEDIDO
  if (!url) return

  const cliente = orden.usuario
    ? `${orden.usuario.nombre ?? ''} (${orden.usuario.email})`.trim()
    : `${orden.nombreGuest ?? ''} (${orden.emailGuest ?? ''})`.trim()

  const telefono = orden.usuario?.telefono ?? orden.telefonoGuest ?? '—'

  const productos = (orden.items ?? []).map(item => {
    const talle = item.variante?.talle ?? ''
    const color = item.variante?.color ? ` / ${item.variante.color}` : ''
    return `• ${item.producto?.nombre ?? 'Producto'} — talle ${talle}${color} x${item.cantidad}`
  }).join('\n')

  const entrega = orden.entrega?.nombre ?? '—'
  const domicilio = orden.domicilio
    ? `${orden.domicilio.calle} ${orden.domicilio.numero ?? ''}${orden.domicilio.piso ? ` piso ${orden.domicilio.piso}` : ''}, ${orden.domicilio.ciudad}`
    : null

  const payload = {
    numero: orden.numero,
    total: Number(orden.total),
    subtotal: Number(orden.subtotal),
    descuento: Number(orden.descuento ?? 0),
    costoEnvio: Number(orden.costoEnvio ?? 0),
    cliente,
    telefono,
    entrega,
    domicilio,
    productos,
    createdAt: orden.createdAt,
    // Mensaje preformateado listo para usar en WhatsApp
    mensaje: [
      `🛍️ *Nuevo pedido #${orden.numero}*`,
      `👤 ${cliente}`,
      `📞 ${telefono}`,
      ``,
      productos,
      ``,
      `🚚 ${entrega}${domicilio ? `: ${domicilio}` : ''}`,
      `💰 Total: $${Number(orden.total).toLocaleString('es-AR')}`,
    ].join('\n'),
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) console.error(`[n8n] Webhook respondió ${res.status}`)
  } catch (err) {
    console.error('[n8n] Error al notificar pedido:', err.message)
  }
}

// Notifica al admin vía webhook n8n cuando una variante se queda sin stock
// o vuelve a tener stock. Si N8N_WEBHOOK_STOCK no está configurado, no hace nada.
async function notificarStockBajo({ variante, producto, puntoDeVenta, motivo }) {
  const url = process.env.N8N_WEBHOOK_STOCK
  if (!url) return

  const talle = variante.talle
  const color = variante.color ? ` / ${variante.color}` : ''

  const payload = {
    productoId: producto.id,
    productoNombre: producto.nombre,
    talle,
    color: variante.color ?? null,
    stockActual: variante.stock,
    puntoDeVenta: puntoDeVenta?.nombre ?? null,
    motivo, // 'sin_stock' | 'reingreso'
    mensaje: motivo === 'sin_stock'
      ? `⚠️ *Sin stock*: ${producto.nombre} — talle ${talle}${color}`
      : `✅ *Volvió a haber stock*: ${producto.nombre} — talle ${talle}${color} (${variante.stock} uds)`,
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) console.error(`[n8n] Webhook stock respondió ${res.status}`)
  } catch (err) {
    console.error('[n8n] Error al notificar stock:', err.message)
  }
}

module.exports = { notificarNuevoPedido, notificarStockBajo }
