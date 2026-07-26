// Peso de las prendas, para cotizar envíos.
//
// El peso real vive en `Producto.pesoGramos` y se carga desde el admin. Estos
// valores son la estimación que se usa mientras ese campo esté en null, para
// que un producto sin cargar no rompa la cotización ni la subestime.

const PESO_POR_TIPO = {
  REMERA: 180,
  CHOMBA: 200,
  BUZO: 500,
  CAMPERA: 800,
  PANTALON: 400,
  SHORT: 250,
  MEDIAS: 80,
}

// Prenda de tipo desconocido: se asume del lado pesado a propósito, porque
// subestimar el peso significa despachar a pérdida.
const PESO_DEFECTO = 300

// Caja, bolsa y relleno. Se suma una sola vez por envío, no por prenda.
const PESO_EMBALAJE = 200

function pesoDeProducto(producto) {
  if (Number.isFinite(producto?.pesoGramos) && producto.pesoGramos > 0) {
    return producto.pesoGramos
  }
  const tipo = typeof producto?.tipo === 'string' ? producto.tipo.toUpperCase() : ''
  return PESO_POR_TIPO[tipo] ?? PESO_DEFECTO
}

// items: [{ producto: { tipo, pesoGramos }, cantidad }]
function pesoDelEnvio(items) {
  const prendas = items.reduce(
    (acc, item) => acc + pesoDeProducto(item.producto) * item.cantidad,
    0
  )
  return prendas + PESO_EMBALAJE
}

module.exports = { PESO_POR_TIPO, PESO_DEFECTO, PESO_EMBALAJE, pesoDeProducto, pesoDelEnvio }
