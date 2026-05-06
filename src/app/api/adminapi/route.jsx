import { supabaseback } from '@/lib/supabaseback'
import { cookies } from 'next/headers'

/**
 * ตัวอย่าง session checker (ง่ายสุด)
 * คุณต้องมี auth login แล้ว set cookie ไว้
 */
async function getUserFromSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) return null

  // ดึง user จาก Supabase auth
  const { data, error } = await supabaseback.auth.getUser(token)

  if (error || !data?.user) return null

  // ดึง role จาก users table
  const { data: userProfile } = await supabaseback
    .from('users')
    .select('id, email, role')
    .eq('id', data.user.id)
    .single()

  return userProfile
}

export async function GET() {
  const user = await getUserFromSession()

  // 🔥 ADMIN GUARD (ที่คุณถาม)
  if (!user || user.role !== 'ADMIN') {
    return Response.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  // ✅ ถ้าเป็น admin ถึงจะผ่าน
  const { data, error } = await supabaseback
    .from('users')
    .select('*')

  if (error) {
    return Response.json({ error }, { status: 500 })
  }

  return Response.json(data)
}
console.log('USER:', user)