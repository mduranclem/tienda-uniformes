require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const bannersRouter = require('./routes/banners')
const cuponesRouter = require('./routes/cupones')
const colegiosRouter = require('./routes/colegios')
const entregasRouter = require('./routes/entregas')
const ordenesRouter = require('./routes/ordenes')
const productosRouter = require('./routes/productos')
const carritoRouter = require('./routes/carrito')
const usuariosRouter = require('./routes/usuarios')
const adminColegiosRouter = require('./routes/admin/colegios')
const adminProductosRouter = require('./routes/admin/productos')
const adminOrdenesRouter = require('./routes/admin/ordenes')
const adminCuponesRouter = require('./routes/admin/cupones')
const adminEntregasRouter = require('./routes/admin/entregas')
const adminBannersRouter = require('./routes/admin/banners')
const errorHandler = require('./middleware/errorHandler')

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/banners', bannersRouter)
app.use('/api/cupones', cuponesRouter)
app.use('/api/colegios', colegiosRouter)
app.use('/api/entregas', entregasRouter)
app.use('/api/ordenes', ordenesRouter)
app.use('/api/productos', productosRouter)
app.use('/api/carrito', carritoRouter)
app.use('/api/usuarios', usuariosRouter)
app.use('/api/admin/colegios', adminColegiosRouter)
app.use('/api/admin/productos', adminProductosRouter)
app.use('/api/admin/ordenes', adminOrdenesRouter)
app.use('/api/admin/cupones', adminCuponesRouter)
app.use('/api/admin/entregas', adminEntregasRouter)
app.use('/api/admin/banners', adminBannersRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use(errorHandler)

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`)
})

module.exports = app
