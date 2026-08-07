import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.usuario.upsert({
    where: { codigo: 'ADMIN' },
    update: {
      clave: 'admin123',
      activo: true,
      esSupervisor: true
    },
    create: {
      codigo: 'ADMIN',
      nombre: 'Administrador del Sistema',
      clave: 'admin123',
      activo: true,
      esSupervisor: true,
      permisos: JSON.stringify({
        catalogos: true,
        inventario: true,
        actividades: true,
        planillas: true,
        reportes: true,
        configuracion: true
      })
    }
  });
  console.log('Admin user ensured:', admin);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
