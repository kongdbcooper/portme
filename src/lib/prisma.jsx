import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('[Prisma] DATABASE_URL is not defined. Database access will fail.')
}

// สร้าง Pool โดยลดจำนวน Max Connection ลงเพื่อไม่ให้เบียดคิวกันเอง
const pool = new pg.Pool({
  connectionString,
  // ลดเหลือ 2-3 สำหรับ Development เพื่อให้ Next.js หลายๆ process แบ่งกันใช้ได้
  max: process.env.NODE_ENV === 'development' ? 3 : 10, 
  idleTimeoutMillis: 10000, // คืน Connection เร็วขึ้น (จาก 30s เหลือ 10s)
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: true,
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