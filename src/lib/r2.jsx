import 'server-only'

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { string } from 'zod'

/**
 * 🔥 อ่าน env ใน function เพื่อป้องกันการ cache ใน Next.js
 */
function getR2Config() {
  const AK = process.env.R2_ACCESS_KEY_ID
  const SK = process.env.R2_SECRET_ACCESS_KEY
  const BUCKET = process.env.R2_BUCKET_NAME
  const PUBLIC_URL = process.env.R2_PUBLIC_URL
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID

  if (!AK || !SK || !BUCKET || !accountId) {
    console.error('[R2] Missing config:', { AK: !!AK, SK: !!SK, BUCKET: !!BUCKET, accountId: !!accountId })
    throw new Error('R2 is not configured. Please set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and CLOUDFLARE_ACCOUNT_ID')
  }

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`

  return { AK, SK, BUCKET, PUBLIC_URL, endpoint }
}

/**
 * สร้าง client ใหม่เมื่อต้องการใช้งาน
 */
function createR2Client() {
  const { AK, SK, endpoint } = getR2Config()
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: AK,
      secretAccessKey: SK,
    },
  })
}

// ------------------- CONFIG -------------------

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_VIDEO_SIZE = 500 * 1024 * 1024
const ALLOWED_FOLDERS = new Set(['products', 'settings', 'videos'])

function sanitizeFilename(filename) {
  return filename.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-')
}

function normalizeUploadInput({ filename, contentType, size = 0, folder = 'products' } = {}) {
  const fname = string().nonempty('Filename is required').parse(filename)
  const ctype = string().nonempty('Content type is required').parse(contentType)
  const normalizedFolder = typeof folder === 'string' && folder ? folder : 'products'
  const numericSize = Number(size) || 0

  if (!ALLOWED_FOLDERS.has(normalizedFolder)) {
    throw new Error('Invalid upload folder')
  }

  if (normalizedFolder === 'videos') {
    if (!ctype.startsWith('video/')) {
      throw new Error('The videos folder only accepts video files')
    }
    if (numericSize > MAX_VIDEO_SIZE) {
      throw new Error('Video file size must not exceed 500MB')
    }
  } else {
    if (!ctype.startsWith('image/')) {
      throw new Error('This folder only accepts image files')
    }
    if (numericSize > MAX_IMAGE_SIZE) {
      throw new Error('Image file size must not exceed 5MB')
    }
  }

  return {
    filename: sanitizeFilename(fname),
    contentType: ctype,
    folder: normalizedFolder,
    size: numericSize,
  }
}

// ------------------- Upload File to R2 -------------------

export async function uploadToR2(file, folder = 'products') {
  const client = createR2Client()
  const { BUCKET, PUBLIC_URL } = getR2Config()

  const normalized = normalizeUploadInput({
    filename: file?.name,
    contentType: file?.type,
    size: file?.size,
    folder,
  })

  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const key = `${normalized.folder}/${timestamp}-${randomStr}-${normalized.filename}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: normalized.contentType,
      CacheControl: 'public, max-age=31536000',
    })
  )

  const publicUrl = `${PUBLIC_URL}/${key}`
  return { key, publicUrl }
}

// ------------------- Delete File -------------------

export async function deleteFromR2(key) {
  if (!key) return
  
  try {
    const client = createR2Client()
    const { BUCKET } = getR2Config()

    await client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    )
  } catch (error) {
    console.error('[R2] Failed to delete object:', key, error)
  }
}

// ------------------- Generate Presigned URL -------------------

export async function getPresignedUploadUrl(key, contentType) {
  const client = createR2Client()
  const { BUCKET } = getR2Config()

  const command = new PutObjectCommand({ 
    Bucket: BUCKET, 
    Key: key, 
    ContentType: contentType 
  })
  
  return await getSignedUrl(client, command, { expiresIn: 900 })
}

export async function createPresignedUpload({ filename, contentType, size = 0, folder = 'products' } = {}) {
  const client = createR2Client()
  const { BUCKET, PUBLIC_URL } = getR2Config()

  const normalized = normalizeUploadInput({ filename, contentType, size, folder })
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const key = `${normalized.folder}/${timestamp}-${randomStr}-${normalized.filename}`

  const command = new PutObjectCommand({ 
    Bucket: BUCKET, 
    Key: key, 
    ContentType: normalized.contentType 
  })
  
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 })

  const publicUrl = `${PUBLIC_URL}/${key}`
  return {
    uploadUrl,
    key,
    publicUrl,
    headers: {
      'Content-Type': normalized.contentType,
    },
  }
}
