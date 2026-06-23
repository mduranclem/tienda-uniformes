import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { productosApi } from '../services/api'
import { useCart } from '../context/CartContext'
import ImageGallery from '../components/product/ImageGallery'
import VariantSelector from '../components/product/VariantSelector'
import Spinner from '../components/ui/Spinner'
import { formatPrecio, calcularCuotas } from '../lib/utils'
import { ShoppingCart } from 'lucide-react'

export default function ProductoPage() {
  const { id } = useParams()
  const { dispatch } = useCart()
  const [producto, setProducto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [varianteSeleccionada, setVarianteSeleccionada] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)

  useEffect(() => {
    setCargando(true)
    productosApi.obtener(id)
      .then(r => {
        const prod = r.data ?? r
        setProducto(prod)
        const primera = prod.variantes?.find(v => v.stock > 0)
        setVarianteSeleccionada(primera ?? prod.variantes?.[0] ?? null)
      })
      .finally(() => setCargando(false))
  }, [id])

  function agregarAlCarrito() {
    if (!varianteSeleccionada) return
    dispatch({
      type: 'AGREGAR',
      item: {
        varianteId: varianteSeleccionada.id,
        productoId: producto.id,
        nombre: producto.nombre,
        talle: varianteSeleccionada.talle,
        color: varianteSeleccionada.color,
        precioUnit: Number(producto.precio),
        imagen: producto.imagenes?.[0]?.url ?? '/placeholder.png',
        cantidad,
      },
    })
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  if (cargando) {
    return <div className="flex justify-center py-20"><Spinner className="w-10 h-10" /></div>
  }

  if (!producto) {
    return <div className="text-center py-20 text-gray-500">Producto no encontrado.</div>
  }

  const stockVariante = varianteSeleccionada?.stock ?? 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Galería */}
        <ImageGallery imagenes={producto.imagenes} />

        {/* Info */}
        <div className="flex flex-col gap-4">
          {producto.colegio && (
            <span className="text-sm text-blue-600 font-medium">{producto.colegio.nombre}</span>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{producto.nombre}</h1>

          <div>
            <p className="text-3xl font-bold text-gray-900">{formatPrecio(producto.precio)}</p>
            <p className="text-sm text-gray-500 mt-0.5">3 cuotas de {calcularCuotas(producto.precio)}</p>
          </div>

          {producto.descripcion && (
            <p className="text-sm text-gray-600 leading-relaxed">{producto.descripcion}</p>
          )}

          {/* Selector de talle */}
          {producto.variantes?.length > 0 && (
            <VariantSelector
              variantes={producto.variantes}
              seleccionada={varianteSeleccionada}
              onChange={setVarianteSeleccionada}
            />
          )}

          {/* Cantidad */}
          {stockVariante > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Cantidad:</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setCantidad(c => Math.max(1, c - 1))}
                  className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded-l-lg"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-medium">{cantidad}</span>
                <button
                  onClick={() => setCantidad(c => Math.min(stockVariante, c + 1))}
                  className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded-r-lg"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-gray-400">({stockVariante} disponibles)</span>
            </div>
          )}

          {/* Botón agregar */}
          <button
            onClick={agregarAlCarrito}
            disabled={!varianteSeleccionada || stockVariante === 0}
            className={`flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-semibold text-base transition-colors ${
              stockVariante === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : agregado
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {stockVariante === 0 ? 'Sin stock' : agregado ? '¡Agregado!' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  )
}
