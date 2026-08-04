const { Router } = require('express')
const prisma = require('../lib/prisma')

const router = Router()

// GET /api/tienda/tabla-talles — público.
// La tabla se sube una vez y su URL vive en ConfigTienda; la página /talles la
// pide acá en vez de tener la dirección escrita a mano, para que al reemplazar
// la imagen no haya que tocar el frontend.
router.get('/tabla-talles', async (_req, res, next) => {
  try {
    const fila = await prisma.configTienda.findUnique({ where: { clave: 'tablaTallesUrl' } })
    res.json({ url: fila?.valor || null })
  } catch (err) { next(err) }
})

module.exports = router
