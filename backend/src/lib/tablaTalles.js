// Tablas de talles.
//
// No hay una sola: un short y una remera se miden distinto —tiro y cadera
// contra ancho y largo—, así que cada familia de prendas tiene su imagen. La
// URL de cada una vive en ConfigTienda.
//
// `Producto.tipo` guarda el nombre de la categoría, que es texto libre
// ("SHORT SIN FRISA BORDADO"), así que se busca por palabra clave contenida —
// mismo criterio que lib/pesos.js.

const prisma = require('./prisma')

// El orden importa: gana la primera que coincida. Las familias específicas van
// antes que la general, para que un short no termine mostrando la tabla de las
// remeras.
const FAMILIAS = [
  { nombre: 'short', patron: /\bSHORT\b/, clave: 'tablaTallesShortUrl' },
  { nombre: 'pantalon', patron: /\b(PANTALON|JOGGING)\b/, clave: 'tablaTallesPantalonUrl' },
  { nombre: 'general', patron: /\b(REMERA|CHOMBA|BUZO|CAMPERA|CHALECO)\b/, clave: 'tablaTallesUrl' },
]

function normalizar(tipo) {
  if (typeof tipo !== 'string') return ''
  return tipo.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase()
}

/** La familia de tabla que le corresponde a un tipo de prenda, o null. */
function familiaDeTabla(tipo) {
  const norm = normalizar(tipo)
  if (!norm) return null
  return FAMILIAS.find(f => f.patron.test(norm)) ?? null
}

function tieneTablaDeTalles(tipo) {
  return familiaDeTabla(tipo) !== null
}

/**
 * URL de la tabla que le corresponde a esta prenda, o null si no tiene familia
 * o si esa tabla todavía no se cargó. Así el frontend no necesita saber qué
 * tipos tienen tabla ni cuál les toca.
 */
async function urlTablaTalles(tipo) {
  const familia = familiaDeTabla(tipo)
  if (!familia) return null
  const fila = await prisma.configTienda.findUnique({ where: { clave: familia.clave } })
  return fila?.valor || null
}

/** Todas las tablas cargadas, para la página pública de guía de talles. */
async function tablasCargadas() {
  const filas = await prisma.configTienda.findMany({
    where: { clave: { in: FAMILIAS.map(f => f.clave) } },
  })
  const porClave = new Map(filas.map(f => [f.clave, f.valor]))
  return FAMILIAS
    .map(f => ({ familia: f.nombre, url: porClave.get(f.clave) || null }))
    .filter(t => t.url)
}

module.exports = { tieneTablaDeTalles, urlTablaTalles, familiaDeTabla, tablasCargadas, FAMILIAS }
