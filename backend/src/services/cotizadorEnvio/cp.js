// Normalización de códigos postales argentinos.
//
// El cliente puede escribir el CP viejo de 4 dígitos ("2000") o el CPA con
// letras ("S2000ABC"). En ambos casos lo que zonifica son los 4 dígitos del
// medio, así que se extraen y se descarta el resto.

const { ErrorCotizacion } = require('./errores')

function normalizarCP(cp) {
  const texto = String(cp ?? '').trim()
  const digitos = texto.match(/\d{4}/)
  if (!digitos) {
    throw new ErrorCotizacion(`"${texto}" no es un código postal válido`)
  }
  return Number(digitos[0])
}

module.exports = { normalizarCP }
