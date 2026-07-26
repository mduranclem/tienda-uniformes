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

export const TALLES_STANDARD = ['4', '6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL', 'ESP']
const ORDEN_TALLES = TALLES_STANDARD

// Posición de un talle para ordenar de más chico a más grande. Los talles
// no reconocidos van al final, en el orden en que aparezcan.
export function posicionTalle(talle) {
  const i = ORDEN_TALLES.indexOf(String(talle).toUpperCase())
  return i === -1 ? ORDEN_TALLES.length : i
}

// Capitaliza la primera letra de cada palabra
export function titleCase(texto) {
  if (!texto) return ''
  return texto
    .toLowerCase()
    .replace(/(?:^|\s|-)\S/g, l => l.toUpperCase())
}
