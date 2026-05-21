import jwt from 'jsonwebtoken'

export async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000)

  const payload = {
    iss: process.env.GOOGLE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const token = jwt.sign(
    payload,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    { algorithm: 'RS256' }
  )

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: token,
    }),
  })

  const data = await res.json()

  return data.access_token
}