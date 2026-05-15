const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'banners'
    `
    console.log('Columns in banners table:', JSON.stringify(columns, null, 2))
  } catch (e) {
    console.error('Error checking columns:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
