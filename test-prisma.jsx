import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
  try {
    const users = await prisma.user.findMany()
    console.log('Users found:', users.length)

    const products = await prisma.product.findMany()
    console.log('Products found:', products.length)
  } catch (e) {
    console.error('Error querying Prisma:', e)
  } finally {
    await prisma.$disconnect()
  }
}

test()
