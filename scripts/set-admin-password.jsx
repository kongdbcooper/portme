import { prisma } from './src/lib/prisma.jsx'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import 'dotenv/config'

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@portme.com'

  // 👉 กำหนดรหัสใหม่ตรงนี้
  const newPassword = process.env.NEW_ADMIN_PASSWORD || '12345678'

  const passwordHash = await bcrypt.hash(newPassword, 10)

  const user = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!user) {
    console.error('❌ ไม่เจอ user:', adminEmail)
    process.exit(1)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      sessionVersion: { increment: 1 }, // logout ทุก session
    },
  })

  console.log('✅ RESET PASSWORD สำเร็จ')
  console.log('📧 Email:', adminEmail)
  console.log('🔑 Password ใหม่:', newPassword)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
