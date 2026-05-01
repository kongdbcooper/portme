export const runtime = 'nodejs';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { deleteFromR2 } from '@/lib/r2'

export async function PUT(request, { params }) {
  try {
    await requireAdmin()

    const { id } = params
    const body = await request.json()

    // ลบ id ออกจาก body เพื่อไม่ให้ถูก update
    const { id: _, createdAt, updatedAt, ...updateData } = body

    const video = await prisma.video.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(video)
  } catch (error) {
    console.error('[API] Update video error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update video' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()

    const { id } = params

    // หา video เพื่อเอา videoKey สำหรับลบไฟล์ใน R2
    const video = await prisma.video.findUnique({
      where: { id }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // ลบไฟล์ใน R2 ถ้ามี
    if (video.videoKey) {
      await deleteFromR2(video.videoKey)
    }

    // ลบใน database
    await prisma.video.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Delete video error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete video' }, { status: 500 })
  }
}
