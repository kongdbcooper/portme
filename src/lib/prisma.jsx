import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('[Prisma] DATABASE_URL is not defined. Database access will fail.')
}

// สร้าง Pool โดยลดจำนวน Max Connection ลงเพื่อไม่ให้เบียดคิวกันเอง
// ... โค้ดส่วนบนเหมือนเดิม ...

const pool = new pg.Pool({
  connectionString,
  // แก้ตรงนี้: บน Vercel ต้องใช้ค่าน้อยที่สุด
  max: process.env.NODE_ENV === 'development' ? 2 : 1, 
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 2000, 
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