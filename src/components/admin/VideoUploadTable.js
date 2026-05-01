'use client'

import { useState, useRef } from 'react'

export default function VideoUploadTable() {
  const [uploadQueue, setUploadQueue] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const generateId = () => Math.random().toString(36).substring(2, 9)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    addFilesToQueue(files)
  }

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || [])
    addFilesToQueue(files)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const addFilesToQueue = (files) => {
    const videoFiles = files.filter((file) => file.type.startsWith('video/'))

    if (videoFiles.length === 0) {
      alert('กรุณาเลือกไฟล์วิดีโอเท่านั้น')
      return
    }

    const newItems = videoFiles.map((file) => ({
      id: generateId(),
      file,
      title: file.name.replace(/\.[^/.]+$/, ''),
      description: '',
      order: uploadQueue.length,
      isActive: true,
      status: 'pending',
      progress: 0,
      error: null,
      videoUrl: null,
      videoKey: null,
    }))

    setUploadQueue([...uploadQueue, ...newItems])
  }

  const updateItem = (id, updates) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  const removeItem = (id) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id))
  }

  const handleUploadFile = async (id) => {
    const item = uploadQueue.find((i) => i.id === id)
    if (!item) return

    updateItem(id, { status: 'uploading', error: null })

    try {
      const formData = new FormData()
      formData.append('file', item.file)
      formData.append('folder', 'videos')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await res.json()
      updateItem(id, {
        status: 'uploaded',
        videoUrl: data.url,
        videoKey: data.key,
        progress: 100,
      })
    } catch (err) {
      updateItem(id, {
        status: 'error',
        error: err.message,
      })
    }
  }

  const handleSaveAll = async () => {
    const uploadedItems = uploadQueue.filter((item) => item.status === 'uploaded')

    if (uploadedItems.length === 0) {
      alert('กรุณาอัปโหลดวิดีโออย่างน้อย 1 ไฟล์')
      return
    }

    try {
      for (const item of uploadedItems) {
        const res = await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: item.title || item.file.name,
            description: item.description || null,
            videoUrl: item.videoUrl,
            videoKey: item.videoKey,
            isActive: item.isActive,
            order: item.order,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Save failed')
        }

        updateItem(item.id, { status: 'saved' })
      }

      // รีเซตหลังบันทึกสำเร็จ
      setTimeout(() => {
        setUploadQueue([])
        window.location.reload()
      }, 1000)
    } catch (err) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`)
    }
  }

  const handleUploadAllPending = async () => {
    const pendingItems = uploadQueue.filter((item) => item.status === 'pending')

    if (pendingItems.length === 0) {
      alert('ไม่มีไฟล์ที่รอการอัปโหลด')
      return
    }

    for (const item of pendingItems) {
      await handleUploadFile(item.id)
    }
  }

  const pendingCount = uploadQueue.filter((i) => i.status === 'pending').length
  const uploadedCount = uploadQueue.filter((i) => i.status === 'uploaded').length
  const errorCount = uploadQueue.filter((i) => i.status === 'error').length

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {uploadQueue.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`glass-card p-8 border-2 border-dashed rounded-xl transition-all ${
            isDragging
              ? 'border-brand-400 bg-brand-500/5'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          <div className="text-center">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <h3 className="text-white font-semibold mb-1">ลากวิดีโอมาวางที่นี่</h3>
            <p className="text-gray-500 text-sm mb-4">หรือ</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-gradient px-4 py-2 text-sm"
            >
              เลือกไฟล์วิดีโอ
            </button>
            <p className="text-gray-500 text-xs mt-3">รองรับ: MP4, WebM, OGG (สูงสุด 50MB)</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Upload Queue Table */}
      {uploadQueue.length > 0 && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="glass-card px-4 py-3 rounded-lg">
              <div className="text-gray-500 text-xs mb-1">รอการอัปโหลด</div>
              <div className="text-xl font-bold text-yellow-400">{pendingCount}</div>
            </div>
            <div className="glass-card px-4 py-3 rounded-lg">
              <div className="text-gray-500 text-xs mb-1">อัปโหลดสำเร็จ</div>
              <div className="text-xl font-bold text-green-400">{uploadedCount}</div>
            </div>
            <div className="glass-card px-4 py-3 rounded-lg">
              <div className="text-gray-500 text-xs mb-1">ข้อผิดพลาด</div>
              <div className="text-xl font-bold text-red-400">{errorCount}</div>
            </div>
          </div>

          {/* Table */}
          <div className="glass-card overflow-hidden rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-surface-800/30">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      ชื่อไฟล์
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                      ชื่อวิดีโอ
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                      สถานะ
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {uploadQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-gray-400">
                        <span className="truncate text-xs">{item.file.name}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItem(item.id, { title: e.target.value })}
                          placeholder="ชื่อวิดีโอ"
                          className="bg-surface-800 text-white text-sm px-2 py-1 rounded border border-white/10 focus:border-brand-400 focus:outline-none w-full"
                          disabled={item.status === 'saving'}
                        />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            item.status === 'pending'
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : item.status === 'uploading'
                                ? 'bg-blue-500/10 text-blue-400'
                                : item.status === 'uploaded'
                                  ? 'bg-green-500/10 text-green-400'
                                  : item.status === 'saved'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {item.status === 'pending' && '⏳ รอการอัปโหลด'}
                          {item.status === 'uploading' && '📤 กำลังอัปโหลด'}
                          {item.status === 'uploaded' && '✓ อัปโหลดสำเร็จ'}
                          {item.status === 'saved' && '💾 บันทึกแล้ว'}
                          {item.status === 'error' && '❌ ข้อผิดพลาด'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.status === 'pending' && (
                          <button
                            onClick={() => handleUploadFile(item.id)}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                          >
                            อัปโหลด
                          </button>
                        )}
                        {item.status === 'uploading' && (
                          <span className="text-gray-500 text-sm">กำลังอัปโหลด...</span>
                        )}
                        {item.status === 'uploaded' && (
                          <span className="text-green-400 text-sm font-medium">✓</span>
                        )}
                        {item.status === 'error' && (
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-400 hover:text-red-300 text-sm font-medium"
                          >
                            ลบ
                          </button>
                        )}
                        {item.status === 'saved' && (
                          <span className="text-emerald-400 text-sm font-medium">✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Error Messages */}
            {uploadQueue.some((item) => item.error) && (
              <div className="border-t border-white/5 bg-red-500/5 px-4 py-3 max-h-20 overflow-y-auto">
                {uploadQueue
                  .filter((item) => item.error)
                  .map((item) => (
                    <p key={item.id} className="text-red-400 text-sm mb-1">
                      • {item.file.name}: {item.error}
                    </p>
                  ))}
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-white/5 bg-surface-800/20 px-4 py-4 flex flex-wrap gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-lg transition-colors"
              >
                + เพิ่มไฟล์อื่น
              </button>
              {pendingCount > 0 && (
                <button
                  onClick={handleUploadAllPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  📤 อัปโหลดทั้งหมด ({pendingCount})
                </button>
              )}
              {uploadedCount > 0 && (
                <button
                  onClick={handleSaveAll}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  ✓ บันทึกวิดีโอ ({uploadedCount})
                </button>
              )}
              <button
                onClick={() => setUploadQueue([])}
                className="ml-auto px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}
