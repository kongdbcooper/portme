'use client'
import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { uploadFileWithPresignedUrl } from '@/lib/upload-client'
import EditableBlock from './EditableBlock'

export default function MultiImageUploader({ 
  images = [], 
  onAddImage, 
  onRemoveImage, 
  onSetCover, 
  folder = 'products',
  disabled = false
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState([]) // Array of { id, progress, error }
  const fileInputRef = useRef(null)

  const validateFile = (file) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) return 'รองรับเฉพาะ JPEG, PNG, WebP และ GIF'
    if (file.size > 5 * 1024 * 1024) return 'ขนาดไม่เกิน 5MB'
    return null
  }

  const handleFiles = async (files) => {
    const validFiles = Array.from(files).filter(file => {
      const err = validateFile(file)
      if (err) alert(`${file.name}: ${err}`)
      return !err
    })

    for (const file of validFiles) {
      const uploadId = Math.random().toString(36).substring(7)
      setUploadingFiles(prev => [...prev, { id: uploadId, progress: 10, file }])
      
      try {
        setUploadingFiles(prev => prev.map(u => u.id === uploadId ? { ...u, progress: 50 } : u))
        const result = await uploadFileWithPresignedUrl({ file, folder })
        setUploadingFiles(prev => prev.map(u => u.id === uploadId ? { ...u, progress: 100 } : u))
        
        // Let UI know we finished
        if (onAddImage) {
          await onAddImage({ url: result.url, key: result.key })
        }
        
        // Remove from uploading list
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(u => u.id !== uploadId))
        }, 500)
      } catch (err) {
        console.error('Upload error:', err)
        setUploadingFiles(prev => prev.map(u => u.id === uploadId ? { ...u, error: err.message || 'ล้มเหลว' } : u))
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(u => u.id !== uploadId))
        }, 3000)
      }
    }
  }

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files)
    }
  }, [disabled]) // eslint-disable-line

  return (
    <div className="space-y-4">
      {/* Gallery Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((img, index) => (
            <div key={img.id || index} className="relative aspect-[4/5] bg-surface-900 rounded-xl overflow-hidden group border border-white/10">
              <Image 
                src={img.imageUrl || img.url} 
                alt="Product image" 
                fill 
                className="object-cover"
                unoptimized={(img.imageUrl || img.url).startsWith('blob:')}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                {index > 0 && onSetCover && (
                  <button
                    type="button"
                    onClick={() => onSetCover(img)}
                    disabled={disabled}
                    className="px-3 py-1.5 bg-brand-500/80 hover:bg-brand-500 text-white text-xs rounded-lg font-medium transition-colors"
                  >
                    ตั้งเป็นรูปปก
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveImage(img, index)}
                  disabled={disabled}
                  className="px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white text-xs rounded-lg font-medium transition-colors"
                >
                  ลบรูปภาพ
                </button>
              </div>

              {/* Cover Badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">
                  Cover
                </div>
              )}
            </div>
          ))}

          {/* Uploading states */}
          {uploadingFiles.map(u => (
            <div key={u.id} className="relative aspect-[4/5] bg-surface-900 rounded-xl overflow-hidden border border-brand-500/30 flex flex-col items-center justify-center p-4 text-center">
              {u.error ? (
                <div className="text-red-400 text-xs">
                  <div className="text-2xl mb-1">⚠️</div>
                  {u.error}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 w-full text-brand-400">
                  <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${u.progress}%` }} />
                  </div>
                  <span className="text-xs">{u.progress}%</span>
                </div>
              )}
            </div>
          ))}

          {/* Add more button */}
          <div 
            onClick={() => !disabled && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`aspect-[4/5] rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer
              ${isDragging ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 hover:border-brand-500/50 hover:bg-white/5'}
              ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
            `}
          >
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl mb-2">➕</div>
            <span className="text-sm text-gray-400 font-medium">เพิ่มรูปภาพ</span>
          </div>
        </div>
      )}

      {/* Empty State Dropzone (When no images at all) */}
      {images.length === 0 && uploadingFiles.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center min-h-[320px] cursor-pointer
            ${isDragging ? 'border-brand-500 bg-brand-500/10 scale-[1.01]' : 'border-white/10 hover:border-brand-500/50 hover:bg-white/5'}
            ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
          `}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 bg-brand-500/15">
            🖼️
          </div>
          <p className="text-white font-medium mb-1">ลากรูปภาพหลายๆ รูปมาวางที่นี่</p>
          <p className="text-gray-500 text-sm">หรือคลิกเพื่อเลือกไฟล์</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files)
          e.target.value = ''
        }}
        className="hidden"
      />
    </div>
  )
}
