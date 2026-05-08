export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import VideoForm from '@/components/admin/VideoForm'

export default async function EditVideoPage({ params }) {
  const { id } = await params

  const video = await prisma.video.findUnique({
    where: { id }
  })

  if (!video) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/admin/videos" className="text-brand-400 text-sm hover:text-brand-300 mb-2 inline-block">
            ← กลับไปหน้ารายการวิดีโอ
          </Link>
          <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            แก้ไขวิดีโอ
          </h2>
          <p className="text-gray-500 text-sm">ปรับปรุงรายละเอียดของวิดีโอ</p>
        </div>
        
        {/* Delete button (client component wrapper inside form, or simple API call) */}
        {/* To keep it simple without another client component, we rely on the form for updates. 
            For deletion, we could add a client side delete button here. */}
        <DeleteVideoButton videoId={id} />
      </div>

      {/* Form Card */}
      <div className="glass-card p-6 md:p-8">
        <VideoForm video={video} mode="edit" />
      </div>
    </div>
  )
}

// Client component for delete button
import DeleteVideoButtonClient from './DeleteVideoButtonClient'

function DeleteVideoButton({ videoId }) {
  return <DeleteVideoButtonClient videoId={videoId} />
}
