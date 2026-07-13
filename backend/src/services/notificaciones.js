// Notificaciones salientes hacia n8n (webhooks). Todas usan postConReintentos
// (3 intentos con backoff) y nunca lanzan — se llaman fire-and-forget.

const { postConReintentos } = require('../lib/httpRetry')

function datosCliente(orden) {
  const cliente = orden.usuario
    ? `${orden.usuario.nombre ?? ''} (${orden.usuario.email})`.trim()
    : `${orden.nombreGuest ?? ''} (${orden.emailGuest ?? ''})`.trim()
  const telefono = orden.usuario?.telefono ?? orden.telefonoGuest ?? '—'
  const email = orden.usuario?.email ?? orden.emailGuest ?? null
  return { cliente, telefono, email }
}

function listaProductos(orden) {
  return (orden.items ?? []).map(item => {
    const talle = item.variante?.talle ?? ''
    const color = item.variante?.color ? ` / ${item.variante.color}` : ''
    return `• ${item.producto?.nombre ?? 'Producto'} — talle ${talle}${color} x${item.cantidad}`
  }).join('\n')
}

// Notifica al admin vía webhook n8n cuando entra un pedido nuevo.
// Si N8N_WEBHOOK_PEDIDO no está configurado, no hace nada.
async function notificarNuevoPedido(orden) {
  const url = process.env.N8N_WEBHOOK_PEDIDO
  if (!url) return

  const { cliente, telefono } = datosCliente(orden)
  const productos = listaProductos(orden)

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

  await postConReintentos(url, payload, { tag: 'n8n:pedido' })
}

// Notifica cuando una orden pasa a PAGADA (pensado para avisarle al cliente
// por WhatsApp que su pago se confirmó).
async function notificarOrdenPagada(orden) {
  const url = process.env.WEBHOOK_ORDEN_PAGADA
  if (!url) return

  const { cliente, telefono, email } = datosCliente(orden)
  const productos = listaProductos(orden)
  const domicilio = orden.domicilio
    ? `${orden.domicilio.calle} ${orden.domicilio.numero ?? ''}${orden.domicilio.piso ? ` piso ${orden.domicilio.piso}` : ''}, ${orden.domicilio.ciudad}`
    : null

  const payload = {
    numero: orden.numero,
    cliente,
    email,
    telefono,
    direccion: domicilio,
    items: (orden.items ?? []).map(item => ({
      producto: item.producto?.nombre ?? 'Producto',
      talle: item.variante?.talle ?? null,
      color: item.variante?.color ?? null,
      cantidad: item.cantidad,
    })),
    total: Number(orden.total),
  }

  await postConReintentos(url, payload, { tag: 'n8n:orden-pagada' })
}

// Notifica cualquier cambio de estado de una orden.
async function notificarCambioEstado(orden, estadoNuevo) {
  const url = process.env.WEBHOOK_ORDEN_ESTADO
  if (!url) return

  const { cliente, telefono, email } = datosCliente(orden)

  const payload = {
    numero: orden.numero,
    estado: estadoNuevo,
    cliente,
    email,
    telefono,
  }

  await postConReintentos(url, payload, { tag: 'n8n:orden-estado' })
}

module.exports = { notificarNuevoPedido, notificarOrdenPagada, notificarCambioEstado }
