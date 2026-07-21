-- CreateTable PrecioBanda
CREATE TABLE "PrecioBanda" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "colegial" BOOLEAN NOT NULL,
    "talles" TEXT[],
    "precio" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrecioBanda_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrecioBanda" ADD CONSTRAINT "PrecioBanda_categoriaId_fkey"
  FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
