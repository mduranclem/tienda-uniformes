-- AlterTable
ALTER TABLE "Categoria" ADD COLUMN     "precio" DECIMAL(10,2);

-- El precio pasa a ser uno por prenda. Hasta cargar la lista nueva, cada
-- categoría queda con el precio de su talle más chico, que es el que ya se
-- mostraba como precio "desde" en la tienda.
UPDATE "Categoria" c
SET "precio" = b.minimo
FROM (SELECT "categoriaId", MIN("precio") AS minimo FROM "PrecioBanda" GROUP BY "categoriaId") b
WHERE b."categoriaId" = c."id";

-- Sin precio por variante: todos los talles cobran el precio del producto
-- (o su oferta, si tiene).
UPDATE "Variante" SET "precio" = NULL WHERE "precio" IS NOT NULL;
