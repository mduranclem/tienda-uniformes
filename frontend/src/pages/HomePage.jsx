import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { colegiosApi, productosApi } from '../services/api'
import ProductGrid from '../components/catalog/ProductGrid'

export default function HomePage() {
  const [novedades, setNovedades] = useState([])
  const [colegios, setColegios] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    Promise.all([
      productosApi.listar({ limit: 8 }),
      colegiosApi.listar(),
    ])
      .then(([prods, cols]) => {
        setNovedades(prods.data ?? prods)
        setColegios(cols.data ?? cols)
      })
      .finally(() => setCargando(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
            Ropa escolar para tu colegio
          </h1>
          <p className="text-blue-100 text-lg sm:text-xl mb-8 max-w-xl mx-auto">
            Remeras, buzos y más. Encontrá los modelos de tu institución o elegí entre nuestros lisos.
          </p>
          <Link
            to="/catalogo"
            className="inline-block bg-white text-blue-700 font-bold px-8 py-3 rounded-full hover:bg-blue-50 transition-colors text-base"
          >
            Ver catálogo
          </Link>
        </div>
      </section>

      {/* Colegios */}
      {colegios.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Por colegio</h2>
          <div className="flex flex-wrap gap-2">
            {colegios.map(c => (
              <Link
                key={c.id}
                to={`/catalogo?colegioId=${c.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-700 transition-colors"
              >
                {c.logo && <img src={c.logo} alt="" className="w-5 h-5 rounded-full object-cover" />}
                {c.nombre}
              </Link>
            ))}
            <Link
              to="/catalogo?colegioId=lisos"
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-700 transition-colors"
            >
              Lisos
            </Link>
          </div>
        </section>
      )}

      {/* Novedades */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Novedades</h2>
          <Link to="/catalogo" className="text-sm text-blue-600 font-medium hover:underline">
            Ver todo →
          </Link>
        </div>
        <ProductGrid productos={novedades} cargando={cargando} />
      </section>
    </div>
  )
}
