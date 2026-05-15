import { getFreshSettings } from '@/lib/settings'
import LoginForm from './LoginForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'เข้าสู่ระบบ | Admin',
}

export default async function LoginPage() {
  const settings = await getFreshSettings()
  
  return <LoginForm settings={settings} />
}
