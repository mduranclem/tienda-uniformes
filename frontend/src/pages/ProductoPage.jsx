import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { productosApi } from '../services/api'
import { useCart } from '../context/CartContext'
import ImageGallery from '../components/product/ImageGallery'
import VariantSelector from '../components/product/VariantSelector'
import Spinner from '../components/ui/Spinner'
import { formatPrecio, titleCase } from '../lib/utils'
import { ShoppingCart, ChevronLeft } from 'lucide-react'

export default function ProductoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
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
        precioUnit: Number(producto.precioOferta && Number(producto.precioOferta) < Number(producto.precio)
          ? producto.precioOferta : producto.precio),
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
    return <div className="text-center py-20 text-zinc-500">Producto no encontrado.</div>
  }

  const stockVariante = varianteSeleccionada?.stock ?? 0
  const tieneOferta = producto.precioOferta && Number(producto.precioOferta) < Number(producto.precio)
  const precioFinal = tieneOferta ? Number(producto.precioOferta) : Number(producto.precio)
  const descuentoPct = tieneOferta
    ? Math.round((1 - Number(producto.precioOferta) / Number(producto.precio)) * 100)
    : 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Galería */}
        <ImageGallery imagenes={producto.imagenes} colorFiltro={varianteSeleccionada?.color ?? null} />

        {/* Info */}
        <div className="flex flex-col gap-4">
          {producto.colegio && (
            <span className="text-sm text-blue-400 font-medium">{producto.colegio.nombre}</span>
          )}
          <h1 className="text-2xl font-bold text-zinc-100">{titleCase(producto.nombre)}</h1>

          {/* Precio */}
          <div>
            {tieneOferta ? (
              <>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-red-400">{formatPrecio(producto.precioOferta)}</p>
                  <span className="bg-red-500/20 text-red-400 text-sm font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                    -{descuentoPct}%
                  </span>
                </div>
                <p className="text-sm text-zinc-600 line-through">{formatPrecio(producto.precio)}</p>
              </>
            ) : (
              <p className="text-3xl font-bold text-zinc-100">{formatPrecio(producto.precio)}</p>
            )}
            {producto.cuotas && (
              <p className="text-sm text-zinc-500 mt-0.5">
                {producto.cuotas} cuotas de {formatPrecio(precioFinal / producto.cuotas)}
              </p>
            )}
          </div>

          {producto.descripcion && (
            <p className="text-sm text-zinc-400 leading-relaxed">{producto.descripcion}</p>
          )}

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
              <span className="text-sm font-medium text-zinc-300">Cantidad:</span>
              <div className="flex items-center border border-zinc-700 rounded-lg bg-zinc-900">
                <button
                  onClick={() => setCantidad(c => Math.max(1, c - 1))}
                  className="w-9 h-9 flex items-center justify-center text-zinc-300 hover:bg-zinc-800 rounded-l-lg"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-medium text-zinc-100">{cantidad}</span>
                <button
                  onClick={() => setCantidad(c => Math.min(stockVariante, c + 1))}
                  className="w-9 h-9 flex items-center justify-center text-zinc-300 hover:bg-zinc-800 rounded-r-lg"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-zinc-600">({stockVariante} disponibles)</span>
            </div>
          )}

          {/* Botón */}
          <button
            onClick={agregarAlCarrito}
            disabled={!varianteSeleccionada || stockVariante === 0}
            className={`flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-semibold text-base transition-colors ${
              stockVariante === 0
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : agregado
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-500'
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
