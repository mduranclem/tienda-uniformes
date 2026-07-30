// Claves de ConfigTienda (tabla clave-valor) y su lectura, compartida entre
// el endpoint público /api/bot/info y el admin /api/admin/bot.

const prisma = require('./prisma')

const CLAVES = [
  'horarios',
  'direccion',
  'telefono',
  'politicaCambios',
  'mediosPago',
  'tiempoEnvioRosario',
  'tiempoEnvioFueraRosario',
  'webhookStockAlert',
  'tablaTallesUrl',
  // Estados de orden que disparan WhatsApp al cliente, separados por coma.
  // Vacío = se usan los de mensajesEstado.ESTADOS_QUE_NOTIFICAN_POR_DEFECTO.
  'estadosQueNotifican',
]

async function leerConfigTienda() {
  const filas = await prisma.configTienda.findMany({ where: { clave: { in: CLAVES } } })
  const mapa = Object.fromEntries(filas.map(f => [f.clave, f.valor]))
  return Object.fromEntries(CLAVES.map(clave => [clave, mapa[clave] ?? '']))
}

module.exports = { CLAVES, leerConfigTienda }
