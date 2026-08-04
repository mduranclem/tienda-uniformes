// Aplica sql/activar-rls.sql por la conexión del pooler.
//
// Alternativa al SQL Editor del dashboard, que a veces no responde. Es el
// mismo SQL, ejecutado por el mismo rol (`postgres`), así que el resultado es
// idéntico. Idempotente: correrlo dos veces no hace daño.
//
//   node scripts/activar-rls.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const fs = require('fs')
const path = require('path')
const prisma = require('../src/lib/prisma')

const RUTA_SQL = path.join(__dirname, '..', 'sql', 'activar-rls.sql')

async function main() {
  const sql = fs.readFileSync(RUTA_SQL, 'utf8')

  // El archivo trae el bloque DO y después una consulta de verificación. Acá se
  // ejecuta solo el bloque; la verificación se hace abajo, para poder mostrarla
  // como tabla en vez de como texto suelto.
  const bloque = sql.slice(sql.indexOf('DO $$'), sql.indexOf('END $$;') + 'END $$;'.length)

  console.log('Activando RLS...')
  await prisma.$executeRawUnsafe(bloque)

  const restantes = await prisma.$queryRawUnsafe(`
    SELECT c.relname AS tabla,
           pg_get_userbyid(c.relowner) AS dueno,
           has_table_privilege('anon', c.oid, 'SELECT') AS anon_lee
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
    ORDER BY c.relname`)

  if (restantes.length === 0) {
    console.log('Listo: todas las tablas quedaron con RLS.')
    return
  }

  console.log('\nQuedaron sin RLS (tiene que decir anon_lee = false en todas):')
  console.table(restantes)
  const alcanzables = restantes.filter(t => t.anon_lee)
  if (alcanzables.length) {
    console.log('\nATENCIÓN: estas siguen expuestas a la API pública:',
      alcanzables.map(t => t.tabla).join(', '))
    process.exitCode = 1
  }
}

main()
  .catch(err => { console.error('ERROR:', err.message); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
