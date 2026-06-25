import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import AdminLayout from './components/admin/AdminLayout'
import HomePage from './pages/HomePage'
import CatalogoPage from './pages/CatalogoPage'
import ProductoPage from './pages/ProductoPage'
import CarritoPage from './pages/CarritoPage'
import LoginPage from './pages/LoginPage'
import AdminProductosPage from './pages/admin/AdminProductosPage'
import AdminOrdenesPage from './pages/admin/AdminOrdenesPage'
import AdminCuponesPage from './pages/admin/AdminCuponesPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Admin — layout propio sin header/footer de la tienda */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/productos" replace />} />
              <Route path="productos" element={<AdminProductosPage />} />
              <Route path="ordenes" element={<AdminOrdenesPage />} />
              <Route path="cupones" element={<AdminCuponesPage />} />
            </Route>

            {/* Tienda pública */}
            <Route path="/*" element={
              <div className="min-h-screen flex flex-col bg-gray-50">
                <Header />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/catalogo" element={<CatalogoPage />} />
                    <Route path="/producto/:id" element={<ProductoPage />} />
                    <Route path="/carrito" element={<CarritoPage />} />
                    <Route path="/login" element={<LoginPage />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            } />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
