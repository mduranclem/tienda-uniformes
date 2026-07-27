// Corrige el propietario de la tabla PrecioBanda.
//
// Uso (desde cualquier carpeta):
//   node backend/scripts/fix-dueno-preciobanda.js            (diagnóstico)
//   node backend/scripts/fix-dueno-preciobanda.js --aplicar  (corrige)
//
// El problema: PrecioBanda quedó siendo propiedad del rol `tienda_app`, mientras
// que todas las demás tablas son de `postgres`. Como el backend se conecta como
// `postgres`, puede leerla pero no escribirla: cualquier intento de modificar
// precios desde /admin/categorias falla con
//   ERROR 42501: permission denied for table PrecioBanda
//
// Se arregla igualando el propietario al del resto del esquema. `postgres` es
// miembro de `tienda_app`, así que tiene permiso para hacerlo.
//
// Cambia permisos, no datos: ninguna fila se toca.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const prisma = require('../src/lib/prisma')

const TABLA = 'PrecioBanda'
const DUENO_ESPERADO = 'postgres'

async function estado() {
  const filas = await prisma.$queryRawUnsafe(
    `SELECT pg_get_userbyid(c.relowner) AS dueno,
            has_table_privilege(current_user, c.oid, 'UPDATE') AS puede_escribir
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relname = $1`,
    TABLA
  )
  if (!filas.length) throw new Error(`No existe la tabla ${TABLA}`)
  return filas[0]
}

async function main() {
  const aplicar = process.argv.includes('--aplicar')

  const antes = await estado()
  console.log(`${TABLA}: dueño "${antes.dueno}", ¿puede escribir?: ${antes.puede_escribir}`)

  if (antes.dueno === DUENO_ESPERADO && antes.puede_escribir) {
    console.log('Ya está correcto. Nada que hacer.')
    await prisma.$disconnect()
    return
  }

  if (!aplicar) {
    console.log(`\nSe cambiaría el dueño a "${DUENO_ESPERADO}".`)
    console.log('Volvé a correrlo con --aplicar para hacerlo.')
    await prisma.$disconnect()
    return
  }

  // Sin parámetro: ALTER TABLE no acepta placeholders para identificadores.
  // TABLA y DUENO_ESPERADO son constantes de este archivo, no entran del exterior.
  await prisma.$executeRawUnsafe(`ALTER TABLE "${TABLA}" OWNER TO ${DUENO_ESPERADO}`)

  const despues = await estado()
  console.log(`✓ Ahora: dueño "${despues.dueno}", ¿puede escribir?: ${despues.puede_escribir}`)

  await prisma.$disconnect()
}

main().catch(async err => {
  console.error('Error:', err.message)
  await prisma.$disconnect()
  process.exit(1)
})
