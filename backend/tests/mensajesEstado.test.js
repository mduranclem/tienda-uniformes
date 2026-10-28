const { test } = require('node:test')
const assert = require('node:assert/strict')

const { componerMensaje } = require('../src/services/mensajesEstado')

const BASE = {
  numero: 42,
  entregaFecha: new Date('2026-07-30T12:00:00Z'),
  entregaFranja: '10-12',
  puntoRetiro: 'Dean Funes 1258',
}

test('no avisa los estados que no le sirven al cliente', () => {
  assert.equal(componerMensaje({ ...BASE, estado: 'PREPARANDO', modoEnvio: 'RETIRO' }), null)
  // PENDIENTE sin forma de pago conocida (pedidos viejos) tampoco avisa
  assert.equal(componerMensaje({ ...BASE, estado: 'PENDIENTE', modoEnvio: 'RETIRO' }), null)
})

// El error que más caro sale: prometerle un retiro a quien pidió envío.
test('un pedido de retiro nunca menciona fecha ni franja', () => {
  for (const estado of ['PAGADA', 'LISTA', 'ENTREGADA']) {
    const msg = componerMensaje({ ...BASE, estado, modoEnvio: 'RETIRO' })
    assert.ok(!msg.includes('jueves'), `${estado} menciona la fecha`)
    assert.ok(!msg.includes('10 y las 12'), `${estado} menciona la franja`)
  }
})

test('un envío en Rosario nunca invita a retirar', () => {
  for (const estado of ['PAGADA', 'LISTA']) {
    const msg = componerMensaje({ ...BASE, estado, modoEnvio: 'ROSARIO' })
    assert.ok(!/retirar/i.test(msg), `${estado} invita a retirar`)
    assert.ok(!msg.includes('Dean Funes'), `${estado} filtra el punto de retiro`)
  }
})

test('LISTA en retiro da la dirección del local', () => {
  const msg = componerMensaje({ ...BASE, estado: 'LISTA', modoEnvio: 'RETIRO' })
  assert.match(msg, /Dean Funes 1258/)
  assert.match(msg, /retirarlo/i)
})

test('LISTA en Rosario da el día y la franja', () => {
  const msg = componerMensaje({ ...BASE, estado: 'LISTA', modoEnvio: 'ROSARIO' })
  assert.match(msg, /jueves 30 de julio/)
  assert.match(msg, /entre las 10 y las 12 hs/)
})

test('PAGADA en Rosario anticipa cuándo se lo llevan', () => {
  const msg = componerMensaje({ ...BASE, estado: 'PAGADA', modoEnvio: 'ROSARIO' })
  assert.match(msg, /jueves 30 de julio/)
})

test('el interior habla de Andreani y no promete horario', () => {
  const msg = componerMensaje({ ...BASE, estado: 'LISTA', modoEnvio: 'INTERIOR' })
  assert.match(msg, /Andreani/)
  assert.ok(!msg.includes('jueves'), 'promete una fecha que no controla')
})

test('PAGADA al interior avisa que el envío se cobra aparte', () => {
  const msg = componerMensaje({
    ...BASE, estado: 'PAGADA', modoEnvio: 'INTERIOR', envioACotizar: true,
  })
  assert.match(msg, /envío/i)
  assert.match(msg, /costo/i)
})

// Si el flete ya se cobró en el checkout, volver a pedirlo sería cobrarlo dos
// veces. El aviso tiene que depender del dato, no del destino.
test('PAGADA al interior con el envío ya pago no lo vuelve a pedir', () => {
  const msg = componerMensaje({
    ...BASE, estado: 'PAGADA', modoEnvio: 'INTERIOR', envioACotizar: false,
  })
  assert.ok(!/costo/i.test(msg), 'pide plata por un envío que ya está pago')
})

// Un envío en Rosario sin fecha no debería existir, pero si pasa el mensaje
// tiene que degradar a "coordinamos" y no romperse ni mentir.
test('un envío en Rosario sin fecha cae en coordinar, sin romperse', () => {
  const msg = componerMensaje({
    ...BASE, estado: 'LISTA', modoEnvio: 'ROSARIO',
    entregaFecha: null, entregaFranja: null,
  })
  assert.match(msg, /coordinar/i)
})

test('todos los mensajes llevan el número de pedido', () => {
  for (const modo of ['RETIRO', 'ROSARIO', 'INTERIOR']) {
    for (const estado of ['PAGADA', 'LISTA', 'ENTREGADA', 'CANCELADA']) {
      const msg = componerMensaje({ ...BASE, estado, modoEnvio: modo })
      assert.match(msg, /#42/, `${modo}/${estado} no lleva el número`)
    }
  }
})

const TRANSFERENCIA = { alias: 'incollege.uniformes', cbu: '0000003100012345678901', titular: 'InCollege SRL', banco: 'Galicia' }

test('pedido recibido por transferencia pasa monto, alias y CBU', () => {
  const msg = componerMensaje({
    ...BASE, estado: 'PENDIENTE', modoEnvio: 'RETIRO',
    metodoPago: 'transferencia', total: 43500, transferencia: TRANSFERENCIA,
    venceEl: new Date('2026-11-02T15:00:00Z'),
  })
  assert.match(msg, /\$43\.500/)
  assert.match(msg, /incollege\.uniformes/)
  assert.match(msg, /0000003100012345678901/)
  assert.match(msg, /comprobante/)
  assert.match(msg, /lunes 2 de noviembre/)
})

// 23 h en Argentina ya es el día siguiente en UTC: el plazo tiene que leerse
// en hora argentina o se le promete un día de más.
test('el vencimiento se muestra en hora argentina', () => {
  const msg = componerMensaje({
    ...BASE, estado: 'PENDIENTE', modoEnvio: 'RETIRO',
    metodoPago: 'transferencia', total: 1000, transferencia: TRANSFERENCIA,
    venceEl: new Date('2026-11-03T02:00:00Z'), // lunes 2, 23 h en Rosario
  })
  assert.match(msg, /lunes 2 de noviembre/)
})

test('sin datos bancarios cargados no se manda el aviso de transferencia', () => {
  const msg = componerMensaje({
    ...BASE, estado: 'PENDIENTE', modoEnvio: 'RETIRO', metodoPago: 'transferencia', total: 1000,
  })
  assert.equal(msg, null)
})

test('pedido recibido en efectivo no pide transferencia', () => {
  const msg = componerMensaje({
    ...BASE, estado: 'PENDIENTE', modoEnvio: 'RETIRO', metodoPago: 'efectivo', total: 1000,
    transferencia: TRANSFERENCIA,
  })
  assert.match(msg, /efectivo/)
  assert.ok(!/transfer/i.test(msg))
})
