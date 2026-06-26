import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

const MODOS = { LOGIN: 'login', REGISTRO: 'registro', RECUPERAR: 'recuperar' }

export default function LoginPage() {
  const { loginConPassword, registrar, recuperarPassword, usuario } = useAuth()
  const navigate = useNavigate()
  const [modo, setModo] = useState(MODOS.LOGIN)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  if (usuario) { navigate('/'); return null }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setExito(''); setCargando(true)
    try {
      if (modo === MODOS.LOGIN) {
        await loginConPassword(email, password)
        navigate('/')
      } else if (modo === MODOS.REGISTRO) {
        await registrar(email, password, nombre)
        setExito('¡Cuenta creada! Revisá tu email para confirmarla y después iniciá sesión.')
        setModo(MODOS.LOGIN)
      } else {
        await recuperarPassword(email)
        setExito('Te enviamos un link para restablecer tu contraseña.')
      }
    } catch (err) {
      const msg = err.message ?? ''
      if (msg.includes('Invalid login credentials')) setError('Email o contraseña incorrectos.')
      else if (msg.includes('Email not confirmed')) setError('Confirmá tu email antes de ingresar.')
      else if (msg.includes('rate limit')) setError('Demasiados intentos. Esperá unos minutos.')
      else if (msg.includes('already registered')) setError('Ya existe una cuenta con ese email. Iniciá sesión.')
      else setError(msg || 'Ocurrió un error. Intentá de nuevo.')
    } finally { setCargando(false) }
  }

  const titulos = {
    [MODOS.LOGIN]: 'Ingresá a tu cuenta',
    [MODOS.REGISTRO]: 'Crear cuenta',
    [MODOS.RECUPERAR]: 'Recuperar contraseña',
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-zinc-100">{titulos[modo]}</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
          {modo === MODOS.REGISTRO && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">Nombre</label>
              <input type="text" placeholder="Tu nombre" value={nombre}
                onChange={e => setNombre(e.target.value)} className="input" />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">Email</label>
            <input type="email" required autoFocus placeholder="tu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} className="input" />
          </div>

          {modo !== MODOS.RECUPERAR && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">Contraseña</label>
              <input type="password" required minLength={6}
                placeholder={modo === MODOS.REGISTRO ? 'Mínimo 6 caracteres' : '••••••••'}
                value={password} onChange={e => setPassword(e.target.value)} className="input" />
            </div>
          )}

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          {exito && <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{exito}</p>}

          <button type="submit" disabled={cargando} className="btn-primario py-2.5">
            {cargando ? 'Cargando...' : modo === MODOS.LOGIN ? 'Ingresar' : modo === MODOS.REGISTRO ? 'Crear cuenta' : 'Enviar link'}
          </button>

          <div className="flex flex-col gap-2 pt-1 text-center text-sm">
            {modo === MODOS.LOGIN && (
              <>
                <button type="button" onClick={() => { setModo(MODOS.RECUPERAR); setError(''); setExito('') }}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  Olvidé mi contraseña
                </button>
                <button type="button" onClick={() => { setModo(MODOS.REGISTRO); setError(''); setExito('') }}
                  className="text-blue-400 font-medium hover:underline">
                  Crear cuenta nueva
                </button>
              </>
            )}
            {(modo === MODOS.REGISTRO || modo === MODOS.RECUPERAR) && (
              <button type="button" onClick={() => { setModo(MODOS.LOGIN); setError(''); setExito('') }}
                className="text-blue-400 font-medium hover:underline">
                ← Volver al login
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-4">
          <Link to="/catalogo" className="text-blue-400 hover:underline">
            Seguir comprando sin cuenta →
          </Link>
        </p>
      </div>
    </div>
  )
}
