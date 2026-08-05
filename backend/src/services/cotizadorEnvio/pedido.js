// Cotización de un pedido concreto.
//
// Traduce "estos items del carrito, a este CP" en opciones de envío. Lo usan
// tanto el endpoint del checkout como la creación de la orden, para que ambos
// calculen exactamente lo mismo.

const prisma = require('../../lib/prisma')
const { esZonaLocal } = require('../../lib/envios')
const { pesoDelEnvio } = require('../../lib/pesos')
const { cotizar } = require('./index')
const { ErrorCotizacion } = require('./errores')

// El reparto propio no pasa por el cotizador: su precio sale de la entrega
// configurada en el panel y de la cantidad de unidades (ver lib/envios.js).
// `precio: 0` acá es solo el valor que devuelve esta cotización informativa; el
// que se cobra lo calcula la creación de la orden.
const OPCION_ROSARIO = {
  codigo: 'local:rosario',
  nombre: 'Envío a domicilio en Rosario y alrededores',
  precio: 0,
  plazoDias: null,
}

/**
 * El peso y el valor declarado se calculan SIEMPRE acá, leyendo la base a
 * partir de los varianteId. Nunca se aceptan del cliente: mandar
 * `pesoGramos: 1` sería la forma trivial de pagar el envío mínimo.
 *
 * @param {{ items: Array<{varianteId: string, cantidad: number}>, cp?: string, ciudad?: string }} pedido
 * @returns {Promise<{ pesoGramos: number, opciones: Array }>}
 */
async function cotizarPedido({ items, cp, ciudad }) {
  if (!items?.length) {
    throw new ErrorCotizacion('No hay items para cotizar')
  }

  const variantes = await prisma.variante.findMany({
    where: { id: { in: items.map(i => i.varianteId) } },
    include: {
      producto: { select: { tipo: true, pesoGramos: true, precio: true, precioOferta: true } },
    },
  })

  const itemsConPeso = items.map(item => {
    const variante = variantes.find(v => v.id === item.varianteId)
    if (!variante) throw new ErrorCotizacion(`Variante ${item.varianteId} no encontrada`)
    return { producto: variante.producto, variante, cantidad: item.cantidad }
  })

  const pesoGramos = pesoDelEnvio(itemsConPeso)

  const valorDeclarado = itemsConPeso.reduce((acc, i) => {
    const precio = Number(i.variante.precio ?? i.producto.precioOferta ?? i.producto.precio)
    return acc + precio * i.cantidad
  }, 0)

  // La regla de Rosario se evalúa por ciudad y no por CP, para que sea la misma
  // condición que ya aplica routes/ordenes.js y no existan dos definiciones de
  // "es Rosario" que puedan divergir.
  if (esZonaLocal(ciudad)) {
    return { pesoGramos, opciones: [OPCION_ROSARIO] }
  }

  const opciones = await cotizar({ cp, ciudad, pesoGramos, valorDeclarado })
  return { pesoGramos, opciones }
}

module.exports = { cotizarPedido, OPCION_ROSARIO }
