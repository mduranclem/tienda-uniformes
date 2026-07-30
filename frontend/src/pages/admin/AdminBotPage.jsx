import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'

const CAMPOS = [
  { clave: 'horarios', label: 'Horarios de atención', placeholder: 'Lunes a viernes de 9 a 18hs' },
  { clave: 'direccion', label: 'Dirección del local', placeholder: 'Av. Corrientes 1234, Rosario' },
  { clave: 'telefono', label: 'Teléfono de contacto', placeholder: '+54 9 341 ...' },
  { clave: 'politicaCambios', label: 'Política de cambios y devoluciones', textarea: true, placeholder: 'Cambios dentro de los 30 días con la prenda sin uso...' },
  { clave: 'mediosPago', label: 'Medios de pago aceptados', textarea: true, placeholder: 'Mercado Pago, transferencia, efectivo en el local...' },
  { clave: 'tiempoEnvioRosario', label: 'Tiempo de envío — Rosario', placeholder: '2 a 3 días hábiles' },
  { clave: 'tiempoEnvioFueraRosario', label: 'Tiempo de envío — fuera de Rosario', placeholder: '5 a 7 días hábiles' },
  { clave: 'webhookStockAlert', label: 'URL del webhook de alertas de stock', placeholder: 'https://...n8n.cloud/webhook/...' },
]

// Estados de pedido que pueden avisar al cliente por WhatsApp.
// PREPARANDO viene desactivado: no le pide una acción al cliente ni le da
// información que no tenga, y cada mensaje de más gasta la paciencia de la que
// dependen los que sí importan.
const ESTADOS_NOTIFICABLES = [
  { valor: 'PAGADA', label: 'Pago confirmado' },
  { valor: 'PREPARANDO', label: 'Preparando el pedido' },
  { valor: 'LISTA', label: 'Listo para retirar / sale a entregarse' },
  { valor: 'ENTREGADA', label: 'Entregado' },
  { valor: 'CANCELADA', label: 'Cancelado' },
]
const ESTADOS_POR_DEFECTO = 'PAGADA,LISTA,ENTREGADA,CANCELADA'

export default function AdminBotPage() {
  const { sesion } = useAuth()
  const token = sesion?.access_token
  const [form, setForm] = useState({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [guardado, setGuardado] = useState(false)

  async function cargar() {
    setCargando(true)
    const data = await adminApi.obtenerConfigBot(token)
    setForm(data)
    setCargando(false)
  }

  useEffect(() => { if (token) cargar() }, [token])

  function set(clave, valor) {
    setForm(f => ({ ...f, [clave]: valor }))
    setGuardado(false)
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setGuardando(true); setGuardado(false)
    try {
      const data = await adminApi.actualizarConfigBot(token, form)
      setForm(data)
      setGuardado(true)
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  if (cargando) {
    return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-100">Configuración del bot / tienda</h1>
        <p className="text-sm text-zinc-500">
          Estos textos los usa el bot de WhatsApp para responder preguntas frecuentes (endpoint <code>/api/bot/info</code>).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex flex-col gap-4">
        {CAMPOS.map(({ clave, label, textarea, placeholder }) => (
          <div key={clave} className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">{label}</label>
            {textarea ? (
              <textarea
                value={form[clave] ?? ''}
                onChange={e => set(clave, e.target.value)}
                className="input min-h-24"
                placeholder={placeholder}
              />
            ) : (
              <input
                value={form[clave] ?? ''}
                onChange={e => set(clave, e.target.value)}
                className="input"
                placeholder={placeholder}
              />
            )}
          </div>
        ))}

        <div className="flex flex-col gap-2 pt-3 border-t border-zinc-800">
          <label className="text-xs font-medium text-zinc-400">
            Avisar al cliente por WhatsApp cuando el pedido pase a...
          </label>
          <p className="text-xs text-zinc-600 -mt-1">
            El mensaje lo arma la tienda según sea retiro, envío en Rosario o Andreani.
          </p>
          {ESTADOS_NOTIFICABLES.map(({ valor, label }) => {
            const activos = (form.estadosQueNotifican || ESTADOS_POR_DEFECTO).split(',').map(s => s.trim())
            const marcado = activos.includes(valor)
            return (
              <label key={valor} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => {
                    const siguiente = marcado
                      ? activos.filter(e => e !== valor)
                      : [...activos, valor]
                    // Se guarda en el orden del ciclo del pedido, no en el de clic
                    const ordenados = ESTADOS_NOTIFICABLES
                      .map(e => e.valor)
                      .filter(e => siguiente.includes(e))
                    set('estadosQueNotifican', ordenados.join(','))
                  }}
                  className="accent-blue-500"
                />
                {label}
              </label>
            )
          })}
        </div>

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
        {guardado && <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">Guardado correctamente</p>}

        <div className="flex justify-end pt-1">
          <button type="submit" disabled={guardando} className="btn-primario">
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
