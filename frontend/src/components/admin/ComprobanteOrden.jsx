import { createPortal } from 'react-dom'
import { formatPrecio } from '../../lib/utils'

// Comprobante imprimible de un pedido. Los estilos viven en index.css bajo el
// prefijo .comprobante-*, porque @page, @media print y el forzado de fondos no
// se pueden expresar con estilos en línea.
//
// Se monta con un portal al body y no dentro del modal: el modal es
// position:fixed con scroll propio, y los navegadores recortan u omiten ese
// tipo de contenedores al imprimir.

const ETIQUETA_PAGO = {
  mercadopago: 'Mercado Pago',
  efectivo: 'Efectivo al retirar',
}

function Dato({ etiqueta, children }) {
  if (!children) return null
  return (
    <div className="comprobante-dato">
      <dt>{etiqueta}</dt>
      <dd>{children}</dd>
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

  // timeZone UTC: la fecha se guarda como día de calendario al mediodía UTC,
  // convertirla a local la correría un día.
  const fechaEntrega = orden.entregaFecha
    ? new Date(orden.entregaFecha).toLocaleDateString('es-AR', {
        timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long',
      })
    : null

  const descuento = Number(orden.descuento)
  const costoEnvio = Number(orden.costoEnvio)
  const cobrarEnEfectivo = orden.metodoPago === 'efectivo' && orden.estado === 'PENDIENTE'

  return createPortal(
    <div className="comprobante">

      <header className="comprobante-header">
        {/* Versión recortada y en escala de grises: el logo original es
            cuadrado con mucho margen transparente y ocupaba alto sin mostrar
            nada, empujando el comprobante a una segunda hoja. */}
        <img src="/logo-print.png" alt="InCollege" className="comprobante-logo" />
        <p className="comprobante-marca">Indumentaria escolar · Rosario</p>

        <div className="comprobante-pedido">
          <p className="comprobante-pedido-numero">Pedido #{orden.numero}</p>
          <p className="comprobante-pedido-dato">
            {new Date(orden.createdAt).toLocaleString('es-AR')}
          </p>
          <p className="comprobante-pedido-estado">{orden.estado}</p>
        </div>
      </header>

      <div className="comprobante-columnas">
        <section className="comprobante-caja">
          <h2>Cliente</h2>
          <dl>
            <Dato etiqueta="Nombre">{cliente}</Dato>
            <Dato etiqueta="Email">{email}</Dato>
            <Dato etiqueta="WhatsApp">{telefono}</Dato>
            <Dato etiqueta="Cuenta">{orden.usuario ? 'Registrada' : 'Compra como invitado'}</Dato>
          </dl>
        </section>

        <section className="comprobante-caja">
          <h2>{esEnvio ? 'Envío a domicilio' : 'Retiro en local'}</h2>
          <dl>
            <Dato etiqueta={esEnvio ? 'Modalidad' : 'Local'}>{orden.entrega?.nombre}</Dato>
            <Dato etiqueta="Dirección">{domicilio}</Dato>
            <Dato etiqueta="Localidad">{localidad}</Dato>
            <Dato etiqueta="Día">{fechaEntrega}</Dato>
            <Dato etiqueta="Horario">{orden.entregaFranja ? `${orden.entregaFranja} hs` : null}</Dato>
          </dl>
        </section>
      </div>

      <h2 className="comprobante-titulo">Productos</h2>
      <table className="comprobante-tabla">
        <thead>
          <tr>
            <th>Producto</th>
            <th className="comprobante-centro">Talle</th>
            <th className="comprobante-centro">Color</th>
            <th className="comprobante-centro">Cant.</th>
            <th className="comprobante-numero">Unitario</th>
            <th className="comprobante-numero">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {orden.items.map(item => (
            <tr key={item.id}>
              <td className="comprobante-producto">{item.producto?.nombre}</td>
              <td className="comprobante-centro">{item.variante?.talle}</td>
              <td className="comprobante-centro">{item.variante?.color ?? '—'}</td>
              <td className="comprobante-centro">{item.cantidad}</td>
              <td className="comprobante-numero">{formatPrecio(item.precioUnit)}</td>
              <td className="comprobante-numero">{formatPrecio(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="comprobante-columnas">
        <section className="comprobante-caja">
          <h2>Pago</h2>
          <dl>
            <Dato etiqueta="Método">
              {ETIQUETA_PAGO[orden.metodoPago] ?? orden.metodoPago ?? 'A definir'}
            </Dato>
            <Dato etiqueta="Cupón">{orden.cupon?.codigo}</Dato>
          </dl>
          {cobrarEnEfectivo && (
            <p className="comprobante-aviso">▸ PENDIENTE DE COBRO</p>
          )}
        </section>

        <div className="comprobante-totales">
          <div className="comprobante-total-fila">
            <span>Subtotal</span>
            <span className="comprobante-numero">{formatPrecio(orden.subtotal)}</span>
          </div>
          {descuento > 0 && (
            <div className="comprobante-total-fila">
              <span>Descuento a favor</span>
              <span className="comprobante-numero">− {formatPrecio(descuento)}</span>
            </div>
          )}
          <div className="comprobante-total-fila">
            <span>Envío</span>
            <span className="comprobante-numero">
              {costoEnvio === 0 ? (esEnvio ? 'A cotizar' : 'Gratis') : formatPrecio(costoEnvio)}
            </span>
          </div>
          <div className="comprobante-total-final">
            <span>TOTAL</span>
            <span className="comprobante-numero">{formatPrecio(orden.total)}</span>
          </div>
        </div>
      </div>

      {orden.historial?.length > 0 && (
        <div className="comprobante-historial">
          {orden.historial.map(h => (
            <div key={h.id}>
              {new Date(h.createdAt).toLocaleString('es-AR')} · {h.estado}
              {h.nota ? ` · ${h.nota}` : ''}
            </div>
          ))}
        </div>
      )}

      <footer className="comprobante-footer">
        Dean Funes 1258 · Eva Perón 7790 · Alberdi 608 — Rosario<br />
        WhatsApp 341 743 4552 · tiendadeuniformes.store
      </footer>

    </div>,
    document.body
  )
}
