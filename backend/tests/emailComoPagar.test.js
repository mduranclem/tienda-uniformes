const test = require('node:test')
const assert = require('node:assert')
const { htmlComoPagar } = require('../src/services/email')

const CONFIG = {
  bancoNombre: 'Banco Galicia',
  bancoTitular: 'InCollege SRL',
  bancoCbu: '0070123430004012345678',
  bancoAlias: 'incollege.uniformes',
  bancoCuit: '30-71234567-8',
  direccion: 'Dean Funes 1258',
}

const ORDEN = { numero: 1234, total: 34300, metodoPago: 'transferencia' }

test('la transferencia lleva los datos de la cuenta', () => {
  const html = htmlComoPagar(ORDEN, CONFIG)
  assert.match(html, /0070123430004012345678/)
  assert.match(html, /incollege\.uniformes/)
  assert.match(html, /Banco Galicia/)
  assert.match(html, /30-71234567-8/)
})

test('la transferencia dice a dónde mandar el comprobante y por cuánto', () => {
  const html = htmlComoPagar(ORDEN, CONFIG)
  assert.match(html, /341 743 4552/)
  assert.match(html, /#1234/)
  assert.match(html, /34\.300/)
})

// Sin CBU cargado el recuadro quedaría vacío y el cliente no sabría qué hacer.
test('sin datos bancarios avisa que se los pasamos por WhatsApp', () => {
  const html = htmlComoPagar(ORDEN, {})
  assert.match(html, /por WhatsApp/)
  assert.doesNotMatch(html, /CBU/)
})

test('el retiro no muestra datos bancarios y sí la dirección', () => {
  const html = htmlComoPagar({ ...ORDEN, metodoPago: 'efectivo' }, CONFIG)
  assert.doesNotMatch(html, /0070123430004012345678/)
  assert.match(html, /Dean Funes 1258/)
  assert.match(html, /Abonás al retirar/)
})
