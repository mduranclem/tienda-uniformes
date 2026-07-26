-- AlterTable
ALTER TABLE "Entrega" ADD COLUMN     "cotizado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Orden" ADD COLUMN     "servicioEnvio" TEXT;

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "pesoGramos" INTEGER;

-- CreateTable
CREATE TABLE "ZonaEnvio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "precioKgAdicional" DECIMAL(10,2),

    CONSTRAINT "ZonaEnvio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RangoCP" (
    "id" TEXT NOT NULL,
    "zonaId" TEXT NOT NULL,
    "desde" INTEGER NOT NULL,
    "hasta" INTEGER NOT NULL,

    CONSTRAINT "RangoCP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarifaEnvio" (
    "id" TEXT NOT NULL,
    "zonaId" TEXT NOT NULL,
    "pesoHastaG" INTEGER NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "TarifaEnvio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ZonaEnvio_nombre_key" ON "ZonaEnvio"("nombre");

-- CreateIndex
CREATE INDEX "RangoCP_desde_hasta_idx" ON "RangoCP"("desde", "hasta");

-- CreateIndex
CREATE UNIQUE INDEX "TarifaEnvio_zonaId_pesoHastaG_key" ON "TarifaEnvio"("zonaId", "pesoHastaG");

-- AddForeignKey
ALTER TABLE "RangoCP" ADD CONSTRAINT "RangoCP_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "ZonaEnvio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarifaEnvio" ADD CONSTRAINT "TarifaEnvio_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "ZonaEnvio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
