import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, tipoHashInicial } from '../lib/supabaseClient'
import Spinner from '../components/ui/Spinner'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState(false)

  useEffect(() => {
    // Si es un link de recuperación, redirigir a la página de nueva contraseña
    if (tipoHashInicial === 'recovery') {
      navigate('/auth/nueva-password', { replace: true })
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') navigate('/', { replace: true })
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/', { replace: true })
    })

    const timeout = setTimeout(() => setError(true), 6000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 text-center">
        <div>
          <p className="text-red-600 font-medium mb-2">No se pudo iniciar sesión</p>
          <p className="text-sm text-gray-500 mb-4">El link puede haber expirado.</p>
          <button onClick={() => navigate('/login')} className="btn-primario">Volver al login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center flex-col gap-3">
      <Spinner className="w-8 h-8" />
      <p className="text-sm text-gray-500">Iniciando sesión...</p>
    </div>
  )
}
