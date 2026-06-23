import { createContext, useContext, useReducer } from 'react'

const CartContext = createContext(null)

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
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

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
