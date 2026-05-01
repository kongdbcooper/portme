import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ authenticated: false, role: null })
    }

    return NextResponse.json({
      authenticated: true,
      role: session.role,
      user: {
        id: session.userId,
        email: session.email,
        role: session.role
      }
    })
  } catch (error) {
    console.error('[Auth API] Error fetching session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
