-- Restringe el bucket `productos` a los administradores.
--
-- Antes: cualquier usuario autenticado podía subir y borrar archivos. Como el
-- registro es abierto, alcanzaba con crearse una cuenta de cliente para borrar
-- todas las fotos del catálogo o llenar el bucket de basura.
--
-- La lectura sigue siendo pública: son las fotos de los productos y las tiene
-- que ver cualquiera que entre a la tienda.
--
-- De paso agrega la política de UPDATE que faltaba. El panel sube con
-- `upsert: true`, que sobre un archivo ya existente es un UPDATE, no un
-- INSERT: sin esta política, reemplazar una foto fallaba.
--
-- Cómo correrlo: dashboard de Supabase → SQL Editor → pegar y ejecutar.
-- Es idempotente.

-- Quién es admin. Va en una función SECURITY DEFINER porque la consulta la
-- hace el rol `authenticated`, que con RLS activado no puede leer la tabla
-- Usuario: la función corre con los permisos de su dueño y devuelve solo un
-- booleano, sin exponer ninguna fila.
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."Usuario"
    WHERE id = auth.uid()::text AND rol = 'ADMIN'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.es_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.es_admin() TO authenticated;

-- Subida
DROP POLICY IF EXISTS "Subida autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Subida admins" ON storage.objects;
CREATE POLICY "Subida admins" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'productos' AND public.es_admin());

-- Reemplazo (upsert sobre un archivo que ya existe)
DROP POLICY IF EXISTS "Reemplazo admins" ON storage.objects;
CREATE POLICY "Reemplazo admins" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'productos' AND public.es_admin())
  WITH CHECK (bucket_id = 'productos' AND public.es_admin());

-- Borrado
DROP POLICY IF EXISTS "Borrado autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Borrado admins" ON storage.objects;
CREATE POLICY "Borrado admins" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'productos' AND public.es_admin());

-- Verificación: la lectura queda en {public}, las otras tres en {authenticated}
-- y con es_admin() en la condición.
SELECT policyname, cmd, roles::text AS roles,
       coalesce(qual, with_check) LIKE '%es_admin%' AS exige_admin
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY cmd;
