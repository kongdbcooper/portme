import Link from 'next/link'
import VideoForm from '@/components/admin/VideoForm'

export default function NewVideoPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/videos" className="text-brand-400 text-sm hover:text-brand-300 mb-2 inline-block">
          ← กลับไปหน้ารายการวิดีโอ
        </Link>
        <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
          เพิ่มวิดีโอใหม่
        </h2>
        <p className="text-gray-500 text-sm">อัปโหลดวิดีโอและกรอกรายละเอียด</p>
      </div>

      {/* Form Card */}
      <div className="glass-card p-6 md:p-8">
        <VideoForm mode="create" />
      </div>
    </div>
  )
}
