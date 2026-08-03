// Datos de contacto de la tienda, en un solo lugar.
//
// El número estaba repetido en el botón flotante, el menú mobile y la página
// de Contacto. Con tres copias, cambiarlo significaba acordarse de los tres
// archivos y alcanzaba con olvidar uno para mandar clientes a un teléfono viejo.

// Formato internacional sin símbolos, que es el que espera wa.me:
// 54 (país) + 9 (móvil) + código de área + abonado.
export const WHATSAPP_NUMERO = '5493415556865'

// Cómo se muestra al cliente cuando el número va escrito, no como enlace.
export const WHATSAPP_LEGIBLE = '341 555 6865'

const SALUDO = 'Hola! Tengo una consulta sobre los uniformes'

export const WHATSAPP_URL =
  `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(SALUDO)}`

export const EMAIL_CONTACTO = 'contacto@tiendadeuniformes.store'
