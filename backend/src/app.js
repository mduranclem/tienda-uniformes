require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const alumnosRouter = require('./routes/alumnos')
const bannersRouter = require('./routes/banners')
const categoriasRouter = require('./routes/categorias')
const adminCategoriasRouter = require('./routes/admin/categorias')
const cuponesRouter = require('./routes/cupones')
const colegiosRouter = require('./routes/colegios')
const entregasRouter = require('./routes/entregas')
const enviosRouter = require('./routes/envios')
const tiendaRouter = require('./routes/tienda')
const ordenesRouter = require('./routes/ordenes')
const productosRouter = require('./routes/productos')
const carritoRouter = require('./routes/carrito')
const usuariosRouter = require('./routes/usuarios')
const adminColegiosRouter = require('./routes/admin/colegios')
const adminProductosRouter = require('./routes/admin/productos')
const adminOrdenesRouter = require('./routes/admin/ordenes')
const adminCuponesRouter = require('./routes/admin/cupones')
const adminEntregasRouter = require('./routes/admin/entregas')
const adminEnviosRouter = require('./routes/admin/envios')
const adminBannersRouter = require('./routes/admin/banners')
const stockRouter = require('./routes/stock')
const adminPuntosVentaRouter = require('./routes/admin/puntosVenta')
const adminMovimientosStockRouter = require('./routes/admin/movimientosStock')
const botRouter = require('./routes/bot')
const adminBotRouter = require('./routes/admin/bot')
const errorHandler = require('./middleware/errorHandler')

const app = express()

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('CORS: origin no permitido'))
  },
  credentials: true,
}))

app.use(express.json())
app.use(cookieParser())

app.use('/api/alumnos', alumnosRouter)
app.use('/api/banners', bannersRouter)
app.use('/api/categorias', categoriasRouter)
app.use('/api/admin/categorias', adminCategoriasRouter)
app.use('/api/cupones', cuponesRouter)
app.use('/api/colegios', colegiosRouter)
app.use('/api/entregas', entregasRouter)
app.use('/api/envios', enviosRouter)
app.use('/api/tienda', tiendaRouter)
app.use('/api/ordenes', ordenesRouter)
app.use('/api/productos', productosRouter)
app.use('/api/carrito', carritoRouter)
app.use('/api/usuarios', usuariosRouter)
app.use('/api/admin/colegios', adminColegiosRouter)
app.use('/api/admin/productos', adminProductosRouter)
app.use('/api/admin/ordenes', adminOrdenesRouter)
app.use('/api/admin/cupones', adminCuponesRouter)
app.use('/api/admin/entregas', adminEntregasRouter)
app.use('/api/admin/envios', adminEnviosRouter)
app.use('/api/admin/banners', adminBannersRouter)
app.use('/api/stock', stockRouter)
app.use('/api/admin/puntos-venta', adminPuntosVentaRouter)
app.use('/api/admin/movimientos-stock', adminMovimientosStockRouter)
app.use('/api/bot', botRouter)
app.use('/api/admin/bot', adminBotRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use(errorHandler)

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`)
})

// Mantiene la conexión con Supabase activa para evitar cold starts
const prisma = require('./lib/prisma')
setInterval(async () => {
  try { await prisma.$queryRaw`SELECT 1` } catch (_) {}
}, 4 * 60 * 1000)

// Cancela los pedidos que pasaron su plazo de pago sin pagarse y devuelve el
// stock. Corre al arrancar y después cada hora: el plazo es de días, así que
// una hora de demora no cambia nada.
const { cancelarVencidas } = require('./lib/vencimientoOrden')
async function revisarVencidas() {
  try {
    const canceladas = await cancelarVencidas()
    if (canceladas) console.log(`[vencimientos] ${canceladas} pedido(s) cancelado(s) por falta de pago`)
  } catch (err) {
    console.error('[vencimientos] Error:', err.message)
  }
}
revisarVencidas()
setInterval(revisarVencidas, 60 * 60 * 1000)

module.exports = app
