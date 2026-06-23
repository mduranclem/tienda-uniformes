const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ mensaje: 'No autorizado' })
  }
  const token = header.slice(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return res.status(401).json({ mensaje: 'Token inválido' })
  }
  req.user = user
  next()
}

async function authOpcional(req, _res, next) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7)
    const { data: { user } } = await supabase.auth.getUser(token)
    req.user = user ?? null
  }
  next()
}

module.exports = { authMiddleware, authOpcional }
