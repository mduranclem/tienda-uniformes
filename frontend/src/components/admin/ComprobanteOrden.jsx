import { formatPrecio } from '../../lib/utils'

// Hoja imprimible de una orden. En pantalla está oculta; solo aparece al
// imprimir (ver la regla @media print en index.css).
//
// Va en blanco y negro a propósito: el panel es oscuro y mandarlo así a una
// impresora gasta un cartucho por pedido.

const ETIQUETA_PAGO = {
  mercadopago: 'Mercado Pago',
  efectivo: 'Efectivo al retirar',
}

function Fila({ etiqueta, children }) {
  if (!children) return null
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
      <span style={{ minWidth: 92, color: '#555' }}>{etiqueta}</span>
      <span style={{ fontWeight: 500 }}>{children}</span>
    </div>
  )
}

function Seccion({ titulo, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{
        fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6,
        color: '#555', borderBottom: '1px solid #ccc',
        paddingBottom: 3, marginBottom: 6, marginTop: 0,
      }}>{titulo}</h2>
      {children}
    </div>
  )
}

export default function ComprobanteOrden({ orden }) {
  if (!orden) return null

  const cliente = orden.usuario?.nombre ?? orden.nombreGuest ?? null
  const email = orden.usuario?.email ?? orden.emailGuest ?? null
  const telefono = orden.usuario?.telefono ?? orden.telefonoGuest ?? null
  const esEnvio = orden.entrega?.tipo === 'ENVIO'
  const d = orden.domicilio

  const domicilio = d
    ? [d.calle, d.numero, d.piso ? `piso ${d.piso}` : null].filter(Boolean).join(' ')
    : null
  const localidad = d
    ? [d.ciudad, d.cp ? `(CP ${d.cp})` : null].filter(Boolean).join(' ')
    : null

  const fechaEntrega = orden.entregaFecha
    ? new Date(orden.entregaFecha).toLocaleDateString('es-AR', {
        timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long',
      })
    : null

  return (
    <div className="zona-impresion" style={{
      background: '#fff', color: '#000', padding: 28,
      fontFamily: 'system-ui, sans-serif', fontSize: 12, lineHeight: 1.45,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 14,
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>InCollege</p>
          <p style={{ margin: 0, fontSize: 11, color: '#555' }}>Indumentaria escolar · Rosario</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Pedido #{orden.numero}</p>
          <p style={{ margin: 0, fontSize: 11, color: '#555' }}>
            {new Date(orden.createdAt).toLocaleString('es-AR')}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700 }}>{orden.estado}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 28 }}>
        <div style={{ flex: 1 }}>
          <Seccion titulo="Cliente">
            <Fila etiqueta="Nombre">{cliente}</Fila>
            <Fila etiqueta="Email">{email}</Fila>
            <Fila etiqueta="WhatsApp">{telefono}</Fila>
            {!orden.usuario && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#777' }}>Compra como invitado</p>}
          </Seccion>
        </div>

        <div style={{ flex: 1 }}>
          <Seccion titulo={esEnvio ? 'Envío' : 'Retiro'}>
            <Fila etiqueta={esEnvio ? 'Modalidad' : 'Local'}>{orden.entrega?.nombre}</Fila>
            <Fila etiqueta="Dirección">{domicilio}</Fila>
            <Fila etiqueta="Localidad">{localidad}</Fila>
            <Fila etiqueta="Día">{fechaEntrega}</Fila>
            <Fila etiqueta="Horario">{orden.entregaFranja ? `${orden.entregaFranja} hs` : null}</Fila>
          </Seccion>
        </div>
      </div>

      <Seccion titulo="Productos">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #999', textAlign: 'left' }}>
              <th style={{ padding: '3px 0', fontSize: 11 }}>Producto</th>
              <th style={{ padding: '3px 6px', fontSize: 11 }}>Talle</th>
              <th style={{ padding: '3px 6px', fontSize: 11 }}>Color</th>
              <th style={{ padding: '3px 6px', fontSize: 11, textAlign: 'center' }}>Cant.</th>
              <th style={{ padding: '3px 6px', fontSize: 11, textAlign: 'right' }}>Unitario</th>
              <th style={{ padding: '3px 0', fontSize: 11, textAlign: 'right' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {orden.items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '4px 0' }}>{item.producto?.nombre}</td>
                <td style={{ padding: '4px 6px' }}>{item.variante?.talle}</td>
                <td style={{ padding: '4px 6px' }}>{item.variante?.color ?? '—'}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center' }}>{item.cantidad}</td>
                <td style={{ padding: '4px 6px', textAlign: 'right' }}>{formatPrecio(item.precioUnit)}</td>
                <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 500 }}>{formatPrecio(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Seccion>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 28 }}>
        <div style={{ flex: 1 }}>
          <Seccion titulo="Pago">
            <Fila etiqueta="Método">{ETIQUETA_PAGO[orden.metodoPago] ?? orden.metodoPago ?? 'A definir'}</Fila>
            <Fila etiqueta="Cupón">{orden.cupon?.codigo}</Fila>
            {orden.metodoPago === 'efectivo' && orden.estado === 'PENDIENTE' && (
              <p style={{ margin: '6px 0 0', fontWeight: 700 }}>PENDIENTE DE COBRO</p>
            )}
          </Seccion>
        </div>

        <div style={{ width: 230 }}>
          <Seccion titulo="Totales">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span><span>{formatPrecio(orden.subtotal)}</span>
            </div>
            {Number(orden.descuento) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Descuento</span><span>−{formatPrecio(orden.descuento)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Envío</span>
              <span>{Number(orden.costoEnvio) === 0 ? (esEnvio ? 'A cotizar' : 'Gratis') : formatPrecio(orden.costoEnvio)}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              borderTop: '1px solid #000', marginTop: 4, paddingTop: 4,
              fontSize: 15, fontWeight: 800,
            }}>
              <span>Total</span><span>{formatPrecio(orden.total)}</span>
            </div>
          </Seccion>
        </div>
      </div>

      {orden.historial?.length > 0 && (
        <Seccion titulo="Historial">
          {orden.historial.map(h => (
            <div key={h.id} style={{ fontSize: 11, color: '#555' }}>
              {new Date(h.createdAt).toLocaleString('es-AR')} · {h.estado}
              {h.nota ? ` · ${h.nota}` : ''}
            </div>
          ))}
        </Seccion>
      )}

      <p style={{ marginTop: 18, paddingTop: 6, borderTop: '1px solid #ccc', fontSize: 10, color: '#777' }}>
        Dean Funes 1258 · Eva Perón 7790 · Alberdi 608 — Rosario · WhatsApp 341 743 4552
      </p>
    </div>
  )
}
