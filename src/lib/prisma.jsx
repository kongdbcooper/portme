import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('[Prisma] DATABASE_URL is not defined. Database access will fail.')
}

const pool = new pg.Pool({
  connectionString,
  max: 13, // Reduced from 15
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000, // Increased timeout
  allowExitOnIdle: true, // Allow pool to close idle connections
})
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
