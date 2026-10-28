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
  // pedido, en el mail y en el WhatsApp de "pedido recibido".
  'transferenciaAlias',
  'transferenciaCbu',
  'transferenciaTitular',
  'transferenciaBanco',
]

async function leerConfigTienda() {
  const filas = await prisma.configTienda.findMany({ where: { clave: { in: CLAVES } } })
  const mapa = Object.fromEntries(filas.map(f => [f.clave, f.valor]))
  return Object.fromEntries(CLAVES.map(clave => [clave, mapa[clave] ?? '']))
}

// Datos bancarios para transferir, o null si no hay alias ni CBU cargados: sin
// ninguno de los dos el cliente no tiene adónde mandar la plata y es mejor no
// mostrar un bloque de pago vacío.
async function leerDatosTransferencia() {
  const config = await leerConfigTienda()
  const datos = {
    alias: config.transferenciaAlias.trim(),
    cbu: config.transferenciaCbu.trim(),
    titular: config.transferenciaTitular.trim(),
    banco: config.transferenciaBanco.trim(),
  }
  return datos.alias || datos.cbu ? datos : null
}

module.exports = { CLAVES, leerConfigTienda, leerDatosTransferencia }
