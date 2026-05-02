// =============================================================================
// src/components/admin/ImageUploader.js — Drag & Drop Image Uploader
// ✅ ใส่แทน
// อัปโหลดรูปภาพไปยัง Cloudflare R2 ผ่าน Presigned URL
// =============================================================================

'use client'
// เพิ่ม import บนสุดของไฟล์
import { uploadFileWithPresignedUrl } from '@/lib/upload-client'
import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'

/**
 * ImageUploader — Drag & Drop image upload component
 * @param {string} currentImageUrl - URL รูปภาพปัจจุบัน (กรณี edit) - ใช้ compatibility
 * @param {string} initialImage - URL รูปภาพเริ่มต้น (แนะนำใช้สิ่งนี้)
 * @param {Function} onUpload - callback เมื่ออัปโหลดสำเร็จ ({ url, key })
 * @param {Function} onUploadSuccess - callback เมื่ออัปโหลดสำเร็จ (ส่ง url โดยตรง)
 */
export default function ImageUploader({ currentImageUrl, initialImage, onUpload, onUploadSuccess, folder = 'products' }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const initialUrl = initialImage || currentImageUrl || null
  const [preview, setPreview] = useState(initialUrl)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)

  // ตรวจสอบประเภทและขนาดไฟล์ก่อน upload
  const validateFile = (file) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      return 'รองรับเฉพาะ JPEG, PNG, WebP และ GIF เท่านั้น'
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'ขนาดไฟล์ต้องไม่เกิน 5MB'
    }
    return null
  }

  // อัปโหลดไฟล์ไปยัง R2 ผ่าน Presigned URL
  const uploadFile = async (file) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setIsUploading(true)
    setProgress(10)

    // แสดง preview ทันที (optimistic)
    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)
    setProgress(30)

    try {
      console.log('[ImageUploader] Starting presigned upload...')
      setProgress(50)
      const result = await uploadFileWithPresignedUrl({ file, folder })
      setProgress(100)

      console.log('[ImageUploader] Upload successful:', result.url)
      setPreview(result.url)

      if (onUpload) onUpload({ url: result.url, key: result.key })
      if (onUploadSuccess) onUploadSuccess(result.url)

      URL.revokeObjectURL(localPreview)
    } catch (err) {
      console.error('[ImageUploader] Upload failed:', err)
      setError(err.message || 'อัปโหลดล้มเหลว กรุณาลองใหม่')
      setPreview(initialUrl || null)
    } finally {
      setIsUploading(false)
      setTimeout(() => setProgress(0), 500)
    }
  }


  // Drag & Drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, []) // eslint-disable-line

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = '' // reset เพื่ออนุญาต upload ไฟล์เดิมซ้ำ
  }

  // ลบรูปภาพ
  const handleDelete = async () => {
    setPreview(null)
    setError('')
    if (onUploadSuccess) {
      onUploadSuccess('')
    }
    if (onUpload) {
      onUpload({ url: '', key: '' })
    }
  }

  return (
    <div className="space-y-3">
      <label className="form-label">รูปภาพโปรดักซ์</label>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden
          ${isDragging
            ? 'border-brand-500 bg-brand-500/10 scale-[1.01]'
            : 'border-white/10 hover:border-brand-500/50 hover:bg-white/2'
          }
          ${isUploading ? 'cursor-wait pointer-events-none' : ''}
        `}
        style={{ minHeight: '180px' }}
        role="button"
        aria-label="อัปโหลดรูปภาพ"
        tabIndex={0}
        id="image-uploader-dropzone"
      >
        {/* Progress bar */}
        {isUploading && progress > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 z-10">
            <div
              className="h-full bg-gradient-brand transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {preview ? (
          // Preview image
          <div className="relative w-full" style={{ minHeight: '180px' }}>
            <Image
              src={preview}
              alt="Product preview"
              fill
              className={`object-cover transition-all duration-300 ${isUploading ? 'opacity-50' : 'opacity-100'}`}
              sizes="(max-width: 768px) 100vw, 500px"
              unoptimized={preview.startsWith('blob:')}
            />
            {/* Overlay on hover */}
            {!isUploading && (
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <div className="text-center text-white">
                  <div className="text-3xl mb-2">🔄</div>
                  <p className="text-sm font-medium">เปลี่ยนรูป</p>
                </div>
                <div className="w-px h-12 bg-white/20" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete()
                  }}
                  className="text-center text-red-400 hover:text-red-300"
                >
                  <div className="text-3xl mb-2">🗑️</div>
                  <p className="text-sm font-medium">ลบ</p>
                </button>
              </div>
            )}
            {/* Uploading indicator */}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-white">
                  <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm">กำลังอัปโหลด... {progress}%</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center" style={{ minHeight: '180px' }}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 transition-transform duration-300 ${isDragging ? 'scale-125' : ''}`}
              style={{ background: 'rgba(90,107,255,0.15)' }}>
              {isDragging ? '📂' : '🖼️'}
            </div>
            <p className="text-white font-medium mb-1">
              {isDragging ? 'ปล่อยไฟล์ที่นี่' : 'ลากรูปมาวางที่นี่'}
            </p>
            <p className="text-gray-500 text-sm">หรือ <span className="text-brand-400 underline">คลิกเพื่อเลือกไฟล์</span></p>
            <p className="text-gray-600 text-xs mt-2">JPEG, PNG, WebP, GIF — ไม่เกิน 5MB</p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        id="image-uploader-input"
      />

      {/* Error message */}
      {error && (
        <p className="flex items-center gap-2 text-red-400 text-sm animate-fade-in">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}

      {/* Success info */}
      {preview && !isUploading && !error && (
        <p className="flex items-center gap-2 text-green-400 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          อัปโหลดรูปภาพสำเร็จ (Cloudflare R2)
        </p>
      )}
    </div>
  )
}

