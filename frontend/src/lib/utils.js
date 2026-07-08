export function formatPrecio(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor)
}

export function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Normaliza texto para comparar: sin tildes, minúsculas, sin espacios extra
export function normalizarTexto(texto) {
  if (typeof texto !== 'string') return ''
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

// El envío dentro de Rosario es siempre gratis (espejo de backend/src/lib/envios.js)
export function esRosario(ciudad) {
  return /\brosario\b/.test(normalizarTexto(ciudad))
}

// Financiación de un producto. Devuelve null si no tiene cuotas configuradas.
// cuotasRecargo: % de recargo sobre el precio; null/0 = sin interés.
export function infoCuotas(precioFinal, cuotas, cuotasRecargo) {
  const n = Number(cuotas)
  if (!n || n < 2 || !precioFinal) return null
  const recargo = Number(cuotasRecargo ?? 0)
  const sinInteres = !recargo
  const monto = (Number(precioFinal) * (1 + recargo / 100)) / n
  const texto = sinInteres
    ? `${n} cuotas sin interés de ${formatPrecio(monto)}`
    : `${n} cuotas de ${formatPrecio(monto)}`
  return { n, sinInteres, monto, texto }
}

// Capitaliza la primera letra de cada palabra
export function titleCase(texto) {
  if (!texto) return ''
  return texto
    .toLowerCase()
    .replace(/(?:^|\s|-)\S/g, l => l.toUpperCase())
}
