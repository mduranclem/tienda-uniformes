import FotoProducto from '../components/catalog/FotoProducto'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ordenesApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatPrecio, esRosario } from '../lib/utils'
import { whatsappUrl, WHATSAPP_LEGIBLE } from '../lib/contacto'
import { trackPurchase } from '../lib/metaPixel'
import Spinner from '../components/ui/Spinner'
import { CheckCircle2, Package, XCircle, Banknote, Landmark, Copy, Check, MessageCircle } from 'lucide-react'

// venceEl es un instante: se muestra en hora argentina, igual que en el mail y
// el WhatsApp, para que los tres digan el mismo día.
function formatearVencimiento(venceEl) {
  return new Date(venceEl).toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

// Un dato bancario con botón para copiarlo. En el celular copiar un CBU de 22
// dígitos a mano es donde más se equivoca la gente.
function DatoCopiable({ etiqueta, valor, destacado = false }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch { /* sin permiso de portapapeles el dato igual queda a la vista */ }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-zinc-800 last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{etiqueta}</p>
        <p className={`break-all ${destacado ? 'text-lg font-bold text-zinc-100' : 'text-sm font-semibold text-zinc-200'}`}>
          {valor}
        </p>
      </div>
      <button
        type="button"
        onClick={copiar}
        className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
          copiado
            ? 'border-green-500/40 bg-green-500/10 text-green-300'
            : 'border-zinc-700 text-zinc-300 hover:border-zinc-500 active:bg-zinc-800'
        }`}
      >
        {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

export default function ConfirmacionPage() {
  const { id } = useParams()
  const { sesion } = useAuth()

  const [orden, setOrden] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    ordenesApi.obtener(id, sesion?.access_token ?? null)
      .then(setOrden)
      .finally(() => setCargando(false))
  }, [id])

  // Purchase al pixel, una sola vez por orden.
  //
  // Dispara al ver el pedido recién hecho y no al confirmarse el pago: el pago
  // por transferencia o en efectivo se confirma después, desde el panel, y el
  // cliente casi nunca vuelve a esta pantalla. Esperar al pago dejaría a la
  // campaña sin ventas que medir.
  //
  // El candado en localStorage es imprescindible: esta pantalla se recarga, se
  // comparte por WhatsApp y queda en el historial. Sin él, cada visita contaría
  // una venta más y las métricas de la campaña quedarían infladas.
  useEffect(() => {
    if (!orden || orden.estado === 'CANCELADA') return

    const clave = `pixel-purchase-${orden.id}`
    try {
      if (localStorage.getItem(clave)) return
      localStorage.setItem(clave, '1')
    } catch { /* sin localStorage se manda igual: mejor medir de más que nada */ }

    trackPurchase({
      total: orden.total,
      unidades: (orden.items ?? []).reduce((acc, i) => acc + i.cantidad, 0),
      productoIds: [...new Set((orden.items ?? []).map(i => i.productoId).filter(Boolean))],
    })
  }, [orden])

  if (cargando) {
    return <div className="flex justify-center py-20"><Spinner className="w-10 h-10" /></div>
  }

  if (!orden) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-400">No se encontró la orden.</p>
        <Link to="/" className="mt-4 inline-block text-blue-400 hover:underline">Volver al inicio</Link>
      </div>
    )
  }

  const pendiente = orden.estado === 'PENDIENTE'
  const cancelada = orden.estado === 'CANCELADA'
  const yaPagada = !pendiente && !cancelada
  const esperandoRetiro = pendiente && orden.metodoPago === 'efectivo'
  // Cualquier pendiente que no sea efectivo espera una transferencia. Incluye
  // los pedidos viejos de Mercado Pago que quedaron sin pagar.
  const esperandoTransferencia = pendiente && !esperandoRetiro
  const datos = orden.datosTransferencia
  const urlComprobante = whatsappUrl(`Hola! Te mando el comprobante del pedido #${orden.numero}`)
  // Envío fuera de Rosario sin costo cobrado: se acuerda aparte.
  const envioACotizar = orden.entrega?.tipo === 'ENVIO'
    && !esRosario(orden.domicilio?.ciudad)
    && Number(orden.costoEnvio) === 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Banner de estado del pedido */}
      {yaPagada && (
        <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 mb-6">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-300">¡Pago recibido!</p>
            <p className="text-xs text-green-400/80 mt-0.5">Tu pedido está confirmado. En breve nos ponemos en contacto.</p>
          </div>
        </div>
      )}
      {cancelada && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6">
          <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-300">Pedido cancelado</p>
            <p className="text-xs text-red-400/80 mt-0.5">
              Si creés que es un error, escribinos por WhatsApp al {WHATSAPP_LEGIBLE} y lo revisamos.
            </p>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          {yaPagada
            ? <CheckCircle2 className="w-16 h-16 text-green-400" />
            : <Package className="w-16 h-16 text-zinc-500" />
          }
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">
          {yaPagada ? '¡Pedido confirmado!'
            : cancelada ? 'Pedido cancelado'
            : esperandoRetiro ? '¡Pedido reservado!'
            : '¡Recibimos tu pedido!'}
        </h1>
        <p className="text-zinc-400 text-sm">
          Orden <span className="font-semibold text-zinc-200">#{orden.numero}</span>
        </p>
        {orden.telefonoGuest && (
          <p className="text-zinc-500 text-xs mt-1">
            Te vamos a contactar por WhatsApp al{' '}
            <span className="text-zinc-300 font-medium">{orden.telefonoGuest}</span>
          </p>
        )}
      </div>

      {/* Transferencia: es lo único que le falta hacer al cliente, así que va
          primero, antes del detalle que ya conoce. */}
      {esperandoTransferencia && (
        <div className="bg-zinc-900 border border-blue-500/40 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-zinc-100 mb-1 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-blue-400 shrink-0" /> Falta un paso: transferí y mandanos el comprobante
          </h2>

          {datos ? (
            <div className="mt-2">
              <DatoCopiable etiqueta="Monto a transferir" valor={formatPrecio(orden.total)} destacado />
              {datos.alias && <DatoCopiable etiqueta="Alias" valor={datos.alias} />}
              {datos.cbu && <DatoCopiable etiqueta="CBU" valor={datos.cbu} />}
              {(datos.titular || datos.banco) && (
                <p className="pt-2.5 text-xs text-zinc-500">
                  {[datos.titular && `Titular: ${datos.titular}`, datos.banco && `Banco: ${datos.banco}`]
                    .filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">
              Te pasamos el alias y el CBU por WhatsApp. El monto a transferir es{' '}
              <span className="font-semibold text-zinc-100">{formatPrecio(orden.total)}</span>.
            </p>
          )}

          <a
            href={urlComprobante}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl text-base transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            {datos ? 'Enviar comprobante por WhatsApp' : 'Pedir los datos por WhatsApp'}
          </a>
          <p className="mt-3 text-xs text-zinc-500 text-center">
            {orden.venceEl
              ? <>Te guardamos el pedido hasta el {formatearVencimiento(orden.venceEl)}. Si necesitás más tiempo, avisanos.</>
              : <>Si necesitás más tiempo para transferir, avisanos.</>}
          </p>
        </div>
      )}

      {/* Detalle de productos */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" /> Productos
        </h2>
        <div className="flex flex-col gap-3">
          {orden.items.map(item => (
            <div key={item.id} className="flex gap-3 items-center">
              <FotoProducto
                url={item.producto.imagenes?.[0]?.url}
                alt={item.producto.nombre}
                className="w-12 h-12 shrink-0 rounded-lg object-cover bg-zinc-800"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{item.producto.nombre}</p>
                <p className="text-xs text-zinc-500">
                  T: {item.variante.talle}{item.variante.color ? ` · ${item.variante.color}` : ''} · x{item.cantidad}
                </p>
              </div>
              <span className="text-sm font-semibold text-zinc-200 shrink-0">
                {formatPrecio(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-800 mt-4 pt-3 flex flex-col gap-1 text-sm">
          <div className="flex justify-between text-zinc-400">
            <span>Subtotal</span><span>{formatPrecio(orden.subtotal)}</span>
          </div>
          {Number(orden.descuento) > 0 && (
            <div className="flex justify-between text-green-400">
              <span>Descuento</span><span>-{formatPrecio(orden.descuento)}</span>
            </div>
          )}
          <div className="flex justify-between text-zinc-400">
            <span>Envío</span>
            <span>
              {envioACotizar
                ? <span className="text-amber-400">A cotizar</span>
                : Number(orden.costoEnvio) === 0 ? 'Gratis' : formatPrecio(orden.costoEnvio)}
            </span>
          </div>
          {envioACotizar && (
            <p className="text-xs text-amber-400/80">
              Te pasamos el costo del envío por WhatsApp antes de despacharlo.
            </p>
          )}
          <div className="flex justify-between font-bold text-zinc-100 text-base mt-1">
            <span>Total</span><span>{formatPrecio(orden.total)}</span>
          </div>
        </div>
      </div>

      {/* Entrega */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-1">Entrega</h2>
        <p className="text-sm text-zinc-400">{orden.entrega.nombre}</p>
        {orden.domicilio && (
          <p className="text-xs text-zinc-500 mt-1">
            {orden.domicilio.calle} {orden.domicilio.numero}
            {orden.domicilio.piso ? `, ${orden.domicilio.piso}` : ''} — {orden.domicilio.ciudad}
            {orden.domicilio.cp ? ` (${orden.domicilio.cp})` : ''}
          </p>
        )}
      </div>

      {/* Pago en efectivo: no hay nada que cobrar online, solo instrucciones */}
      {esperandoRetiro && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-4 mb-6">
          <Banknote className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Pagás al retirar, en efectivo</p>
            <p className="text-xs text-amber-400/90 mt-1">
              Te guardamos el pedido en <span className="font-semibold">{orden.entrega.nombre}</span>.
              Te avisamos por WhatsApp cuando esté listo para que pases a buscarlo y abonarlo.
            </p>
            <p className="text-xs text-amber-400/70 mt-2">
              {orden.venceEl
                ? <>Te lo guardamos hasta el {formatearVencimiento(orden.venceEl)}. Si no podés pasar antes, avisanos.</>
                : <>Si no pasás a retirarlo dentro de los 7 días, el pedido se cancela y se libera el stock.</>}
            </p>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-col items-center gap-3">

        <Link
          to="/"
          className="text-zinc-400 text-sm font-medium hover:text-zinc-200 transition-colors"
        >
          {yaPagada ? 'Seguir comprando' : 'Volver al inicio'}
        </Link>
      </div>

    </div>
  )
}
