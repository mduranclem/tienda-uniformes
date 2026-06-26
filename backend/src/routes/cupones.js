const { Router } = require('express')
const prisma = require('../lib/prisma')

const router = Router()


// POST /api/cupones/validar
router.post('/validar', async (req, res, next) => {
  try {
    const { codigo, subtotal, colegioIds = [], productoIds = [], itemsSubtotales = [] } = req.body
    if (!codigo) return res.status(400).json({ mensaje: 'Código requerido' })

    const cupon = await prisma.cupon.findUnique({
      where: { codigo: codigo.toUpperCase().trim() },
    })

    if (!cupon || !cupon.activo) {
      return res.status(400).json({ mensaje: 'Cupón inválido o inactivo' })
    }

    const ahora = new Date()
    if (cupon.desde && ahora < cupon.desde) {
      return res.status(400).json({ mensaje: 'El cupón todavía no está vigente' })
    }
    if (cupon.hasta && ahora > cupon.hasta) {
      return res.status(400).json({ mensaje: 'El cupón está vencido' })
    }
    if (cupon.usosMax !== null && cupon.usosActuales >= cupon.usosMax) {
      return res.status(400).json({ mensaje: 'El cupón ya alcanzó el límite de usos' })
    }
    if (cupon.minimoCompra !== null && subtotal < Number(cupon.minimoCompra)) {
      return res.status(400).json({ mensaje: `El cupón requiere una compra mínima de ${Number(cupon.minimoCompra).toLocaleString('es-AR')}` })
    }
    if (cupon.aplicaA === 'COLEGIO' && cupon.colegioId && !colegioIds.includes(cupon.colegioId)) {
      return res.status(400).json({ mensaje: 'El cupón no aplica a los productos en tu carrito' })
    }
    if (cupon.aplicaA === 'PRODUCTO' && cupon.productoId && !productoIds.includes(cupon.productoId)) {
      return res.status(400).json({ mensaje: 'El cupón no aplica a los productos en tu carrito' })
    }

    // Base imponible: si aplica a producto específico, solo el subtotal de ese producto
    let base = subtotal
    if (cupon.aplicaA === 'PRODUCTO' && cupon.productoId) {
      const baseProducto = itemsSubtotales?.find(i => i.productoId === cupon.productoId)?.subtotal ?? 0
      base = baseProducto
    } else if (cupon.aplicaA === 'COLEGIO' && cupon.colegioId) {
      const baseColegio = itemsSubtotales?.filter(i => i.colegioId === cupon.colegioId).reduce((a, i) => a + i.subtotal, 0) ?? subtotal
      base = baseColegio
    }

    const descuento = cupon.tipo === 'PORCENTAJE'
      ? Math.round(base * Number(cupon.valor) / 100)
      : Math.min(Number(cupon.valor), base)

    res.json({ valido: true, cuponId: cupon.id, codigo: cupon.codigo, tipo: cupon.tipo, valor: Number(cupon.valor), descuento })
  } catch (err) { next(err) }
})

module.exports = router
