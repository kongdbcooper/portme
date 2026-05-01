const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Create Admin User
  const adminEmail = 'admin@portme.com'
  const adminPassword = 'password123'
  const passwordHash = await bcrypt.hash(adminPassword, 10)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'System Admin',
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
  })

  console.log(`✅ Admin user created: ${admin.email}`)
  console.log(`🔑 Login with: ${adminEmail} / ${adminPassword}`)

  // 2. Create Initial Settings
  const settings = [
    { key: 'site_name', value: 'PortMe Store' },
    { key: 'hero_title', value: 'Welcome to our premium collection' },
    { key: 'hero_subtitle', value: 'Discover unique products tailored for you.' },
  ]

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    })
  }

  console.log('✅ Initial settings created')

  // 3. Create Sample Products
  console.log('🗑️ Cleaning up old products...')
  await prisma.product.deleteMany({})

  const products = [
    {
      name: 'Me 1',
      imageUrl: '/picture/pang1.jpg',
      description: 'this is me.',
      category: 'R2',
      isActive: true,
      abVariant: 'A',
    },
    {
      name: 'Me 2',
      imageUrl: '/picture/pang2.jpg',
      description: 'this is me.',
      category: 'R2',
      isActive: true,
      abVariant: 'B',
    },
    {
      name: 'Me 3',
      imageUrl: '/picture/pang3.jpg',
      description: 'this is me.',
      category: 'R2',
      isActive: true,
      abVariant: 'C',
    },
  ]

  for (const p of products) {
    await prisma.product.create({
      data: p,
    })
  }

  console.log('✅ Sample products created')
  console.log('🚀 Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
