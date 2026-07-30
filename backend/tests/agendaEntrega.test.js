const { test } = require('node:test')
const assert = require('node:assert/strict')

const {
  fechasDisponibles, esFechaValida, esFranjaValida, formatearFecha, aISO,
  DIAS_DISPONIBLES,
} = require('../src/lib/agendaEntrega')

// Referencias: 2026-07-27 es lunes, 2026-07-31 viernes, 2026-08-01 sábado.
const LUNES = new Date('2026-07-27T13:00:00Z')
const VIERNES = new Date('2026-07-31T13:00:00Z')
const SABADO = new Date('2026-08-01T13:00:00Z')

test('nunca ofrece el mismo día', () => {
  const primera = aISO(fechasDisponibles(LUNES)[0])
  assert.notEqual(primera, '2026-07-27')
})

test('un lunes ofrece el martes como primera fecha', () => {
  assert.equal(aISO(fechasDisponibles(LUNES)[0]), '2026-07-28')
})

test('un viernes saltea el fin de semana y ofrece el lunes', () => {
  assert.equal(aISO(fechasDisponibles(VIERNES)[0]), '2026-08-03')
})

test('un sábado también ofrece el lunes', () => {
  assert.equal(aISO(fechasDisponibles(SABADO)[0]), '2026-08-03')
})

test('no incluye sábados ni domingos', () => {
  for (const fecha of fechasDisponibles(LUNES)) {
    const dia = fecha.getUTCDay()
    assert.ok(dia >= 1 && dia <= 5, `${aISO(fecha)} cae fin de semana`)
  }
})

test('ofrece la cantidad de días configurada, sin repetir', () => {
  const fechas = fechasDisponibles(LUNES)
  assert.equal(fechas.length, DIAS_DISPONIBLES)
  assert.equal(new Set(fechas.map(aISO)).size, DIAS_DISPONIBLES)
})

// El caso que motivó calcular todo en hora argentina: a las 22:00 de Argentina
// ya es el día siguiente en UTC. Sin convertir la zona, la agenda se correría.
test('a las 22 hora argentina ofrece las mismas fechas que a las 10', () => {
  const manana = new Date('2026-07-27T13:00:00Z')  // 10:00 en Argentina
  const noche = new Date('2026-07-28T01:00:00Z')   // 22:00 del 27 en Argentina
  assert.deepEqual(
    fechasDisponibles(manana).map(aISO),
    fechasDisponibles(noche).map(aISO)
  )
})

test('acepta una fecha de la lista y rechaza una que no está', () => {
  assert.ok(esFechaValida(new Date('2026-07-28T12:00:00Z'), LUNES))
  assert.ok(!esFechaValida(new Date('2026-08-01T12:00:00Z'), LUNES), 'sábado')
  assert.ok(!esFechaValida(new Date('2026-07-27T12:00:00Z'), LUNES), 'hoy')
  assert.ok(!esFechaValida(new Date('2026-06-01T12:00:00Z'), LUNES), 'pasado')
})

test('rechaza fechas vacías o inválidas', () => {
  assert.ok(!esFechaValida(null, LUNES))
  assert.ok(!esFechaValida('cualquier cosa', LUNES))
})

test('solo acepta las tres franjas', () => {
  assert.ok(esFranjaValida('10-12'))
  assert.ok(esFranjaValida('12-14'))
  assert.ok(esFranjaValida('14-16'))
  assert.ok(!esFranjaValida('16-18'))
  assert.ok(!esFranjaValida(''))
})

test('formatea la fecha en español sin corrimiento de día', () => {
  assert.equal(formatearFecha(new Date('2026-07-30T12:00:00Z')), 'jueves 30 de julio')
})
