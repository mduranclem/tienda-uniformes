const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function adminOnly(req, res, next) {
  if (!req.user) return res.status(401).json({ mensaje: 'No autorizado' })
  const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } })
  if (!usuario || usuario.rol !== 'ADMIN') {
    return res.status(403).json({ mensaje: 'Acceso denegado' })
  }
  next()
}

module.exports = adminOnly
