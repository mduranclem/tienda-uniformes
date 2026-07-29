-- CreateEnum
CREATE TYPE "TipoMovimientoStock" AS ENUM ('VENTA', 'INGRESO', 'AJUSTE', 'DEVOLUCION');

-- CreateTable PuntoDeVenta
CREATE TABLE "PuntoDeVenta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "apiKeyUltimos4" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PuntoDeVenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable MovimientoStock
CREATE TABLE "MovimientoStock" (
    "id" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "puntoDeVentaId" TEXT NOT NULL,
    "tipo" "TipoMovimientoStock" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MovimientoStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PuntoDeVenta_nombre_key" ON "PuntoDeVenta"("nombre");
CREATE UNIQUE INDEX "PuntoDeVenta_apiKeyHash_key" ON "PuntoDeVenta"("apiKeyHash");

-- CreateIndex
CREATE INDEX "MovimientoStock_varianteId_idx" ON "MovimientoStock"("varianteId");
CREATE INDEX "MovimientoStock_puntoDeVentaId_idx" ON "MovimientoStock"("puntoDeVentaId");
CREATE INDEX "MovimientoStock_createdAt_idx" ON "MovimientoStock"("createdAt");

-- AddForeignKey
ALTER TABLE "MovimientoStock" ADD CONSTRAINT "MovimientoStock_varianteId_fkey"
  FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovimientoStock" ADD CONSTRAINT "MovimientoStock_puntoDeVentaId_fkey"
  FOREIGN KEY ("puntoDeVentaId") REFERENCES "PuntoDeVenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
