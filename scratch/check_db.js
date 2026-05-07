
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.user.findMany();
    const settings = await prisma.siteSetting.findMany();
    console.log('Users:', users.map(u => ({ email: u.email, role: u.role })));
    console.log('Settings count:', settings.length);
    console.log('Settings:', settings);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
