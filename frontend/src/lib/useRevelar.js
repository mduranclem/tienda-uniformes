import { useEffect, useRef } from 'react'

// Marca un elemento como visible la primera vez que entra en pantalla, para
// que el CSS pueda animar su aparición (clase .revelar en index.css).
//
// Se usa IntersectionObserver y no un listener de scroll: el navegador avisa
// solo cuando corresponde, sin ejecutar código en cada píxel de desplazamiento.
//
// Deja de observar apenas revela: la entrada ocurre una vez, no cada vez que la
// tarjeta vuelve a pasar por pantalla.
export function useRevelar() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const revelar = () => el.classList.add('visible')

    // Navegador sin soporte: se muestra y listo. Nunca se esconde contenido
    // detrás de una capacidad que puede no estar.
    if (typeof IntersectionObserver === 'undefined') {
      revelar()
      return
    }

    const observador = new IntersectionObserver(
      ([entrada], obs) => {
        if (!entrada.isIntersecting) return
        revelar()
        obs.unobserve(entrada.target)
      },
      // Margen positivo abajo: la tarjeta se prepara un poco antes de entrar,
      // así no se la ve aparecer sobre el borde de la pantalla.
      { rootMargin: '0px 0px 120px 0px', threshold: 0.01 }
    )

    observador.observe(el)

    // Red de seguridad. Las fotos cargan tarde y mueven el alto de la grilla:
    // si por un reacomodo el observador no llega a disparar, la tarjeta se
    // revela igual. Un producto invisible es mucho peor que una animación
    // perdida.
    const respaldo = setTimeout(revelar, 3000)

    return () => {
      observador.disconnect()
      clearTimeout(respaldo)
    }
  }, [])

  return ref
}
