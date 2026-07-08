import { createContext, useContext, useReducer, useEffect } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'carrito'

// Carga inicial desde localStorage (persiste entre recargas y sesiones)
function cargarCarrito() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { items: [] }
    const items = JSON.parse(raw)
    if (!Array.isArray(items)) return { items: [] }
    // Solo items con la forma mínima esperada
    return { items: items.filter(i => i?.varianteId && i?.cantidad > 0) }
  } catch {
    return { items: [] }
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'AGREGAR': {
      const existe = state.items.find(i => i.varianteId === action.item.varianteId)
      if (existe) {
        return {
          ...state,
          items: state.items.map(i =>
            i.varianteId === action.item.varianteId
              ? { ...i, cantidad: i.cantidad + action.item.cantidad }
              : i
          ),
        }
      }
      return { ...state, items: [...state.items, action.item] }
    }
    case 'QUITAR':
      return { ...state, items: state.items.filter(i => i.varianteId !== action.varianteId) }
    case 'ACTUALIZAR_CANTIDAD':
      return {
        ...state,
        items: state.items.map(i =>
          i.varianteId === action.varianteId ? { ...i, cantidad: action.cantidad } : i
        ),
      }
    case 'VACIAR':
      return { items: [] }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, cargarCarrito)

  // Guardar en localStorage ante cada cambio
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    } catch { /* localStorage puede no estar disponible */ }
  }, [state.items])

  const totalItems = state.items.reduce((acc, i) => acc + i.cantidad, 0)
  const totalPrecio = state.items.reduce((acc, i) => acc + i.precioUnit * i.cantidad, 0)

  return (
    <CartContext.Provider value={{ ...state, totalItems, totalPrecio, dispatch }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
