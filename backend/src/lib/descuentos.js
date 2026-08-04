// Cálculo de los descuentos de una orden.
//
// Vive aparte de la ruta porque la regla de cómo conviven las promos es
// justamente la parte que se discute y se cambia, y así se puede probar sin
// levantar el servidor ni tocar la base.

const DESCUENTO_BIENVENIDA_PCT = 20
const DESCUENTO_RETIRO_PCT = 20

// Las promos de la casa NO se acumulan entre sí: se aplica la mayor. Quien
// compra por primera vez y además retira paga 20% menos, no 40%. El cupón sí
// se suma aparte, porque es una acción puntual que la tienda entrega a mano.
function calcularDescuentos({ subtotal, primeraCompra = false, retiraEnLocal = false, cupon = null }) {
  const bienvenida = primeraCompra
    ? Math.round(subtotal * DESCUENTO_BIENVENIDA_PCT / 100)
    : 0

  const retiro = retiraEnLocal
    ? Math.round(subtotal * DESCUENTO_RETIRO_PCT / 100)
    : 0

  const promo = Math.max(bienvenida, retiro)

  let descuentoCupon = 0
  if (cupon) {
    descuentoCupon = cupon.tipo === 'PORCENTAJE'
      ? Math.round(subtotal * Number(cupon.valor) / 100)
      : Math.min(Number(cupon.valor), subtotal)
  }

  // Con un cupón grande sobre un carrito ya promocionado el descuento podría
  // superar al carrito y dejar un total negativo, que al pasarlo a Mercado
  // Pago es un error de la preferencia.
  const total = Math.min(promo + descuentoCupon, subtotal)

  return {
    bienvenida,
    retiro,
    // Cuál de las dos promos quedó efectivamente aplicada, para poder
    // mostrarle al cliente el motivo correcto en el resumen.
    promoAplicada: promo === 0 ? null : (retiro >= bienvenida && retiraEnLocal ? 'RETIRO' : 'BIENVENIDA'),
    promo,
    cupon: descuentoCupon,
    total,
  }
}

module.exports = { calcularDescuentos, DESCUENTO_BIENVENIDA_PCT, DESCUENTO_RETIRO_PCT }
