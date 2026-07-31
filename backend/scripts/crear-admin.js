// Da de alta un administrador de la tienda.
//
// Uso (desde cualquier carpeta):
//   ADMIN_PASSWORD="la-clave" node backend/scripts/crear-admin.js correo@ejemplo.com "Nombre Apellido"
//
// La contraseña se pasa por variable de entorno y no como argumento, para que
// no quede en el historial de comandos.
//
// Hace dos cosas, porque el acceso depende de las dos:
//   1. Crea el usuario en Supabase Auth (o reutiliza el que exista).
//   2. Crea la fila en la tabla Usuario con rol ADMIN, que es lo que mira
//      middleware/adminOnly para dejar entrar a /admin.
//
// Es idempotente: si el usuario ya existe, le actualiza la contraseña y le
// asegura el rol ADMIN en vez de fallar.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const prisma = require('../src/lib/prisma')
const supabaseAdmin = require('../src/lib/supabaseAdmin')

async function buscarPorEmail(email) {
  // La API de admin no expone búsqueda por email, así que se pagina.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`No se pudo listar usuarios: ${error.message}`)
    const encontrado = data.users.find(u => u.email?.toLowerCase() === email)
    if (encontrado) return encontrado
    if (data.users.length < 200) return null
  }
  return null
}

async function main() {
  const email = (process.argv[2] ?? '').trim().toLowerCase()
  const nombre = process.argv[3] ?? null
  const password = process.env.ADMIN_PASSWORD

  if (!email || !email.includes('@')) {
    console.error('Falta el email.\n  ADMIN_PASSWORD="..." node backend/scripts/crear-admin.js correo@ejemplo.com "Nombre"')
    process.exit(1)
  }
  if (!password || password.length < 6) {
    console.error('Falta ADMIN_PASSWORD (mínimo 6 caracteres).')
    process.exit(1)
  }

  const existente = await buscarPorEmail(email)
  let authUser

  if (existente) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existente.id, { password })
    if (error) throw new Error(`No se pudo actualizar la contraseña: ${error.message}`)
    authUser = data.user
    console.log('· Ya existía en Supabase Auth: se actualizó la contraseña')
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      // Sin esto queda pendiente de confirmar y no puede entrar.
      email_confirm: true,
      user_metadata: nombre ? { full_name: nombre } : undefined,
    })
    if (error) throw new Error(`No se pudo crear el usuario: ${error.message}`)
    authUser = data.user
    console.log('✓ Creado en Supabase Auth')
  }

  const usuario = await prisma.usuario.upsert({
    where: { id: authUser.id },
    update: { email, rol: 'ADMIN', nombre: nombre ?? undefined },
    create: { id: authUser.id, email, nombre, rol: 'ADMIN' },
  })

  console.log('✓ Rol ADMIN asignado')
  console.log(`\n  ${usuario.email}${usuario.nombre ? ' (' + usuario.nombre + ')' : ''}`)
  console.log(`  rol: ${usuario.rol}`)
  console.log('\nYa puede entrar en /login y acceder a /admin.')

  await prisma.$disconnect()
}

main().catch(async err => {
  console.error('Error:', err.message)
  await prisma.$disconnect()
  process.exit(1)
})
