const { Router } = require('express')
const { cotizarPedido } = require('../services/cotizadorEnvio/pedido')

const router = Router()

// POST /api/envios/cotizar — público, lo usa el checkout de invitado
// body: { cp, ciudad?, items: [{ varianteId, cantidad }] }
router.post('/cotizar', async (req, res, next) => {
  try {
    const { cp, ciudad, items } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ mensaje: 'items es requerido' })
    }
    if (!cp && !ciudad) {
      return res.status(400).json({ mensaje: 'Indicá el código postal' })
    }

    const { pesoGramos, opciones } = await cotizarPedido({ items, cp, ciudad })
    res.json({ pesoGramos, opciones })
  } catch (err) {
    // Un destino que no sabemos cotizar no es un error del servidor: es una
    // respuesta que el checkout muestra tal cual al cliente.
    if (err.esErrorCotizacion) {
      return res.status(422).json({ mensaje: err.message })
    }
    next(err)
  }
})

module.exports = router
