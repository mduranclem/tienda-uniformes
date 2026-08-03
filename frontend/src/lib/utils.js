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
  // "Hasta" y no "desde": el cliente puede pagar en 1, 2 o hasta n cuotas, y n
  // es el máximo. Decir "desde" invierte el sentido de la promoción.
  const texto = sinInteres
    ? `Hasta ${n} cuotas sin interés de ${formatPrecio(monto)}`
    : `Hasta ${n} cuotas de ${formatPrecio(monto)}`
  // Versión sin monto, para lugares donde el precio varía según el talle.
  const textoCorto = sinInteres
    ? `Hasta ${n} cuotas sin interés`
    : `Hasta ${n} cuotas`
  return { n, sinInteres, monto, texto, textoCorto }
}

export const TALLES_STANDARD = ['4', '6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL', 'ESP']
const ORDEN_TALLES = TALLES_STANDARD

// Posición de un talle para ordenar de más chico a más grande. Los talles
// no reconocidos van al final, en el orden en que aparezcan.
export function posicionTalle(talle) {
  const i = ORDEN_TALLES.indexOf(String(talle).toUpperCase())
  return i === -1 ? ORDEN_TALLES.length : i
}

// Palabras que en español van en minúscula dentro de un título, salvo que
// abran la frase.
const MINUSCULAS_EN_TITULO = new Set([
  'a', 'con', 'de', 'del', 'e', 'el', 'en', 'la', 'las', 'lo', 'los',
  'para', 'por', 'sin', 'sobre', 'u', 'y',
])

// Normaliza el nombre de un producto para mostrarlo.
//
// La versión anterior capitalizaba la inicial de TODAS las palabras y bajaba el
// resto, y eso rompía los nombres bien escritos: "Campera con capucha – Escuela
// Familia de Dios" salía como "Campera Con Capucha – Escuela Familia De Dios",
// y las siglas quedaban destruidas ("IZO" → "Izo", "N.º" → "N.º", "VI" → "Vi").
//
// Casi todos los nombres se cargan bien desde el admin, así que solo se
// interviene cuando hace falta: se colapsan los espacios de más y se reescribe
// únicamente si el nombre vino todo en mayúsculas.
export function titleCase(texto) {
  if (!texto) return ''

  const limpio = texto.replace(/\s+/g, ' ').trim()

  // Tiene minúsculas: está escrito por una persona, se respeta tal cual.
  if (/[a-záéíóúüñ]/.test(limpio)) return limpio

  // Vino en mayúsculas (ej. "PANTALON JOGGING BORDADO"): se pasa a formato
  // título, dejando en minúscula las palabras de enlace que no abren la frase.
  return limpio
    .toLowerCase()
    .split(' ')
    .map((palabra, i) =>
      i > 0 && MINUSCULAS_EN_TITULO.has(palabra)
        ? palabra
        : palabra.charAt(0).toUpperCase() + palabra.slice(1)
    )
    .join(' ')
}
