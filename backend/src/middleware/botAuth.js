// Protege las rutas /api/bot/* — pensadas para ser llamadas desde n8n.
// Requiere el header x-bot-key con el valor de BOT_API_KEY.

function botAuth(req, res, next) {
  const key = process.env.BOT_API_KEY
  if (!key) {
    return res.status(503).json({ mensaje: 'Bot no configurado (falta BOT_API_KEY)' })
  }
  if (req.headers['x-bot-key'] !== key) {
    return res.status(401).json({ mensaje: 'No autorizado' })
  }
  next()
}

module.exports = botAuth
