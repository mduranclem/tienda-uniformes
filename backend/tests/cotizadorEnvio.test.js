// Ejecutar con: npm test  (desde backend/)
// No toca la base: prueba la lógica pura de zonificación, tarifas y pesos.

const { test } = require('node:test')
const assert = require('node:assert/strict')

const { normalizarCP } = require('../src/services/cotizadorEnvio/cp')
const { elegirZona, precioParaPeso } = require('../src/services/cotizadorEnvio/tablaZonasLogica')
const { pesoDelEnvio, pesoDeProducto, pesoPorTipo, PESO_EMBALAJE, PESO_DEFECTO } = require('../src/lib/pesos')

const santaFe = {
  nombre: 'Santa Fe',
  orden: 1,
  precioKgAdicional: 1500,
  rangos: [{ desde: 2000, hasta: 3599 }],
  tarifas: [
    { pesoHastaG: 1000, precio: 5000 },
    { pesoHastaG: 3000, precio: 7000 },
  ],
}

const patagonia = {
  nombre: 'Patagonia',
  orden: 9,
  precioKgAdicional: null,
  rangos: [{ desde: 8300, hasta: 9410 }],
  tarifas: [{ pesoHastaG: 1000, precio: 12000 }],
}

// ── Normalización de CP ───────────────────────────────────────────────────────

test('acepta el CP numérico de 4 dígitos', () => {
  assert.equal(normalizarCP('2000'), 2000)
})

test('acepta el CPA con letras y extrae los 4 dígitos', () => {
  assert.equal(normalizarCP('S2000ABC'), 2000)
  assert.equal(normalizarCP('C1425DKE'), 1425)
})

test('tolera espacios alrededor', () => {
  assert.equal(normalizarCP('  3000 '), 3000)
})

test('rechaza un CP que no contiene 4 dígitos', () => {
  assert.throws(() => normalizarCP('abc'), { esErrorCotizacion: true })
  assert.throws(() => normalizarCP(''), { esErrorCotizacion: true })
  assert.throws(() => normalizarCP(null), { esErrorCotizacion: true })
})

// ── Selección de zona ─────────────────────────────────────────────────────────

test('elige la zona cuyo rango contiene al CP', () => {
  const zona = elegirZona([santaFe, patagonia], 3000)
  assert.equal(zona.nombre, 'Santa Fe')
})

test('incluye los extremos del rango', () => {
  assert.equal(elegirZona([santaFe], 2000).nombre, 'Santa Fe')
  assert.equal(elegirZona([santaFe], 3599).nombre, 'Santa Fe')
})

test('falla si ninguna zona cubre el CP', () => {
  assert.throws(() => elegirZona([santaFe, patagonia], 5000), { esErrorCotizacion: true })
})

test('ante rangos solapados gana la zona de orden menor', () => {
  const cara = { ...patagonia, nombre: 'Cara', orden: 5, rangos: [{ desde: 2000, hasta: 3599 }] }
  const zona = elegirZona([cara, santaFe], 3000)
  assert.equal(zona.nombre, 'Santa Fe')
})

// ── Selección de tarifa ───────────────────────────────────────────────────────

test('usa el primer escalón que cubre el peso', () => {
  assert.equal(precioParaPeso(santaFe, 800), 5000)
  assert.equal(precioParaPeso(santaFe, 1500), 7000)
})

test('un peso justo en el límite usa ese escalón y no el siguiente', () => {
  assert.equal(precioParaPeso(santaFe, 1000), 5000)
  assert.equal(precioParaPeso(santaFe, 1001), 7000)
})

test('sobre el tope máximo suma el precio por kilo adicional, redondeando hacia arriba', () => {
  // 4200 g = 1200 g sobre el tope de 3000 g → 2 kg adicionales
  assert.equal(precioParaPeso(santaFe, 4200), 7000 + 2 * 1500)
})

test('sobre el tope máximo sin precio por kilo adicional, falla', () => {
  assert.throws(() => precioParaPeso(patagonia, 2000), { esErrorCotizacion: true })
})

test('una zona sin tarifas cargadas falla', () => {
  assert.throws(() => precioParaPeso({ ...santaFe, tarifas: [] }, 500), { esErrorCotizacion: true })
})

test('no depende de que las tarifas vengan ordenadas', () => {
  const desordenada = { ...santaFe, tarifas: [...santaFe.tarifas].reverse() }
  assert.equal(precioParaPeso(desordenada, 800), 5000)
})

// ── Peso ──────────────────────────────────────────────────────────────────────

test('usa el peso cargado del producto cuando existe', () => {
  assert.equal(pesoDeProducto({ tipo: 'CHOMBA', pesoGramos: 250 }), 250)
})

test('estima por tipo cuando el producto no tiene peso cargado', () => {
  assert.equal(pesoDeProducto({ tipo: 'BUZO', pesoGramos: null }), 500)
  assert.equal(pesoDeProducto({ tipo: 'buzo', pesoGramos: null }), 500)
})

test('cae al peso por defecto ante un tipo desconocido', () => {
  assert.equal(pesoDeProducto({ tipo: 'PARAGUAS', pesoGramos: null }), PESO_DEFECTO)
})

test('ignora un peso cargado inválido y estima por tipo', () => {
  assert.equal(pesoDeProducto({ tipo: 'BUZO', pesoGramos: 0 }), 500)
})

// `tipo` es el nombre de la categoría, texto libre cargado desde el admin.
// Estos son los valores reales que hay hoy en la base.
test('reconoce la prenda dentro del nombre completo de la categoría', () => {
  assert.equal(pesoPorTipo('CAMPERA CANGURO CON FRISA BORDADO'), 800)
  assert.equal(pesoPorTipo('BUZO CUELLO RED CON FRISA BORDADO'), 500)
  assert.equal(pesoPorTipo('BUZO ACETATO'), 500)
  assert.equal(pesoPorTipo('CHOMBA BORDADA'), 200)
  assert.equal(pesoPorTipo('REMERA ESTAMPADA'), 180)
  assert.equal(pesoPorTipo('CHALECO LISO POLAR'), 400)
  assert.equal(pesoPorTipo('CAMPERA LISA POLAR'), 800)
})

test('una regla más específica gana sobre la general', () => {
  assert.equal(pesoPorTipo('REMERA MANGAS LARGAS LISA'), 220)
  assert.equal(pesoPorTipo('REMERA LISA'), 180)
})

test('tolera tildes y minúsculas en el nombre de la categoría', () => {
  assert.equal(pesoPorTipo('pantalón de gimnasia'), 400)
})

test('suma el embalaje una sola vez por envío, no por prenda', () => {
  const items = [
    { producto: { tipo: 'CHOMBA', pesoGramos: 200 }, cantidad: 3 },
    { producto: { tipo: 'BUZO', pesoGramos: 500 }, cantidad: 2 },
  ]
  assert.equal(pesoDelEnvio(items), 200 * 3 + 500 * 2 + PESO_EMBALAJE)
})
