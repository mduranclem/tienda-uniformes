import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function NuevaPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return }
    setGuardando(true); setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError(err.message.includes('session') ? 'El link expiró. Pedí uno nuevo desde el login.' : err.message)
      setGuardando(false)
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-zinc-100">Creá tu contraseña</h1>
          <p className="text-sm text-zinc-500 mt-1">A partir de ahora usás email y contraseña para entrar.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">Nueva contraseña</label>
            <input type="password" required minLength={6} autoFocus
              placeholder="Mínimo 6 caracteres" value={password}
              onChange={e => setPassword(e.target.value)} className="input" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">Repetir contraseña</label>
            <input type="password" required placeholder="Igual que la anterior"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input" />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={guardando} className="btn-primario py-2.5">
            {guardando ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
