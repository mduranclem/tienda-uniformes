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
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') && session) {
        await sincronizarUsuario(session)
        if (event === 'SIGNED_IN') {
          try { await carritoApi.merge() } catch (_) {}
        }
      }
      if (event === 'SIGNED_OUT') {
        setUsuario(null)
        setCargando(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function sincronizarUsuario(session) {
    try {
      const data = await usuariosApi.sync(session.access_token)
      setUsuario(data)
    } catch (err) {
      setUsuario(null)
    } finally {
      setCargando(false)
    }
  }

  async function loginConPassword(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function registrar(email, password, nombre) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nombre } },
    })
    if (error) throw error
  }

  async function recuperarPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/nueva-password`,
    })
    if (error) throw error
  }

  async function logout() {
    await supabase.auth.signOut()
    setUsuario(null)
    setSesion(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, sesion, cargando, loginConPassword, registrar, recuperarPassword, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
