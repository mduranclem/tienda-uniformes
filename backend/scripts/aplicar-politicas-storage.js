// Aplica sql/politicas-storage.sql por la conexión del pooler.
//
// El esquema `storage` lo administra el rol `supabase_storage_admin`, así que
// esto puede fallar con 42501 si `postgres` no es dueño de storage.objects. En
// ese caso hay que hacerlo desde el dashboard (Storage → Policies), que corre
// con un rol privilegiado.
//
//   node scripts/aplicar-politicas-storage.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const fs = require('fs')
const path = require('path')
const prisma = require('../src/lib/prisma')

const RUTA_SQL = path.join(__dirname, '..', 'sql', 'politicas-storage.sql')

// Separa el archivo en sentencias. Se corren de a una porque el driver no
// acepta varias en un mismo executeRaw, y el bloque $$ de la función no se
// puede partir por punto y coma.
function separarSentencias(sql) {
  const sinComentarios = sql.replace(/^\s*--.*$/gm, '')
  const partes = []
  let actual = ''
  let dentroDeBloque = false
  for (const linea of sinComentarios.split('\n')) {
    if (linea.includes('$$')) dentroDeBloque = !dentroDeBloque
    actual += linea + '\n'
    if (!dentroDeBloque && linea.trim().endsWith(';')) {
      if (actual.trim()) partes.push(actual.trim())
      actual = ''
    }
  }
  if (actual.trim()) partes.push(actual.trim())
  return partes
}

async function main() {
  const sentencias = separarSentencias(fs.readFileSync(RUTA_SQL, 'utf8'))
  const verificacion = sentencias.pop() // el SELECT final

  for (const s of sentencias) {
    const resumen = s.split('\n')[0].slice(0, 60)
    await prisma.$executeRawUnsafe(s)
    console.log('ok  ' + resumen)
  }

  console.log('\nPolíticas del bucket:')
  console.table(await prisma.$queryRawUnsafe(verificacion))
}

main()
  .catch(err => { console.error('ERROR:', err.message); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
