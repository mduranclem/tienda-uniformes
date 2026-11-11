const test = require('node:test')
const assert = require('node:assert')
const { errorDatosPago } = require('../src/lib/configTienda')

test('con CBU y sin titular no se puede guardar', () => {
  assert.match(errorDatosPago({ bancoCbu: '0070000000000000000001', bancoTitular: '' }), /titular/)
})

test('con alias y titular en blanco tampoco', () => {
  assert.match(errorDatosPago({ bancoAlias: 'incollege.uniformes', bancoTitular: '   ' }), /titular/)
})

test('con titular cargado se puede guardar', () => {
  assert.equal(errorDatosPago({ bancoCbu: '0070000000000000000001', bancoTitular: 'InCollege SRL' }), null)
})

test('sin cuenta cargada no se exige titular (solo textos del bot)', () => {
  assert.equal(errorDatosPago({ horarios: 'Lunes a viernes' }), null)
})
