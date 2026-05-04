// =============================================================================
// src/components/admin/ProductForm.js — Create/Edit Product Form
// ฟอร์มสำหรับสร้างและแก้ไขโปรดักซ์ รวม ImageUploader
// ใช้งานร่วมกับ: src/components/admin/ImageUploader.js
//               src/app/admin/products/new/page.js
//               src/app/admin/products/[id]/edit/page.js
// =============================================================================

'use client'

import { useState, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUploader from './ImageUploader'

/**
 * ProductForm — Client Component
 * @param {Object} product - ข้อมูลโปรดักซ์เดิม (กรณี edit) หรือ null (กรณี create)
 * @param {string} mode - 'create' | 'edit'
 */
export default function ProductForm({ product = null, mode = 'create' }) {
  const router = useRouter()
  const isEdit = mode === 'edit'

  // State สำหรับ image ที่อัปโหลดแล้ว
  const [uploadedImage, setUploadedImage] = useState({
    url: product?.imageUrl || '',
    key: product?.imageKey || '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isImagePending, setIsImagePending] = useState(false)
  const [isImageUploading, setIsImageUploading] = useState(false)

  // Submit form — เรียก API ตรงๆ (ไม่ใช้ Server Action เพราะ handle image state ด้วย)
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isImagePending) {
      setSubmitError('กรุณากดยืนยันการอัปโหลดรูปภาพ (ตกลง) ก่อนบันทึกโปรดักซ์')
      return
    }
    if (isImageUploading) {
      setSubmitError('กรุณารอให้รูปภาพอัปโหลดเสร็จสิ้นก่อน')
      return
    }
    
    setIsSubmitting(true)
    setSubmitError('')

    const formData = new FormData(e.currentTarget)

    const payload = {
      name: formData.get('name'),
      description: formData.get('description') || null,
      price: parseFloat(formData.get('price')),
      category: formData.get('category') || null,
      isActive: formData.get('isActive') === 'on',
      abVariant: formData.get('abVariant'),
      imageUrl: uploadedImage.url || null,
      imageKey: uploadedImage.key || null,
    }

    try {
      const url = isEdit ? `/api/products/${product.id}` : '/api/products'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาด')
      }

      // Redirect กลับไปหน้า list หลังสำเร็จ
      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      setSubmitError(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* ------------------- Image Upload ------------------- */}
      <ImageUploader
        currentImageUrl={product?.imageUrl}
        onUpload={({ url, key }) => setUploadedImage({ url, key })}
        onPendingChange={setIsImagePending}
        onUploadingChange={setIsImageUploading}
      />

      {/* ------------------- Product Name ------------------- */}
      <div>
        <label className="form-label" htmlFor="product-name">
          ชื่อโปรดักซ์ <span className="text-red-400">*</span>
        </label>
        <input
          id="product-name"
          name="name"
          type="text"
          required
          maxLength={200}
          placeholder="ระบุชื่อโปรดักซ์"
          defaultValue={product?.name || ''}
          className="form-input"
          disabled={isSubmitting}
        />
      </div>

      {/* ------------------- Description ------------------- */}
      <div>
        <label className="form-label" htmlFor="product-description">คำอธิบาย</label>
        <textarea
          id="product-description"
          name="description"
          rows={4}
          placeholder="อธิบายรายละเอียดโปรดักซ์..."
          defaultValue={product?.description || ''}
          className="form-input resize-none"
          disabled={isSubmitting}
        />
      </div>

      {/* ------------------- Price + Category (2-col) ------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="form-label" htmlFor="product-price">
            ราคา (บาท) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">฿</span>
            <input
              id="product-price"
              name="price"
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              defaultValue={product?.price ? Number(product.price) : ''}
              className="form-input pl-8"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label className="form-label" htmlFor="product-category">หมวดหมู่</label>
          <input
            id="product-category"
            name="category"
            type="text"
            placeholder="เช่น อิเล็กทรอนิกส์, เสื้อผ้า"
            defaultValue={product?.category || ''}
            className="form-input"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* ------------------- A/B Variant + Status (2-col) ------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="form-label" htmlFor="product-ab-variant">A/B Test Variant</label>
          <select
            id="product-ab-variant"
            name="abVariant"
            defaultValue={product?.abVariant || 'A'}
            className="form-input appearance-none"
            disabled={isSubmitting}
          >
            <option value="A">Variant A (Standard)</option>
            <option value="B">Variant B (Horizontal)</option>
          </select>
        </div>

        <div className="flex flex-col justify-center">
          <label className="form-label">สถานะการแสดงผล</label>
          <label
            className="flex items-center gap-3 cursor-pointer group"
            htmlFor="product-isActive"
          >
            <div className="relative">
              <input
                id="product-isActive"
                name="isActive"
                type="checkbox"
                defaultChecked={product?.isActive ?? true}
                className="sr-only peer"
                disabled={isSubmitting}
              />
              <div className="w-11 h-6 rounded-full border border-white/10 bg-white/5 peer-checked:bg-brand-500 peer-checked:border-brand-500 transition-all duration-200" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white/30 peer-checked:bg-white peer-checked:translate-x-5 transition-all duration-200" />
            </div>
            <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
              แสดงบนเว็บไซต์
            </span>
          </label>
        </div>
      </div>

      {/* ------------------- Error Message ------------------- */}
      {submitError && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {submitError}
        </div>
      )}

      {/* ------------------- Action Buttons ------------------- */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          id={`product-form-submit-${mode}`}
          disabled={isSubmitting || isImageUploading}
          className={`btn-gradient px-8 py-3 ${(isSubmitting || isImageUploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              กำลังบันทึก...
            </span>
          ) : isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มโปรดักซ์'}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="btn-ghost px-6 py-3"
        >
          ยกเลิก
        </button>
      </div>
    </form>
  )
}
