-- CreateTable ProductoColor
CREATE TABLE "ProductoColor" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductoColor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductoColor_productoId_nombre_key" ON "ProductoColor"("productoId", "nombre");

-- AddForeignKey
ALTER TABLE "ProductoColor" ADD CONSTRAINT "ProductoColor_productoId_fkey"
  FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrar colores existentes desde las variantes
INSERT INTO "ProductoColor" ("id", "productoId", "nombre", "createdAt")
SELECT gen_random_uuid()::text, "productoId", "color", NOW()
FROM "Variante"
WHERE "color" IS NOT NULL
ON CONFLICT DO NOTHING;
