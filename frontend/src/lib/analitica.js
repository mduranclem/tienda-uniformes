// Eventos de negocio hacia las herramientas de medición.
//
// Hoy la tienda solo tiene Meta Pixel; no hay GA4 ni GTM. Los eventos igual se
// empujan a `dataLayer`, que es la cola estándar que leen tanto GTM como
// gtag.js: el día que se cargue cualquiera de los dos, estos eventos ya están
// puestos y no hay que volver a tocar las pantallas.
//
// `gtag` se llama solo si existe, para cubrir el caso de una instalación
// directa de GA4 sin GTM.

/**
 * Registra un evento con sus parámetros.
 *
 * @param {string} nombre  ej. 'busqueda_colegio_sin_resultado'
 * @param {object} datos   parámetros del evento, en snake_case como espera GA4
 */
export function evento(nombre, datos = {}) {
  if (typeof window === 'undefined') return

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event: nombre, ...datos })

  if (typeof window.gtag === 'function') {
    window.gtag('event', nombre, datos)
  }
}
