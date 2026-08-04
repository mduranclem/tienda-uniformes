// Aplica sql/politica-backend.sql: le devuelve el acceso a `tienda_app`, el
// usuario con el que se conecta la aplicación, sobre las tablas con RLS.
//
//   node scripts/aplicar-politica-backend.js
//
// Correr siempre después de activar RLS en tablas nuevas. Sin esto la tienda
// muestra el catálogo vacío.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const fs = require('fs')
const path = require('path')
const prisma = require('../src/lib/prisma')

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'politica-backend.sql'), 'utf8')
  const bloque = sql.slice(sql.indexOf('DO $$'), sql.indexOf('END $$;') + 'END $$;'.length)

  await prisma.$executeRawUnsafe(bloque)

  const faltan = await prisma.$queryRawUnsafe(`
    SELECT c.relname AS tabla
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
      AND pg_get_userbyid(c.relowner) <> 'tienda_app'
      AND NOT EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = 'public' AND p.tablename = c.relname
          AND 'tienda_app' = ANY (p.roles)
      )`)

  const total = await prisma.$queryRawUnsafe(
    `SELECT count(*)::int AS n FROM pg_policies WHERE schemaname='public' AND 'tienda_app' = ANY (roles)`)

  console.log(`${total[0].n} tabla(s) con acceso para el backend.`)
  if (faltan.length) {
    console.log('Quedaron sin política:', faltan.map(f => f.tabla).join(', '))
    process.exitCode = 1
  }
}

main()
  .catch(err => { console.error('ERROR:', err.message); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
