import ProductCard from './ProductCard'
import { useRevelar } from '../../lib/useRevelar'

// El retardo se reinicia cada 4 tarjetas —el ancho de una fila en escritorio—
// para que la última de una grilla de 33 no espere un segundo entero.
const RETARDO_POR_TARJETA = 55
const TARJETAS_POR_FILA = 4

const GRILLA = 'grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-10'

function TarjetaRevelada({ producto, indice }) {
  const ref = useRevelar()
  return (
    <div
      ref={ref}
      className="revelar flex"
      style={{ '--retardo': `${(indice % TARJETAS_POR_FILA) * RETARDO_POR_TARJETA}ms` }}
    >
      <ProductCard producto={producto} />
    </div>
  )
}

export default function ProductGrid({ productos, cargando }) {
  // Mientras carga, la forma de la grilla y no un spinner: la página no salta
  // cuando llegan los productos.
  if (cargando) {
    return (
      <div className={GRILLA} aria-busy="true" aria-label="Cargando productos">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2.5">
            <div className="aspect-square animate-pulse rounded-2xl bg-zinc-900" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-900" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-900" />
          </div>
        ))}
      </div>
    )
  }

  if (!productos?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-16 text-center">
        <p className="text-base font-medium text-zinc-300">No encontramos productos</p>
        <p className="mt-1 text-sm text-zinc-500">Probá con otro filtro o búsqueda</p>
      </div>
    )
  }

  return (
    <div className={GRILLA}>
      {productos.map((p, i) => (
        <TarjetaRevelada key={p.id} producto={p} indice={i} />
      ))}
    </div>
  )
}
