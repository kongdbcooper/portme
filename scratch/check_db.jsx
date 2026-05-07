import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
})

async function main() {
  const settings = await prisma.siteSetting.findMany()
  console.log(JSON.stringify(settings, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
