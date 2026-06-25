import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { loginConMagicLink, usuario } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Si ya está logueado, redirigir
  if (usuario) {
    navigate('/')
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await loginConMagicLink(email)
      setEnviado(true)
    } catch (err) {
      setError(err.message ?? 'No se pudo enviar el email. Intentá de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  if (enviado) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Revisá tu email</h1>
          <p className="text-gray-600 text-sm mb-6">
            Te enviamos un link a <strong>{email}</strong>. Hacé clic en él para ingresar.
          </p>
          <button
            onClick={() => setEnviado(false)}
            className="text-sm text-blue-600 hover:underline"
          >
            Usar otro email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Ingresá a tu cuenta</h1>
          <p className="text-gray-500 text-sm mt-2">
            Te mandamos un link directo a tu email, sin contraseña.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={cargando || !email}
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? 'Enviando...' : 'Enviar link de acceso'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          ¿Querés seguir comprando sin cuenta?{' '}
          <Link to="/catalogo" className="text-blue-600 hover:underline">
            Ver catálogo
          </Link>
        </p>
      </div>
    </div>
  )
}
