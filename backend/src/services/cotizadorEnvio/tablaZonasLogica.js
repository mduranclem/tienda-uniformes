// Lógica pura de selección de zona y tarifa.
//
// Vive separada de tablaZonas.js —que sí toca la base— para poder testear los
// casos de borde (rangos solapados, peso justo en el límite, exceso de peso)
// sin levantar Postgres.

const { ErrorCotizacion } = require('./errores')

function slug(texto) {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Ante rangos solapados (error de carga en el admin) gana la zona de `orden`
// menor, que por convención es la más barata. No debería haber solapamientos,
// pero si los hay conviene equivocarse a favor del cliente.
function elegirZona(zonas, cpNumerico) {
  const candidatas = zonas.filter(zona =>
    zona.rangos.some(rango => cpNumerico >= rango.desde && cpNumerico <= rango.hasta)
  )
  if (candidatas.length === 0) {
    throw new ErrorCotizacion(
      `Todavía no tenemos tarifa de envío para el código postal ${cpNumerico}`
    )
  }
  return candidatas.sort((a, b) => a.orden - b.orden)[0]
}

function precioParaPeso(zona, pesoGramos) {
  const escalones = [...zona.tarifas].sort((a, b) => a.pesoHastaG - b.pesoHastaG)
  if (escalones.length === 0) {
    throw new ErrorCotizacion(`La zona "${zona.nombre}" no tiene tarifas cargadas`)
  }

  // El escalón "hasta 1 kg" incluye exactamente 1000 g, de ahí el >=.
  const escalon = escalones.find(t => t.pesoHastaG >= pesoGramos)
  if (escalon) return Number(escalon.precio)

  const tope = escalones[escalones.length - 1]
  const porKg = zona.precioKgAdicional === null || zona.precioKgAdicional === undefined
    ? null
    : Number(zona.precioKgAdicional)
  if (porKg === null) {
    throw new ErrorCotizacion(
      `El pedido supera el peso máximo que podemos enviar a "${zona.nombre}". Escribinos y lo resolvemos.`
    )
  }

  const kilosDeMas = Math.ceil((pesoGramos - tope.pesoHastaG) / 1000)
  return Number(tope.precio) + kilosDeMas * porKg
}

module.exports = { slug, elegirZona, precioParaPeso }
