export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { updateSession } from '@/lib/session'

export async function POST(request) {
  try {
    await requireAuth()
    const payload = await updateSession()
    if (!payload) return NextResponse.json({ error: 'No active session' }, { status: 401 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[RefreshSession] Error:', err)
    return NextResponse.json({ error: 'Failed to refresh session' }, { status: 500 })
  }
}
