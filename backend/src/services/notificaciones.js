// Notificaciones salientes hacia n8n (webhooks). Todas usan postConReintentos
// (3 intentos con backoff) y nunca lanzan — se llaman fire-and-forget.

const { postConReintentos } = require('../lib/httpRetry')
const prisma = require('../lib/prisma')
const { esRosario } = require('../lib/envios')
const { aWhatsapp } = require('../lib/telefono')
const { componerMensaje, ESTADOS_QUE_NOTIFICAN_POR_DEFECTO } = require('./mensajesEstado')

// Cómo recibe el cliente el pedido. Se deriva del tipo de entrega y de la
// ciudad, reusando el mismo esRosario() que ya usan el checkout y la creación
// de la orden: no se introduce una segunda definición de "es Rosario".
function modoDeEnvio(orden) {
  if (orden.entrega?.tipo !== 'ENVIO') return 'RETIRO'
  return esRosario(orden.domicilio?.ciudad) ? 'ROSARIO' : 'INTERIOR'
}

// Estados que avisan, configurables desde /admin/bot.
async function estadosQueNotifican() {
  try {
    const fila = await prisma.configTienda.findUnique({ where: { clave: 'estadosQueNotifican' } })
    const lista = (fila?.valor ?? '').split(',').map(s => s.trim()).filter(Boolean)
    return lista.length ? lista : ESTADOS_QUE_NOTIFICAN_POR_DEFECTO
  } catch (_) {
    // Si la config no se puede leer, mejor avisar de más que quedarse mudo.
    return ESTADOS_QUE_NOTIFICAN_POR_DEFECTO
  }
}

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

// Notifica un cambio de estado de una orden, con el mensaje de WhatsApp ya
// redactado para que n8n solo tenga que reenviarlo.
//
// No dispara para los estados que no le sirven al cliente (PREPARANDO no le
// pide una acción ni le da información nueva, y cada mensaje de más gasta la
// paciencia de la que dependen los que sí importan).
async function notificarCambioEstado(orden, estadoNuevo) {
  const url = process.env.WEBHOOK_ORDEN_ESTADO
  if (!url) return

  const estados = await estadosQueNotifican()
  if (!estados.includes(estadoNuevo)) return

  const { cliente, telefono, email } = datosCliente(orden)
  const modoEnvio = modoDeEnvio(orden)
  const puntoRetiro = modoEnvio === 'RETIRO' ? (orden.entrega?.nombre ?? null) : null

  const mensaje = componerMensaje({
    estado: estadoNuevo,
    modoEnvio,
    numero: orden.numero,
    puntoRetiro,
    entregaFecha: orden.entregaFecha,
    entregaFranja: orden.entregaFranja,
    // Al interior el flete no se cobró en el checkout: la orden quedó con
    // costoEnvio en 0 y todavía hay que pasarle el costo al cliente.
    envioACotizar: modoEnvio === 'INTERIOR' && Number(orden.costoEnvio) === 0,
  })
  if (!mensaje) return

  const payload = {
    numero: orden.numero,
    estado: estadoNuevo,
    cliente,
    email,
    // telefono es lo que escribió el cliente; telefonoWhatsapp es ese mismo
    // número en formato internacional (5493417434552), que es el único que
    // acepta WhatsApp. Es null si no se pudo interpretar: en ese caso no hay
    // que mandar nada, porque escribirle a un número equivocado es peor.
    telefono,
    telefonoWhatsapp: aWhatsapp(telefono),
    tipoEntrega: orden.entrega?.tipo ?? null,
    modoEnvio,
    puntoRetiro,
    entregaFecha: orden.entregaFecha ?? null,
    entregaFranja: orden.entregaFranja ?? null,
    // Texto listo para mandar por WhatsApp tal cual viene.
    mensaje,
  }

  await postConReintentos(url, payload, { tag: 'n8n:orden-estado' })
}

module.exports = { notificarNuevoPedido, notificarOrdenPagada, notificarCambioEstado }
