const test = require('node:test')
const assert = require('node:assert')
const { calcularDescuentos } = require('../src/lib/descuentos')

test('sin promos ni cupón no descuenta nada', () => {
  const r = calcularDescuentos({ subtotal: 43500 })
  assert.strictEqual(r.total, 0)
  assert.strictEqual(r.promoAplicada, null)
})

test('primera compra descuenta 20%', () => {
  const r = calcularDescuentos({ subtotal: 43500, primeraCompra: true })
  assert.strictEqual(r.total, 8700)
  assert.strictEqual(r.promoAplicada, 'BIENVENIDA')
})

test('retirar en el local descuenta 20% aunque no sea la primera compra', () => {
  const r = calcularDescuentos({ subtotal: 43500, retiraEnLocal: true })
  assert.strictEqual(r.total, 8700)
  assert.strictEqual(r.promoAplicada, 'RETIRO')
})

test('las dos promos juntas no se acumulan: sigue siendo 20%', () => {
  const r = calcularDescuentos({ subtotal: 43500, primeraCompra: true, retiraEnLocal: true })
  assert.strictEqual(r.total, 8700)
  assert.strictEqual(r.bienvenida, 8700)
  assert.strictEqual(r.retiro, 8700)
})

test('el cupón sí se suma a la promo', () => {
  const r = calcularDescuentos({
    subtotal: 10000,
    retiraEnLocal: true,
    cupon: { tipo: 'PORCENTAJE', valor: 10 },
  })
  assert.strictEqual(r.total, 3000)
})

test('el cupón de monto fijo nunca supera el subtotal', () => {
  const r = calcularDescuentos({ subtotal: 5000, cupon: { tipo: 'MONTO', valor: 9000 } })
  assert.strictEqual(r.total, 5000)
})

test('promo más cupón no puede dejar el total en negativo', () => {
  const r = calcularDescuentos({
    subtotal: 10000,
    primeraCompra: true,
    cupon: { tipo: 'PORCENTAJE', valor: 95 },
  })
  assert.strictEqual(r.total, 10000)
})

test('redondea al peso', () => {
  const r = calcularDescuentos({ subtotal: 43501, retiraEnLocal: true })
  assert.strictEqual(r.total, 8700)
  assert.ok(Number.isInteger(r.total))
})
