import { prisma } from '../src/lib/prisma.jsx'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
async function main() {
  console.log('🌱 Seeding database...')

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@portme.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'password123'
  const passwordHash = await bcrypt.hash(adminPassword, 10)

  // 1. ตรวจสอบหรือสร้าง Admin
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'System Admin',
      passwordHash,
      role: 'ADMIN',
    },
  })
  console.log(`✅ Admin ensured: ${adminEmail}`)

  // 2. ตั้งค่าเบื้องต้น (Settings)
  const settings = [
    { key: 'site_name', value: 'PortMe Store' },
    { key: 'site_logo', value: 'https://pub-b7f6f5f01b32476a9462f87d684f54d9.r2.dev/profile/pang1.jpg' },
  ]

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }

  console.log('✅ Settings ensured')
  console.log('🚀 Seed complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    // ปิดการเชื่อมต่อเมื่อทำงานเสร็จ
    await prisma.$disconnect()
  })