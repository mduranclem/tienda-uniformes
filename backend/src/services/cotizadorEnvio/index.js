// Cotizador de envíos.
//
// Punto único de entrada: nadie más en el código sabe si el precio sale de la
// tabla propia o de la API de Andreani. Cambiar de uno a otro es cambiar la
// variable de entorno COTIZADOR_ENVIO.

const tablaZonas = require('./tablaZonas')
const andreani = require('./andreani')
const { ErrorCotizacion } = require('./errores')

const IMPLEMENTACIONES = {
  tabla: tablaZonas,
  andreani,
}

function implementacionActiva() {
  const nombre = process.env.COTIZADOR_ENVIO ?? 'tabla'
  const impl = IMPLEMENTACIONES[nombre]
  if (!impl) {
    throw new Error(
      `COTIZADOR_ENVIO="${nombre}" no existe. Opciones: ${Object.keys(IMPLEMENTACIONES).join(', ')}`
    )
  }
  return impl
}

/**
 * @param {{ cp: string, ciudad?: string, pesoGramos: number, valorDeclarado: number }} destino
 * @returns {Promise<Array<{ codigo: string, nombre: string, precio: number, plazoDias: number|null }>>}
 * @throws {ErrorCotizacion} si ese destino o ese peso no se pueden cotizar
 */
async function cotizar(destino) {
  return implementacionActiva().cotizar(destino)
}

module.exports = { cotizar, ErrorCotizacion, implementacionActiva }
