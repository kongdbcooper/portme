// =============================================================================
// src/app/admin/products/DeleteProductButton.js — Delete Product Client Button
// ปุ่มลบโปรดักซ์พร้อม confirm dialog
// ใช้งานร่วมกับ: src/app/admin/products/page.js
//               src/app/api/products/[id]/route.js (DELETE)
// =============================================================================

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteProductButton({ productId, productName }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      
      if (res.status === 403) {
        alert('คุณไม่มีสิทธิ์ลบโปรดักซ์นี้ (เฉพาะ Admin เท่านั้น)')
        setIsDeleting(false)
        setShowConfirm(false)
        return
      }

      if (res.status === 404) {
        alert('ไม่พบโปรดักซ์ที่ต้องการลบ')
        setIsDeleting(false)
        setShowConfirm(false)
        return
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Delete failed')
      }
      
      router.refresh() // รีโหลด server data
    } catch (err) {
      alert('ลบโปรดักซ์ไม่สำเร็จ: ' + err.message)
      setIsDeleting(false)
    }
    setShowConfirm(false)
  }

  return (
    <>
      {/* Delete button */}
      <button
        onClick={() => setShowConfirm(true)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-all"
        title="ลบ"
        id={`delete-product-${productId}`}
        disabled={isDeleting}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative glass-card p-6 max-w-sm w-full animate-fade-up">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-center mb-2">ยืนยันการลบ</h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              คุณต้องการลบ <span className="text-white font-medium">&quot;{productName}&quot;</span> ใช่หรือไม่?
              <br />
              <span className="text-red-400 text-xs">รูปภาพใน R2 จะถูกลบด้วย และไม่สามารถกู้คืนได้</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-ghost flex-1 py-2.5 text-sm"
                disabled={isDeleting}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                id="confirm-delete-btn"
              >
                {isDeleting ? 'กำลังลบ...' : 'ลบโปรดักซ์'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
