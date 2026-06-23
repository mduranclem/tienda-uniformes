require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const colegiosRouter = require('./routes/colegios')
const productosRouter = require('./routes/productos')
const carritoRouter = require('./routes/carrito')
const errorHandler = require('./middleware/errorHandler')

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/colegios', colegiosRouter)
app.use('/api/productos', productosRouter)
app.use('/api/carrito', carritoRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use(errorHandler)

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`)
})

module.exports = app
