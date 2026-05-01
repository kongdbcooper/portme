'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteVideoButtonClient({ videoId }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบวิดีโอนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/admin/videos')
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'ลบไม่สำเร็จ')
        setIsDeleting(false)
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการลบ')
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-sm font-medium transition-colors border border-red-500/20 flex items-center gap-2 disabled:opacity-50"
    >
      {isDeleting ? 'กำลังลบ...' : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          ลบวิดีโอ
        </>
      )}
    </button>
  )
}
