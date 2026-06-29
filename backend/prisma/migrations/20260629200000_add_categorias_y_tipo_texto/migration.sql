-- CreateTable Categoria
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");

-- AlterTable Producto: enum → text (preserva datos existentes)
ALTER TABLE "Producto" ALTER COLUMN "tipo" TYPE TEXT USING "tipo"::text;
ALTER TABLE "Producto" ALTER COLUMN "tipo" SET DEFAULT 'REMERA';

-- AlterTable AlumnoTalle: enum → text
ALTER TABLE "AlumnoTalle" ALTER COLUMN "tipoPrenda" TYPE TEXT USING "tipoPrenda"::text;

-- DropEnum
DROP TYPE IF EXISTS "TipoProducto";

-- Seed categorías iniciales
INSERT INTO "Categoria" ("id", "nombre", "activo", "orden", "createdAt") VALUES
  (gen_random_uuid()::text, 'REMERA',   true, 1, NOW()),
  (gen_random_uuid()::text, 'CHOMBA',   true, 2, NOW()),
  (gen_random_uuid()::text, 'BUZO',     true, 3, NOW()),
  (gen_random_uuid()::text, 'PANTALON', true, 4, NOW()),
  (gen_random_uuid()::text, 'CAMPERA',  true, 5, NOW()),
  (gen_random_uuid()::text, 'OTRO',     true, 6, NOW());
