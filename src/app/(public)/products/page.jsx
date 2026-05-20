// =============================================================================
// src/app/(public)/products/page.jsx — Public All Products Page
// แสดงสินค้าทั้งหมด แยกตามหมวดหมู่
// =============================================================================

import { getCachedProducts } from '@/lib/products-cache'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'All Products | PortMe',
  description: 'ดูสินค้าทั้งหมดของเรา แยกตามหมวดหมู่',
}

// Revalidate ทุกๆ 60 วินาที
export const revalidate = 60



export default async function AllProductsPage({ searchParams }) {

  // รับค่าหมวดหมู่จาก URL Query
  const resolvedSearchParams = await searchParams
  const categoryParam = resolvedSearchParams?.category || 'all'

  // ดึงสินค้าทั้งหมดที่ใช้งานอยู่ ผ่าน caching layer (ความเร็วระดับ ms)
  const products = await getCachedProducts('all')

  // สร้างรายการหมวดหมู่ที่ไม่ซ้ำ
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))]

  // กรองสินค้าตามหมวดหมู่ที่เลือก
  const filteredProducts = categoryParam === 'all' 
    ? products 
    : products.filter(p => p.category === categoryParam)

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 section-container">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            ค้นหา<span className="gradient-text">สิ่งที่คุณต้องการ</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            ดูสินค้าทั้งหมดของเราที่นี่ เลือกหมวดหมู่เพื่อค้นหาสินค้าที่ตรงใจคุณมากที่สุด
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {categories.map(cat => {
            const isActive = categoryParam === cat
            const label = cat === 'all' ? 'ทั้งหมด' : cat
            return (
              <Link
                key={cat}
                href={`/products?category=${cat}`}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 border border-brand-400'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-50">🛍️</div>
            <h3 className="text-xl text-gray-300 font-medium">ไม่พบสินค้าในหมวดหมู่นี้</h3>
            <p className="text-gray-500 mt-2">ลองเลือกหมวดหมู่ใหม่ หรือกลับไปดูสินค้าทั้งหมด</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredProducts.map(product => (
              <div key={product.id} className="glass-card group flex flex-col h-full hover:border-brand-500/50 transition-all duration-300">
                {/* Product Image */}
                <Link href={`/products/${product.id}`} className="relative block w-full aspect-[4/3] bg-surface-800 overflow-hidden cursor-pointer">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl text-white/10 font-bold">
                      {product.name.charAt(0)}
                    </div>
                  )}
                  {product.category && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 text-xs font-medium bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white">
                        {product.category}
                      </span>
                    </div>
                  )}
                </Link>

                {/* Product Info */}
                <div className="p-6 flex flex-col flex-grow">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 hover:text-brand-400 transition-colors" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-grow">
                    {product.description || 'ไม่มีรายละเอียดสินค้า'}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5 gap-2">
                    <span className="text-xl font-black text-brand-400">
                      ฿{Number(product.price).toLocaleString('th-TH')}
                    </span>
                    <Link 
                      href={`/products/${product.id}`}
                      className="px-4 py-2 rounded-xl text-sm font-semibold border border-brand-500/30 bg-brand-500/10 text-brand-300 hover:bg-brand-500 hover:text-white transition-all duration-300 active:scale-95"
                    >
                      ดูรายละเอียด
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Client Component สำหรับปุ่มและติดตามพฤติกรรม (Track Event)
import ProductTrackerButton from './ProductTrackerButton'
