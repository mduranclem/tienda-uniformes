const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')
const { randomUUID } = require('crypto')
const { authOpcional, authMiddleware } = require('../middleware/auth')

const router = Router()
const prisma = new PrismaClient()

// Obtiene o crea el carrito para el usuario/sesión actual
async function resolverCarrito(req, res) {
  const usuarioId = req.user?.id ?? null
  const sessionId = req.cookies?.sessionId ?? null

  if (usuarioId) {
    let carrito = await prisma.carrito.findFirst({
      where: { usuarioId },
      include: { items: { include: { producto: true, variante: true } } },
    })
    if (!carrito) {
      carrito = await prisma.carrito.create({
        data: { usuarioId },
        include: { items: { include: { producto: true, variante: true } } },
      })
    }
    return { carrito, nuevoSessionId: null }
  }

  if (sessionId) {
    const carrito = await prisma.carrito.findFirst({
      where: { sessionId },
      include: { items: { include: { producto: true, variante: true } } },
    })
    if (carrito) return { carrito, nuevoSessionId: null }
  }

  const nuevoSessionId = randomUUID()
  const carrito = await prisma.carrito.create({
    data: { sessionId: nuevoSessionId },
    include: { items: { include: { producto: true, variante: true } } },
  })
  return { carrito, nuevoSessionId }
}

function setSessionCookie(res, sessionId) {
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
  })
}

// GET /api/carrito
router.get('/', authOpcional, async (req, res, next) => {
  try {
    const { carrito, nuevoSessionId } = await resolverCarrito(req, res)
    if (nuevoSessionId) setSessionCookie(res, nuevoSessionId)
    res.json(carrito)
  } catch (err) {
    next(err)
  }
})

// POST /api/carrito/items
router.post('/items', authOpcional, async (req, res, next) => {
  try {
    const { varianteId, cantidad = 1 } = req.body
    if (!varianteId || cantidad < 1) {
      return res.status(400).json({ mensaje: 'varianteId y cantidad son requeridos' })
    }

    const variante = await prisma.variante.findUnique({ where: { id: varianteId } })
    if (!variante) return res.status(404).json({ mensaje: 'Variante no encontrada' })
    if (variante.stock < cantidad) {
      return res.status(409).json({ mensaje: 'Stock insuficiente' })
    }

    const producto = await prisma.producto.findUnique({ where: { id: variante.productoId } })

    const { carrito, nuevoSessionId } = await resolverCarrito(req, res)
    if (nuevoSessionId) setSessionCookie(res, nuevoSessionId)

    const itemExistente = carrito.items.find(i => i.varianteId === varianteId)
    const nuevaCantidad = (itemExistente?.cantidad ?? 0) + cantidad

    if (variante.stock < nuevaCantidad) {
      return res.status(409).json({ mensaje: 'Stock insuficiente' })
    }

    let item
    if (itemExistente) {
      item = await prisma.itemCarrito.update({
        where: { id: itemExistente.id },
        data: { cantidad: nuevaCantidad },
      })
    } else {
      item = await prisma.itemCarrito.create({
        data: {
          carritoId: carrito.id,
          productoId: variante.productoId,
          varianteId,
          cantidad,
          precioUnit: producto.precio,
        },
      })
    }

    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
})

// PUT /api/carrito/items/:varianteId
router.put('/items/:varianteId', authOpcional, async (req, res, next) => {
  try {
    const { cantidad } = req.body
    if (!cantidad || cantidad < 1) {
      return res.status(400).json({ mensaje: 'cantidad debe ser mayor a 0' })
    }

    const { carrito } = await resolverCarrito(req, res)
    const item = carrito.items.find(i => i.varianteId === req.params.varianteId)
    if (!item) return res.status(404).json({ mensaje: 'Item no encontrado en el carrito' })

    const variante = await prisma.variante.findUnique({ where: { id: req.params.varianteId } })
    if (variante.stock < cantidad) {
      return res.status(409).json({ mensaje: 'Stock insuficiente' })
    }

    const actualizado = await prisma.itemCarrito.update({
      where: { id: item.id },
      data: { cantidad },
    })
    res.json(actualizado)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/carrito/items/:varianteId
router.delete('/items/:varianteId', authOpcional, async (req, res, next) => {
  try {
    const { carrito } = await resolverCarrito(req, res)
    const item = carrito.items.find(i => i.varianteId === req.params.varianteId)
    if (!item) return res.status(404).json({ mensaje: 'Item no encontrado' })

    await prisma.itemCarrito.delete({ where: { id: item.id } })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

// POST /api/carrito/merge
// Fusiona el carrito guest (sessionId de cookie) con el carrito del usuario logueado.
// Se llama una sola vez justo después del login.
router.post('/merge', authMiddleware, async (req, res, next) => {
  try {
    const sessionId = req.cookies?.sessionId
    if (!sessionId) return res.status(200).json({ mensaje: 'Nada que fusionar' })

    const carritoGuest = await prisma.carrito.findFirst({
      where: { sessionId },
      include: { items: true },
    })
    if (!carritoGuest || carritoGuest.items.length === 0) {
      return res.status(200).json({ mensaje: 'Carrito guest vacío' })
    }

    let carritoUsuario = await prisma.carrito.findFirst({
      where: { usuarioId: req.user.id },
      include: { items: true },
    })
    if (!carritoUsuario) {
      carritoUsuario = await prisma.carrito.create({
        data: { usuarioId: req.user.id },
        include: { items: true },
      })
    }

    // Fusionar item por item — si ya existe la variante, sumar cantidad
    for (const itemGuest of carritoGuest.items) {
      const variante = await prisma.variante.findUnique({ where: { id: itemGuest.varianteId } })
      if (!variante) continue

      const itemExistente = carritoUsuario.items.find(i => i.varianteId === itemGuest.varianteId)
      const nuevaCantidad = Math.min(
        (itemExistente?.cantidad ?? 0) + itemGuest.cantidad,
        variante.stock
      )

      if (itemExistente) {
        await prisma.itemCarrito.update({
          where: { id: itemExistente.id },
          data: { cantidad: nuevaCantidad },
        })
      } else {
        await prisma.itemCarrito.create({
          data: {
            carritoId: carritoUsuario.id,
            productoId: itemGuest.productoId,
            varianteId: itemGuest.varianteId,
            cantidad: nuevaCantidad,
            precioUnit: itemGuest.precioUnit,
          },
        })
      }
    }

    // Eliminar carrito guest
    await prisma.carrito.delete({ where: { id: carritoGuest.id } })

    // Limpiar cookie de sesión
    res.clearCookie('sessionId')

    const carritoFinal = await prisma.carrito.findUnique({
      where: { id: carritoUsuario.id },
      include: { items: { include: { producto: true, variante: true } } },
    })

    res.json(carritoFinal)
  } catch (err) {
    next(err)
  }
})

module.exports = router
