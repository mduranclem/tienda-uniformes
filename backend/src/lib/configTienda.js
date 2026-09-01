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
  // Datos para que el cliente transfiera. Se muestran en la confirmación del
  // pedido y en el mail.
  'bancoNombre',
  'bancoTitular',
  'bancoCbu',
  'bancoAlias',
  'bancoCuit',
  // '1' habilita el checkout por Mercado Pago; cualquier otra cosa lo deja
  // apagado. Hoy se cobra por transferencia con confirmación manual, pero el
  // código de MP sigue entero para poder volver atrás sin deploy.
  'mercadoPagoActivo',
]

// Lo que puede ver cualquiera desde la tienda, sin autenticación: los datos
// para transferir y si Mercado Pago está disponible. El resto de las claves
// —el webhook de n8n, sobre todo— es interna, así que se elige qué se publica
// en vez de excluir lo secreto: agregar una clave nueva no la expone sola.
const CLAVES_PUBLICAS = [
  'bancoNombre',
  'bancoTitular',
  'bancoCbu',
  'bancoAlias',
  'bancoCuit',
  'mercadoPagoActivo',
  'direccion',
]

async function leerClaves(claves) {
  const filas = await prisma.configTienda.findMany({ where: { clave: { in: claves } } })
  const mapa = Object.fromEntries(filas.map(f => [f.clave, f.valor]))
  return Object.fromEntries(claves.map(clave => [clave, mapa[clave] ?? '']))
}

function leerConfigTienda() {
  return leerClaves(CLAVES)
}

function leerConfigPublica() {
  return leerClaves(CLAVES_PUBLICAS)
}

/** Si el checkout por Mercado Pago está habilitado. Apagado salvo que se pida. */
async function mercadoPagoEstaActivo() {
  const fila = await prisma.configTienda.findUnique({ where: { clave: 'mercadoPagoActivo' } })
  return fila?.valor === '1'
}

module.exports = {
  CLAVES,
  CLAVES_PUBLICAS,
  leerConfigTienda,
  leerConfigPublica,
  mercadoPagoEstaActivo,
}
