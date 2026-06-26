import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { entregasApi, ordenesApi, cuponesApi, primeraCompraApi } from '../services/api'
import { formatPrecio } from '../lib/utils'
import Spinner from '../components/ui/Spinner'
import { ChevronLeft, Truck, MapPin, Tag, X } from 'lucide-react'

export default function CheckoutPage() {
  const { items, totalPrecio, dispatch } = useCart()
  const { usuario, sesion } = useAuth()
  const navigate = useNavigate()

  const [entregas, setEntregas] = useState([])
  const [entregaId, setEntregaId] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [codigoInput, setCodigoInput] = useState('')
  const [cupon, setCupon] = useState(null)
  const [cuponError, setCuponError] = useState('')
  const [validandoCupon, setValidandoCupon] = useState(false)
  const [esPrimeraCompra, setEsPrimeraCompra] = useState(false)

  const [form, setForm] = useState({
    nombre: usuario?.nombre ?? '',
    email: usuario?.email ?? '',
    telefono: '',
    calle: '',
    numero: '',
    piso: '',
    ciudad: '',
    cp: '',
  })

  useEffect(() => {
    if (!items.length) { navigate('/carrito', { replace: true }); return }
    entregasApi.listar()
      .then(data => {
        setEntregas(data)
        if (data.length > 0) setEntregaId(data[0].id)
      })
      .finally(() => setCargando(false))
  }, [])

  // Actualiza nombre/email si el usuario carga después
  useEffect(() => {
    if (usuario) {
      setForm(f => ({
        ...f,
        nombre: f.nombre || usuario.nombre || '',
        email: f.email || usuario.email || '',
      }))
    }
  }, [usuario])

  const entregaSeleccionada = entregas.find(e => e.id === entregaId)
  const esEnvio = entregaSeleccionada?.tipo === 'ENVIO'
  const costoEnvio = Number(entregaSeleccionada?.costo ?? 0)
  const descuentoBienvenida = esPrimeraCompra ? Math.round(totalPrecio * 20 / 100) : 0
  const descuentoCupon = cupon?.descuento ?? 0
  const descuento = descuentoBienvenida + descuentoCupon
  const total = totalPrecio + costoEnvio - descuento

  // Verificar primera compra cuando el email cambia (con delay)
  useEffect(() => {
    if (!form.email || !form.email.includes('@')) { setEsPrimeraCompra(false); return }
    const t = setTimeout(() => {
      primeraCompraApi.verificar(form.email).then(r => setEsPrimeraCompra(r.aplica)).catch(() => {})
    }, 600)
    return () => clearTimeout(t)
  }, [form.email])

  async function aplicarCupon() {
    if (!codigoInput.trim()) return
    setCuponError(''); setValidandoCupon(true)
    try {
      const colegioIds = [...new Set(items.map(i => i.colegioId).filter(Boolean))]
      const productoIds = [...new Set(items.map(i => i.productoId).filter(Boolean))]
      const itemsSubtotales = items.map(i => ({ productoId: i.productoId, colegioId: i.colegioId ?? null, subtotal: i.precioUnit * i.cantidad }))
      const result = await cuponesApi.validar(codigoInput.trim(), totalPrecio, colegioIds, productoIds, itemsSubtotales)
      setCupon(result)
      setCodigoInput('')
    } catch (err) {
      setCuponError(err.message)
    } finally {
      setValidandoCupon(false)
    }
  }

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.nombre.trim() || !form.email.trim()) {
      setError('Nombre y email son obligatorios.'); return
    }
    if (!form.telefono.trim()) {
      setError('El número de WhatsApp es obligatorio.'); return
    }
    if (esEnvio && (!form.calle.trim() || !form.ciudad.trim())) {
      setError('Completá la dirección de envío.'); return
    }

    setEnviando(true)
    try {
      const payload = {
        items: items.map(i => ({
          varianteId: i.varianteId,
          productoId: i.productoId,
          cantidad: i.cantidad,
          precioUnit: i.precioUnit,
        })),
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono || null,
        entregaId,
        cuponId: cupon?.cuponId ?? null,
        aplicarDescuentoBienvenida: esPrimeraCompra,
        domicilio: esEnvio ? {
          calle: form.calle,
          numero: form.numero,
          piso: form.piso || null,
          ciudad: form.ciudad,
          cp: form.cp,
        } : null,
      }

      const { id } = await ordenesApi.crear(payload, sesion?.access_token ?? null)
      dispatch({ type: 'VACIAR' })
      navigate(`/confirmacion/${id}`, { replace: true })
    } catch (err) {
      setError(err.message || 'Ocurrió un error al procesar tu pedido.')
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) {
    return <div className="flex justify-center py-20"><Spinner className="w-10 h-10" /></div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link to="/carrito" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors mb-6">
        <ChevronLeft className="w-4 h-4" />
        Volver al carrito
      </Link>

      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Finalizar compra</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Columna izquierda — formulario */}
          <div className="lg:col-span-3 flex flex-col gap-5">

            {/* Datos personales */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-base font-semibold text-zinc-100 mb-4">Tus datos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-zinc-400 mb-1">Nombre completo *</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setField('nombre', e.target.value)}
                    className="input w-full"
                    placeholder="Juan García"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setField('email', e.target.value)}
                    className="input w-full"
                    placeholder="juan@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">WhatsApp *</label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={e => setField('telefono', e.target.value)}
                    className="input w-full"
                    placeholder="11 1234-5678"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Entrega */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-base font-semibold text-zinc-100 mb-4">Forma de entrega</h2>
              {entregas.length === 0 ? (
                <p className="text-sm text-zinc-500">No hay opciones de entrega configuradas.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {entregas.map(e => (
                    <label
                      key={e.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        entregaId === e.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="entrega"
                        value={e.id}
                        checked={entregaId === e.id}
                        onChange={() => setEntregaId(e.id)}
                        className="accent-blue-500"
                      />
                      {e.tipo === 'ENVIO'
                        ? <Truck className="w-4 h-4 text-zinc-400 shrink-0" />
                        : <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                      }
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-100">{e.nombre}</p>
                      </div>
                      <span className="text-sm font-semibold text-zinc-200">
                        {Number(e.costo) === 0 ? 'Gratis' : formatPrecio(e.costo)}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Dirección (solo si es envío) */}
              {esEnvio && (
                <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-zinc-400 mb-1">Calle *</label>
                    <input type="text" value={form.calle} onChange={e => setField('calle', e.target.value)}
                      className="input w-full" placeholder="Av. Corrientes" required={esEnvio} />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Número *</label>
                    <input type="text" value={form.numero} onChange={e => setField('numero', e.target.value)}
                      className="input w-full" placeholder="1234" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Piso / Depto</label>
                    <input type="text" value={form.piso} onChange={e => setField('piso', e.target.value)}
                      className="input w-full" placeholder="3° B" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Ciudad *</label>
                    <input type="text" value={form.ciudad} onChange={e => setField('ciudad', e.target.value)}
                      className="input w-full" placeholder="Buenos Aires" required={esEnvio} />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Código postal</label>
                    <input type="text" value={form.cp} onChange={e => setField('cp', e.target.value)}
                      className="input w-full" placeholder="1043" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha — resumen */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sticky top-20">
              <h2 className="text-base font-semibold text-zinc-100 mb-4">Resumen</h2>

              <div className="flex flex-col gap-3 mb-4">
                {items.map(item => (
                  <div key={item.varianteId} className="flex gap-3 items-center">
                    <img src={item.imagen} alt={item.nombre}
                      className="w-12 h-12 rounded-lg object-cover bg-zinc-800 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-200 leading-tight truncate">{item.nombre}</p>
                      <p className="text-xs text-zinc-500">
                        T: {item.talle}{item.color ? ` · ${item.color}` : ''} · x{item.cantidad}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-zinc-200 shrink-0">
                      {formatPrecio(item.precioUnit * item.cantidad)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Descuento bienvenida */}
              {esPrimeraCompra && (
                <div className="mb-3 flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-lg px-3 py-2">
                  <span className="text-lg">🎉</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-violet-300">¡20% OFF — Primera compra!</p>
                    <p className="text-xs text-violet-400">Descuento aplicado automáticamente</p>
                  </div>
                  <span className="text-sm font-bold text-violet-300">− {formatPrecio(descuentoBienvenida)}</span>
                </div>
              )}

              {/* Cupón */}
              {cupon ? (
                <div className="mb-3 flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-sm font-mono font-bold text-green-400">{cupon.codigo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-400">− {formatPrecio(cupon.descuento)}</span>
                    <button onClick={() => setCupon(null)} className="text-zinc-500 hover:text-zinc-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-3">
                  <div className="flex gap-2">
                    <input
                      value={codigoInput}
                      onChange={e => { setCodigoInput(e.target.value.toUpperCase()); setCuponError('') }}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), aplicarCupon())}
                      placeholder="Código de descuento"
                      className="input flex-1 text-sm"
                    />
                    <button type="button" onClick={aplicarCupon} disabled={validandoCupon || !codigoInput.trim()}
                      className="btn-secundario text-sm px-3 disabled:opacity-50">
                      {validandoCupon ? '...' : 'Aplicar'}
                    </button>
                  </div>
                  {cuponError && <p className="mt-1 text-xs text-red-400">{cuponError}</p>}
                </div>
              )}

              <div className="border-t border-zinc-800 pt-3 flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span>{formatPrecio(totalPrecio)}</span>
                </div>
                {descuentoBienvenida > 0 && (
                  <div className="flex justify-between text-violet-400">
                    <span>20% primera compra</span>
                    <span>− {formatPrecio(descuentoBienvenida)}</span>
                  </div>
                )}
                {descuentoCupon > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Cupón {cupon.codigo}</span>
                    <span>− {formatPrecio(descuentoCupon)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Envío</span>
                  <span>{costoEnvio === 0 ? 'Gratis' : formatPrecio(costoEnvio)}</span>
                </div>
                <div className="flex justify-between font-bold text-zinc-100 text-base mt-1">
                  <span>Total</span>
                  <span>{formatPrecio(total)}</span>
                </div>
              </div>

              {error && (
                <p className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando || !entregaId}
                className="mt-4 w-full btn-primario flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviando ? <><Spinner className="w-4 h-4" /> Procesando...</> : 'Confirmar pedido'}
              </button>

              <p className="mt-2 text-xs text-center text-zinc-600">
                Vas a poder pagar en el siguiente paso
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
