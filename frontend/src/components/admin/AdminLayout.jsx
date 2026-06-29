import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../ui/Spinner'
import { Package, ShoppingBag, Tag, Truck, Images, School, LayoutList } from 'lucide-react'

const links = [
  { to: '/admin/colegios', label: 'Colegios', icon: School },
  { to: '/admin/categorias', label: 'Categorías', icon: LayoutList },
  { to: '/admin/productos', label: 'Productos', icon: Package },
  { to: '/admin/ordenes', label: 'Órdenes', icon: ShoppingBag },
  { to: '/admin/cupones', label: 'Cupones', icon: Tag },
  { to: '/admin/entregas', label: 'Entregas', icon: Truck },
  { to: '/admin/banners', label: 'Carrusel', icon: Images },
]

export default function AdminLayout() {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return <div className="flex justify-center items-center min-h-screen bg-zinc-950"><Spinner className="w-10 h-10" /></div>
  }

  if (!usuario || usuario.rol !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <aside className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-zinc-800">
          <img src="/logo.png" alt="InCollege" className="h-10 w-auto mb-2" />
          <p className="text-xs text-zinc-500 truncate">{usuario.email}</p>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-zinc-800">
          <NavLink to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors">
            ← Ver tienda
          </NavLink>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-zinc-950">
        <Outlet />
      </main>
    </div>
  )
}
