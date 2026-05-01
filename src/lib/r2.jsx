// =============================================================================
// src/lib/r2.js — Cloudflare R2 Storage Client (S3-compatible)
// อัปโหลดและลบรูปภาพโปรดักซ์บน Cloudflare R2 อัตโนมัติ
// ใช้งานร่วมกับ: src/app/api/upload/route.js
// Cloudflare R2 ใช้ AWS S3-compatible API
// =============================================================================

import 'server-only'

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NodeHttpHandler } from '@aws-sdk/node-http-handler'

// ------------------- R2 Client Configuration -------------------
// Cloudflare R2 endpoint รูปแบบ: https://{ACCOUNT_ID}.r2.cloudflarestorage.com
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
const R2_ENDPOINT = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`

if (!accountId) {
  console.warn('[R2] Warning: CLOUDFLARE_ACCOUNT_ID is not defined in environment variables')
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
  tls: true,
  requestTimeout: 30000,
  connectionTimeout: 10000,
  maxAttempts: 3,
  // ใช้ Node.js native http handler เพื่อหลีกเลี่ยง SSL issues
  requestHandler: new NodeHttpHandler({
    httpAgent: new (require('http').Agent)({
      keepAlive: true,
      maxSockets: 25,
    }),
    httpsAgent: new (require('https').Agent)({
      keepAlive: true,
      maxSockets: 25,
      // ปิด certificate verification เนื่องจาก R2 ใช้ self-signed cert
      rejectUnauthorized: false,
    }),
  }),
})

// ------------------- Upload File to R2 -------------------
// อัปโหลดไฟล์รูปภาพไปยัง R2 bucket
// return: { key, publicUrl } — key ใช้ตอนลบ, publicUrl ใช้แสดงรูป
export async function uploadToR2(file, folder = 'products') {
  // สร้าง unique key สำหรับแต่ละรูป
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const extension = file.name.split('.').pop().toLowerCase()
  const key = `${folder}/${timestamp}-${randomStr}.${extension}`

  // อ่านข้อมูลไฟล์
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // อัปโหลดไป R2
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      // Cache 1 ปีสำหรับ static images
      CacheControl: 'public, max-age=31536000',
    })
  )

  // สร้าง public URL ของรูปภาพ
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  return { key, publicUrl }
}

// ------------------- Delete File from R2 -------------------
// ลบรูปภาพเก่าออกจาก R2 เมื่ออัปโหลดรูปใหม่
export async function deleteFromR2(key) {
  if (!key) return

  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      })
    )
  } catch (error) {
    // Log error แต่ไม่ throw เพื่อไม่ให้กระทบ main flow
    console.error('[R2] Failed to delete object:', key, error)
  }
}

// ------------------- Generate Presigned Upload URL -------------------
// สร้าง presigned URL สำหรับ direct upload จาก browser (optional)
// ใช้ถ้าต้องการ upload โดยตรงจาก client (ไม่ผ่าน API route)
export async function getPresignedUploadUrl(key, contentType) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  // URL หมดอายุใน 15 นาที
  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 })

  return signedUrl
}
