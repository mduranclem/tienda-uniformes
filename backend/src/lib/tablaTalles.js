// Tabla de talles: una sola imagen compartida por todas las prendas que la
// tienen (la imagen cubre buzo/campera y remera manga corta).
//
// `Producto.tipo` guarda el nombre de la categoría, que es texto libre
// ("CAMPERA CANGURO CON FRISA BORDADO"), así que se busca por palabra clave
// contenida — mismo criterio que lib/pesos.js.

const prisma = require('./prisma')

const PRENDAS_CON_TABLA = /\bREMERA|CHOMBA|BUZO|CAMPERA|CHALECO\b/

function tieneTablaDeTalles(tipo) {
  if (typeof tipo !== 'string') return false
  const norm = tipo.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase()
  return PRENDAS_CON_TABLA.test(norm)
}

// Devuelve la URL solo si esta prenda tiene tabla; null en caso contrario, para
// que el frontend no tenga que saber qué tipos la tienen.
async function urlTablaTalles(tipo) {
  if (!tieneTablaDeTalles(tipo)) return null
  const fila = await prisma.configTienda.findUnique({ where: { clave: 'tablaTallesUrl' } })
  return fila?.valor || null
}

module.exports = { tieneTablaDeTalles, urlTablaTalles }
