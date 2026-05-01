export const runtime = 'nodejs';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit'), 10) : undefined

    const videos = await prisma.video.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    })
    return NextResponse.json({ videos })
  } catch (error) {
    console.error('[API] Fetch videos error:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { title, description, videoUrl, videoKey, isActive, order } = body

    if (!title || !videoUrl) {
      return NextResponse.json({ error: 'Missing required fields: title, videoUrl' }, { status: 400 })
    }

    const video = await prisma.video.create({
      data: {
        title,
        description,
        videoUrl,
        videoKey,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
      },
    })

    return NextResponse.json(video)
  } catch (error) {
    console.error('[API] Create video error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create video' }, { status: 500 })
  }
}
