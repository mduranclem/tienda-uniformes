import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { usuariosApi, carritoApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)   // datos de nuestra DB
  const [sesion, setSesion] = useState(null)      // sesión de Supabase
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session)
      if (session) sincronizarUsuario(session)
      else setCargando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSesion(session)
      if (event === 'SIGNED_IN' && session) {
        await sincronizarUsuario(session)
        // Fusionar carrito guest con el del usuario
        try { await carritoApi.merge() } catch (_) {}
      }
      if (event === 'SIGNED_OUT') {
        setUsuario(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function sincronizarUsuario(session) {
    try {
      const data = await usuariosApi.sync(session.access_token)
      setUsuario(data)
    } catch (_) {
      setUsuario(null)
    } finally {
      setCargando(false)
    }
  }

  async function loginConMagicLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
  }

  async function logout() {
    await supabase.auth.signOut()
    setUsuario(null)
    setSesion(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, sesion, cargando, loginConMagicLink, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
