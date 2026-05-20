// =============================================================================
// src/app/admin/products/page.js — Admin Product List Page
// แสดงรายการโปรดักซ์ทั้งหมดสำหรับ Admin พร้อม delete/edit
// ใช้งานร่วมกับ: src/lib/prisma.js, src/app/api/products/[id]/route.js
//               src/app/admin/layout.js
// =============================================================================


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import DeleteProductButton from './DeleteProductButton'
import { FaBox } from 'react-icons/fa6'

export const metadata = {
  title: 'จัดการโปรดักซ์',
}

// Server Component — ดึงข้อมูลตรงจาก database
export default async function AdminProductsPage({ searchParams }) {
  const { page = '1', q = '' } = await searchParams
  const currentPage = parseInt(page)
  const limit = 10

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {}

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            โปรดักซ์ทั้งหมด
          </h2>
          <p className="text-gray-500 text-sm mt-1">พบ {total} รายการ</p>
        </div>
        <Link
          href="/admin/products/new"
          id="products-list-add-btn"
          className="btn-gradient px-5 py-2.5 text-sm inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มโปรดักซ์ใหม่
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            name="q"
            type="text"
            defaultValue={q}
            placeholder="ค้นหาโปรดักซ์..."
            className="form-input pl-10 text-sm"
            id="products-search-input"
          />
        </div>
        <button type="submit" className="btn-ghost px-4 py-2 text-sm">ค้นหา</button>
        {q && (
          <Link href="/admin/products" className="btn-ghost px-4 py-2 text-sm text-gray-500">
            ล้าง
          </Link>
        )}
      </form>

      {/* Products Table */}
      <div className="glass-card overflow-hidden">
        {products.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-3 flex justify-center text-gray-700"><FaBox /></div>
            <p className="text-gray-500">
              {q ? `ไม่พบโปรดักซ์ที่ตรงกับ "${q}"` : 'ยังไม่มีโปรดักซ์'}
            </p>
            {!q && (
              <Link href="/admin/products/new" className="inline-block mt-4 text-brand-400 hover:text-brand-300 text-sm">
                + เพิ่มโปรดักซ์แรก
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">รูปภาพ</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อโปรดักซ์</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">หมวดหมู่</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ราคา</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Variant</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-white/2 transition-colors group">
                      {/* Thumbnail */}
                      <td className="px-5 py-3.5">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm"><FaBox /></div>
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <p className="text-white font-medium text-sm max-w-[200px] truncate">{product.name}</p>
                        <p className="text-gray-600 text-xs mt-0.5 max-w-[200px] truncate">{product.description || '—'}</p>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5 text-gray-400 text-sm hidden sm:table-cell">
                        {product.category || '—'}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3.5">
                        <span className="text-brand-400 font-bold text-sm">
                          ฿{Number(product.price).toLocaleString('th-TH')}
                        </span>
                      </td>

                      {/* AB Variant */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className={`badge text-xs ${product.abVariant === 'A' ? 'bg-brand-500/15 text-brand-400' : 'bg-accent-500/15 text-accent-400'}`}>
                          Variant {product.abVariant}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`badge text-xs ${product.isActive ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-500'}`}>
                          {product.isActive ? '● ใช้งาน' : '○ ปิด'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-brand-500/20 transition-all"
                            title="แก้ไข"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <DeleteProductButton productId={product.id} productName={product.name} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
                <p className="text-gray-600 text-xs">
                  หน้า {currentPage} จาก {totalPages}
                </p>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`/admin/products?page=${p}${q ? `&q=${q}` : ''}`}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all ${
                        p === currentPage
                          ? 'bg-brand-500 text-white'
                          : 'text-gray-500 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {p}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
