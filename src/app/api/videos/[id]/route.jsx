export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { deleteFromR2 } from '@/lib/r2'
import { revalidateTag, revalidatePath } from 'next/cache'

const UpdateVideoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  videoUrl: z.string().url().optional(),
  videoKey: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
})

export async function PUT(request, { params }) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await request.json()
    const validation = UpdateVideoSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid video data', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const existingVideo = await prisma.video.findUnique({
      where: { id },
    })

    if (!existingVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const video = await prisma.video.update({
      where: { id },
      data: validation.data,
    })

    if (
      Object.hasOwn(validation.data, 'videoKey') &&
      existingVideo.videoKey &&
      existingVideo.videoKey !== validation.data.videoKey
    ) {
      await deleteFromR2(existingVideo.videoKey)
    }

    // Invalidate cache
    revalidateTag('videos')
    revalidatePath('/')

    return NextResponse.json(video)
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    console.error('[API] Update video error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update video' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()

    const { id } = await params
    const video = await prisma.video.findUnique({
      where: { id },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    await prisma.video.delete({
      where: { id },
    })

    if (video.videoKey) {
      await deleteFromR2(video.videoKey)
    }

    // Invalidate cache
    revalidateTag('videos')
    revalidatePath('/')

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    console.error('[API] Delete video error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete video' }, { status: 500 })
  }
}
