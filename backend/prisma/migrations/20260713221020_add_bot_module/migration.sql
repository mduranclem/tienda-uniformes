-- CreateTable
CREATE TABLE "ConfigTienda" (
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "ConfigTienda_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "AlertaStock" (
    "id" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "notificada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertaStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlertaStock_varianteId_notificada_idx" ON "AlertaStock"("varianteId", "notificada");

-- AddForeignKey
ALTER TABLE "AlertaStock" ADD CONSTRAINT "AlertaStock_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE CASCADE ON UPDATE CASCADE;
