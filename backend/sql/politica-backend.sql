-- Le devuelve el acceso al backend después de activar RLS.
--
-- Al activar RLS sin políticas, las tablas quedaron cerradas para TODOS los
-- roles que no las poseen ni tienen BYPASSRLS. La aplicación se conecta como
-- `tienda_app`, que no tiene ninguna de las dos cosas: la tienda pasó a
-- devolver cero productos.
--
-- (La verificación original no lo detectó porque se hizo con el rol `postgres`,
-- que sí tiene rolbypassrls y ve todo aunque haya RLS. Verificar con un usuario
-- más privilegiado que el de producción no verifica nada.)
--
-- Una política por tabla para `tienda_app` restaura el acceso sin reabrir la
-- API pública: las políticas son por rol, así que `anon` y `authenticated`
-- siguen sin ver nada. El backend es quien decide qué se muestra, como antes.
--
-- Es idempotente.

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity
      AND pg_has_role(current_user, c.relowner, 'USAGE')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "backend tienda_app" ON public.%I', t.relname);
    EXECUTE format(
      'CREATE POLICY "backend tienda_app" ON public.%I FOR ALL TO tienda_app USING (true) WITH CHECK (true)',
      t.relname);
    RAISE NOTICE 'política creada en %', t.relname;
  END LOOP;
END $$;

-- Verificación: toda tabla con RLS tiene que tener su política para el backend.
SELECT c.relname AS tabla_sin_politica_backend
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = c.relname
      AND p.policyname = 'backend tienda_app'
  );
