import 'server-only'

import crypto from 'crypto'

export const EMAIL_CHANGE_CODE_TTL_MINUTES = 10

export function generateEmailChangeCode() {
  return crypto.randomInt(100000, 1000000).toString()
}

export function hashEmailChangeCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex')
}

export function getEmailChangeExpiryDate() {
  return new Date(Date.now() + EMAIL_CHANGE_CODE_TTL_MINUTES * 60 * 1000)
}

export function maskEmailAddress(email) {
  const [localPart, domain = ''] = email.split('@')

  if (!localPart) return email

  const visibleLocal = localPart.slice(0, Math.min(2, localPart.length))
  const maskedLocal = `${visibleLocal}${'*'.repeat(Math.max(2, localPart.length - visibleLocal.length))}`

  return domain ? `${maskedLocal}@${domain}` : maskedLocal
}
