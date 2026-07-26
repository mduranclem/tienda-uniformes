// Cotizador vía API de Andreani. SIN IMPLEMENTAR.
//
// La cuenta actual es Andreani PyME y su panel de integraciones solo expone
// conectores para WooCommerce y Tiendanube: no entrega credenciales de API.
// Consumir apis.andreani.com requiere contrato comercial, que está gestionándose.
//
// Cuando lleguen las credenciales, esto es lo único que hay que escribir. El
// checkout, las órdenes y el admin no se tocan.
//
// Cómo integrarlo (developers.andreani.com, verificado 2026-07-26):
//
//   1. POST https://apis.andreani.com/login con Basic Auth (usuario/contraseña).
//      Devuelve un token con vigencia de 24 hs — cachearlo en memoria y renovarlo
//      por vencimiento, no en cada cotización.
//   2. Las llamadas siguientes mandan ese token en el header `x-authorization-token`.
//   3. La cotización necesita, además del CP destino: número de cliente, número de
//      contrato, CP de origen (2000, Rosario) y los bultos con peso y valor declarado.
//   4. Ambiente de pruebas en https://apisqa.andreani.com/login.
//
// Al implementar, respetar el contrato de cotizar() y hacer fallback a
// tablaZonas cuando la API no responda: es preferible una tarifa aproximada a
// no poder vender.

const { ErrorCotizacion } = require('./errores')

const VARIABLES_REQUERIDAS = [
  'ANDREANI_USUARIO',
  'ANDREANI_PASSWORD',
  'ANDREANI_CLIENTE',
  'ANDREANI_CONTRATO',
]

async function cotizar() {
  const faltantes = VARIABLES_REQUERIDAS.filter(v => !process.env[v])
  throw new ErrorCotizacion(
    'El cotizador de Andreani todavía no está implementado' +
    (faltantes.length ? ` (faltan además las variables: ${faltantes.join(', ')})` : '')
  )
}

module.exports = { cotizar, VARIABLES_REQUERIDAS }
