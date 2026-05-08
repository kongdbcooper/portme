export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createPresignedUpload } from '@/lib/r2'

const CLIENT_ERROR_MESSAGES = new Set([
  'Filename is required',
  'Content type is required',
  'File size is required',
  'Invalid upload folder',
  'Unsupported file type',
  'Image file size must not exceed 5MB',
  'Video file size must not exceed 500MB',
  'The videos folder only accepts video files',
  'This folder only accepts image files',
])

export async function POST(request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const upload = await createPresignedUpload({
      filename: body?.filename,
      contentType: body?.contentType,
      size: body?.size,
      folder: body?.folder,
    })

    return NextResponse.json({
      success: true,
      ...upload,
    })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }

    if (CLIENT_ERROR_MESSAGES.has(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('[Upload Presign] Error:', error)
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ error: error.message || 'Failed to create upload URL', stack: error.stack }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 })
  }
}
