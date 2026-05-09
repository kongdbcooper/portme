const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = process.env.SMTP_PORT
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const FROM_EMAIL = process.env.SMTP_FROM || 'no-reply@example.com'

let transporter = null

async function initTransporterIfNeeded() {
  if (transporter) return transporter
  if (!SMTP_HOST || !SMTP_PORT) return null
  try {
    const nodemailer = await import('nodemailer')
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
    return transporter
  } catch (err) {
    console.warn('[Mail] nodemailer not available, falling back to console')
    return null
  }
}

export async function sendEmail({ to, subject, html, text }) {
  const t = await initTransporterIfNeeded()
  if (t) {
    try {
      await t.sendMail({ from: FROM_EMAIL, to, subject, html, text })
      console.log('[Mail] Sent email to', to)
      return true
    } catch (err) {
      console.error('[Mail] Failed to send email:', err)
    }
  }

  // ถ้าไม่มี transporter และเป็น production -> ไม่พิมพ์ token ลง log
  if (process.env.NODE_ENV !== 'development') {
    console.error('[Mail] No mail transporter configured (production)')
    return false
  }

  // Development fallback: ปริ้นเฉพาะข้อมูลที่จำเป็นสำหรับดีบัก
  console.log('--- Email fallback (dev) ---')
  console.log('To:', to)
  console.log('Subject:', subject)
  if (text) console.log('Text:', text)
  if (html) console.log('HTML:', html)
  console.log('--- End Email ---')
  return false
}
