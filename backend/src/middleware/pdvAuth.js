const { createHash } = require('crypto')
const prisma = require('../lib/prisma')

// Autenticación de puntos de venta (locales) vía header x-pdv-key.
// La key nunca se guarda en texto plano — se compara por hash.
async function pdvAuth(req, res, next) {
  const key = req.headers['x-pdv-key']
  if (!key) return res.status(401).json({ mensaje: 'Falta el header x-pdv-key' })

  const apiKeyHash = createHash('sha256').update(key).digest('hex')
  const puntoDeVenta = await prisma.puntoDeVenta.findUnique({ where: { apiKeyHash } })

  if (!puntoDeVenta || !puntoDeVenta.activo) {
    return res.status(401).json({ mensaje: 'API key inválida' })
  }

  req.puntoDeVenta = puntoDeVenta
  next()
}

module.exports = pdvAuth
