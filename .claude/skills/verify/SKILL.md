---
name: verify
description: Cómo levantar y verificar tienda-uniformes end-to-end en esta máquina (sin credenciales reales)
---

# Verificar tienda-uniformes localmente

## Contexto clave
- El repo NO tiene `.env` versionado; las credenciales reales (Supabase, Mercado Pago, Resend) las maneja el dueño.
- Sin credenciales se puede verificar TODO el flujo invitado (catálogo → ficha → carrito → checkout → orden → botón de pago). No se puede: login/admin UI (Supabase real), redirect real a MP.
- El carrito es estado en memoria (sin localStorage): un reload lo vacía. En Playwright navegar SIEMPRE in-app (el header abre un CartDrawer con CTA "Finalizar compra" → /checkout; no hay link a /carrito).
- La ficha bloquea la compra si ninguna variante tiene `color` (el seed no carga colores → asignarlos por DB antes de probar compra).
- Frontend espera el backend en `http://localhost:3000/api` (setear `PORT=3000`; el default del backend es 3001).
- `frontend/src/lib/supabaseClient.js` tira error si faltan `VITE_SUPABASE_URL/ANON_KEY` → usar dummies válidos como URL.
- Backend necesita `RESEND_API_KEY` dummy (el constructor de Resend explota sin key) y `SUPABASE_URL/ANON_KEY` dummies.

## Levantar (una vez por sesión)
1. Postgres embebido (si no hay DB): `npm i embedded-postgres` en un dir temporal; binarios en `node_modules/@embedded-postgres/windows-x64/native/bin`:
   - `initdb.exe -D <data> -U postgres -A trust -E UTF8 --no-locale`
   - `pg_ctl.exe -D <data> -o "-p 5433" -l <log> start` (no trae createdb/psql: usar la DB `postgres`)
2. `backend/.env`: `DATABASE_URL/DIRECT_URL=postgresql://postgres@localhost:5433/postgres`, `PORT=3000`, dummies para Supabase/MP/Resend, `FRONTEND_URL=http://localhost:5173`.
3. `frontend/.env`: `VITE_SUPABASE_URL=https://dummy.supabase.co`, `VITE_SUPABASE_ANON_KEY=dummy`.
4. `cd backend && npx prisma migrate deploy && node -r dotenv/config prisma/seed.js && node src/app.js` (background).
5. `cd frontend && npm run dev` (background). Health: `GET :3000/api/health` → `{"ok":true}`.

## Probar
- API: crear órdenes guest con `POST /api/ordenes` (authOpcional). Marcar PAGADA vía Prisma directo (simula webhook MP). Los emails de prueba deben ser únicos por corrida (las órdenes persisten).
- UI: Playwright (instalar en dir temporal). Viewports: 375×812 / 768×1024 / 1280×800. Chequear siempre `scrollWidth <= clientWidth` (regla mobile-first del proyecto).
- El stock se descuenta al crear la orden: reponer stock entre corridas o los talles se agotan y los botones quedan deshabilitados.
- Placeholders ambiguos: usar `getByPlaceholder(..., { exact: true })` ("1234" también matchea "11 1234-5678").
