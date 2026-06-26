-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AplicaA" AS ENUM ('TODO', 'COLEGIO', 'PRODUCTO');

-- CreateEnum
CREATE TYPE "public"."EstadoOrden" AS ENUM ('PENDIENTE', 'PAGADA', 'PREPARANDO', 'LISTA', 'ENTREGADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."RolUsuario" AS ENUM ('CLIENTE', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."TipoDescuento" AS ENUM ('PORCENTAJE', 'MONTO_FIJO');

-- CreateEnum
CREATE TYPE "public"."TipoEntrega" AS ENUM ('ENVIO', 'RETIRO');

-- CreateEnum
CREATE TYPE "public"."TipoProducto" AS ENUM ('REMERA', 'BUZO', 'PANTALON', 'CAMPERA', 'OTRO');

-- CreateTable
CREATE TABLE "public"."Alumno" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "colegioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AlumnoTalle" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "tipoPrenda" "public"."TipoProducto" NOT NULL,
    "talle" TEXT NOT NULL,

    CONSTRAINT "AlumnoTalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BannerSlide" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "titulo" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannerSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Carrito" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carrito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Colegio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Colegio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cupon" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "public"."TipoDescuento" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "aplicaA" "public"."AplicaA" NOT NULL,
    "colegioId" TEXT,
    "usosMax" INTEGER,
    "usosActuales" INTEGER NOT NULL DEFAULT 0,
    "minimoCompra" DECIMAL(10,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "desde" TIMESTAMP(3),
    "hasta" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productoId" TEXT,

    CONSTRAINT "Cupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Entrega" (
    "id" TEXT NOT NULL,
    "tipo" "public"."TipoEntrega" NOT NULL,
    "nombre" TEXT NOT NULL,
    "costo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HistorialOrden" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "estado" "public"."EstadoOrden" NOT NULL,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialOrden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItemCarrito" (
    "id" TEXT NOT NULL,
    "carritoId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnit" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ItemCarrito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItemOrden" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnit" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ItemOrden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Orden" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "usuarioId" TEXT,
    "emailGuest" TEXT,
    "nombreGuest" TEXT,
    "telefonoGuest" TEXT,
    "estado" "public"."EstadoOrden" NOT NULL DEFAULT 'PENDIENTE',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "costoEnvio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "metodoPago" TEXT,
    "mpPaymentId" TEXT,
    "mpPreferenceId" TEXT,
    "cuponId" TEXT,
    "entregaId" TEXT,
    "domicilio" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductImage" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "alt" TEXT,
    "color" TEXT,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Producto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "public"."TipoProducto" NOT NULL DEFAULT 'REMERA',
    "precio" DECIMAL(10,2) NOT NULL,
    "colegioId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cuotas" INTEGER,
    "precioOferta" DECIMAL(10,2),

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Promocion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "public"."TipoDescuento" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "aplicaA" "public"."AplicaA" NOT NULL,
    "colegioId" TEXT,
    "productoId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "desde" TIMESTAMP(3),
    "hasta" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promocion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT,
    "telefono" TEXT,
    "rol" "public"."RolUsuario" NOT NULL DEFAULT 'CLIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Variante" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "talle" TEXT NOT NULL,
    "color" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,

    CONSTRAINT "Variante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Alumno_usuarioId_idx" ON "public"."Alumno"("usuarioId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AlumnoTalle_alumnoId_tipoPrenda_key" ON "public"."AlumnoTalle"("alumnoId" ASC, "tipoPrenda" ASC);

-- CreateIndex
CREATE INDEX "Carrito_sessionId_idx" ON "public"."Carrito"("sessionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Colegio_slug_key" ON "public"."Colegio"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Cupon_codigo_key" ON "public"."Cupon"("codigo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ItemCarrito_carritoId_varianteId_key" ON "public"."ItemCarrito"("carritoId" ASC, "varianteId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "public"."Usuario"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Variante_productoId_talle_color_key" ON "public"."Variante"("productoId" ASC, "talle" ASC, "color" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Variante_sku_key" ON "public"."Variante"("sku" ASC);

-- AddForeignKey
ALTER TABLE "public"."Alumno" ADD CONSTRAINT "Alumno_colegioId_fkey" FOREIGN KEY ("colegioId") REFERENCES "public"."Colegio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alumno" ADD CONSTRAINT "Alumno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AlumnoTalle" ADD CONSTRAINT "AlumnoTalle_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "public"."Alumno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Carrito" ADD CONSTRAINT "Carrito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cupon" ADD CONSTRAINT "Cupon_colegioId_fkey" FOREIGN KEY ("colegioId") REFERENCES "public"."Colegio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cupon" ADD CONSTRAINT "Cupon_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "public"."Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistorialOrden" ADD CONSTRAINT "HistorialOrden_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "public"."Orden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemCarrito" ADD CONSTRAINT "ItemCarrito_carritoId_fkey" FOREIGN KEY ("carritoId") REFERENCES "public"."Carrito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemCarrito" ADD CONSTRAINT "ItemCarrito_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "public"."Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemCarrito" ADD CONSTRAINT "ItemCarrito_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "public"."Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemOrden" ADD CONSTRAINT "ItemOrden_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "public"."Orden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemOrden" ADD CONSTRAINT "ItemOrden_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "public"."Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemOrden" ADD CONSTRAINT "ItemOrden_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "public"."Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Orden" ADD CONSTRAINT "Orden_cuponId_fkey" FOREIGN KEY ("cuponId") REFERENCES "public"."Cupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Orden" ADD CONSTRAINT "Orden_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "public"."Entrega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Orden" ADD CONSTRAINT "Orden_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductImage" ADD CONSTRAINT "ProductImage_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "public"."Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Producto" ADD CONSTRAINT "Producto_colegioId_fkey" FOREIGN KEY ("colegioId") REFERENCES "public"."Colegio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Variante" ADD CONSTRAINT "Variante_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "public"."Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
