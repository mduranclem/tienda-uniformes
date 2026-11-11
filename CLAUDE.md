# Tienda Indumentaria Escolar

## Qué es
Tienda online B2C para consumidor final (alumnos de colegios y familias).
Venta de remeras y prendas, lisas y personalizadas por colegio. El cliente
entra, ve qué hay disponible, filtra por colegio o por "lisos", arma el
carrito y paga por transferencia o en efectivo en el local.

## Stack (NO cambiar sin avisar)
- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Express + Prisma
- DB: PostgreSQL (Supabase)
- Auth: Supabase Auth (magic link + Google opcional)
- Deploy: vía GitHub
- Pagos: transferencia bancaria y pago en el local (Mercado Pago apagado)

## Modelo de datos (entidades core)
- Colegio: nombre, logo, slug. Agrupa los modelos disponibles para ese colegio.
- Categoria: tipo de prenda ("REMERA BORDADA") con UN precio para todos los
  talles. Producto.precio es una copia que se actualiza al guardar la categoría.
  No hay precio por talle ni por variante.
- Producto: nombre, descripción, tipo, precio, pertenece a un Colegio o a "Lisos".
- ProductImage: productId, url, orden, alt (varias fotos por producto).
- Variante: talle + color + stock (stock por variante, no por producto).
- Carrito y Orden: items, totales.
- EstadoOrden: pendiente / pagada / preparando / lista / entregada / cancelada.
- Usuario: registro con email (checkout invitado permitido).
- Promocion / Cupon: descuentos por producto, categoría o colegio, y códigos.
- Entrega: envío a domicilio o retiro en local, con su costo.
- Destacados (BannerSlide): imágenes de promos arriba de todo en la portada,
  con link opcional; se cargan en Admin > Destacados.

## Pagos (IMPORTANTE — Argentina)
- Mercado Pago quedó apagado (sus comisiones encarecían los precios): el
  código sigue y se prende con la clave `mercadoPagoActivo` de ConfigTienda.
  No prenderlo ni agregar otra pasarela sin avisar.
- Formas de pago: transferencia (siempre) y pago en el local (solo con retiro,
  en efectivo o como prefiera el cliente).
- La confirmación del pedido, el mail y el WhatsApp de "pedido recibido" le
  pasan al cliente los datos para transferir y el monto; manda el comprobante
  por WhatsApp. Banco, titular, CBU, alias, CUIT y ese WhatsApp se cargan en
  el panel (Configuración) y ninguno es obligatorio.
- La orden se marca como pagada a mano desde el panel, al ver el comprobante,
  NUNCA desde el frontend de la tienda.
- Plazo de pago: 7 días (`venceEl`). El backend cancela los vencidos cada hora
  y devuelve el stock; desde el panel se puede dar 7 días más.
- Sin cuotas: no mostrar financiación en ningún lado.

## Notificaciones
- Confirmación de compra por email (base).
- WhatsApp vía webhook a n8n (lo conecto yo después).
- Promos por email; WhatsApp masivo solo con opt-in y API oficial.

## Reglas de diseño
- Mobile-first (la mayoría compra desde el celular), luego desktop.
- Estilo tipo Tiendanube / Mercado Libre: grilla de productos con foto,
  precio; buscador arriba; filtros por colegio y "Lisos".
- Página de producto con galería + zoom y selector de talle/color.
- Limpio y moderno. NADA de aspecto "template de IA".

## Reglas de trabajo
- Plan mode antes de features grandes; mostrar el plan y esperar aprobación.
- No instalar dependencias sin avisar.
- Stock con control para no sobrevender.
- Textos y datos en español, con tildes correctas.