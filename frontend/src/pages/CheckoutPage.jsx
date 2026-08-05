import FotoProducto from '../components/catalog/FotoProducto'
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { entregasApi, enviosApi, ordenesApi, cuponesApi, primeraCompraApi } from '../services/api'
import { formatPrecio, esZonaLocal, costoEnvioLocal, UNIDADES_ENVIO_LOCAL_GRATIS } from '../lib/utils'
import Spinner from '../components/ui/Spinner'
import { ChevronLeft, Truck, MapPin, Tag, X, CreditCard, Banknote } from 'lucide-react'

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
  const [metodoPago, setMetodoPago] = useState('mercadopago')
  const [agenda, setAgenda] = useState(null)
  const [cotizacion, setCotizacion] = useState(null)
  const [cotizando, setCotizando] = useState(false)
  const [errorCotizacion, setErrorCotizacion] = useState('')

  const [form, setForm] = useState({
    nombre: usuario?.nombre ?? '',
    email: usuario?.email ?? '',
    telefono: '',
    calle: '',
    numero: '',
    piso: '',
    ciudad: '',
    cp: '',
    entregaFecha: '',
    entregaFranja: '',
  })

  useEffect(() => {
    if (!items.length) { navigate('/carrito', { replace: true }); return }
    entregasApi.listar()
      .then(data => {
        setEntregas(data)
        if (data.length > 0) setEntregaId(data[0].id)
      })
      .finally(() => setCargando(false))
    // Los días hábiles los calcula el backend, para que el checkout ofrezca
    // exactamente los mismos que después valida al crear la orden.
    entregasApi.agenda().then(setAgenda).catch(() => {})
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
  // Reparto propio en Rosario y alrededores: precio fijo, gratis desde dos
  // unidades. El backend recalcula lo mismo; esto es solo para mostrar.
  //
  // Manda la opción elegida y no la ciudad escrita: el cliente elige el envío
  // antes de cargar la dirección, y mirar la ciudad hacía que el resumen
  // cobrara los $5.000 incluso llevando dos prendas. Que la dirección
  // corresponda a la zona lo controla `zonaNoCoincide`, que bloquea la compra.
  const envioLocal = esEnvio && Boolean(entregaSeleccionada?.soloRosario)
  const unidades = items.reduce((acc, i) => acc + i.cantidad, 0)
  const faltanParaEnvioGratis = Math.max(0, UNIDADES_ENVIO_LOCAL_GRATIS - unidades)
  // Entregas marcadas como "cotizado": el precio sale del CP y el peso, no de un
  // costo fijo. La zona local se resuelve antes y nunca llega a cotizarse.
  const envioCotizado = esEnvio && Boolean(entregaSeleccionada?.cotizado) && !envioLocal
  const costoEnvio = envioLocal
    ? costoEnvioLocal(unidades, entregaSeleccionada?.costo ?? 0)
    : envioCotizado
      ? Number(cotizacion?.precio ?? 0)
      : Number(entregaSeleccionada?.costo ?? 0)
  // Sin cotización no se puede comprar: es preferible perder la venta a
  // despachar al interior cobrando $0.
  const faltaCotizacion = envioCotizado && (cotizando || !cotizacion)
  // Solo se coordina día y horario en las entregas que hace la tienda. Los
  // envíos al interior los reparte Andreani en su propia ventana.
  const coordinaEntrega = esEnvio && Boolean(entregaSeleccionada?.soloRosario)
  const faltaCoordinar = coordinaEntrega && (!form.entregaFecha || !form.entregaFranja)
  // Envío fuera de Rosario sin tarifas cargadas: se acuerda el costo después,
  // por WhatsApp. Dentro de Rosario siempre es gratis y no entra acá.
  const envioACotizar = esEnvio && !entregaSeleccionada?.soloRosario && !entregaSeleccionada?.cotizado
  // La dirección tiene que corresponder a la opción elegida: cada una cubre una
  // zona con precio distinto.
  const ciudadCargada = form.ciudad.trim().length > 0
  const zonaNoCoincide = esEnvio && ciudadCargada && (
    entregaSeleccionada?.soloRosario !== esZonaLocal(form.ciudad)
  )
  // Efectivo solo si pasa por el local: con envío no hay dónde cobrarle.
  const puedePagarEfectivo = entregaSeleccionada?.tipo === 'RETIRO'
  // Las dos promos de la casa valen 20% y NO se acumulan: se aplica una sola.
  // Este cálculo es solo para mostrar; el que vale es el del servidor
  // (backend/src/lib/descuentos.js), que es el que arma el total de la orden.
  const retiraEnLocal = entregaSeleccionada?.tipo === 'RETIRO'
  const descuentoPromo = (esPrimeraCompra || retiraEnLocal) ? Math.round(totalPrecio * 20 / 100) : 0
  // Con las dos activas se muestra la de bienvenida, que es la que el cliente
  // ya venía viendo desde el banner de arriba.
  const motivoPromo = esPrimeraCompra ? 'primera compra' : 'retiro en el local'
  const descuentoCupon = cupon?.descuento ?? 0
  const descuento = descuentoPromo + descuentoCupon
  const total = totalPrecio + costoEnvio - descuento

  // Verificar primera compra cuando el email cambia (con delay)
  useEffect(() => {
    if (!form.email || !form.email.includes('@')) { setEsPrimeraCompra(false); return }
    const t = setTimeout(() => {
      primeraCompraApi.verificar(form.email).then(r => setEsPrimeraCompra(r.aplica)).catch(() => {})
    }, 600)
    return () => clearTimeout(t)
  }, [form.email])

  // Cotiza el envío cuando cambia el CP. Mismo patrón de guarda `cancelado` que
  // CatalogoPage: sin él, una respuesta lenta de un CP viejo puede pisar a la
  // del CP que el cliente terminó de escribir, y mostrar un precio equivocado.
  useEffect(() => {
    if (!envioCotizado) {
      setCotizacion(null); setErrorCotizacion(''); setCotizando(false)
      return
    }
    if (!/\d{4}/.test(form.cp.trim())) {
      setCotizacion(null); setErrorCotizacion(''); setCotizando(false)
      return
    }

    let cancelado = false
    setCotizando(true)
    setErrorCotizacion('')

    const t = setTimeout(() => {
      enviosApi.cotizar({
        cp: form.cp.trim(),
        ciudad: form.ciudad,
        items: items.map(i => ({ varianteId: i.varianteId, cantidad: i.cantidad })),
      })
        .then(r => { if (!cancelado) setCotizacion(r.opciones?.[0] ?? null) })
        .catch(err => {
          if (cancelado) return
          setCotizacion(null)
          setErrorCotizacion(err.message)
        })
        .finally(() => { if (!cancelado) setCotizando(false) })
    }, 500)

    return () => { cancelado = true; clearTimeout(t) }
  }, [envioCotizado, form.cp, form.ciudad, items])

  // Si cambia a envío a domicilio, el efectivo deja de ser una opción válida.
  useEffect(() => {
    if (!puedePagarEfectivo && metodoPago === 'efectivo') setMetodoPago('mercadopago')
  }, [puedePagarEfectivo, metodoPago])

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
    if (envioCotizado && !/\d{4}/.test(form.cp.trim())) {
      setError('Ingresá tu código postal para calcular el envío.'); return
    }
    if (faltaCotizacion) {
      setError(errorCotizacion || 'Esperá a que terminemos de calcular el envío.'); return
    }
    if (zonaNoCoincide) {
      setError(entregaSeleccionada?.soloRosario
        ? 'Esa dirección está fuera de Rosario. Elegí "Envío al resto del país".'
        : 'Para direcciones de Rosario elegí "Envío a domicilio en Rosario", que es gratis.')
      return
    }
    if (faltaCoordinar) {
      setError('Elegí el día y el horario en que querés recibir el pedido.'); return
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
        metodoPago,
        entregaFecha: coordinaEntrega ? form.entregaFecha : null,
        entregaFranja: coordinaEntrega ? form.entregaFranja : null,
        cuponId: cupon?.cuponId ?? null,
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

      {/* Compra como invitado por defecto; login opcional */}
      {!sesion && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
          <p className="text-sm text-zinc-300">
            Estás comprando como invitado — solo necesitamos tu email y los datos de entrega.
          </p>
          <Link
            to="/login?redirect=/checkout"
            className="text-sm text-blue-400 font-medium hover:text-blue-300 whitespace-nowrap"
          >
            ¿Ya tenés cuenta? Ingresá
          </Link>
        </div>
      )}

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
                        {e.tipo === 'RETIRO' && (
                          <p className="mt-0.5 text-xs font-semibold text-violet-300">
                            20% OFF retirando
                          </p>
                        )}
                        {e.soloRosario && (
                          <p className="mt-0.5 text-xs font-semibold text-emerald-400">
                            {unidades >= UNIDADES_ENVIO_LOCAL_GRATIS
                              ? `Gratis por llevar ${unidades} prendas`
                              : `Gratis desde ${UNIDADES_ENVIO_LOCAL_GRATIS} prendas`}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-zinc-200">
                        {e.tipo === 'RETIRO' || e.soloRosario
                          ? ((e.soloRosario ? costoEnvioLocal(unidades, e.costo) : Number(e.costo)) === 0
                              ? <span className="bg-green-500/25 border border-green-400/50 text-green-300 text-xs font-bold px-2 py-0.5 rounded-md">Gratis</span>
                              : formatPrecio(e.costo))
                          : e.cotizado
                            ? (entregaId === e.id && cotizacion
                                ? formatPrecio(cotizacion.precio)
                                : <span className="font-normal text-zinc-500">Según tu CP</span>)
                            : <span className="font-normal text-amber-400">A cotizar</span>}
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
                      className="input w-full" placeholder="Rosario" required={esEnvio} />
                    {zonaNoCoincide ? (
                      <p className="mt-1 text-xs font-medium text-red-400">
                        {entregaSeleccionada?.soloRosario
                          ? 'Esa dirección está fuera de la zona de reparto. Elegí "Envío al resto del país".'
                          : 'Estás en la zona de reparto: elegí "Envío a domicilio en Rosario y alrededores".'}
                      </p>
                    ) : (
                      <>
                        {entregaSeleccionada?.soloRosario && ciudadCargada && (
                          faltanParaEnvioGratis > 0 ? (
                            // Decirlo acá, con la dirección ya cargada, es donde
                            // todavía puede agregar una prenda sin perder el hilo.
                            <p className="mt-1 text-xs font-medium text-amber-400">
                              Agregá {faltanParaEnvioGratis} prenda más y el envío te sale gratis
                            </p>
                          ) : (
                            <p className="mt-1 text-xs font-medium text-emerald-400">
                              🎉 Envío gratis por llevar {unidades} prendas
                            </p>
                          )
                        )}
                        {/* Antes esperaba a que cargaran la ciudad, así que la
                            opción decía "A cotizar" sin explicar nada. */}
                        {envioACotizar && (
                          <p className="mt-1 text-xs text-amber-400">
                            El envío al interior se cotiza aparte: te pasamos el costo
                            por WhatsApp antes de despacharlo.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Código postal {envioCotizado && '*'}
                    </label>
                    <input type="text" value={form.cp} onChange={e => setField('cp', e.target.value)}
                      className="input w-full" placeholder="1043" required={envioCotizado} />
                    {envioCotizado && cotizando && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
                        <Spinner className="w-3 h-3" /> Calculando envío...
                      </p>
                    )}
                    {envioCotizado && !cotizando && cotizacion && (
                      <p className="mt-1 text-xs text-zinc-400">
                        {cotizacion.nombre}: <span className="font-medium text-zinc-200">{formatPrecio(cotizacion.precio)}</span>
                      </p>
                    )}
                    {envioCotizado && !cotizando && errorCotizacion && (
                      <p className="mt-1 text-xs text-amber-400">
                        {errorCotizacion} Escribinos por WhatsApp y lo resolvemos.
                      </p>
                    )}
                  </div>

                  {/* Coordinación de la entrega: solo en Rosario, que es donde
                      reparte la tienda. Al interior lo lleva Andreani. */}
                  {coordinaEntrega && (
                    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 mt-1 border-t border-zinc-800">
                      <p className="sm:col-span-2 text-xs text-zinc-400">
                        ¿Cuándo querés recibirlo? Entregamos de lunes a viernes, de 10 a 16 hs.
                      </p>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Día *</label>
                        <select
                          value={form.entregaFecha}
                          onChange={e => setField('entregaFecha', e.target.value)}
                          className="input w-full"
                          required={coordinaEntrega}
                        >
                          <option value="">Elegí un día</option>
                          {(agenda?.fechas ?? []).map(f => (
                            <option key={f.valor} value={f.valor}>{f.etiqueta}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Horario *</label>
                        <select
                          value={form.entregaFranja}
                          onChange={e => setField('entregaFranja', e.target.value)}
                          className="input w-full"
                          required={coordinaEntrega}
                        >
                          <option value="">Elegí un horario</option>
                          {(agenda?.franjas ?? []).map(f => (
                            <option key={f.valor} value={f.valor}>{f.etiqueta}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Forma de pago */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-base font-semibold text-zinc-100 mb-4">Forma de pago</h2>
              <div className="flex flex-col gap-2">
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  metodoPago === 'mercadopago' ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 hover:border-zinc-600'
                }`}>
                  <input type="radio" name="metodoPago" value="mercadopago"
                    checked={metodoPago === 'mercadopago'}
                    onChange={() => setMetodoPago('mercadopago')}
                    className="accent-blue-500" />
                  <CreditCard className="w-4 h-4 text-zinc-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-100">Mercado Pago</p>
                    <p className="text-xs text-zinc-500">Tarjeta, débito o dinero en cuenta. Hasta 3 cuotas sin interés.</p>
                  </div>
                </label>

                {/* Solo con retiro: con envío a domicilio no hay dónde cobrar. */}
                {puedePagarEfectivo && (
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    metodoPago === 'efectivo' ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 hover:border-zinc-600'
                  }`}>
                    <input type="radio" name="metodoPago" value="efectivo"
                      checked={metodoPago === 'efectivo'}
                      onChange={() => setMetodoPago('efectivo')}
                      className="accent-blue-500" />
                    <Banknote className="w-4 h-4 text-zinc-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-100">Efectivo al retirar</p>
                      <p className="text-xs text-zinc-500">Pagás cuando pasás a buscar el pedido por el local.</p>
                    </div>
                  </label>
                )}
              </div>

              {!puedePagarEfectivo && esEnvio && (
                <p className="mt-3 text-xs text-zinc-500">
                  El pago en efectivo está disponible solo si retirás por uno de nuestros locales.
                </p>
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
                    <FotoProducto url={item.imagen} alt={item.nombre}
                      className="w-12 h-12 shrink-0 rounded-lg object-cover bg-zinc-800" />
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

              {/* Promo de la casa: bienvenida o retiro, nunca las dos */}
              {descuentoPromo > 0 && (
                <div className="mb-3 flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-lg px-3 py-2">
                  <span className="text-lg">🎉</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-violet-300">
                      ¡20% OFF — {esPrimeraCompra ? 'Primera compra' : 'Retirando en el local'}!
                    </p>
                    <p className="text-xs text-violet-400">
                      {esPrimeraCompra && retiraEnLocal
                        ? 'Los descuentos no se acumulan: se aplica uno solo'
                        : 'Descuento aplicado automáticamente'}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-violet-300">− {formatPrecio(descuentoPromo)}</span>
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
                {descuentoPromo > 0 && (
                  <div className="flex justify-between text-violet-400">
                    <span>20% {motivoPromo}</span>
                    <span>− {formatPrecio(descuentoPromo)}</span>
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
                  <span>
                    {cotizando ? 'Calculando...'
                      : faltaCotizacion ? '—'
                      : envioACotizar ? <span className="text-amber-400">A cotizar</span>
                      : costoEnvio === 0 ? 'Gratis'
                      : formatPrecio(costoEnvio)}
                  </span>
                </div>
                {/* El total de abajo no incluye el flete. Decirlo al lado del
                    número, que es donde el cliente mira. */}
                {envioACotizar && (
                  <p className="text-xs leading-snug text-amber-400/90">
                    El total no incluye el envío: te pasamos el costo por WhatsApp
                    antes de despacharlo.
                  </p>
                )}
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
                disabled={enviando || !entregaId || faltaCotizacion || faltaCoordinar || zonaNoCoincide}
                className="mt-4 w-full btn-primario flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviando ? <><Spinner className="w-4 h-4" /> Procesando...</> : 'Confirmar pedido'}
              </button>

              <p className="mt-2 text-xs text-center text-zinc-600">
                {metodoPago === 'efectivo'
                  ? 'Reservamos tu pedido y pagás al retirarlo'
                  : 'Vas a poder pagar en el siguiente paso'}
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
