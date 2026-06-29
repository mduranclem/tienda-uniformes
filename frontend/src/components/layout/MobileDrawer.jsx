import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X, Search, ChevronDown, ChevronUp, ClipboardList, LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { colegiosApi } from '../../services/api'

const WHATSAPP = 'https://wa.me/5493417434552?text=' + encodeURIComponent('Hola! Tengo una consulta sobre los uniformes')

export default function MobileDrawer({ abierto, onCerrar }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [colegiosAbierto, setColegiosAbierto] = useState(false)
  const [colegios, setColegios] = useState([])

  useEffect(() => {
    colegiosApi.listar().then(r => setColegios(r.data ?? r)).catch(() => {})
  }, [])

  useEffect(() => {
    document.body.style.overflow = abierto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [abierto])

  function handleBusqueda(e) {
    e.preventDefault()
    if (!busqueda.trim()) return
    navigate(`/catalogo?q=${encodeURIComponent(busqueda.trim())}`)
    setBusqueda('')
    onCerrar()
  }

  function ir(to) {
    navigate(to)
    onCerrar()
  }

  const itemClass = 'flex items-center justify-between w-full px-6 py-4 text-[13px] font-semibold tracking-[0.15em] text-white uppercase hover:bg-white/5 transition-colors text-left'

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCerrar}
        className="fixed inset-0 z-40 bg-black/70 transition-opacity duration-300"
        style={{ opacity: abierto ? 1 : 0, pointerEvents: abierto ? 'auto' : 'none' }}
      />

      {/* Panel */}
      <aside
        className="fixed top-0 left-0 h-full w-[82vw] max-w-sm z-50 flex flex-col"
        style={{
          background: '#111',
          transform: abierto ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        {/* Header del drawer */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #2a2a2a' }}>
          <Link to="/" onClick={onCerrar}>
            <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
          </Link>
          <button
            onClick={onCerrar}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buscador */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #2a2a2a' }}>
          <form onSubmit={handleBusqueda} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="search"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1"
              style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', focusRingColor: '#444' }}
            />
          </form>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto">
          {/* COLEGIOS — expandible */}
          <div style={{ borderBottom: '1px solid #2a2a2a' }}>
            <button
              onClick={() => setColegiosAbierto(v => !v)}
              className={itemClass}
            >
              Colegios
              {colegiosAbierto
                ? <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" />
                : <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
              }
            </button>
            {colegiosAbierto && colegios.length > 0 && (
              <div style={{ background: '#0d0d0d', borderTop: '1px solid #222' }}>
                {colegios.map(c => (
                  <button
                    key={c.id}
                    onClick={() => ir(`/catalogo?colegioId=${c.id}`)}
                    className="w-full text-left px-10 py-3 text-xs font-medium tracking-wider text-white/50 hover:text-white hover:bg-white/5 transition-colors uppercase"
                    style={{ borderBottom: '1px solid #1a1a1a' }}
                  >
                    {c.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderBottom: '1px solid #2a2a2a' }}>
            <button onClick={() => ir('/catalogo?q=egresados')} className={itemClass}>
              Egresados
            </button>
          </div>

          <div style={{ borderBottom: '1px solid #2a2a2a' }}>
            <button onClick={() => ir('/catalogo?colegioId=lisos')} className={itemClass}>
              Básicos lisos
            </button>
          </div>

          <div style={{ borderBottom: '1px solid #2a2a2a' }}>
            <button onClick={() => ir('/faq')} className={itemClass}>
              Preguntas frecuentes
            </button>
          </div>

          <div style={{ borderBottom: '1px solid #2a2a2a' }}>
            <button onClick={() => ir('/contacto')} className={itemClass}>
              Contacto
            </button>
          </div>

          {/* Links de cuenta (solo si está logueado — accesos rápidos) */}
          {usuario && (
            <>
              {usuario.rol === 'ADMIN' && (
                <div style={{ borderBottom: '1px solid #2a2a2a' }}>
                  <button onClick={() => ir('/admin')} className={`${itemClass} text-blue-400`}>
                    <span className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Panel admin</span>
                  </button>
                </div>
              )}
              <div style={{ borderBottom: '1px solid #2a2a2a' }}>
                <button onClick={() => ir('/mi-cuenta/ordenes')} className={`${itemClass} text-white/70`}>
                  <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Mis compras</span>
                </button>
              </div>
            </>
          )}
        </nav>

        {/* Footer — login / cuenta */}
        <div className="px-6 py-5" style={{ borderTop: '1px solid #2a2a2a' }}>
          {usuario ? (
            <div className="flex flex-col gap-3">
              <span className="text-[11px] text-white/30 truncate">{usuario.nombre ?? usuario.email}</span>
              <button
                onClick={() => { logout(); onCerrar() }}
                className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-red-500/80 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={onCerrar}
              className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/40 hover:text-white/70 transition-colors"
            >
              Iniciar sesión / Crear cuenta
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}
