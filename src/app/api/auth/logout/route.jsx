// =============================================================================
// src/app/api/auth/logout/route.js — Logout API Route
// ลบ session cookie เพื่อ logout
// ใช้งานร่วมกับ: src/lib/session.js, src/components/admin/Sidebar.js
// POST /api/auth/logout
// =============================================================================


export const runtime = 'nodejs';
import { NextResponse } from 'next/server'
import { deleteSession } from '@/lib/session'

export async function POST() {
  try {
    // ลบ session cookie
    await deleteSession()

    return NextResponse.json({ success: true, redirectTo: '/login' })
  } catch (error) {
    console.error('[Auth] Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
