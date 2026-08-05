// Reglas del envío que reparte la tienda.
//
// Rosario y las localidades pegadas van con logística propia y precio fijo; el
// resto del país va por Andreani y se cotiza aparte.

// Localidades que cubre el reparto propio. Se comparan normalizadas (sin
// tildes, en minúsculas) para tolerar "Villa Gdor. Gálvez" o "GRANADERO
// BAIGORRIA, SANTA FE".
const LOCALIDADES_LOCALES = [
  'rosario',
  'funes',
  'roldan',
  'perez',
  'ibarlucea',
  'granadero baigorria',
  'baigorria',
  'villa gobernador galvez',
  'gobernador galvez',
]

// A partir de cuántas unidades el envío local pasa a ser gratis.
const UNIDADES_ENVIO_LOCAL_GRATIS = 2

function normalizar(texto) {
  if (typeof texto !== 'string') return ''
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

/**
 * ¿La ciudad entra en el reparto propio (Rosario y alrededores)?
 *
 * Cada nombre se busca como palabra completa dentro de lo que escribió el
 * cliente, así "Rosario, Santa Fe" entra igual que "rosario".
 */
function esZonaLocal(ciudad) {
  const norm = normalizar(ciudad)
  if (!norm) return false
  return LOCALIDADES_LOCALES.some(l => new RegExp(`\\b${l}\\b`).test(norm))
}

/**
 * Cuánto sale el envío local para un pedido de `unidades` prendas.
 *
 * @param {number} unidades  total de prendas, no de líneas del carrito: dos
 *                           remeras del mismo talle son dos unidades.
 * @param {number} costoBase precio configurado en la entrega (/admin/entregas).
 */
function costoEnvioLocal(unidades, costoBase) {
  return unidades >= UNIDADES_ENVIO_LOCAL_GRATIS ? 0 : Number(costoBase)
}

module.exports = {
  esZonaLocal,
  // La zona ahora es más grande que Rosario, pero varios llamadores siguen
  // preguntando "¿es Rosario?". Se mantiene el nombre viejo como alias.
  esRosario: esZonaLocal,
  costoEnvioLocal,
  UNIDADES_ENVIO_LOCAL_GRATIS,
  LOCALIDADES_LOCALES,
}
