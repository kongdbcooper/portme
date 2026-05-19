// =============================================================================
// src/app/(public)/search/page.jsx — Public Search Results Page
// แสดงผลลัพธ์การค้นหา สินค้าและวิดีโอ
// =============================================================================

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ProductTrackerButton from '../products/ProductTrackerButton'
import SearchLogger from './SearchLogger'

export const metadata = {
  title: 'Search Results | PortMe',
}

export default async function SearchResultsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams
  const query = resolvedSearchParams?.q || ''

  let products = []
  let videos = []

  if (query) {
    products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    videos = await prisma.video.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: { order: 'asc' }
    })
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 section-container">
      {/* SearchLogger will call the API to log the search on the client side */}
      <SearchLogger query={query} />

      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            ผลการค้นหาสำหรับ: <span className="text-brand-400">"{query}"</span>
          </h1>
          <p className="text-gray-400">
            พบสินค้า {products.length} รายการ และวิดีโอ {videos.length} รายการ
          </p>
        </div>

        {products.length === 0 && videos.length === 0 ? (
          <div className="text-center py-20 glass-card">
            <div className="text-6xl mb-4 opacity-50">🔍</div>
            <h3 className="text-xl text-gray-300 font-medium">ไม่พบผลลัพธ์ที่ตรงกับ "{query}"</h3>
            <p className="text-gray-500 mt-2">ลองใช้คำค้นหาอื่นดูอีกครั้ง</p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Products Section */}
            {products.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-2">🛍️ สินค้า</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {products.map(product => (
                    <div key={product.id} className="glass-card group flex flex-col h-full hover:border-brand-500/50 transition-all duration-300">
                      <div className="relative w-full aspect-[4/3] bg-surface-800 overflow-hidden">
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
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {product.name}
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-grow">
                          {product.description || 'ไม่มีรายละเอียดสินค้า'}
                        </p>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                          <span className="text-xl font-black text-brand-400">
                            ฿{Number(product.price).toLocaleString('th-TH')}
                          </span>
                          <ProductTrackerButton product={product} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Section */}
            {videos.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-2">🎥 วิดีโอ</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video) => (
                    <div key={video.id} className="glass-card overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                      <div className="relative w-full aspect-video bg-black">
                        <video
                          src={video.videoUrl}
                          className="w-full h-full object-contain"
                          controls
                          controlsList="nodownload"
                          preload="metadata"
                        />
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {video.title}
                        </h3>
                        {video.description && (
                          <p className="text-gray-400 text-sm line-clamp-2">{video.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
