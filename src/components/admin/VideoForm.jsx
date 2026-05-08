'use client'

import { useState, useRef } from 'react'
import EditableBlock from './EditableBlock'
import { useRouter } from 'next/navigation'
import { uploadFileWithPresignedUrl } from '@/lib/upload-client'

export default function VideoForm({ video = null, mode = 'create' }) {
  const router = useRouter()
  const isEdit = mode === 'edit'

  const [videoUrl, setVideoUrl] = useState(video?.videoUrl || '')
  const [videoKey, setVideoKey] = useState(video?.videoKey || '')
  
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 500MB
    if (file.size > 500 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 500MB')
      return
    }

    setIsUploading(true)
    setSubmitError('')

    try {
      const data = await uploadFileWithPresignedUrl({ 
        file, 
        folder: 'videos',
        onProgress: (percent) => setUploadProgress(percent)
      })
      setVideoUrl(data.url)
      setVideoKey(data.key)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    const formData = new FormData(e.currentTarget)

    if (!videoUrl) {
      setSubmitError('กรุณาอัปโหลดวิดีโอ')
      setIsSubmitting(false)
      return
    }

    const payload = {
      title: formData.get('title'),
      description: formData.get('description') || null,
      isActive: formData.get('isActive') === 'on',
      order: parseInt(formData.get('order') || '0', 10),
      videoUrl,
      videoKey,
    }

    try {
      const url = isEdit ? `/api/videos/${video.id}` : '/api/videos'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาด')
      }

      router.push('/admin/videos')
      router.refresh()
    } catch (err) {
      setSubmitError(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Upload Section */}
      <div>
        <label className="form-label"><EditableBlock as="span" settingKey="video_upload_label" defaultText="วิดีโอ (ไม่เกิน 500MB)" /> <span className="text-red-400">*</span></label>
        
        {videoUrl ? (
          <div className="relative rounded-xl overflow-hidden aspect-video bg-black/40 border border-white/10 group mb-4">
            <video src={videoUrl} controls className="w-full h-full object-contain" />
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isSubmitting}
                className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm text-white font-medium hover:bg-black"
              >
                เปลี่ยนวิดีโอ
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              isUploading ? 'border-brand-500 bg-brand-500/5' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            {isUploading ? (
                <div className="flex flex-col items-center w-full max-w-xs">
                <span className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-brand-400 font-medium mb-2"><EditableBlock as="span" settingKey="video_uploading_prefix" defaultText="กำลังอัปโหลด..." /> {uploadProgress}%</p>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-brand-500 h-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-white font-medium mb-1"><EditableBlock as="span" settingKey="video_click_to_upload" defaultText="คลิกเพื่ออัปโหลดวิดีโอ" /></p>
                <p className="text-gray-500 text-sm text-center"><EditableBlock as="span" settingKey="video_upload_hint" defaultText="MP4, WebM, OGG สูงสุด 500MB" /></p>
              </>
            )}
          </div>
        )}
        <input
          type="file"
          accept="video/mp4,video/webm,video/ogg"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading || isSubmitting}
        />
      </div>

      {/* Info Fields */}
      <div>
        <label className="form-label" htmlFor="video-title">
          <EditableBlock as="span" settingKey="video_title_label" defaultText="ชื่อวิดีโอ" /> <span className="text-red-400">*</span>
        </label>
        <input
          id="video-title"
          name="title"
          type="text"
          required
          maxLength={200}
          placeholder={"ระบุชื่อวิดีโอ"}
          defaultValue={video?.title || ''}
          className="form-input"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="form-label" htmlFor="video-description"><EditableBlock as="span" settingKey="video_description_label" defaultText="คำอธิบาย" /></label>
        <textarea
          id="video-description"
          name="description"
          rows={3}
          placeholder={"อธิบายรายละเอียดวิดีโอ..."}
          defaultValue={video?.description || ''}
          className="form-input resize-none"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="form-label" htmlFor="video-order"><EditableBlock as="span" settingKey="video_order_label" defaultText="ลำดับการแสดงผล" /></label>
          <input
            id="video-order"
            name="order"
            type="number"
            defaultValue={video?.order || 0}
            className="form-input"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col justify-center">
          <label className="form-label"><EditableBlock as="span" settingKey="video_status_label" defaultText="สถานะการแสดงผล" /></label>
          <label className="flex items-center gap-3 cursor-pointer group" htmlFor="video-isActive">
            <div className="relative">
              <input
                id="video-isActive"
                name="isActive"
                type="checkbox"
                defaultChecked={video?.isActive ?? true}
                className="sr-only peer"
                disabled={isSubmitting}
              />
              <div className="w-11 h-6 rounded-full border border-white/10 bg-white/5 peer-checked:bg-brand-500 peer-checked:border-brand-500 transition-all duration-200" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white/30 peer-checked:bg-white peer-checked:translate-x-5 transition-all duration-200" />
            </div>
            <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
              <EditableBlock as="span" settingKey="video_show_on_site" defaultText="แสดงบนเว็บไซต์" />
            </span>
          </label>
        </div>
      </div>

        {submitError && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {submitError}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="btn-gradient px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <EditableBlock as="span" settingKey="video_saving" defaultText="กำลังบันทึก..." /> : isEdit ? <EditableBlock as="span" settingKey="video_save_changes" defaultText="บันทึกการแก้ไข" /> : <EditableBlock as="span" settingKey="video_add" defaultText="เพิ่มวิดีโอ" />}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="btn-ghost px-6 py-3"
        >
          <EditableBlock as="span" settingKey="video_cancel" defaultText="ยกเลิก" />
        </button>
      </div>
    </form>
  )
}
