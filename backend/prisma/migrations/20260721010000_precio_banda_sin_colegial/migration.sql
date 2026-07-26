-- Cada Categoria ya es específica (ej. "CHOMBA BORDADA" vs "CHOMBA LISA"),
-- el split colegial/liso a nivel de banda queda redundante.
ALTER TABLE "PrecioBanda" DROP COLUMN "colegial";
