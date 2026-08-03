import ProductCard from './ProductCard'
import Spinner from '../ui/Spinner'
import { useRevelar } from '../../lib/useRevelar'

// El retardo se reinicia cada 4 tarjetas —el ancho de una fila en escritorio—
// para que la última de una grilla de 33 no espere un segundo entero.
const RETARDO_POR_TARJETA = 55
const TARJETAS_POR_FILA = 4

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
  if (cargando) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-10 h-10" />
      </div>
    )
  }

  if (!productos?.length) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg">No se encontraron productos</p>
        <p className="text-sm mt-1">Probá con otro filtro o búsqueda</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {productos.map((p, i) => (
        <TarjetaRevelada key={p.id} producto={p} indice={i} />
      ))}
    </div>
  )
}
