// Datos de contacto de la tienda para lo que sale del backend (mails, avisos).
//
// Espejo de frontend/src/lib/contacto.js: el número tiene que ser el mismo que
// ve el cliente en el sitio, porque al mail de un pedido le pedimos que mande
// el comprobante justo a ese WhatsApp. Si cambia, hay que tocar los dos.

// Formato internacional sin símbolos, el que espera wa.me.
const WHATSAPP_NUMERO = '5493417434552'

// Cómo se escribe cuando va como texto y no como enlace.
const WHATSAPP_LEGIBLE = '341 743 4552'

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMERO}`

module.exports = { WHATSAPP_NUMERO, WHATSAPP_LEGIBLE, WHATSAPP_URL }
