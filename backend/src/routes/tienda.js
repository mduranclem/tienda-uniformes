const { Router } = require('express')
const { tablasCargadas } = require('../lib/tablaTalles')

const router = Router()

// GET /api/tienda/tabla-talles — público.
// Las tablas se suben una vez y sus URLs viven en ConfigTienda; la página
// /talles las pide acá en vez de tener las direcciones escritas a mano, para
// que al reemplazar una imagen no haya que tocar el frontend.
//
// `url` se mantiene por compatibilidad: apunta a la primera tabla cargada, que
// es lo que devolvía antes esta ruta cuando había una sola.
router.get('/tabla-talles', async (_req, res, next) => {
  try {
    const tablas = await tablasCargadas()
    res.json({ tablas, url: tablas[0]?.url ?? null })
  } catch (err) { next(err) }
})

module.exports = router
