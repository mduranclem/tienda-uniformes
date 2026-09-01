const { Router } = require('express')
const { tablasCargadas } = require('../lib/tablaTalles')
const { leerConfigPublica } = require('../lib/configTienda')

const router = Router()

// GET /api/tienda/pago — público.
// Los datos para transferir y si Mercado Pago está habilitado. El checkout los
// necesita para mostrarle el CBU al cliente, y /api/bot/* no sirve para eso
// porque está detrás de la clave del bot.
router.get('/pago', async (_req, res, next) => {
  try {
    const config = await leerConfigPublica()
    res.json({
      banco: {
        nombre: config.bancoNombre,
        titular: config.bancoTitular,
        cbu: config.bancoCbu,
        alias: config.bancoAlias,
        cuit: config.bancoCuit,
      },
      // Con los datos incompletos no se puede pedir una transferencia: el
      // frontend usa esto para avisar en vez de mostrar campos vacíos.
      transferenciaDisponible: Boolean(config.bancoCbu || config.bancoAlias),
      mercadoPagoActivo: config.mercadoPagoActivo === '1',
      direccion: config.direccion,
    })
  } catch (err) { next(err) }
})

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
