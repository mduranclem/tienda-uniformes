const { Router } = require('express')
const prisma = require('../lib/prisma')
const { authMiddleware } = require('../middleware/auth')
const { crearPreferencia } = require('../services/mercadopago')

const router = Router()

// POST /api/pagos/preferencia
router.post('/preferencia', authMiddleware, async (req, res, next) => {
  try {
    const { ordenId } = req.body
    if (!ordenId) return res.status(400).json({ mensaje: 'ordenId es requerido' })

    const orden = await prisma.orden.findUnique({
      where: { id: ordenId },
      include: {
        usuario: { select: { email: true, nombre: true } },
        items: {
          include: {
            producto: { select: { nombre: true } },
            variante: { select: { talle: true, color: true } },
          },
        },
        entrega: true,
      },
    })

    if (!orden) return res.status(404).json({ mensaje: 'Orden no encontrada' })
    if (orden.usuarioId !== req.user.id) return res.status(403).json({ mensaje: 'No tenés acceso a esta orden' })
    if (orden.estado !== 'PENDIENTE') return res.status(400).json({ mensaje: 'Esta orden ya no está pendiente de pago' })

    const preference = await crearPreferencia(orden)

    // Guardar el ID de la preferencia en la orden
    await prisma.orden.update({
      where: { id: ordenId },
      data: { mpPreferenceId: preference.id },
    })

    res.json({
      preferenceId: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    })
  } catch (err) { next(err) }
})

module.exports = router
