const { test } = require('node:test')
const assert = require('node:assert/strict')

const { calcularVencimiento, extenderVencimiento, DIAS_PLAZO_PAGO } = require('../src/lib/vencimientoOrden')

const DIA = 24 * 60 * 60 * 1000
const AHORA = new Date('2026-10-26T15:00:00Z')

test('un pedido nuevo vence a los 7 días', () => {
  assert.equal(DIAS_PLAZO_PAGO, 7)
  assert.equal(calcularVencimiento(AHORA).getTime(), AHORA.getTime() + 7 * DIA)
})

test('extender un plazo vigente suma 7 días sobre el vencimiento actual', () => {
  const venceEl = new Date(AHORA.getTime() + 2 * DIA)
  assert.equal(extenderVencimiento(venceEl, AHORA).getTime(), venceEl.getTime() + 7 * DIA)
})

// Si sumara sobre la fecha vieja, el pedido podría seguir vencido después de
// "dar 7 días más" y cancelarse en la próxima pasada.
test('extender un plazo ya vencido cuenta 7 días desde ahora', () => {
  const venceEl = new Date(AHORA.getTime() - 10 * DIA)
  assert.equal(extenderVencimiento(venceEl, AHORA).getTime(), AHORA.getTime() + 7 * DIA)
})

test('extender un pedido sin vencimiento cuenta desde ahora', () => {
  assert.equal(extenderVencimiento(null, AHORA).getTime(), AHORA.getTime() + 7 * DIA)
})
