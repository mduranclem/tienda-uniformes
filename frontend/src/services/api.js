function getBase() {
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:3000/api'
  return `https://api.${hostname}/api`
}
const BASE = getBase()

async function request(path, options = {}) {
  const { headers: extraHeaders, ...restOptions } = options
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    ...restOptions,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ mensaje: res.statusText }))
    throw new Error(error.mensaje || `Error ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

// ── Colegios ────────────────────────────────────────────────────────────────
export const colegiosApi = {
  listar: () => request('/colegios'),
}

// ── Categorías ───────────────────────────────────────────────────────────────
export const categoriasApi = {
  listar: () => request('/categorias'),
}

// ── Productos ────────────────────────────────────────────────────────────────
export const productosApi = {
  listar: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ).toString()
    return request(`/productos${qs ? `?${qs}` : ''}`)
  },
  obtener: (id) => request(`/productos/${id}`),
}

// ── Carrito ──────────────────────────────────────────────────────────────────
export const carritoApi = {
  obtener: () => request('/carrito'),
  agregar: (varianteId, cantidad) =>
    request('/carrito/items', { method: 'POST', body: JSON.stringify({ varianteId, cantidad }) }),
  actualizar: (varianteId, cantidad) =>
    request(`/carrito/items/${varianteId}`, { method: 'PUT', body: JSON.stringify({ cantidad }) }),
  quitar: (varianteId) => request(`/carrito/items/${varianteId}`, { method: 'DELETE' }),
  merge: () => request('/carrito/merge', { method: 'POST' }),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
function adminRequest(path, options = {}, token) {
  return request(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  })
}

export const adminApi = {
  // Colegios
  listarColegios: (token) => adminRequest('/admin/colegios', {}, token),
  crearColegio: (token, data) => adminRequest('/admin/colegios', { method: 'POST', body: JSON.stringify(data) }, token),
  actualizarColegio: (token, id, data) => adminRequest(`/admin/colegios/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  eliminarColegio: (token, id) => adminRequest(`/admin/colegios/${id}`, { method: 'DELETE' }, token),
  // Productos
  listarProductos: (token) => adminRequest('/admin/productos', {}, token),
  crearProducto: (token, data) => adminRequest('/admin/productos', { method: 'POST', body: JSON.stringify(data) }, token),
  actualizarProducto: (token, id, data) => adminRequest(`/admin/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  eliminarProducto: (token, id) => adminRequest(`/admin/productos/${id}`, { method: 'DELETE' }, token),
  agregarImagen: (token, productoId, data) => adminRequest(`/admin/productos/${productoId}/imagenes`, { method: 'POST', body: JSON.stringify(data) }, token),
  actualizarImagen: (token, imagenId, data) => adminRequest(`/admin/productos/imagenes/${imagenId}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  eliminarImagen: (token, imagenId) => adminRequest(`/admin/productos/imagenes/${imagenId}`, { method: 'DELETE' }, token),
  crearVariante: (token, productoId, data) => adminRequest(`/admin/productos/${productoId}/variantes`, { method: 'POST', body: JSON.stringify(data) }, token),
  actualizarVariante: (token, varianteId, data) => adminRequest(`/admin/productos/variantes/${varianteId}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  eliminarVariante: (token, varianteId) => adminRequest(`/admin/productos/variantes/${varianteId}`, { method: 'DELETE' }, token),
  agregarColor: (token, productoId, nombre) => adminRequest(`/admin/productos/${productoId}/colores`, { method: 'POST', body: JSON.stringify({ nombre }) }, token),
  eliminarColor: (token, colorId) => adminRequest(`/admin/productos/colores/${colorId}`, { method: 'DELETE' }, token),
  // Órdenes
  listarOrdenes: (token, params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()
    return adminRequest(`/admin/ordenes${qs ? `?${qs}` : ''}`, {}, token)
  },
  obtenerOrden: (token, id) => adminRequest(`/admin/ordenes/${id}`, {}, token),
  cambiarEstadoOrden: (token, id, estado, nota) => adminRequest(`/admin/ordenes/${id}/estado`, { method: 'PUT', body: JSON.stringify({ estado, nota }) }, token),
  // Cupones
  listarCupones: (token) => adminRequest('/admin/cupones', {}, token),
  crearCupon: (token, data) => adminRequest('/admin/cupones', { method: 'POST', body: JSON.stringify(data) }, token),
  actualizarCupon: (token, id, data) => adminRequest(`/admin/cupones/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  // Entregas
  listarEntregas: (token) => adminRequest('/admin/entregas', {}, token),
  crearEntrega: (token, data) => adminRequest('/admin/entregas', { method: 'POST', body: JSON.stringify(data) }, token),
  actualizarEntrega: (token, id, data) => adminRequest(`/admin/entregas/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  // Banners
  listarBanners: (token) => adminRequest('/admin/banners', {}, token),
  crearBanner: (token, data) => adminRequest('/admin/banners', { method: 'POST', body: JSON.stringify(data) }, token),
  actualizarBanner: (token, id, data) => adminRequest(`/admin/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  eliminarBanner: (token, id) => adminRequest(`/admin/banners/${id}`, { method: 'DELETE' }, token),
  // Categorías
  listarCategorias: (token) => adminRequest('/admin/categorias', {}, token),
  crearCategoria: (token, data) => adminRequest('/admin/categorias', { method: 'POST', body: JSON.stringify(data) }, token),
  actualizarCategoria: (token, id, data) => adminRequest(`/admin/categorias/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  eliminarCategoria: (token, id) => adminRequest(`/admin/categorias/${id}`, { method: 'DELETE' }, token),
}

// ── Entregas ──────────────────────────────────────────────────────────────────
export const cuponesApi = {
  validar: (codigo, subtotal, colegioIds, productoIds, itemsSubtotales) => request('/cupones/validar', {
    method: 'POST',
    body: JSON.stringify({ codigo, subtotal, colegioIds, productoIds, itemsSubtotales }),
  }),
}

export const entregasApi = {
  listar: () => request('/entregas'),
}

// ── Órdenes ───────────────────────────────────────────────────────────────────
export const primeraCompraApi = {
  verificar: (email) => request(`/ordenes/primera-compra?email=${encodeURIComponent(email)}`),
}

export const ordenesApi = {
  crear: (data, token) => request('/ordenes', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }),
  obtener: (id, token) => request(`/ordenes/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }),
  misOrdenes: (token) => request('/ordenes/mis-ordenes', {
    headers: { Authorization: `Bearer ${token}` },
  }),
}

// ── Pagos ─────────────────────────────────────────────────────────────────────
export const pagosApi = {
  crearPreferencia: (token, ordenId) =>
    request('/pagos/preferencia', {
      method: 'POST',
      body: JSON.stringify({ ordenId }),
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── Banners ───────────────────────────────────────────────────────────────────
export const bannersApi = {
  listar: () => request('/banners'),
}

// ── Alumnos ───────────────────────────────────────────────────────────────────
function authHeader(token) {
  return { Authorization: `Bearer ${token}` }
}

export const alumnosApi = {
  listar: (token) =>
    request('/alumnos', { headers: authHeader(token) }),
  crear: (token, data) =>
    request('/alumnos', { method: 'POST', body: JSON.stringify(data), headers: authHeader(token) }),
  actualizar: (token, id, data) =>
    request(`/alumnos/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: authHeader(token) }),
  eliminar: (token, id) =>
    request(`/alumnos/${id}`, { method: 'DELETE', headers: authHeader(token) }),
  actualizarTalles: (token, id, talles) =>
    request(`/alumnos/${id}/talles`, { method: 'PUT', body: JSON.stringify({ talles }), headers: authHeader(token) }),
}

// ── Usuarios ──────────────────────────────────────────────────────────────────
export const usuariosApi = {
  sync: (token) =>
    request('/usuarios/sync', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
  me: (token) =>
    request('/usuarios/me', { headers: { Authorization: `Bearer ${token}` } }),
}
