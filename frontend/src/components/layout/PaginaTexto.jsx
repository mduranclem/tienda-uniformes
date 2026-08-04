// Contenedor para las páginas de texto largo (legales, guía de talles).
// Centraliza el ancho de lectura y la jerarquía tipográfica para que las
// cuatro se vean iguales y no haya que repetir clases en cada una.

export function Seccion({ titulo, children }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="text-base font-semibold text-white sm:text-lg">{titulo}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-zinc-400">{children}</div>
    </section>
  )
}

export default function PaginaTexto({ titulo, bajada, actualizado, children }) {
  // Fondo propio: la tienda tiene una foto de fondo global y un texto largo
  // encima de una imagen se lee mal, sobre todo en los párrafos en gris.
  return (
    <div className="bg-zinc-950/90 mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{titulo}</h1>
      {bajada && <p className="mt-2 text-sm text-zinc-400 sm:text-base">{bajada}</p>}
      {actualizado && (
        <p className="mt-3 text-xs text-zinc-600">Última actualización: {actualizado}</p>
      )}
      <div className="mt-8 border-t border-zinc-800 pt-8">{children}</div>
    </div>
  )
}
