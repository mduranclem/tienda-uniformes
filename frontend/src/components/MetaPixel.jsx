import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { iniciarPixel, trackPageView } from '../lib/metaPixel'

/**
 * Carga el pixel y avisa cada cambio de página.
 *
 * La tienda es una SPA: al navegar no se recarga el documento, así que el
 * PageView automático del script solo contaría la primera pantalla. Mirando la
 * ruta se cuentan todas, incluida la inicial.
 *
 * Va dentro del router, que es de donde sale useLocation. No renderiza nada.
 */
export default function MetaPixel() {
  const { pathname, search } = useLocation()
  const ultimaRuta = useRef(null)

  useEffect(() => { iniciarPixel() }, [])

  useEffect(() => {
    // search entra en la clave porque /catalogo?colegioId=x es otra pantalla
    // para el visitante, aunque comparta el pathname.
    const ruta = pathname + search
    // Se recuerda la última ruta avisada porque en desarrollo React monta los
    // componentes dos veces y contaría doble. Volver a la misma pantalla
    // después de pasar por otra sí cuenta de nuevo: ahí la clave cambió.
    if (ultimaRuta.current === ruta) return
    ultimaRuta.current = ruta
    trackPageView()
  }, [pathname, search])

  return null
}
