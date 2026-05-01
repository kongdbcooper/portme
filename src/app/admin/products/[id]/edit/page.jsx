// =============================================================================
// src/app/admin/products/[id]/edit/page.js — Edit Product Page
// หน้าแก้ไขโปรดักซ์ รวมถึงเปลี่ยนรูปภาพ (ลบรูปเก่าจาก R2 อัตโนมัติ)
// ใช้งานร่วมกับ: src/lib/prisma.js, src/components/admin/ProductForm.js
//               src/app/api/products/[id]/route.js (PATCH)
// =============================================================================


export const runtime = 'nodejs';
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ProductForm from '@/components/admin/ProductForm'

// สร้าง metadata แบบ dynamic ตามชื่อโปรดักซ์
export async function generateMetadata({ params }) {
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } })
  return {
    title: product ? `แก้ไข: ${product.name}` : 'แก้ไขโปรดักซ์',
  }
}

export default async function EditProductPage({ params }) {
  const { id } = await params

  // ดึงข้อมูลโปรดักซ์จาก database
  const product = await prisma.product.findUnique({ where: { id } })

  // ถ้าไม่พบ → 404
  if (!product) notFound()

  // แปลง Decimal เป็น number เพื่อส่งไป Client Component
  const productData = {
    ...product,
    price: Number(product.price),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin" className="hover:text-gray-300">Dashboard</Link>
        <span>/</span>
        <Link href="/admin/products" className="hover:text-gray-300">โปรดักซ์</Link>
        <span>/</span>
        <span className="text-white truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          แก้ไขโปรดักซ์
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          ID: <span className="font-mono text-gray-400">{product.id}</span>
          {' · '}อัปเดตล่าสุด: {new Date(product.updatedAt).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>

      {/* Form Card */}
      <div className="glass-card p-6 lg:p-8">
        <ProductForm product={productData} mode="edit" />
      </div>
    </div>
  )
}
