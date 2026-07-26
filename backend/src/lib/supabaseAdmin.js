const { createClient } = require('@supabase/supabase-js')

// Cliente con service role key — solo para uso en el backend (nunca exponer
// esta key al frontend). Necesaria para subir a Storage sin depender de las
// políticas RLS del bucket.
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno del backend')
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

module.exports = supabaseAdmin
