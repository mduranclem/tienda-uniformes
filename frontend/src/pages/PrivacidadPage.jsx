import PaginaTexto, { Seccion } from '../components/layout/PaginaTexto'
import { EMAIL_CONTACTO } from '../lib/contacto'

export default function PrivacidadPage() {
  return (
    <PaginaTexto
      titulo="Política de privacidad"
      bajada="Qué datos te pedimos, para qué los usamos y cómo pedir que los borremos."
      actualizado="agosto de 2026"
    >
      <Seccion titulo="Qué datos guardamos">
        <p>
          Para procesar tu pedido guardamos tu nombre, email, teléfono y, si elegís envío, la
          dirección de entrega. Si creás una cuenta, también los talles que cargues para tus
          alumnos, con el único fin de facilitarte las próximas compras.
        </p>
        <p>
          No guardamos datos de tarjetas de crédito ni débito. Esa información la ingresás
          directamente en Mercado Pago, que la procesa bajo sus propias condiciones.
        </p>
      </Seccion>

      <Seccion titulo="Para qué los usamos">
        <p>
          Los usamos para preparar y entregar tu pedido, avisarte por email y WhatsApp cómo va tu
          compra, y responder tus consultas. Si aceptaste recibir promociones, también para
          enviarte novedades; podés darte de baja cuando quieras.
        </p>
      </Seccion>

      <Seccion titulo="Con quién los compartimos">
        <p>
          Solo con quienes hacen falta para completar la compra: Mercado Pago para el cobro,
          Andreani para los envíos al interior y los proveedores técnicos que alojan la tienda y
          envían las notificaciones. No vendemos ni cedemos tus datos a terceros con fines
          publicitarios.
        </p>
      </Seccion>

      <Seccion titulo="Cookies">
        <p>
          Usamos cookies propias para mantener tu sesión iniciada y recordar el contenido del
          carrito. Podés bloquearlas desde tu navegador, aunque en ese caso algunas funciones
          del sitio pueden dejar de andar.
        </p>
      </Seccion>

      <Seccion titulo="Tus derechos">
        <p>
          Podés pedirnos acceder a tus datos, corregirlos o borrarlos escribiendo a {EMAIL_CONTACTO}.
          Tratamos la información de acuerdo con la Ley 25.326 de Protección de los Datos
          Personales. La Agencia de Acceso a la Información Pública es el órgano de control y
          atiende los reclamos de quienes se vean afectados.
        </p>
      </Seccion>
    </PaginaTexto>
  )
}
