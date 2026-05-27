// =============================================================================
// src/app/(public)/products/[id]/page.jsx — Public Single Product Detail Page
// แสดงรายละเอียดรูปภาพเพิ่มเติม ข้อความอธิบายแบบจัดรูปประโยค และปุ่มสนใจสินค้า
// =============================================================================

import { getCachedProduct } from '@/lib/products-cache'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductGallery from './ProductGallery'
import ProductTrackerButton from '../ProductTrackerButton'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { id } = await params
  const product = await getCachedProduct(id)

  if (!product) return { title: 'Product Not Found' }

  return {
    title: `${product.name} | PortMe`,
    description: product.description || 'ดูรายละเอียดโปรดักซ์เพิ่มเติม',
  }
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params

  // ดึงรายละเอียดสินค้าพร้อมรูปภาพสัมพันธ์ทั้งหมด ผ่าน caching layer (ความเร็วระดับ ms)
  const product = await getCachedProduct(id)

  if (!product || !product.isActive) {
    notFound()
  }

  // รวบรวมรูปภาพทั้งหมด (ImageUrl หลัก + อัลบั้มรูป)
  const allImages = []
  if (product.imageUrl) {
    allImages.push({ id: 'main', imageUrl: product.imageUrl })
  }
  
  product.images.forEach(img => {
    // ป้องกันรูปภาพซ้ำซ้อนกับรูปหน้าปกหลัก
    if (img.imageUrl !== product.imageUrl) {
      allImages.push({ id: img.id, imageUrl: img.imageUrl })
    }
  })

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-8 lg:px-12 section-container">
      <div className="max-w-[1500px] mx-auto">
        
        {/* Breadcrumbs / Back button (Dual Back buttons) */}
        <div className="flex flex-wrap gap-4 items-center mb-8">
          <Link 
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/10 rounded-full transition-all duration-300 shadow-md active:scale-95"
          >
            <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ย้อนกลับไปหน้าสินค้าทั้งหมด
          </Link>
          <Link 
            href="/#products"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/10 rounded-full transition-all duration-300 shadow-md active:scale-95"
          >
            <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            ย้อนกลับไปยังหน้าพรีวิวสินค้า
          </Link>
        </div>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          
          {/* Left: Dynamic Image Gallery */}
          <div className="lg:col-span-8 w-full">
            <ProductGallery images={allImages} productName={product.name} />
          </div>

          {/* Right: Detailed Product Info */}
          <div className="lg:col-span-4 space-y-6 lg:pt-4">
            
            {/* Category Tag */}
            {product.category && (
              <div>
                <span className="px-3.5 py-1.5 text-xs font-semibold bg-brand-500/10 border border-brand-500/20 rounded-full text-brand-300">
                  {product.category}
                </span>
              </div>
            )}

            {/* Product Name */}
            <h1 
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight" 
              style={{ fontFamily: 'Noto Serif Thai, serif' }}
            >
              {product.name}
            </h1>

            {/* Product Price */}
            <div className="text-3xl font-black text-brand-400">
              ฿{Number(product.price).toLocaleString('th-TH')}
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Detailed Description */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Noto Serif Thai, serif' }}>
                รายละเอียดสินค้า
              </h3>
              <p className="text-gray-300 leading-relaxed text-base whitespace-pre-wrap">
                {product.description || 'ไม่มีคำอธิบายหรือรายละเอียดเพิ่มเติมสำหรับสินค้านี้'}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Action CTA Box */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-white">สนใจในผลิตภัณฑ์ชิ้นนี้?</h4>
                <p className="text-xs text-gray-500 mt-1">คลิกปุ่มเพื่อส่งสัญญาณความสนใจให้ทีมงานทราบ</p>
              </div>
              <ProductTrackerButton product={product} />
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
