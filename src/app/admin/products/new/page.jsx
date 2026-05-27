// =============================================================================
// src/app/admin/products/new/page.js — Add New Product Page
// หน้าเพิ่มโปรดักซ์ใหม่ + อัปโหลดรูปไปยัง R2
// ใช้งานร่วมกับ: src/components/admin/ProductForm.js
//               src/components/admin/ImageUploader.js
// =============================================================================


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import Link from 'next/link'
import ProductForm from '@/components/admin/ProductForm'

export const metadata = {
  title: 'เพิ่มโปรดักซ์ใหม่',
}

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin" className="hover:text-gray-300">Dashboard</Link>
        <span>/</span>
        <Link href="/admin/products" className="hover:text-gray-300">โปรดักซ์</Link>
        <span>/</span>
        <span className="text-white">เพิ่มใหม่</span>
      </nav>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Noto Serif Thai, serif' }}>
          เพิ่มโปรดักซ์ใหม่
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          รูปภาพจะถูกอัปโหลดไปยัง Cloudflare R2 อัตโนมัติ
        </p>
      </div>

      {/* Form Card */}
      <div className="glass-card p-6 lg:p-8">
        <ProductForm mode="create" />
      </div>
    </div>
  )
}
