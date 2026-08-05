import { Link } from 'react-router-dom'
import PaginaTexto, { Seccion } from '../components/layout/PaginaTexto'
import { EMAIL_CONTACTO, WHATSAPP_LEGIBLE, DIRECCIONES, CIUDAD } from '../lib/contacto'

export default function TerminosPage() {
  return (
    <PaginaTexto
      titulo="Términos y condiciones"
      bajada="Condiciones de uso de la tienda y de las compras realizadas en incollege."
      actualizado="agosto de 2026"
    >
      <Seccion titulo="1. Quiénes somos">
        <p>
          InCollege es una tienda de indumentaria escolar con locales en {DIRECCIONES.join(', ')},
          {' '}{CIUDAD}. Al comprar en este sitio aceptás estas condiciones.
        </p>
      </Seccion>

      <Seccion titulo="2. Productos y disponibilidad">
        <p>
          Las fotos son ilustrativas y puede haber variaciones mínimas de tono según la pantalla
          y el lote de tela. El stock se descuenta al confirmarse el pago; si un artículo quedara
          sin stock después de tu compra, te contactamos para cambiarlo o devolverte el importe.
        </p>
        <p>
          Las prendas personalizadas con el escudo de un colegio se producen a pedido y no
          admiten cambio por arrepentimiento, salvo falla de fábrica.
        </p>
      </Seccion>

      <Seccion titulo="3. Precios y pagos">
        <p>
          Los precios están expresados en pesos argentinos e incluyen IVA. Pueden modificarse sin
          aviso previo; el precio válido es el vigente al momento de confirmar la compra.
        </p>
        <p>
          Los pagos se procesan a través de Mercado Pago. No almacenamos datos de tarjetas: los
          ingresás directamente en la plataforma de pago. El pedido se considera confirmado
          únicamente cuando recibimos la acreditación del pago.
        </p>
      </Seccion>

      <Seccion titulo="4. Entregas">
        <p>
          En Rosario y alrededores —Funes, Roldán, Pérez, Ibarlucea, Granadero Baigorria y Villa
          Gobernador Gálvez— el envío cuesta $5.000 y es sin cargo a partir de 2 prendas. El día y
          la franja horaria se coordinan durante el checkout. Al resto del país despachamos por
          Andreani; el costo se informa antes del despacho. También podés retirar por cualquiera de
          nuestros locales, sin cargo y con un 20% de descuento sobre el pedido.
        </p>
        <p>
          Los descuentos de la casa (20% por primera compra y 20% por retirar en el local)
          no se acumulan entre sí: se aplica uno solo. Los cupones sí se suman al descuento
          vigente.
        </p>
        <p>
          Los plazos son estimados y pueden verse afectados por demoras del correo o de la
          producción en temporada alta.
        </p>
      </Seccion>

      <Seccion titulo="5. Cambios y devoluciones">
        <p>
          Se rigen por nuestra <Link to="/cambios" className="text-[var(--marca-claro)] underline underline-offset-2">política de cambios</Link>,
          que forma parte de estos términos.
        </p>
      </Seccion>

      <Seccion titulo="6. Uso del sitio">
        <p>
          Los contenidos del sitio (textos, fotos y marca) pertenecen a InCollege. Los escudos y
          nombres de las instituciones son propiedad de cada colegio y se utilizan para
          identificar los productos correspondientes.
        </p>
      </Seccion>

      <Seccion titulo="7. Contacto">
        <p>
          Ante cualquier consulta o reclamo escribinos a {EMAIL_CONTACTO} o por WhatsApp
          al {WHATSAPP_LEGIBLE}. Estas condiciones se rigen por la legislación argentina y por la
          Ley 24.240 de Defensa del Consumidor.
        </p>
      </Seccion>
    </PaginaTexto>
  )
}
