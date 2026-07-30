// Error de cotización: el destino o el peso no se pueden cotizar.
//
// Se distingue de un error genérico porque el checkout lo traduce a un 422 con
// mensaje visible para el cliente, en lugar de un 500 anónimo.

class ErrorCotizacion extends Error {
  constructor(mensaje) {
    super(mensaje)
    this.name = 'ErrorCotizacion'
    this.esErrorCotizacion = true
  }
}

module.exports = { ErrorCotizacion }
