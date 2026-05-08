import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('[Prisma] DATABASE_URL is not defined. Database access will fail.')
}

// แก้ไขตรงนี้: ลดจำนวนการแย่ง Connection
const pool = new pg.Pool({ 
  connectionString,
  max: 3, // ลดจาก 20 เหลือ 3-5 สำหรับ Serverless เพื่อไม่ให้เต็มเร็ว
  idleTimeoutMillis: 10000, // ปิด connection ที่ไม่ได้ใช้เร็วขึ้น (จาก 30s เหลือ 10s)
  connectionTimeoutMillis: 5000,
})

const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter, 
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}