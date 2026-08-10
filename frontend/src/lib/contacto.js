// Datos de contacto de la tienda, en un solo lugar.
//
// El número estaba repetido en el botón flotante, el menú mobile y la página
// de Contacto. Con tres copias, cambiarlo significaba acordarse de los tres
// archivos y alcanzaba con olvidar uno para mandar clientes a un teléfono viejo.

// Formato internacional sin símbolos, que es el que espera wa.me:
// 54 (país) + 9 (móvil) + código de área + abonado.
export const WHATSAPP_NUMERO = '5493417434552'

// Cómo se muestra al cliente cuando el número va escrito, no como enlace.
export const WHATSAPP_LEGIBLE = '341 743 4552'

const SALUDO = 'Hola! Tengo una consulta sobre los uniformes'

/**
 * Enlace a WhatsApp con el mensaje ya escrito.
 *
 * Escribir el mensaje por el cliente no es un detalle: el que abre WhatsApp con
 * el chat en blanco muchas veces no escribe nada y se pierde la consulta.
 */
export function whatsappUrl(mensaje = SALUDO) {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`
}

export const WHATSAPP_URL = whatsappUrl()

export const EMAIL_CONTACTO = 'tiendadeuniformes.incollege@gmail.com'

export const DIRECCIONES = ['Dean Funes 1258', 'Eva Perón 7790', 'Alberdi 608']
export const CIUDAD = 'Rosario, Santa Fe'
