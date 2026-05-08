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

  const isProduction = process.env.NODE_ENV === 'production'
  const allowProdSeed = process.env.ALLOW_PROD_SEED === 'true'
  const runSampleData = !isProduction || allowProdSeed

  // Admin credentials — ALWAYS use env vars in production!
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@portme.com'
  const providedAdminPassword = process.env.SEED_ADMIN_PASSWORD

  // 1. Create or ensure Admin User (idempotent)
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (!admin) {
    if (isProduction && !providedAdminPassword) {
      console.error('❌ Production: SEED_ADMIN_PASSWORD env var is REQUIRED. Set it and re-run.')
      process.exit(1)
    }

    const adminPassword = providedAdminPassword || 'Dev$ecure2026!'
    // Use bcrypt cost 12 for stronger hashing
    const passwordHash = await bcrypt.hash(adminPassword, 12)

    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'System Admin',
        passwordHash,
        role: 'ADMIN',
      },
    })

    console.log(`✅ Admin user created: ${admin.email}`)
    if (!isProduction) {
      console.log(`🔑 Login with: ${adminEmail} / ${adminPassword}`)
      console.warn('⚠️  IMPORTANT: Change this password immediately via Admin → ความปลอดภัย')
    }
  } else {
    console.log(`ℹ️ Admin already exists: ${admin.email}`)
  }

  // 2. Create Initial Settings (idempotent)
  const settings = [
    { key: 'site_name', value: 'PortMe Store' },
    { key: 'site_logo', value: 'https://pub-b7f6f5f01b32476a9462f87d684f54d9.r2.dev/profile/pang1.jpg' },
    { key: 'hero_title', value: 'Welcome to our premium collection' },
    { key: 'hero_subtitle', value: 'Discover unique products tailored for you.' },
    { key: 'prod_profile_images', value: JSON.stringify([
      { url: 'https://pub-b7f6f5f01b32476a9462f87d684f54d9.r2.dev/profile/pang1.jpg' },
      { url: 'https://pub-b7f6f5f01b32476a9462f87d684f54d9.r2.dev/profile/pang2.jpg' }
    ]) },
  ]

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }

  console.log('✅ Initial settings ensured')

  // 3. Sample Products — only in non-production or when explicitly allowed
const products = [
  {
    name: 'Me 1',
    imageUrl: 'https://pub-b7f6f5f01b32476a9462f87d684f54d9.r2.dev/profile/pang1.jpg',
    description: 'this is me.',
    category: 'R2',
    isActive: true,
    abVariant: 'A',
  },
  {
    name: 'Me 2',
    imageUrl: 'https://pub-b7f6f5f01b32476a9462f87d684f54d9.r2.dev/profile/pang2.jpg',
    description: 'this is me.',
    category: 'R2',
    isActive: true,
    abVariant: 'B',
  },
  {
    name: 'Me 3',
    imageUrl: 'https://pub-b7f6f5f01b32476a9462f87d684f54d9.r2.dev/profile/pang3.jpg',
    description: 'this is me.',
    category: 'R2',
    isActive: true,
    abVariant: 'C',
  },
]

  if (runSampleData) {
    for (const p of products) {
      // Product.name is not unique in the schema, so treat name as a natural key here
      const existing = await prisma.product.findFirst({ where: { name: p.name } })
      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data: p })
        console.log(`ℹ️ Updated product: ${p.name}`)
      } else {
        await prisma.product.create({ data: p })
        console.log(`✅ Created product: ${p.name}`)
      }
    }
    console.log('✅ Sample products ensured')
  } else {
    console.log('ℹ️ Skipping sample products in production (set ALLOW_PROD_SEED=true to override)')
  }

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
