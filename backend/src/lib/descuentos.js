// Cálculo de los descuentos de una orden.
//
// Vive aparte de la ruta porque la regla de cómo conviven las promos es
// justamente la parte que se discute y se cambia, y así se puede probar sin
// levantar el servidor ni tocar la base.
//
// El 20% de bienvenida por primera compra se sacó en 2026-11: los precios de
// la lista ya son de promo (efectivo o transferencia).

const DESCUENTO_RETIRO_PCT = 20

// La promo de la casa es retirar en el local. El cupón se suma aparte, porque
// es una acción puntual que la tienda entrega a mano.
function calcularDescuentos({ subtotal, retiraEnLocal = false, cupon = null }) {
  const retiro = retiraEnLocal
    ? Math.round(subtotal * DESCUENTO_RETIRO_PCT / 100)
    : 0

  let descuentoCupon = 0
  if (cupon) {
    descuentoCupon = cupon.tipo === 'PORCENTAJE'
      ? Math.round(subtotal * Number(cupon.valor) / 100)
      : Math.min(Number(cupon.valor), subtotal)
  }

  // Con un cupón grande sobre un carrito ya promocionado el descuento podría
  // superar al carrito y dejar un total negativo.
  const total = Math.min(retiro + descuentoCupon, subtotal)

  return {
    retiro,
    promoAplicada: retiro ? 'RETIRO' : null,
    promo: retiro,
    cupon: descuentoCupon,
    total,
  }
}

module.exports = { calcularDescuentos, DESCUENTO_RETIRO_PCT }
