import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el .env')
}

// Leer el hash ANTES de que createClient lo limpie (lo hace de forma asíncrona pero
// el módulo ya exportó el valor antes de que eso ocurra)
const _hashParams = new URLSearchParams(window.location.hash.slice(1))
export const tipoHashInicial = _hashParams.get('type') // 'recovery' | 'magiclink' | null

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit',
  },
})
