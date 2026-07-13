// Endpoints públicos (protegidos con x-bot-key) para el bot de WhatsApp
// armado en n8n. Ver bot/SYSTEM_PROMPT.md para el prompt que los usa.

const { Router } = require('express')
const prisma = require('../lib/prisma')
const botAuth = require('../middleware/botAuth')
const { leerConfigTienda } = require('../lib/configTienda')

const router = Router()

router.use(botAuth)

// GET /api/bot/pedido?busqueda=EMAIL_O_NUMERO
router.get('/pedido', async (req, res, next) => {
  try {
    const busqueda = (req.query.busqueda ?? '').trim()
    if (!busqueda) return res.status(400).json({ mensaje: 'Falta el parámetro busqueda' })

    const include = {
      items: {
        include: {
          producto: { select: { nombre: true } },
          variante: { select: { talle: true, color: true } },
        },
      },
      entrega: { select: { nombre: true, tipo: true } },
      historial: { orderBy: { createdAt: 'desc' }, take: 1 },
    }

    const esNumero = /^\d+$/.test(busqueda)
    const orden = esNumero
      ? await prisma.orden.findFirst({ where: { numero: Number(busqueda) }, include })
      : await prisma.orden.findFirst({
          where: {
            OR: [
              { emailGuest: { equals: busqueda, mode: 'insensitive' } },
              { usuario: { email: { equals: busqueda, mode: 'insensitive' } } },
            ],
          },
          orderBy: { createdAt: 'desc' },
          include,
        })

    if (!orden) {
      return res.json({
        encontrado: false,
        mensaje: 'No encontramos ningún pedido con esos datos. ¿Podés confirmar el número de orden o el email que usaste en la compra?',
      })
    }

    res.json({
      encontrado: true,
      numero: orden.numero,
      estado: orden.estado,
      fecha: orden.createdAt,
      entrega: orden.entrega?.nombre ?? null,
      items: orden.items.map(item => ({
        producto: item.producto?.nombre ?? 'Producto',
        talle: item.variante?.talle ?? null,
        color: item.variante?.color ?? null,
        cantidad: item.cantidad,
      })),
      ultimoCambio: orden.historial[0]
        ? {
            estado: orden.historial[0].estado,
            nota: orden.historial[0].nota,
            fecha: orden.historial[0].createdAt,
          }
        : null,
    })
  } catch (err) { next(err) }
})

// GET /api/bot/productos?colegio=SLUG_O_NOMBRE
router.get('/productos', async (req, res, next) => {
  try {
    const colegioParam = (req.query.colegio ?? '').trim()
    if (!colegioParam) return res.status(400).json({ mensaje: 'Falta el parámetro colegio' })

    const colegio = await prisma.colegio.findFirst({
      where: {
        activo: true,
        OR: [
          { slug: colegioParam },
          { nombre: { contains: colegioParam, mode: 'insensitive' } },
        ],
      },
    })

    if (!colegio) {
      return res.json({ encontrado: false, mensaje: `No encontramos el colegio "${colegioParam}".` })
    }

    const productos = await prisma.producto.findMany({
      where: { colegioId: colegio.id, activo: true },
      include: {
        imagenes: { take: 1, orderBy: { orden: 'asc' } },
        variantes: { select: { talle: true, color: true, stock: true } },
      },
      orderBy: { nombre: 'asc' },
    })

    const frontendUrl = process.env.FRONTEND_URL ?? ''

    res.json({
      encontrado: true,
      colegio: colegio.nombre,
      productos: productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precioOferta ?? p.precio),
        precioLista: p.precioOferta ? Number(p.precio) : null,
        imagen: p.imagenes[0]?.url ?? null,
        talles: p.variantes.map(v => ({ talle: v.talle, color: v.color, stock: v.stock })),
        link: `${frontendUrl}/producto/${p.id}`,
      })),
    })
  } catch (err) { next(err) }
})

// GET /api/bot/stock?productoId=ID&talle=TALLE
router.get('/stock', async (req, res, next) => {
  try {
    const { productoId, talle } = req.query
    if (!productoId || !talle) {
      return res.status(400).json({ mensaje: 'Faltan los parámetros productoId y talle' })
    }

    const variante = await prisma.variante.findFirst({
      where: { productoId, talle: { equals: talle, mode: 'insensitive' } },
      include: { producto: { select: { nombre: true } } },
    })

    if (!variante) {
      return res.status(404).json({ mensaje: 'No encontramos ese talle para ese producto' })
    }

    res.json({
      disponible: variante.stock > 0,
      cantidad: variante.stock,
      producto: variante.producto.nombre,
      talle: variante.talle,
    })
  } catch (err) { next(err) }
})

// POST /api/bot/alerta-stock  { telefono, productoId, talle }
router.post('/alerta-stock', async (req, res, next) => {
  try {
    const { telefono, productoId, talle } = req.body
    if (!telefono || !productoId || !talle) {
      return res.status(400).json({ mensaje: 'Faltan datos: telefono, productoId y talle son requeridos' })
    }

    const variante = await prisma.variante.findFirst({
      where: { productoId, talle: { equals: talle, mode: 'insensitive' } },
    })
    if (!variante) {
      return res.status(404).json({ mensaje: 'No encontramos ese talle para ese producto' })
    }

    await prisma.alertaStock.create({ data: { telefono, varianteId: variante.id } })

    res.status(201).json({ mensaje: 'Listo, te avisamos apenas haya stock 👍' })
  } catch (err) { next(err) }
})

// GET /api/bot/info
router.get('/info', async (req, res, next) => {
  try {
    const config = await leerConfigTienda()
    // webhookStockAlert es config interna, no se expone en la respuesta pública
    const { webhookStockAlert, ...publico } = config
    res.json(publico)
  } catch (err) { next(err) }
})

module.exports = router
