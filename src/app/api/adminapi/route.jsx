import { supabaseback } from '@/lib/supabaseback'
import { cookies } from 'next/headers'

/**
 * ฟังก์ชันสำหรับตรวจสอบ Session จาก Cookie
 */
async function getUserFromSession() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) return null

    // 1. ดึง user จาก Supabase Auth โดยใช้ token จาก cookie
    const { data: authData, error: authError } = await supabaseback.auth.getUser(token)
    if (authError || !authData?.user) return null

    // 2. ดึงข้อมูล Profile เพื่อเช็ค Role (จาก table users ของคุณ)
    const { data: userProfile, error: profileError } = await supabaseback
      .from('users')
      .select('id, email, role')
      .eq('id', authData.user.id)
      .single()

    if (profileError) return null

    return userProfile
  } catch (error) {
    console.error('Session error:', error)
    return null
  }
}

export async function GET() {
  const user = await getUserFromSession()

  // พิมพ์ Log ด้านในฟังก์ชันเพื่อให้มีตัวแปร user ใช้งานได้จริง
  console.log('API Request by USER:', user)

  // 🔥 ADMIN GUARD
  // ถ้าไม่มี user หรือ role ไม่ใช่ ADMIN ให้ตีกลับ 403
  if (!user || user.role !== 'ADMIN') {
    return Response.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    )
  }

  // ✅ กรณีเป็น ADMIN: ดึงรายชื่อผู้ใช้ทั้งหมดมาแสดง
  const { data, error } = await supabaseback
    .from('users')
    .select('*')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}
