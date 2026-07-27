const { test } = require('node:test')
const assert = require('node:assert/strict')

const { aWhatsapp } = require('../src/lib/telefono')

const ESPERADO = '5493417434552'

test('acepta el número tal cual lo escribe la mayoría', () => {
  assert.equal(aWhatsapp('3417434552'), ESPERADO)
})

test('saca el 0 de larga distancia', () => {
  assert.equal(aWhatsapp('03417434552'), ESPERADO)
})

test('saca el 15 que va después del código de área', () => {
  assert.equal(aWhatsapp('0341157434552'), ESPERADO)
  assert.equal(aWhatsapp('341157434552'), ESPERADO)
})

test('acepta el formato internacional completo', () => {
  assert.equal(aWhatsapp('+5493417434552'), ESPERADO)
  assert.equal(aWhatsapp('5493417434552'), ESPERADO)
  assert.equal(aWhatsapp('005493417434552'), ESPERADO)
})

test('acepta el internacional sin el 9 de móvil', () => {
  assert.equal(aWhatsapp('543417434552'), ESPERADO)
})

test('ignora espacios, guiones y paréntesis', () => {
  assert.equal(aWhatsapp('+54 9 341 743-4552'), ESPERADO)
  assert.equal(aWhatsapp('(0341) 15 743 4552'), ESPERADO)
})

test('funciona con códigos de área de 2 y 4 dígitos', () => {
  // CABA: área 11
  assert.equal(aWhatsapp('1145678901'), '5491145678901')
  assert.equal(aWhatsapp('011 15 4567-8901'), '5491145678901')
  // Área de 4 dígitos
  assert.equal(aWhatsapp('2954123456'), '5492954123456')
})

// Ante la duda no se manda nada: escribirle a un número equivocado es peor
// que no escribir.
test('devuelve null cuando no puede interpretarlo', () => {
  assert.equal(aWhatsapp(''), null)
  assert.equal(aWhatsapp(null), null)
  assert.equal(aWhatsapp(undefined), null)
  assert.equal(aWhatsapp('—'), null)
  assert.equal(aWhatsapp('sin teléfono'), null)
  assert.equal(aWhatsapp('12345'), null, 'demasiado corto')
  assert.equal(aWhatsapp('34174345521234'), null, 'demasiado largo')
})
