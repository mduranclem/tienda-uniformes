// Le devuelve a `postgres` el permiso de escritura sobre todo lo que creó el
// rol `tienda_app`, y hace que las tablas futuras nazcan bien.
//
// Uso (bash), con la contraseña del rol tienda_app:
//   DATABASE_URL_DUENO="postgresql://tienda_app.ofeiqcjqoajjgkkcqhoq:LA_CLAVE@aws-1-us-east-1.pooler.supabase.com:5432/postgres" node backend/scripts/fix-permisos-tienda-app.js
//
// El problema: las máquinas de trabajo están configuradas con usuarios de base
// distintos. Las tablas creadas desde la que usa `tienda_app` le pertenecen a
// ese rol, y el backend —que se conecta como `postgres`— puede leerlas pero no
// escribirlas:
//   ERROR 42501: permission denied for table X
//
// Ya pasó con PrecioBanda (precios no editables) y con MovimientoStock y
// PuntoDeVenta (stock sin historial). Por eso esto no arregla una tabla suelta:
//
//   1. Da permisos sobre TODAS las tablas y secuencias que hoy son de tienda_app.
//   2. Deja configurado ALTER DEFAULT PRIVILEGES para que lo que tienda_app cree
//      de acá en adelante ya nazca accesible, sin tener que volver a correr esto.
//
// La contraseña se pasa por variable de entorno y no como argumento, para que no
// quede en el historial de comandos. Nunca se escribe a disco.

const { PrismaClient } = require('@prisma/client')

const BENEFICIARIO = 'postgres'

async function main() {
  const url = process.env.DATABASE_URL_DUENO
  if (!url) {
    console.error(
      'Falta DATABASE_URL_DUENO.\n\n' +
      '  DATABASE_URL_DUENO="postgresql://tienda_app.ofeiqcjqoajjgkkcqhoq:LA_CLAVE@aws-1-us-east-1.pooler.supabase.com:5432/postgres" \\\n' +
      '    node backend/scripts/fix-permisos-tienda-app.js\n'
    )
    process.exit(1)
  }

  const prisma = new PrismaClient({ datasources: { db: { url } } })

  try {
    const [{ current_user: usuario }] = await prisma.$queryRawUnsafe('SELECT current_user')
    console.log(`Conectado como: ${usuario}`)

    const tablas = await prisma.$queryRawUnsafe(
      `SELECT c.relname AS tabla
       FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relkind = 'r'
         AND pg_get_userbyid(c.relowner) = $1
       ORDER BY 1`,
      usuario
    )

    if (tablas.length === 0) {
      console.log(`No hay tablas cuyo dueño sea "${usuario}". Nada que hacer.`)
      return
    }

    console.log(`\nTablas de ${usuario} (${tablas.length}):`)
    tablas.forEach(t => console.log('  ·', t.tabla))

    // Se otorga en bloque: alcanza con ser dueño, y no hace falta ser miembro
    // del rol destino como sí exigiría transferir la propiedad.
    await prisma.$executeRawUnsafe(`GRANT ALL ON ALL TABLES IN SCHEMA public TO ${BENEFICIARIO}`)
    await prisma.$executeRawUnsafe(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ${BENEFICIARIO}`)
    console.log(`\n✓ Permisos otorgados a ${BENEFICIARIO}`)

    // Lo importante: que no vuelva a pasar con las tablas que se creen después.
    await prisma.$executeRawUnsafe(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${BENEFICIARIO}`
    )
    await prisma.$executeRawUnsafe(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${BENEFICIARIO}`
    )
    console.log(`✓ Las tablas que cree ${usuario} de ahora en más ya nacen accesibles`)

    const pendientes = await prisma.$queryRawUnsafe(
      `SELECT c.relname AS tabla
       FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relkind = 'r'
         AND NOT has_table_privilege($1, c.oid, 'INSERT')
       ORDER BY 1`,
      BENEFICIARIO
    )
    console.log(
      pendientes.length
        ? `\n⚠️  Siguen sin permiso: ${pendientes.map(t => t.tabla).join(', ')}`
        : `\n✓ ${BENEFICIARIO} puede escribir todas las tablas del esquema.`
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
