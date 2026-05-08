import { createClient } from '@supabase/supabase-js'

// ดึงค่าจาก Env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ใส่ค่าสำรอง (Placeholder) เพื่อให้ผ่านขั้นตอน Build
// Next.js จะพยายามโหลดไฟล์นี้ตอนคอมไพล์ ซึ่งบางครั้ง Env ยังไม่ถูกโหลดเข้า Process
export const supabaseback = createClient(
  supabaseUrl || 'https://supabase.co',
  supabaseAnonKey || 'placeholder-key'
)
