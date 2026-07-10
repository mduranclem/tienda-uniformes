import { Link } from 'react-router-dom'
import { Truck } from 'lucide-react'
import { formatPrecio, titleCase, infoCuotas } from '../../lib/utils'

const ORDEN_TALLES = ['4', '6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL', 'ESP']

function posicionTalle(talle) {
  const i = ORDEN_TALLES.indexOf(String(talle).toUpperCase())
  return i === -1 ? ORDEN_TALLES.length : i
}

// Precio efectivo de una variante: el propio (si tiene) o el del producto
// (con oferta si corresponde). Espeja la lógica de ProductoPage.
function precioEfectivo(variante, producto) {
  if (variante.precio != null) return { precio: Number(variante.precio), tieneOferta: false }
  const tieneOferta = producto.precioOferta && Number(producto.precioOferta) < Number(producto.precio)
  return { precio: tieneOferta ? Number(producto.precioOferta) : Number(producto.precio), tieneOferta }
}

export default function ProductCard({ producto }) {
  const imagenPrincipal = producto.imagenes?.[0]?.url ?? '/placeholder.png'
  const variantes = producto.variantes ?? []
  const stockTotal = variantes.reduce((acc, v) => acc + v.stock, 0)

  // "Desde $X": precio más bajo entre las variantes con stock (o, si ninguna
  // tiene stock, entre todas) — siempre con el prefijo "Desde" para mantener
  // consistencia visual aunque haya una sola variante o todas cuesten igual.
  const variantesConStock = variantes.filter(v => v.stock > 0)
  const variantesParaPrecio = variantesConStock.length > 0 ? variantesConStock : variantes
  const opcionesPrecio = variantesParaPrecio.length > 0
    ? variantesParaPrecio.map(v => precioEfectivo(v, producto))
    : [precioEfectivo({ precio: null }, producto)]
  const { precio: precioFinal, tieneOferta } = opcionesPrecio.reduce((min, p) => (p.precio < min.precio ? p : min))
  const descuentoPct = tieneOferta
    ? Math.round((1 - precioFinal / Number(producto.precio)) * 100)
    : 0
  const cuotas = infoCuotas(precioFinal, producto.cuotas, producto.cuotasRecargo)

  // Rango de talles disponibles (solo variantes con stock)
  const tallesDisponibles = [...new Set(
    (producto.variantes ?? []).filter(v => v.stock > 0).map(v => v.talle)
  )].sort((a, b) => posicionTalle(a) - posicionTalle(b))
  const rangoTalles = tallesDisponibles.length === 0
    ? null
    : tallesDisponibles.length === 1
      ? `Talle ${tallesDisponibles[0]}`
      : `Talles ${tallesDisponibles[0]} al ${tallesDisponibles[tallesDisponibles.length - 1]}`

  return (
    <Link
      to={`/producto/${producto.id}`}
      className="group bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-600 transition-colors flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-800">
        <img
          src={imagenPrincipal}
          alt={producto.nombre}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${stockTotal === 0 ? 'opacity-50 grayscale' : ''}`}
          loading="lazy"
        />
        {tieneOferta && stockTotal > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{descuentoPct}%
          </span>
        )}
        {stockTotal === 0 && (
          <div className="absolute inset-0 bg-zinc-950/60 flex items-center justify-center">
            <span className="text-xs font-semibold text-zinc-400 bg-zinc-900/80 px-3 py-1 rounded-full">Sin stock</span>
          </div>
        )}
      </div>

      <div className={`p-3 flex flex-col gap-1 flex-1 ${stockTotal === 0 ? 'opacity-60' : ''}`}>
        {producto.colegio && (
          <span className="text-xs text-blue-400 font-medium">{producto.colegio.nombre}</span>
        )}
        <h3 className="text-sm font-medium text-zinc-100 line-clamp-2 leading-snug">
          {titleCase(producto.nombre)}
        </h3>
        <div className="mt-auto pt-2">
          {tieneOferta ? (
            <>
              <p className="text-base font-bold text-red-400">Desde {formatPrecio(precioFinal)}</p>
              <p className="text-xs text-zinc-600 line-through">{formatPrecio(producto.precio)}</p>
            </>
          ) : (
            <p className="text-base font-bold text-zinc-100">Desde {formatPrecio(precioFinal)}</p>
          )}
          {cuotas && (
            <p className="text-xs text-green-400">Desde {cuotas.texto}</p>
          )}
          {stockTotal > 0 && stockTotal < 5 ? (
            <p className="text-xs font-semibold text-amber-400 mt-0.5">¡Últimas unidades!</p>
          ) : rangoTalles ? (
            <p className="text-xs text-zinc-500 mt-0.5">{rangoTalles}</p>
          ) : null}
          <p className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1">
            <Truck className="w-3 h-3 flex-shrink-0" />
            <span>Envío gratis en Rosario</span>
          </p>
        </div>
      </div>
    </Link>
  )
}
