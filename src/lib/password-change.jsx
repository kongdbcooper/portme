import 'server-only'

import crypto from 'crypto'

export const PASSWORD_CHANGE_CODE_TTL_MINUTES = 10

export function generatePasswordChangeCode() {
  return crypto.randomInt(100000, 1000000).toString()
}

export function hashPasswordChangeCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex')
}

export function getPasswordChangeExpiryDate() {
  return new Date(Date.now() + PASSWORD_CHANGE_CODE_TTL_MINUTES * 60 * 1000)
}