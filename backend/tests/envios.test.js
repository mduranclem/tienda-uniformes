const test = require('node:test')
const assert = require('node:assert')
const { esZonaLocal, costoEnvioLocal } = require('../src/lib/envios')

test('Rosario entra, con o sin provincia', () => {
  assert.ok(esZonaLocal('Rosario'))
  assert.ok(esZonaLocal('rosario'))
  assert.ok(esZonaLocal('ROSARIO, SANTA FE'))
})

test('las localidades del alrededor entran', () => {
  for (const c of ['Funes', 'Roldán', 'Pérez', 'Ibarlucea', 'Granadero Baigorria', 'Villa Gobernador Gálvez']) {
    assert.ok(esZonaLocal(c), `${c} debería entrar en el reparto propio`)
  }
})

test('tolera abreviaturas y mayúsculas de Villa Gobernador Gálvez', () => {
  assert.ok(esZonaLocal('VILLA GOBERNADOR GALVEZ'))
  assert.ok(esZonaLocal('Gobernador Galvez'))
})

test('el resto del país queda afuera', () => {
  for (const c of ['Buenos Aires', 'Córdoba', 'Santa Fe', 'San Lorenzo', 'Arroyo Seco', '']) {
    assert.ok(!esZonaLocal(c), `${c} no debería entrar en el reparto propio`)
  }
})

test('no explota con lo que no es texto', () => {
  assert.strictEqual(esZonaLocal(null), false)
  assert.strictEqual(esZonaLocal(undefined), false)
  assert.strictEqual(esZonaLocal(42), false)
})

test('una unidad paga el envío', () => {
  assert.strictEqual(costoEnvioLocal(1, 5000), 5000)
})

test('desde dos unidades el envío es gratis', () => {
  assert.strictEqual(costoEnvioLocal(2, 5000), 0)
  assert.strictEqual(costoEnvioLocal(7, 5000), 0)
})

// El precio sale de la entrega configurada en el panel, no de una constante en
// el código: si el dueño lo cambia ahí, tiene que cambiar en la tienda.
test('respeta el costo configurado en la entrega', () => {
  assert.strictEqual(costoEnvioLocal(1, 7500), 7500)
})

test('un carrito vacío no viaja gratis por descuido', () => {
  assert.strictEqual(costoEnvioLocal(0, 5000), 5000)
})
