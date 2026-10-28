// Redacción de los avisos por WhatsApp según el estado del pedido.
//
// Vive acá y no en n8n a propósito: así el texto queda versionado en git y
// cubierto por tests. n8n recibe el mensaje ya escrito y solo lo reenvía.
//
// Es una función pura: sin base de datos ni red. El error que importa —prometer
// un retiro cuando en realidad era un envío— se atrapa con un test.

const { formatearFecha } = require('../lib/agendaEntrega')

// Cómo se le entrega al cliente. Se deriva del tipo de entrega y de la ciudad.
const MODOS = ['RETIRO', 'ROSARIO', 'INTERIOR']

// Estados que avisan si no hay nada configurado en /admin/bot.
// PREPARANDO queda afuera: no le pide una acción al cliente ni le da
// información que no tenga, y cada mensaje de más gasta la paciencia de la que
// dependen los que sí importan.
// PENDIENTE sí: es el mensaje que le pasa al cliente los datos para pagar.
const ESTADOS_QUE_NOTIFICAN_POR_DEFECTO = ['PENDIENTE', 'PAGADA', 'LISTA', 'ENTREGADA', 'CANCELADA']

function formatearMonto(n) {
  return `$${Number(n).toLocaleString('es-AR')}`
}

// venceEl es un instante y no un día de calendario como entregaFecha: se
// muestra en hora argentina, o un pedido de las 22 h vencería "un día después".
function formatearVencimiento(venceEl) {
  const fecha = venceEl instanceof Date ? venceEl : new Date(venceEl)
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(fecha).replace(',', '')
}

// Pedido recién hecho: qué tiene que hacer el cliente para pagarlo.
function mensajePendiente({ pedido, metodoPago, total, transferencia, venceEl }) {
  const plazo = venceEl ? ` antes del ${formatearVencimiento(venceEl)}` : ''

  if (metodoPago === 'efectivo') {
    return `🛍️ ${pedido}\n\n¡Recibimos tu pedido! Lo pagás en efectivo cuando lo pasás a retirar. Te avisamos por acá apenas esté listo.`
  }
  // Sin datos bancarios cargados no hay nada útil que decir: mandar "transferí"
  // sin decir adónde solo genera la pregunta.
  if (metodoPago !== 'transferencia' || !transferencia) return null

  const datos = [
    transferencia.alias && `Alias: *${transferencia.alias}*`,
    transferencia.cbu && `CBU: ${transferencia.cbu}`,
    transferencia.titular && `Titular: ${transferencia.titular}`,
    transferencia.banco && `Banco: ${transferencia.banco}`,
  ].filter(Boolean).join('\n')

  return [
    `🛍️ ${pedido}`,
    '',
    `¡Recibimos tu pedido! Para confirmarlo, transferí *${formatearMonto(total)}*${plazo}:`,
    '',
    datos,
    '',
    'Cuando lo hagas, mandanos el comprobante por acá. Si necesitás más tiempo, avisanos y te guardamos el pedido.',
  ].join('\n')
}

function cuando({ entregaFecha, entregaFranja }) {
  if (!entregaFecha || !entregaFranja) return null
  return `el ${formatearFecha(entregaFecha)} entre las ${entregaFranja.replace('-', ' y las ')} hs`
}

/**
 * @param {{ estado: string, modoEnvio: string, numero: number,
 *           puntoRetiro?: string|null, entregaFecha?: Date|string|null,
 *           entregaFranja?: string|null, envioACotizar?: boolean,
 *           metodoPago?: string|null, total?: number,
 *           transferencia?: {alias, cbu, titular, banco}|null,
 *           venceEl?: Date|string|null }} datos
 * @returns {string|null} null si ese estado no corresponde avisarlo
 */
function componerMensaje({
  estado, modoEnvio, numero, puntoRetiro, entregaFecha, entregaFranja, envioACotizar = false,
  metodoPago = null, total = 0, transferencia = null, venceEl = null,
}) {
  const pedido = `*Pedido #${numero}*`
  const momento = cuando({ entregaFecha, entregaFranja })

  switch (estado) {
    case 'PENDIENTE':
      return mensajePendiente({ pedido, metodoPago, total, transferencia, venceEl })

    case 'PAGADA':
      if (modoEnvio === 'RETIRO') {
        return `✅ ${pedido}\n\n¡Recibimos tu pago! Te avisamos por acá apenas esté listo para retirar.`
      }
      if (modoEnvio === 'ROSARIO') {
        return momento
          ? `✅ ${pedido}\n\n¡Recibimos tu pago! Te lo llevamos ${momento}.`
          : `✅ ${pedido}\n\n¡Recibimos tu pago! Te escribimos para coordinar la entrega.`
      }
      // Al interior el flete no se cobró en la tienda, así que el pago que
      // acaba de hacer no lo incluye. Decirlo acá y no cuando ya está
      // despachado: enterarse del costo después de pagar se siente a trampa.
      return envioACotizar
        ? `✅ ${pedido}\n\n¡Recibimos tu pago! Falta el envío: te pasamos el costo por acá y, cuando lo abones, lo despachamos por Andreani.`
        : `✅ ${pedido}\n\n¡Recibimos tu pago! Te avisamos en cuanto lo despachemos por Andreani.`

    case 'LISTA':
      if (modoEnvio === 'RETIRO') {
        return puntoRetiro
          ? `📦 ${pedido}\n\n¡Ya podés retirarlo! Te esperamos en ${puntoRetiro}, de lunes a viernes de 10 a 16 hs.`
          : `📦 ${pedido}\n\n¡Ya está listo para retirar! Te esperamos de lunes a viernes de 10 a 16 hs.`
      }
      if (modoEnvio === 'ROSARIO') {
        return momento
          ? `🚚 ${pedido}\n\n¡Tu pedido está listo! Sale ${momento}.`
          : `🚚 ${pedido}\n\n¡Tu pedido está listo! Te escribimos para coordinar la entrega.`
      }
      return `🚚 ${pedido}\n\n¡Lo despachamos por Andreani! En breve vas a poder seguirlo con el código de envío.`

    case 'ENTREGADA':
      return `🎉 ${pedido}\n\n¡Gracias por tu compra! Cualquier cosa que necesites, escribinos por acá.`

    case 'CANCELADA':
      return `❌ ${pedido}\n\nTu pedido fue cancelado. Si creés que es un error, respondenos este mensaje y lo revisamos.`

    default:
      // PREPARANDO no avisa.
      return null
  }
}

module.exports = { componerMensaje, MODOS, ESTADOS_QUE_NOTIFICAN_POR_DEFECTO }
