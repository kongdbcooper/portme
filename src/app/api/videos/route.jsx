export const runtime = 'nodejs';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { revalidateTag } from 'next/cache'

const CreateVideoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  videoUrl: z.string().url(),
  videoKey: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
})

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    // ถ้า limit ระบุเป็นตัวเลขจะใช้นั้น, มิฉะนั้น ดึงทั้งหมด (unlimited)
    const limit = searchParams.get('limit') 
      ? parseInt(searchParams.get('limit'), 10) 
      : undefined

    const videos = await prisma.video.findMany({
      where: { isActive: true },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    })
    return new NextResponse(JSON.stringify({ videos }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('[API] Fetch videos error:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const validation = CreateVideoSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid video data', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { title, description, videoUrl, videoKey, isActive, order } = validation.data

    const video = await prisma.video.create({
      data: {
        title,
        description,
        videoUrl,
        videoKey,
        isActive: isActive !== undefined ? isActive : true,
        order: order ?? 0,
      },
    })

    // Invalidate cache
    revalidateTag('videos')

    return NextResponse.json(video)
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    console.error('[API] Create video error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create video' }, { status: 500 })
  }
}
