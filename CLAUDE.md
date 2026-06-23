# Tienda Indumentaria Escolar

## Qué es
Tienda online B2C para consumidor final (alumnos de colegios y familias).
Venta de remeras y prendas, lisas y personalizadas por colegio. El cliente
entra, ve qué hay disponible, filtra por colegio o por "lisos", arma el
carrito y paga online.

## Stack (NO cambiar sin avisar)
- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Express + Prisma
- DB: PostgreSQL (Supabase)
- Auth: Supabase Auth (magic link + Google opcional)
- Deploy: vía GitHub
- Pagos: Mercado Pago (modo test primero) + NAVE (Banco Galicia) más adelante

## Modelo de datos (entidades core)
- Colegio: nombre, logo, slug. Agrupa los modelos disponibles para ese colegio.
- Producto: nombre, descripción, tipo, precio, pertenece a un Colegio o a "Lisos".
- ProductImage: productId, url, orden, alt (varias fotos por producto).
- Variante: talle + color + stock (stock por variante, no por producto).
- Carrito y Orden: items, totales.
- EstadoOrden: pendiente / pagada / preparando / lista / entregada / cancelada.
- Usuario: registro con email (checkout invitado permitido).
- Promocion / Cupon: descuentos por producto, categoría o colegio, y códigos.
- Entrega: envío a domicilio o retiro en local, con su costo.

## Pagos (IMPORTANTE — Argentina)
- NO usar Stripe (no cobra en Argentina).
- Mercado Pago como principal, SIEMPRE primero en modo sandbox/test.
- NAVE (Banco Galicia) como opción adicional más adelante.
- La orden SOLO se marca como pagada al recibir el webhook de confirmación,
  NUNCA desde el frontend.
- Usar Context7 para la documentación vigente de cada pasarela.

## Notificaciones
- Confirmación de compra por email (base).
- WhatsApp vía webhook a n8n (lo conecto yo después).
- Promos por email; WhatsApp masivo solo con opt-in y API oficial.

## Reglas de diseño
- Mobile-first (la mayoría compra desde el celular), luego desktop.
- Estilo tipo Tiendanube / Mercado Libre: grilla de productos con foto,
  precio y cuotas; buscador arriba; filtros por colegio y "Lisos".
- Página de producto con galería + zoom y selector de talle/color.
- Limpio y moderno. NADA de aspecto "template de IA".

## Reglas de trabajo
- Plan mode antes de features grandes; mostrar el plan y esperar aprobación.
- No instalar dependencias sin avisar.
- Stock con control para no sobrevender.
- Textos y datos en español, con tildes correctas.