// Carga las zonas de envío iniciales con sus rangos de CP y escalones de tarifa.
//
// Uso:
//   cd backend
//   node -r dotenv/config scripts/seed-zonas-envio.js
//   node -r dotenv/config scripts/seed-zonas-envio.js --reset   (pisa zonas existentes)
//
// Es idempotente: una zona que ya existe se saltea, para no pisar precios que
// hayas cargado a mano desde /admin/envios. Con --reset se recrean sus rangos y
// tarifas con los valores de acá.
//
// ⚠️ LOS PRECIOS SON PROVISORIOS. Son estimaciones para que el checkout funcione
// desde el día uno, no tarifas reales. Cargá los definitivos desde /admin/envios
// cotizando en andreani.com → "Cotizar envío" desde CP 2000 hacia un CP de cada
// zona, para cada escalón de peso.
//
// Los rangos de CP cubren 1000–9999 sin solaparse. Si dos zonas llegaran a
// solaparse, el cotizador elige la de `orden` menor.

const prisma = require('../src/lib/prisma')

const ZONAS = [
  {
    nombre: 'Rosario y alrededores',
    orden: 1,
    precioKgAdicional: 800,
    // Rosario capital nunca llega acá: se resuelve antes por la regla de envío
    // gratis. Esta zona cubre el cordón (Funes, Roldán, V. G. Gálvez, San Lorenzo).
    rangos: [[2000, 2299]],
    tarifas: [[1000, 4000], [3000, 5000], [5000, 6000], [10000, 8000]],
  },
  {
    nombre: 'Santa Fe y Entre Ríos',
    orden: 2,
    precioKgAdicional: 1200,
    rangos: [[2300, 2499], [3000, 3299]],
    tarifas: [[1000, 6000], [3000, 7500], [5000, 9000], [10000, 12000]],
  },
  {
    nombre: 'Córdoba y Buenos Aires interior',
    orden: 3,
    precioKgAdicional: 1400,
    rangos: [[2500, 2999], [5000, 5299], [6000, 7999]],
    tarifas: [[1000, 7000], [3000, 9000], [5000, 11000], [10000, 14500]],
  },
  {
    nombre: 'CABA y Gran Buenos Aires',
    orden: 4,
    precioKgAdicional: 1500,
    rangos: [[1000, 1999]],
    tarifas: [[1000, 7500], [3000, 9500], [5000, 11500], [10000, 15000]],
  },
  {
    nombre: 'Cuyo, NOA y NEA',
    orden: 5,
    precioKgAdicional: 1800,
    rangos: [[3300, 4999], [5300, 5999]],
    tarifas: [[1000, 9000], [3000, 11500], [5000, 14000], [10000, 18000]],
  },
  {
    nombre: 'Patagonia',
    orden: 6,
    precioKgAdicional: 2300,
    rangos: [[8000, 9999]],
    tarifas: [[1000, 11000], [3000, 14000], [5000, 17500], [10000, 23000]],
  },
]

async function crearZona(def) {
  return prisma.zonaEnvio.create({
    data: {
      nombre: def.nombre,
      orden: def.orden,
      precioKgAdicional: def.precioKgAdicional,
      rangos: { create: def.rangos.map(([desde, hasta]) => ({ desde, hasta })) },
      tarifas: { create: def.tarifas.map(([pesoHastaG, precio]) => ({ pesoHastaG, precio })) },
    },
  })
}

async function main() {
  const reset = process.argv.includes('--reset')

  let creadas = 0
  let recreadas = 0
  let salteadas = 0

  for (const def of ZONAS) {
    const existente = await prisma.zonaEnvio.findUnique({ where: { nombre: def.nombre } })

    if (existente && !reset) {
      salteadas++
      console.log(`· ${def.nombre} — ya existe, se saltea`)
      continue
    }

    if (existente) {
      // Rangos y tarifas caen en cascada al borrar la zona.
      await prisma.zonaEnvio.delete({ where: { id: existente.id } })
      await crearZona(def)
      recreadas++
      console.log(`↻ ${def.nombre} — recreada`)
      continue
    }

    await crearZona(def)
    creadas++
    console.log(`✓ ${def.nombre} — creada`)
  }

  console.log(`\nResumen: ${creadas} creadas, ${recreadas} recreadas, ${salteadas} salteadas.`)
  if (creadas > 0 || recreadas > 0) {
    console.log('⚠️  Los precios cargados son PROVISORIOS. Reemplazalos desde /admin/envios.')
  }
  await prisma.$disconnect()
}

main().catch(async err => {
  console.error('Error:', err.message)
  await prisma.$disconnect()
  process.exit(1)
})
