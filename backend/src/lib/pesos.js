// Peso de las prendas, para cotizar envíos.
//
// El peso real vive en `Producto.pesoGramos` y se carga desde el admin. Estos
// valores son la estimación que se usa mientras ese campo esté en null, para
// que un producto sin cargar no rompa la cotización ni la subestime.
//
// `Producto.tipo` guarda el nombre de la categoría, que es texto libre cargado
// desde el admin: "CHOMBA BORDADA", "CAMPERA CANGURO CON FRISA BORDADO",
// "REMERA MANGAS LARGAS LISA". Por eso se busca por palabra clave contenida y
// no por igualdad exacta.
//
// El orden importa: gana la primera regla que coincide, así que las más
// específicas van primero ("REMERA MANGAS LARGAS" antes que "REMERA").

const REGLAS_PESO = [
  [/\bCAMPERA\b/, 800],
  [/\bBUZO\b/, 500],
  [/\bPANTALON|PANTALÓN|JOGGING\b/, 400],
  [/\bCHALECO\b/, 400],
  [/\bREMERA\b.*\bMANGAS?\s+LARGAS?\b/, 220],
  [/\bPOLLERA\b/, 250],
  [/\bSHORT\b/, 250],
  [/\bCHOMBA\b/, 200],
  [/\bREMERA\b/, 180],
  [/\bMEDIAS?\b/, 80],
]

// Prenda que no coincide con ninguna regla: se asume del lado pesado a
// propósito, porque subestimar el peso significa despachar a pérdida.
const PESO_DEFECTO = 500

// Caja, bolsa y relleno. Se suma una sola vez por envío, no por prenda.
const PESO_EMBALAJE = 200

function pesoPorTipo(tipo) {
  if (typeof tipo !== 'string') return PESO_DEFECTO
  const norm = tipo.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase()
  const regla = REGLAS_PESO.find(([patron]) => patron.test(norm))
  return regla ? regla[1] : PESO_DEFECTO
}

function pesoDeProducto(producto) {
  if (Number.isFinite(producto?.pesoGramos) && producto.pesoGramos > 0) {
    return producto.pesoGramos
  }
  return pesoPorTipo(producto?.tipo)
}

// items: [{ producto: { tipo, pesoGramos }, cantidad }]
function pesoDelEnvio(items) {
  const prendas = items.reduce(
    (acc, item) => acc + pesoDeProducto(item.producto) * item.cantidad,
    0
  )
  return prendas + PESO_EMBALAJE
}

module.exports = { REGLAS_PESO, PESO_DEFECTO, PESO_EMBALAJE, pesoPorTipo, pesoDeProducto, pesoDelEnvio }
