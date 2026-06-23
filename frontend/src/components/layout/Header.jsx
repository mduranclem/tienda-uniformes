import { Link } from 'react-router-dom'
import { ShoppingCart, Search, Menu } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useState } from 'react'

export default function Header() {
  const { totalItems } = useCart()
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="font-bold text-xl text-blue-700 shrink-0">
          Tienda Escolar
        </Link>

        {/* Buscador — oculto en mobile */}
        <div className="hidden sm:flex flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="search"
            placeholder="Buscar productos..."
            className="w-full pl-9 pr-4 py-1.5 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <Link
            to="/catalogo"
            className="hidden sm:block text-sm font-medium text-gray-700 hover:text-blue-700"
          >
            Catálogo
          </Link>
          <Link to="/carrito" className="relative p-1.5">
            <ShoppingCart className="w-6 h-6 text-gray-700" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>
          <button
            className="sm:hidden p-1.5"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label="Menú"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Menú mobile */}
      {menuAbierto && (
        <nav className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-3 text-sm">
          <Link to="/catalogo" onClick={() => setMenuAbierto(false)} className="font-medium text-gray-700">
            Catálogo
          </Link>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="search"
              placeholder="Buscar productos..."
              className="w-full pl-9 pr-4 py-1.5 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </nav>
      )}
    </header>
  )
}
