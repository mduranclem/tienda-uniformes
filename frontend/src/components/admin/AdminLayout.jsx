import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../ui/Spinner'
import { Package, ShoppingBag, Tag, Truck } from 'lucide-react'

const links = [
  { to: '/admin/productos', label: 'Productos', icon: Package },
  { to: '/admin/ordenes', label: 'Órdenes', icon: ShoppingBag },
  { to: '/admin/cupones', label: 'Cupones', icon: Tag },
  { to: '/admin/entregas', label: 'Entregas', icon: Truck },
]

export default function AdminLayout() {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return <div className="flex justify-center items-center min-h-screen"><Spinner className="w-10 h-10" /></div>
  }

  if (!usuario || usuario.rol !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="font-bold text-blue-700 text-sm">Panel Admin</p>
          <p className="text-xs text-gray-500 truncate">{usuario.email}</p>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <NavLink to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">
            ← Ver tienda
          </NavLink>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
