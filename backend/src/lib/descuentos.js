// Cálculo de los descuentos de una orden.
//
// Vive aparte de la ruta porque la regla de los descuentos es justamente la
// parte que se discute y se cambia, y así se puede probar sin levantar el
// servidor ni tocar la base.
//
// En 2026-11 se sacaron las promos de la casa (20% por primera compra y 20% por
// retirar en el local): los precios de la lista ya son de promo (efectivo o
// transferencia). Queda solo el cupón, que la tienda entrega a mano.

function calcularDescuentos({ subtotal, cupon = null }) {
  let descuentoCupon = 0
  if (cupon) {
    descuentoCupon = cupon.tipo === 'PORCENTAJE'
      ? Math.round(subtotal * Number(cupon.valor) / 100)
      : Math.min(Number(cupon.valor), subtotal)
  }

  // Un cupón grande nunca puede dejar el total en negativo.
  const total = Math.min(descuentoCupon, subtotal)

  return { cupon: descuentoCupon, total }
}

module.exports = { calcularDescuentos }
