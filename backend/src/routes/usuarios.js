const { Router } = require('express')
const prisma = require('../lib/prisma')
const { authMiddleware } = require('../middleware/auth')

const router = Router()


// POST /api/usuarios/sync
// Upsert del usuario en nuestra DB al loguear con Supabase.
// El frontend lo llama una sola vez después de obtener la sesión.
router.post('/sync', authMiddleware, async (req, res, next) => {
  try {
    const { id, email, user_metadata } = req.user

    const usuario = await prisma.usuario.upsert({
      where: { id },
      update: {
        email,
        nombre: user_metadata?.full_name ?? user_metadata?.name ?? undefined,
      },
      create: {
        id,
        email,
        nombre: user_metadata?.full_name ?? user_metadata?.name ?? null,
        rol: 'CLIENTE',
      },
    })

    res.json(usuario)
  } catch (err) {
    next(err)
  }
})

// GET /api/usuarios/me
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
    })
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' })
    res.json(usuario)
  } catch (err) {
    next(err)
  }
})

module.exports = router
