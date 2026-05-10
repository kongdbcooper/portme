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
  /* - ตอน Dev (พัฒนา): ใช้แค่ 2 เพื่อไม่ให้ Next.js จองท่อค้างจนเต็มเวลาเราแก้โค้ดบ่อยๆ
     - ตอน Prod (ใช้งานจริง): ใช้ 10-15 ท่อ ก็เพียงพอรองรับคนดูพร้อมกันเป็นร้อยเป็นพันคนแล้วครับ
  */
  max: process.env.NODE_ENV === 'development' ? 2 : 15, 
  
  // ลดเวลาถือท่อว่างๆ ให้เหลือน้อยลง เพื่อรีบคืนให้คนอื่นใช้งาน
  idleTimeoutMillis: 5000, 
  
  // เพิ่มความเร็วในการแจ้งเตือนถ้าต่อไม่ติด
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