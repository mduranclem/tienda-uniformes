import { Link } from 'react-router-dom'
import { Truck } from 'lucide-react'
import { formatPrecio, titleCase, infoCuotas, posicionTalle } from '../../lib/utils'
import FotoProducto from './FotoProducto'

// Precio efectivo de una variante: el propio (si tiene) o el del producto
// (con oferta si corresponde). Espeja la lógica de ProductoPage.
function precioEfectivo(variante, producto) {
  if (variante.precio != null) return { precio: Number(variante.precio), tieneOferta: false }
  const tieneOferta = producto.precioOferta && Number(producto.precioOferta) < Number(producto.precio)
  return { precio: tieneOferta ? Number(producto.precioOferta) : Number(producto.precio), tieneOferta }
}

export default function ProductCard({ producto }) {
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
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900
                 shadow-[0_1px_2px_rgba(0,0,0,0.4)]
                 transition-[transform,box-shadow,border-color] duration-300 ease-out
                 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.8)]
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-800">
        <FotoProducto
          url={producto.imagenes?.[0]?.url}
          alt={producto.nombre}
          sinStock={stockTotal === 0}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {tieneOferta && stockTotal > 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
            −{descuentoPct}%
          </span>
        )}
        {stockTotal === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/70">
            <span className="rounded-full bg-zinc-900/90 px-3 py-1 text-xs font-semibold text-zinc-300">Sin stock</span>
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col p-3.5 ${stockTotal === 0 ? 'opacity-60' : ''}`}>
        {/* Colegio y nombre son una sola unidad: van juntos y separados del precio */}
        {producto.colegio && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-400">
            {producto.colegio.nombre}
          </span>
        )}
        <h3 className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-zinc-100">
          {titleCase(producto.nombre)}
        </h3>

        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex items-baseline gap-2">
            <p className={`text-lg font-bold tracking-tight ${tieneOferta ? 'text-red-400' : 'text-zinc-50'}`}>
              Desde {formatPrecio(precioFinal)}
            </p>
            {tieneOferta && (
              <p className="text-xs text-zinc-500 line-through">{formatPrecio(producto.precio)}</p>
            )}
          </div>

          {cuotas && (
            <p className="inline-flex w-fit rounded-md border border-green-400/50 bg-green-500/25 px-2 py-0.5 text-[11px] font-bold text-green-300">
              {cuotas.textoCorto}
            </p>
          )}

          {stockTotal > 0 && stockTotal < 5 ? (
            <p className="text-xs font-semibold text-amber-400">¡Últimas unidades!</p>
          ) : rangoTalles ? (
            <p className="text-xs text-zinc-500">{rangoTalles}</p>
          ) : null}

          <p className="mt-auto flex items-center gap-1.5 pt-1 text-[11px] font-medium text-emerald-400">
            <Truck className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Envío gratis desde 2 prendas</span>
          </p>
        </div>
      </div>
    </Link>
  )
}
