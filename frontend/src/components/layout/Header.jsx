import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Search, Menu, User, LogOut, LayoutDashboard, X, ClipboardList } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import CartDrawer from '../cart/CartDrawer'

export default function Header() {
  const { totalItems } = useCart()
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  function handleBusqueda(e) {
    e.preventDefault()
    if (busqueda.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(busqueda.trim())}`)
      setMenuAbierto(false)
    }
  }

  return (
    <>
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="shrink-0">
            <img src="/logo.png" alt="InCollege" className="h-20 w-auto" />
          </Link>

          {/* Buscador desktop */}
          <form onSubmit={handleBusqueda} className="hidden sm:flex flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <input
              type="search"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            <Link to="/catalogo" className="hidden sm:block text-sm font-medium text-zinc-400 hover:text-white px-2 transition-colors">
              Catálogo
            </Link>

            {usuario ? (
              <div className="hidden sm:flex items-center gap-2">
                {usuario.rol === 'ADMIN' && (
                  <Link to="/admin" title="Panel admin" className="p-1.5 text-zinc-400 hover:text-blue-400 transition-colors">
                    <LayoutDashboard className="w-4 h-4" />
                  </Link>
                )}
                <Link to="/mi-cuenta/ordenes" title="Mis compras" className="p-1.5 text-zinc-400 hover:text-blue-400 transition-colors">
                  <ClipboardList className="w-4 h-4" />
                </Link>
                <span className="text-sm text-zinc-400 max-w-[120px] truncate">
                  {usuario.nombre ?? usuario.email}
                </span>
                <button onClick={logout} title="Cerrar sesión" className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden sm:flex items-center gap-1 text-sm font-medium text-zinc-400 hover:text-white px-2 transition-colors">
                <User className="w-4 h-4" />
                Ingresar
              </Link>
            )}

            {/* Carrito */}
            <button onClick={() => setDrawerAbierto(true)} className="relative p-1.5" aria-label="Abrir carrito">
              <ShoppingCart className="w-6 h-6 text-zinc-300" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* Burger mobile */}
            <button className="sm:hidden p-1.5" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Menú">
              {menuAbierto ? <X className="w-6 h-6 text-zinc-300" /> : <Menu className="w-6 h-6 text-zinc-300" />}
            </button>
          </div>
        </div>

        {/* Menú mobile */}
        {menuAbierto && (
          <nav className="sm:hidden border-t border-zinc-800 bg-zinc-900 px-4 py-3 flex flex-col gap-3 text-sm">
            <Link to="/catalogo" onClick={() => setMenuAbierto(false)} className="font-medium text-zinc-200">Catálogo</Link>
            {usuario ? (
              <>
                <span className="text-zinc-500 text-xs">{usuario.nombre ?? usuario.email}</span>
                {usuario.rol === 'ADMIN' && (
                  <Link to="/admin" onClick={() => setMenuAbierto(false)} className="font-medium text-blue-400">Panel admin</Link>
                )}
                <Link to="/mi-cuenta/ordenes" onClick={() => setMenuAbierto(false)} className="font-medium text-zinc-200 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4" /> Mis compras
                </Link>
                <button onClick={() => { logout(); setMenuAbierto(false) }} className="text-left text-red-400 font-medium">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuAbierto(false)} className="font-medium text-zinc-200">Ingresar</Link>
            )}
            <form onSubmit={handleBusqueda} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                type="search"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full pl-9 pr-4 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </form>
          </nav>
        )}
      </header>

      <CartDrawer abierto={drawerAbierto} onCerrar={() => setDrawerAbierto(false)} />
    </>
  )
}
