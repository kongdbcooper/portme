export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import VideoUploadTable from '@/components/admin/VideoUploadTable'

export default async function VideosPage() {
  const videos = await prisma.video.findMany({
    orderBy: [
      { order: 'asc' },
      { createdAt: 'desc' },
    ]
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            จัดการวิดีโอ
          </h2>
          <p className="text-gray-500 text-sm">จัดการวิดีโอแนะนำและผลงาน</p>
        </div>
        <Link 
          href="/admin/videos/new"
          className="btn-gradient px-5 py-2.5 flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มวิดีโอใหม่
        </Link>
      </div>

      {/* Video Upload Table */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">อัปโหลดวิดีโอใหม่</h3>
        <VideoUploadTable />
      </div>

      {/* Video List */}
      <div className="glass-card overflow-hidden">
        {videos.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4 text-3xl">
              🎥
            </div>
            <h3 className="text-white font-medium mb-1">ยังไม่มีวิดีโอ</h3>
            <p className="text-gray-500 text-sm mb-4">เพิ่มวิดีโอแรกของคุณเพื่อแสดงผลบนหน้าเว็บไซต์</p>
            <Link href="/admin/videos/new" className="text-brand-400 hover:text-brand-300 font-medium text-sm">
              + เพิ่มวิดีโอใหม่
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-surface-800/30">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ลำดับ</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อวิดีโอ</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">คำอธิบาย</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {videos.map((video) => (
                  <tr key={video.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-gray-400 text-sm">{video.order}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-10 rounded-lg bg-black overflow-hidden flex-shrink-0 relative">
                          <video src={video.videoUrl} className="w-full h-full object-cover opacity-50" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <span className="text-white text-sm font-medium line-clamp-1">{video.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm hidden sm:table-cell">
                      <span className="line-clamp-1">{video.description || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        video.isActive 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${video.isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
                        {video.isActive ? 'ใช้งาน' : 'ปิด'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/videos/${video.id}/edit`}
                        className="inline-flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 font-medium"
                      >
                        แก้ไข
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
