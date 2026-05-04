export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { uploadToR2 } from '@/lib/r2'

const CLIENT_ERROR_MESSAGES = new Set([
  'Filename is required',
  'Content type is required',
  'Invalid upload folder',
  'Image file size must not exceed 5MB',
  'Video file size must not exceed 50MB',
  'The videos folder only accepts video files',
  'This folder only accepts image files',
])

export async function POST(request) {
  try {
    await requireAdmin()

    const formData = await request.formData()
    const file = formData.get('file')
    const folder = formData.get('folder') || 'products'

    if (!file || typeof file.arrayBuffer !== 'function' || typeof file.name !== 'string') {
      return NextResponse.json({ error: 'A file is required' }, { status: 400 })
    }

    const upload = await uploadToR2(file, folder)

    return NextResponse.json({
      success: true,
      url: upload.publicUrl,
      key: upload.key,
    })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }

    if (CLIENT_ERROR_MESSAGES.has(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('[Upload] Server fallback error:', error)
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 })
  }
}
