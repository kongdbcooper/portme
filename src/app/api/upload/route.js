// =============================================================================
// src/app/api/upload/route.js — Image Upload API (Admin Only)
// รับไฟล์รูปภาพและอัปโหลดไปยัง Cloudflare R2 อัตโนมัติ
// ใช้งานร่วมกับ: src/lib/r2.js, src/lib/auth.js, src/components/admin/ImageUploader.js
// POST /api/upload (multipart/form-data)
// =============================================================================


export const runtime = 'nodejs';
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { uploadToR2 } from '@/lib/r2'

// ขนาดไฟล์สูงสุด: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// ประเภทไฟล์ที่อนุญาต
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request) {
  try {
      console.log('R2_ACCOUNT_ID:', process.env.CLOUDFLARE_ACCOUNT_ID)
      console.log('R2_ACCESS_KEY:', process.env.R2_ACCESS_KEY_ID)
      console.log('R2_SECRET_KEY:', process.env.R2_SECRET_ACCESS_KEY)
      console.log('R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME)
      console.log('R2_PUBLIC_URL:', process.env.R2_PUBLIC_URL)
      console.log('R2_ENDPOINT:', process.env.R2_ENDPOINT)
      console.log('FINAL ENDPOINT:', `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
    // ตรวจสอบว่าเป็น Admin เท่านั้นที่อัปโหลดได้
    try {
      await requireAdmin()
    } catch (authError) {
      console.error('[Upload] Auth failed:', authError.message)
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const folder = formData.get('folder') || 'products'

    console.log(`[Upload] Starting upload: file=${file?.name}, size=${file?.size}, folder=${folder}`)

    // ------------------- Validate File -------------------
    if (!file || typeof file === 'string') {
      console.warn('[Upload] No file provided')
      return NextResponse.json({ error: 'กรุณาเลือกไฟล์รูปภาพ' }, { status: 400 })
    }

    // ตรวจสอบประเภทไฟล์
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.warn(`[Upload] Invalid file type: ${file.type}`)
      return NextResponse.json(
        { error: 'รองรับเฉพาะไฟล์ JPEG, PNG, WebP และ GIF เท่านั้น' },
        { status: 400 }
      )
    }

    // ตรวจสอบขนาดไฟล์
    if (file.size > MAX_FILE_SIZE) {
      console.warn(`[Upload] File too large: ${file.size} bytes`)
      return NextResponse.json(
        { error: 'ขนาดไฟล์ต้องไม่เกิน 5MB' },
        { status: 400 }
      )
    }

    // ------------------- Upload to R2 -------------------
    console.log('[Upload] Uploading to R2...')
    const { key, publicUrl } = await uploadToR2(file, folder)
    console.log(`[Upload] R2 upload successful: key=${key}, url=${publicUrl}`)

    return NextResponse.json({
      success: true,
      key,       // ใช้ตอนลบไฟล์
      url: publicUrl, // ใช้แสดงรูปใน product
    })

  } catch (error) {
    console.error('[Upload] Error:', error.message, error.stack)
    return NextResponse.json(
      { error: `อัปโหลดไฟล์ล้มเหลว: ${error.message}` },
      { status: 500 }
    )
  }
}
