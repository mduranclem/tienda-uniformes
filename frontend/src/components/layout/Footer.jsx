export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Tienda Escolar. Todos los derechos reservados.</p>
        <p className="mt-1">Pagos seguros con Mercado Pago</p>
      </div>
    </footer>
  )
}
