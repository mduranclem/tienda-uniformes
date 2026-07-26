// Cotizador por tabla de zonas propia.
//
// Implementación activa mientras no haya contrato con Andreani. Las zonas, sus
// rangos de CP y sus escalones de tarifa se cargan desde /admin/envios.
//
// La lógica de selección vive en tablaZonasLogica.js, sin acceso a la base.

const prisma = require('../../lib/prisma')
const { normalizarCP } = require('./cp')
const { slug, elegirZona, precioParaPeso } = require('./tablaZonasLogica')

async function cotizar({ cp, pesoGramos }) {
  const cpNumerico = normalizarCP(cp)

  const zonas = await prisma.zonaEnvio.findMany({
    where: { activo: true },
    include: { rangos: true, tarifas: true },
  })

  const zona = elegirZona(zonas, cpNumerico)
  const precio = precioParaPeso(zona, pesoGramos)

  return [{
    codigo: `tabla:${slug(zona.nombre)}`,
    nombre: `Envío a domicilio — ${zona.nombre}`,
    precio,
    plazoDias: null,
  }]
}

module.exports = { cotizar }
