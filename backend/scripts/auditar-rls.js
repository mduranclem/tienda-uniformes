// Estado de Row Level Security de las tablas públicas.
//
// Supabase expone toda la base por su API REST con la anon key, que viaja en
// el frontend y por lo tanto es pública. Lo único que separa esa API de los
// datos es RLS: sin RLS, cualquiera con la URL del proyecto lee y escribe.
//
//   node scripts/auditar-rls.js
//
// Solo lee. No modifica nada.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const prisma = require('../src/lib/prisma')

async function main() {
  const filas = await prisma.$queryRawUnsafe(`
    SELECT c.relname AS tabla,
           pg_get_userbyid(c.relowner) AS dueno,
           c.relrowsecurity AS rls,
           (SELECT count(*) FROM pg_policies p
              WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS politicas,
           has_table_privilege('anon', c.oid, 'SELECT') AS anon_lee,
           has_table_privilege('anon', c.oid, 'INSERT') AS anon_escribe
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname`)

  console.log('tabla'.padEnd(26) + 'dueño'.padEnd(14) + 'RLS'.padEnd(7) + 'pol'.padEnd(5) + 'anon lee'.padEnd(10) + 'anon escribe')
  console.log('-'.repeat(76))
  for (const f of filas) {
    console.log(
      f.tabla.padEnd(26) +
      String(f.dueno).padEnd(14) +
      (f.rls ? 'sí' : 'NO').padEnd(7) +
      String(f.politicas).padEnd(5) +
      (f.anon_lee ? 'SÍ' : 'no').padEnd(10) +
      (f.anon_escribe ? 'SÍ' : 'no'))
  }

  const expuestas = filas.filter(f => !f.rls && (f.anon_lee || f.anon_escribe))
  console.log('\nTablas alcanzables por anon sin RLS: ' + expuestas.length + ' de ' + filas.length)
  if (expuestas.length) console.log(expuestas.map(f => f.tabla).join(', '))
}

main()
  .catch(err => { console.error('ERROR:', err.message); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
