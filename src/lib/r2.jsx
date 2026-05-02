// =============================================================================
// src/lib/r2.js — Cloudflare R2 Storage Client (S3-compatible)
// Safe, lazy-validated R2 helper: avoids throwing during module import so API
// routes can initialize and always return JSON errors instead of HTML error pages.
// =============================================================================

import 'server-only'

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NodeHttpHandler } from '@smithy/node-http-handler'  // ✅ เพิ่ม
import https from 'https'   // ✅ เพิ่ม
import { string } from 'zod'

// Read env vars once and validate lazily
const AK = process.env.R2_ACCESS_KEY_ID || ''
const SK = process.env.R2_SECRET_ACCESS_KEY || ''
const BUCKET = process.env.R2_BUCKET_NAME || ''
const PUBLIC_URL = process.env.R2_PUBLIC_URL || ''
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || ''
const R2_ENDPOINT = accountId ? `https://${accountId}.r2.cloudflarestorage.com` : ''

let r2Configured = true
if (!AK || !SK) {
  r2Configured = false
  console.warn('[R2] Missing credentials in environment variables')
}
if (!BUCKET) {
  r2Configured = false
  console.warn('[R2] Missing R2_BUCKET_NAME in environment variables')
}
if (!accountId) {
  r2Configured = false
  console.warn('[R2] Missing CLOUDFLARE_ACCOUNT_ID in environment variables')
}

export let r2Client = null
if (r2Configured) {
  r2Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: AK,
      secretAccessKey: SK,
    },
    forcePathStyle: true,
    maxAttempts: 3,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    // ✅ SSL/TLS Configuration for Cloudflare R2
    requestHandler: new NodeHttpHandler({
      httpsAgent: new https.Agent({
        keepAlive: false,        // ✅ ปิด keepAlive แก้ SSL handshake
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',  // ✅ บังคับ TLS version ที่ถูกต้อง
      }),
      connectionTimeout: 30000,
      requestTimeout: 60000,
    }),
  })
} else {
  console.warn('[R2] r2Client not created due to missing configuration')
}

if (process.env.NODE_ENV !== 'production') {
  try {
    console.log(`[R2 DEBUG] accessKeyId length=${AK.length}, secret length=${SK.length}`)
  } catch (e) {
    console.warn('[R2 DEBUG] failed to read env vars')
  }
  if (!r2Configured) {
    console.warn('[R2] R2 not fully configured — upload functions will throw until env vars are fixed')
  }
}

function ensureR2() {
  if (!r2Configured || !r2Client) {
    throw new Error('R2 is not configured. Please set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and CLOUDFLARE_ACCOUNT_ID')
  }
}

// ------------------- Upload File to R2 -------------------
export async function uploadToR2(file, folder = 'products') {
  ensureR2()

  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const extension = (file.name || '').split('.').pop().toLowerCase()
  const key = `${folder}/${timestamp}-${randomStr}.${extension}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload to R2
  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000',
    })
  )

  const publicUrl = `${PUBLIC_URL}/${key}`
  return { key, publicUrl }
}

// ------------------- Delete File from R2 -------------------
export async function deleteFromR2(key) {
  if (!key) return
  if (!r2Configured || !r2Client) {
    console.warn('[R2] deleteFromR2 skipped because R2 is not configured')
    return
  }
  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    )
  } catch (error) {
    console.error('[R2] Failed to delete object:', key, error)
  }
}

// ------------------- Generate Presigned Upload URL -------------------
export async function getPresignedUploadUrl(key, contentType) {
  ensureR2()
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType })
  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 })
  return signedUrl
}

export async function createPresignedUpload({ filename, contentType, size = 0, folder = 'products' } = {}) {
  const fname = string().nonempty('Filename is required').parse(filename)
  const ctype = string().nonempty('Content type is required').parse(contentType)
  const timestamp = Date.now()
  const key = `${folder}/${timestamp}-${fname}`

  ensureR2()

  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: ctype })
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 })

  console.log('UPLOAD URL:', uploadUrl)

  const publicUrl = `${PUBLIC_URL}/${key}`
  return {
    uploadUrl,
    key,
    publicUrl,
    headers: {
      'Content-Type': ctype,
    },
  }
}
