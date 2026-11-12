const test = require('node:test')
const assert = require('node:assert')
const { calcularDescuentos } = require('../src/lib/descuentos')

test('sin cupón no descuenta nada', () => {
  assert.strictEqual(calcularDescuentos({ subtotal: 43500 }).total, 0)
})

test('ni la primera compra ni el retiro en el local tienen descuento', () => {
  const r = calcularDescuentos({ subtotal: 43500, primeraCompra: true, retiraEnLocal: true })
  assert.strictEqual(r.total, 0)
})

test('el cupón de porcentaje descuenta sobre el subtotal', () => {
  const r = calcularDescuentos({ subtotal: 10000, cupon: { tipo: 'PORCENTAJE', valor: 10 } })
  assert.strictEqual(r.total, 1000)
})

test('el cupón de monto fijo nunca supera el subtotal', () => {
  const r = calcularDescuentos({ subtotal: 5000, cupon: { tipo: 'MONTO', valor: 9000 } })
  assert.strictEqual(r.total, 5000)
})

test('redondea al peso', () => {
  const r = calcularDescuentos({ subtotal: 43501, cupon: { tipo: 'PORCENTAJE', valor: 20 } })
  assert.strictEqual(r.total, 8700)
  assert.ok(Number.isInteger(r.total))
})
