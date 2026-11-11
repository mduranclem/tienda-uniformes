-- AlterTable
ALTER TABLE "BannerSlide" ADD COLUMN     "enlace" TEXT;

-- La tabla pasa a alimentar los Destacados de la portada. Las imágenes que ya
-- había eran del carrusel viejo, que hace meses no se muestra: se ocultan para
-- que no aparezcan de golpe en la portada. Se pueden volver a mostrar desde el
-- panel.
UPDATE "BannerSlide" SET "activo" = false;
