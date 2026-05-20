import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const prismaClientSingleton = () => {
  // 1. ตั้งค่า Connection Pool ตรงนี้ (จำกัดไม่ให้เกินโควตาของ Vercel)
  const pool = new pg.Pool({ 
    connectionString: process.env.DATABASE_URL, // ใช้ URL เส้นที่เป็น Pooler ของ Vercel/Neon
    max: 3, // ตัวเลขสำคัญ! บังคับให้แต่ละ Serverless Function เปิดท่อได้ไม่เกิน 2 ท่อ เพื่อไม่ให้คิวรวม 15 ท่อเต็ม
    idleTimeoutMillis: 5000, // เคลียร์ท่อที่ไม่ได้ใช้งานใน 5 วินาที เพื่อคืนโควตาให้คนอื่น
  })
  
  // 2. ส่ง Pool เข้าไปใน Prisma v7 Adapter
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}


const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
