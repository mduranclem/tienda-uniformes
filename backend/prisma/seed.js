const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Sembrando datos de prueba...')

  // ── Colegios ───────────────────────────────────────────────────────────────
  const colegio1 = await prisma.colegio.upsert({
    where: { slug: 'san-martin' },
    update: {},
    create: {
      nombre: 'Instituto San Martín',
      slug: 'san-martin',
      logo: 'https://placehold.co/64x64/1d4ed8/white?text=SM',
    },
  })

  const colegio2 = await prisma.colegio.upsert({
    where: { slug: 'belgrano' },
    update: {},
    create: {
      nombre: 'Colegio Belgrano',
      slug: 'belgrano',
      logo: 'https://placehold.co/64x64/15803d/white?text=CB',
    },
  })

  // ── Opciones de entrega ────────────────────────────────────────────────────
  await prisma.entrega.upsert({
    where: { id: 'entrega-envio' },
    update: {},
    create: {
      id: 'entrega-envio',
      tipo: 'ENVIO',
      nombre: 'Envío a domicilio',
      costo: 2500,
    },
  })

  await prisma.entrega.upsert({
    where: { id: 'entrega-retiro' },
    update: {},
    create: {
      id: 'entrega-retiro',
      tipo: 'RETIRO',
      nombre: 'Retiro en local (Av. Corrientes 1234, CABA)',
      costo: 0,
    },
  })

  // ── Productos ──────────────────────────────────────────────────────────────
  const productos = [
    {
      nombre: 'Remera Manga Corta San Martín',
      descripcion: 'Remera de algodón 100% con logo bordado del Instituto San Martín.',
      tipo: 'REMERA',
      precio: 8500,
      colegioId: colegio1.id,
      imagenes: [
        { url: 'https://placehold.co/600x600/dbeafe/1d4ed8?text=Remera+SM', orden: 0, alt: 'Remera San Martín frente' },
        { url: 'https://placehold.co/600x600/bfdbfe/1d4ed8?text=Remera+SM+dorso', orden: 1, alt: 'Remera San Martín dorso' },
      ],
      variantes: [
        { talle: '6', stock: 10 },
        { talle: '8', stock: 8 },
        { talle: '10', stock: 5 },
        { talle: '12', stock: 3 },
        { talle: '14', stock: 0 },
        { talle: 'S', stock: 6 },
        { talle: 'M', stock: 9 },
        { talle: 'L', stock: 4 },
        { talle: 'XL', stock: 2 },
      ],
    },
    {
      nombre: 'Buzo con Capucha San Martín',
      descripcion: 'Buzo de frisa con capucha, escudo bordado al tono.',
      tipo: 'BUZO',
      precio: 18900,
      colegioId: colegio1.id,
      imagenes: [
        { url: 'https://placehold.co/600x600/eff6ff/1d4ed8?text=Buzo+SM', orden: 0, alt: 'Buzo San Martín' },
      ],
      variantes: [
        { talle: 'S', stock: 5 },
        { talle: 'M', stock: 7 },
        { talle: 'L', stock: 6 },
        { talle: 'XL', stock: 3 },
        { talle: 'XXL', stock: 1 },
      ],
    },
    {
      nombre: 'Remera Colegio Belgrano',
      descripcion: 'Remera piqué con cuello redondo, diseño oficial del Colegio Belgrano.',
      tipo: 'REMERA',
      precio: 9200,
      colegioId: colegio2.id,
      imagenes: [
        { url: 'https://placehold.co/600x600/dcfce7/15803d?text=Remera+CB', orden: 0, alt: 'Remera Belgrano' },
      ],
      variantes: [
        { talle: '8', stock: 4 },
        { talle: '10', stock: 6 },
        { talle: 'S', stock: 8 },
        { talle: 'M', stock: 5 },
        { talle: 'L', stock: 3 },
      ],
    },
    {
      nombre: 'Remera Lisa Blanca',
      descripcion: 'Remera lisa de algodón jersey sin marca. Ideal para todos los colegios.',
      tipo: 'REMERA',
      precio: 6500,
      colegioId: null,
      imagenes: [
        { url: 'https://placehold.co/600x600/f8fafc/94a3b8?text=Remera+Lisa', orden: 0, alt: 'Remera lisa blanca' },
      ],
      variantes: [
        { talle: '6', color: 'Blanco', stock: 12 },
        { talle: '8', color: 'Blanco', stock: 10 },
        { talle: '10', color: 'Blanco', stock: 8 },
        { talle: 'S', color: 'Blanco', stock: 15 },
        { talle: 'M', color: 'Blanco', stock: 15 },
        { talle: 'L', color: 'Blanco', stock: 10 },
        { talle: 'XL', color: 'Blanco', stock: 6 },
      ],
    },
    {
      nombre: 'Remera Lisa Negra',
      descripcion: 'Remera lisa de algodón jersey sin marca, color negro.',
      tipo: 'REMERA',
      precio: 6500,
      colegioId: null,
      imagenes: [
        { url: 'https://placehold.co/600x600/1e293b/94a3b8?text=Remera+Lisa', orden: 0, alt: 'Remera lisa negra' },
      ],
      variantes: [
        { talle: '6', color: 'Negro', stock: 10 },
        { talle: '8', color: 'Negro', stock: 9 },
        { talle: 'S', color: 'Negro', stock: 12 },
        { talle: 'M', color: 'Negro', stock: 14 },
        { talle: 'L', color: 'Negro', stock: 8 },
        { talle: 'XL', color: 'Negro', stock: 5 },
      ],
    },
  ]

  for (const p of productos) {
    const { imagenes, variantes, ...data } = p
    const producto = await prisma.producto.create({
      data: {
        ...data,
        imagenes: { create: imagenes },
        variantes: { create: variantes },
      },
    })
    console.log(`  ✓ ${producto.nombre}`)
  }

  console.log('\nSeed completado.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
