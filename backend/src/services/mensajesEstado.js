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
const ESTADOS_QUE_NOTIFICAN_POR_DEFECTO = ['PAGADA', 'LISTA', 'ENTREGADA', 'CANCELADA']

function cuando({ entregaFecha, entregaFranja }) {
  if (!entregaFecha || !entregaFranja) return null
  return `el ${formatearFecha(entregaFecha)} entre las ${entregaFranja.replace('-', ' y las ')} hs`
}

/**
 * @param {{ estado: string, modoEnvio: string, numero: number,
 *           puntoRetiro?: string|null, entregaFecha?: Date|string|null,
 *           entregaFranja?: string|null, envioACotizar?: boolean }} datos
 * @returns {string|null} null si ese estado no corresponde avisarlo
 */
function componerMensaje({ estado, modoEnvio, numero, puntoRetiro, entregaFecha, entregaFranja, envioACotizar = false }) {
  const pedido = `*Pedido #${numero}*`
  const momento = cuando({ entregaFecha, entregaFranja })

  switch (estado) {
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
      // PENDIENTE y PREPARANDO no avisan.
      return null
  }
}

module.exports = { componerMensaje, MODOS, ESTADOS_QUE_NOTIFICAN_POR_DEFECTO }
