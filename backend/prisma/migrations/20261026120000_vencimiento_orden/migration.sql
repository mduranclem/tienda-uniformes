-- AlterTable
ALTER TABLE "Orden" ADD COLUMN     "venceEl" TIMESTAMP(3);

-- Los pendientes que ya existen reciben 7 días desde el deploy y no desde que
-- se hicieron: si no, la primera pasada de la cancelación automática se
-- llevaría de golpe todos los pedidos viejos (y les mandaría a esas familias
-- un WhatsApp de "cancelado") sin que nadie los haya revisado.
UPDATE "Orden" SET "venceEl" = NOW() + INTERVAL '7 days' WHERE "estado" = 'PENDIENTE';
