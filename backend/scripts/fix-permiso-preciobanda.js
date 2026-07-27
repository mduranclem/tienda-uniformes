// Le devuelve a `postgres` el permiso de escritura sobre PrecioBanda.
//
// El problema: la tabla la creó el rol `tienda_app` desde otra máquina, así que
// le pertenece a él. El backend (y el panel admin, y los scripts) se conectan
// como `postgres`, que puede leerla pero no escribirla:
//   ERROR 42501: permission denied for table PrecioBanda
//
// `postgres` no puede arreglarlo solo —no es dueño ni puede asumir el rol— y el
// SQL Editor de Supabase tampoco, porque corre con el mismo usuario. Hay que
// conectarse como el dueño, que es lo que hace este script.
//
// Uso (PowerShell), reemplazando LA_CLAVE por la contraseña de tienda_app:
//
//   $env:DATABASE_URL_DUENO = "postgresql://tienda_app.ofeiqcjqoajjgkkcqhoq:LA_CLAVE@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
//   node backend/scripts/fix-permiso-preciobanda.js
//
// La contraseña se pasa por variable de entorno y no por argumento, para que no
// quede en el historial de comandos. Nunca se escribe a disco.
//
// Se otorgan permisos en vez de transferir la propiedad: el dueño siempre puede
// dar permisos, mientras que transferir requiere además ser miembro del rol
// destino. Menos requisitos, mismo resultado práctico.

const { PrismaClient } = require('@prisma/client')

const TABLA = 'PrecioBanda'
const BENEFICIARIO = 'postgres'

async function main() {
  const url = process.env.DATABASE_URL_DUENO
  if (!url) {
    console.error(
      'Falta DATABASE_URL_DUENO.\n\n' +
      'En PowerShell:\n' +
      '  $env:DATABASE_URL_DUENO = "postgresql://tienda_app.ofeiqcjqoajjgkkcqhoq:LA_CLAVE@aws-1-us-east-1.pooler.supabase.com:5432/postgres"\n' +
      '  node backend/scripts/fix-permiso-preciobanda.js\n'
    )
    process.exit(1)
  }

  const prisma = new PrismaClient({ datasources: { db: { url } } })

  try {
    const [{ current_user: usuario }] = await prisma.$queryRawUnsafe('SELECT current_user')
    console.log(`Conectado como: ${usuario}`)

    const [antes] = await prisma.$queryRawUnsafe(
      `SELECT pg_get_userbyid(c.relowner) AS dueno
       FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relname = $1`,
      TABLA
    )
    console.log(`Dueño de ${TABLA}: ${antes.dueno}`)

    if (antes.dueno !== usuario) {
      console.error(
        `\nEste usuario no es el dueño de la tabla. El GRANT va a fallar.\n` +
        `Conectate con el rol "${antes.dueno}".`
      )
      process.exit(1)
    }

    await prisma.$executeRawUnsafe(`GRANT ALL ON TABLE "${TABLA}" TO ${BENEFICIARIO}`)

    // has_table_privilege parsea el nombre como identificador SQL: sin comillas
    // lo pasa a minúsculas y no encuentra "PrecioBanda".
    const [despues] = await prisma.$queryRawUnsafe(
      `SELECT has_table_privilege($1, $2, 'UPDATE') AS puede_escribir`,
      BENEFICIARIO, `"${TABLA}"`
    )
    console.log(`✓ ${BENEFICIARIO} puede escribir ${TABLA}: ${despues.puede_escribir}`)
    console.log('\nYa se pueden editar precios desde /admin/categorias y correr ajustar-precios-mp.js.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
