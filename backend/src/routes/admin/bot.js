const { Router } = require('express')
const prisma = require('../../lib/prisma')
const { authMiddleware } = require('../../middleware/auth')
const adminOnly = require('../../middleware/adminOnly')
const { CLAVES, leerConfigTienda } = require('../../lib/configTienda')

const router = Router()

router.use(authMiddleware, adminOnly)

// GET /api/admin/bot — config actual del bot / tienda
router.get('/', async (req, res, next) => {
  try {
    const config = await leerConfigTienda()
    res.json(config)
  } catch (err) { next(err) }
})

// PUT /api/admin/bot — upsert de todas las claves recibidas
router.put('/', async (req, res, next) => {
  try {
    const entradas = CLAVES
      .filter(clave => req.body[clave] !== undefined)
      .map(clave => ({ clave, valor: String(req.body[clave] ?? '') }))

    await prisma.$transaction(
      entradas.map(({ clave, valor }) =>
        prisma.configTienda.upsert({
          where: { clave },
          update: { valor },
          create: { clave, valor },
        })
      )
    )

    const config = await leerConfigTienda()
    res.json(config)
  } catch (err) { next(err) }
})

module.exports = router
