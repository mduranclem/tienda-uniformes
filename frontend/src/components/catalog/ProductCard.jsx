import { Link } from 'react-router-dom'
import { formatPrecio, titleCase, posicionTalle } from '../../lib/utils'
import FotoProducto from './FotoProducto'

// Precio efectivo de una variante: el propio (si tiene) o el del producto
// (con oferta si corresponde). Espeja la lógica de ProductoPage.
function precioEfectivo(variante, producto) {
  if (variante.precio != null) return { precio: Number(variante.precio), tieneOferta: false }
  const tieneOferta = producto.precioOferta && Number(producto.precioOferta) < Number(producto.precio)
  return { precio: tieneOferta ? Number(producto.precioOferta) : Number(producto.precio), tieneOferta }
}

// La foto manda: sin caja alrededor, la info queda debajo como texto. El envío
// gratis ya se anuncia una vez en la portada y en la ficha; repetirlo en cada
// tarjeta era ruido. Tampoco va "Desde": el precio es el mismo en todos los
// talles.
export default function ProductCard({ producto }) {
  const variantes = producto.variantes ?? []
  const stockTotal = variantes.reduce((acc, v) => acc + v.stock, 0)

  // Por si quedara alguna variante con precio propio, se muestra el menor
  // entre las que tienen stock.
  const variantesConStock = variantes.filter(v => v.stock > 0)
  const variantesParaPrecio = variantesConStock.length > 0 ? variantesConStock : variantes
  const opcionesPrecio = variantesParaPrecio.length > 0
    ? variantesParaPrecio.map(v => precioEfectivo(v, producto))
    : [precioEfectivo({ precio: null }, producto)]
  const { precio: precioFinal, tieneOferta } = opcionesPrecio.reduce((min, p) => (p.precio < min.precio ? p : min))
  const descuentoPct = tieneOferta
    ? Math.round((1 - precioFinal / Number(producto.precio)) * 100)
    : 0

  // Rango de talles disponibles (solo variantes con stock)
  const tallesDisponibles = [...new Set(
    variantes.filter(v => v.stock > 0).map(v => v.talle)
  )].sort((a, b) => posicionTalle(a) - posicionTalle(b))
  const rangoTalles = tallesDisponibles.length === 0
    ? null
    : tallesDisponibles.length === 1
      ? `Talle ${tallesDisponibles[0]}`
      : `Talles ${tallesDisponibles[0]} al ${tallesDisponibles[tallesDisponibles.length - 1]}`

  return (
    <Link
      to={`/producto/${producto.id}`}
      className="group flex w-full flex-col rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-950"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900">
        <FotoProducto
          url={producto.imagenes?.[0]?.url}
          alt={producto.nombre}
          sinStock={stockTotal === 0}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        {tieneOferta && stockTotal > 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
            -{descuentoPct}%
          </span>
        )}
        {stockTotal === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60">
            <span className="rounded-full bg-zinc-900/90 px-3 py-1 text-xs font-semibold text-zinc-300">Sin stock</span>
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col px-0.5 pt-3 ${stockTotal === 0 ? 'opacity-60' : ''}`}>
        {producto.colegio && (
          <span className="line-clamp-1 text-xs font-medium text-blue-400">
            {titleCase(producto.colegio.nombre)}
          </span>
        )}
        <h3 className="mt-0.5 line-clamp-2 text-sm leading-snug text-zinc-200 transition-colors group-hover:text-white">
          {titleCase(producto.nombre)}
        </h3>

        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <p className={`text-base font-bold tracking-tight sm:text-lg ${tieneOferta ? 'text-red-400' : 'text-zinc-50'}`}>
            {formatPrecio(precioFinal)}
          </p>
          {tieneOferta && (
            <p className="text-xs text-zinc-500 line-through">{formatPrecio(producto.precio)}</p>
          )}
        </div>
        {stockTotal > 0 && stockTotal < 5 ? (
          <p className="mt-0.5 text-xs font-semibold text-amber-400">Últimas unidades</p>
        ) : rangoTalles ? (
          <p className="mt-0.5 text-xs text-zinc-500">{rangoTalles}</p>
        ) : null}
      </div>
    </Link>
  )
}
