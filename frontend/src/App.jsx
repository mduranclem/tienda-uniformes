import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

const WHATSAPP_NUMERO = '5493417434552'
const WHATSAPP_MENSAJE = encodeURIComponent('Hola! Tengo una consulta sobre los uniformes')
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
import AuthCallbackPage from './pages/AuthCallbackPage'
import NuevaPasswordPage from './pages/NuevaPasswordPage'
import AdminProductosPage from './pages/admin/AdminProductosPage'
import AdminOrdenesPage from './pages/admin/AdminOrdenesPage'
import AdminCuponesPage from './pages/admin/AdminCuponesPage'
import AdminBannersPage from './pages/admin/AdminBannersPage'
import AdminEntregasPage from './pages/admin/AdminEntregasPage'
import AdminColegiosPage from './pages/admin/AdminColegiosPage'
import CheckoutPage from './pages/CheckoutPage'
import ConfirmacionPage from './pages/ConfirmacionPage'
import MisOrdenesPage from './pages/MisOrdenesPage'

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
              <Route path="colegios" element={<AdminColegiosPage />} />
              <Route path="entregas" element={<AdminEntregasPage />} />
              <Route path="banners" element={<AdminBannersPage />} />
            </Route>

            {/* Tienda pública */}
            <Route path="/*" element={
              <div className="min-h-screen flex flex-col relative" style={{ background: 'linear-gradient(rgba(9,9,11,0.75), rgba(9,9,11,0.75)), url(/fondo.png)', backgroundSize: '100% auto', backgroundPosition: 'top center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'scroll' }}>
                {/* Capa extra oscura solo en mobile */}
                <div className="sm:hidden absolute inset-0 bg-black/40 pointer-events-none z-0" />
                <div className="bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600 text-white text-center py-2 px-4 text-sm font-semibold tracking-wide">
                  🎉 ¡20% OFF en tu primera compra! — Se aplica automáticamente al finalizar
                </div>
                <Header />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/catalogo" element={<CatalogoPage />} />
                    <Route path="/producto/:id" element={<ProductoPage />} />
                    <Route path="/carrito" element={<CarritoPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/confirmacion/:id" element={<ConfirmacionPage />} />
                    <Route path="/mi-cuenta/ordenes" element={<MisOrdenesPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />
                    <Route path="/auth/nueva-password" element={<NuevaPasswordPage />} />
                  </Routes>
                </main>
                <Footer />

                {/* Botón flotante WhatsApp */}
                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}?text=${WHATSAPP_MENSAJE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-green-500 hover:bg-green-400 text-white rounded-full shadow-lg shadow-green-900/40 transition-all hover:scale-105"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 sm:w-7 sm:h-7">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>

              </div>
            } />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
