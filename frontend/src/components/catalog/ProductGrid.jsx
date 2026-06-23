import ProductCard from './ProductCard'
import Spinner from '../ui/Spinner'

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
      {productos.map(p => (
        <ProductCard key={p.id} producto={p} />
      ))}
    </div>
  )
}
