import { prisma } from '../src/lib/prisma.jsx'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import 'dotenv/config'

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@portme.com'
  const newPassword = process.env.NEW_ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url')
  const passwordHash = await bcrypt.hash(newPassword, 10)

  const user = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!user) {
    console.error('Admin user not found:', adminEmail)
    process.exit(1)
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, sessionVersion: { increment: 1 } },
  })

  console.log('✅ Admin password updated for', adminEmail)
  console.log('New password:', newPassword)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
