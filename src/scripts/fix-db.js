const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Adding description column to banners table...')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "banners" ADD COLUMN IF NOT EXISTS "description" TEXT;
    `)
    console.log('✅ Column added (or already existed).')
  } catch (e) {
    console.error('❌ Error adding column:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
