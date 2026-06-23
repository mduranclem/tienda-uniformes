export default function Spinner({ className = '' }) {
  return (
    <div
      className={`inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Cargando"
    />
  )
}
