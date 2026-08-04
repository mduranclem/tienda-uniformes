-- Cierra la API REST de Supabase sobre las tablas de la tienda.
--
-- El problema: la anon key viaja en el JavaScript de la tienda, así que es
-- pública por diseño. Con RLS apagado, cualquiera con esa clave podía leer y
-- escribir las tablas del esquema public a través de /rest/v1 — órdenes,
-- usuarios, alumnos, precios y cupones incluidos.
--
-- Activar RLS sin crear ninguna política deja la tabla cerrada para todos los
-- roles que pasan por la API (anon y authenticated).
--
-- OJO: también la cierra para la aplicación. Producción se conecta como
-- `tienda_app`, que no es dueño de estas tablas ni tiene BYPASSRLS, así que sin
-- una política propia deja de ver todo y la tienda queda sin productos. Correr
-- SIEMPRE politica-backend.sql junto con este archivo, y verificar con las
-- credenciales de producción y no con las de `postgres`, que tiene rolbypassrls
-- y ve todo aunque esté mal.
--
-- Cómo correrlo: dashboard de Supabase → SQL Editor → pegar y ejecutar.
-- Es idempotente: se puede correr las veces que haga falta.

DO $$
DECLARE
  t record;
  ajenas text[] := '{}';
BEGIN
  FOR t IN
    SELECT c.relname, c.relowner
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT c.relrowsecurity
  LOOP
    -- ALTER TABLE exige ser dueño de la tabla. Tres tablas las creó
    -- `tienda_app` y `postgres` no puede tocarlas; saltearlas evita que el
    -- bloque entero aborte y deje sin cerrar a las demás. Esas tres no tienen
    -- ningún GRANT para `anon`, así que la API pública no las alcanza igual.
    IF pg_has_role(current_user, t.relowner, 'USAGE') THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.relname);
      RAISE NOTICE 'RLS activado en %', t.relname;
    ELSE
      ajenas := ajenas || t.relname;
    END IF;
  END LOOP;

  IF array_length(ajenas, 1) > 0 THEN
    RAISE NOTICE 'Sin permiso para: % (las creó otro rol, no las alcanza la API)',
      array_to_string(ajenas, ', ');
  END IF;
END $$;

-- Verificación. Lo único que puede quedar acá son las tablas de `tienda_app`,
-- y la columna `anon_lee` tiene que decir false en todas.
SELECT c.relname             AS tabla_sin_rls,
       pg_get_userbyid(c.relowner) AS dueno,
       has_table_privilege('anon', c.oid, 'SELECT') AS anon_lee
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;
