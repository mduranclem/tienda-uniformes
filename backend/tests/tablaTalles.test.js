const test = require('node:test')
const assert = require('node:assert')
const { familiaDeTabla, tieneTablaDeTalles } = require('../src/lib/tablaTalles')

const familia = tipo => familiaDeTabla(tipo)?.nombre ?? null

test('los shorts usan la tabla de shorts', () => {
  assert.strictEqual(familia('SHORT SIN FRISA BORDADO'), 'short')
  assert.strictEqual(familia('SHORT SIN FRISA LISO'), 'short')
  assert.strictEqual(familia('SHORT SIN FRISA ESTAMPADO'), 'short')
})

test('los pantalones usan la tabla de pantalones', () => {
  assert.strictEqual(familia('PANTALON LARGO CON FRISA BORDADO'), 'pantalon')
  assert.strictEqual(familia('PANTALON CARGO GABARDINA'), 'pantalon')
})

test('las prendas de arriba siguen en la tabla general', () => {
  for (const tipo of [
    'REMERA LISA', 'CHOMBA BORDADA', 'BUZO ACETATO',
    'CAMPERA CANGURO CON FRISA BORDADO', 'CHALECO LISO POLAR',
  ]) {
    assert.strictEqual(familia(tipo), 'general', `${tipo} debería usar la tabla general`)
  }
})

// El orden de las familias es lo que evita este error: si la general se
// evaluara primero, un "SHORT" nunca llegaría a su propia tabla.
test('un short no cae en la tabla de las remeras', () => {
  assert.notStrictEqual(familia('SHORT SIN FRISA BORDADO'), 'general')
})

test('un tipo desconocido no tiene tabla', () => {
  assert.strictEqual(familia('MEDIAS'), null)
  assert.strictEqual(tieneTablaDeTalles('MEDIAS'), false)
})

test('no explota con lo que no es texto', () => {
  assert.strictEqual(tieneTablaDeTalles(null), false)
  assert.strictEqual(tieneTablaDeTalles(undefined), false)
  assert.strictEqual(tieneTablaDeTalles(42), false)
})
