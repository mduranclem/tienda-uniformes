// Meta Pixel.
//
// El ID sale de VITE_META_PIXEL_ID. Sin esa variable no se carga nada: en
// desarrollo no queremos ensuciar las métricas con nuestras propias visitas ni
// pedirle a cada uno que configure una cuenta de Meta para levantar la tienda.
//
// El script oficial se descarga con async, así que no bloquea el renderizado.
// Todo lo que se manda son eventos de la tienda: no se envían mail, teléfono ni
// dirección, que es información del cliente y no hace falta para medir.

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID

export const MONEDA = 'ARS'

let iniciado = false

/**
 * Carga el pixel una sola vez. Se llama al montar la aplicación.
 *
 * No dispara PageView acá: de eso se encarga el hook de navegación, que
 * también cubre los cambios de ruta. Dispararlo en los dos lados contaría dos
 * veces la primera pantalla.
 */
export function iniciarPixel() {
  if (iniciado || !PIXEL_ID || typeof window === 'undefined') return

  /* eslint-disable */
  // Snippet oficial de Meta, tal cual lo entrega el administrador de eventos.
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    }
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = !0
    n.version = '2.0'
    n.queue = []
    t = b.createElement(e)
    t.async = !0
    t.src = v
    s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
  /* eslint-enable */

  window.fbq('init', PIXEL_ID)
  iniciado = true
}

/**
 * Manda un evento estándar. Si el pixel no está configurado no hace nada, así
 * que se puede llamar sin condicionales desde cualquier página.
 */
export function trackPixel(evento, datos) {
  if (typeof window === 'undefined' || !window.fbq) return
  if (datos) window.fbq('track', evento, datos)
  else window.fbq('track', evento)
}

// ── Eventos de la tienda ─────────────────────────────────────────────────────
// Cada uno arma el payload que espera Meta, para que las páginas no tengan que
// acordarse de los nombres de los campos ni de la moneda.

export function trackPageView() {
  trackPixel('PageView')
}

export function trackViewContent({ id, nombre, precio }) {
  trackPixel('ViewContent', {
    content_ids: [String(id)],
    content_name: nombre,
    content_type: 'product',
    value: Number(precio) || 0,
    currency: MONEDA,
  })
}

export function trackAddToCart({ id, nombre, precioUnit, cantidad }) {
  trackPixel('AddToCart', {
    content_ids: [String(id)],
    content_name: nombre,
    content_type: 'product',
    value: (Number(precioUnit) || 0) * (Number(cantidad) || 0),
    currency: MONEDA,
    contents: [{ id: String(id), quantity: Number(cantidad) || 0 }],
  })
}

export function trackInitiateCheckout({ total, unidades, productoIds = [] }) {
  trackPixel('InitiateCheckout', {
    value: Number(total) || 0,
    currency: MONEDA,
    num_items: Number(unidades) || 0,
    content_ids: productoIds.map(String),
    content_type: 'product',
  })
}

export function trackPurchase({ total, unidades, productoIds = [] }) {
  trackPixel('Purchase', {
    value: Number(total) || 0,
    currency: MONEDA,
    num_items: Number(unidades) || 0,
    content_ids: productoIds.map(String),
    content_type: 'product',
  })
}
