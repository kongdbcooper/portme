import { NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/admin/banners
export async function GET(request) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    const where = type ? { type } : {}
    
    const banners = await prisma.banner.findMany({
      where,
      orderBy: { order: 'asc' },
    })
    
    return NextResponse.json(banners)
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}

// POST /api/admin/banners
export async function POST(request) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const { type, title, subtitle, description, imageUrl, imageKey, isActive = true } = body
    
    if (!type || !imageUrl) {
      return NextResponse.json({ error: 'Type and imageUrl are required' }, { status: 400 })
    }
    
    // Auto-calculate next order
    const maxOrderBanner = await prisma.banner.findFirst({
      where: { type },
      orderBy: { order: 'desc' },
      select: { order: true }
    })
    const order = (maxOrderBanner?.order ?? -1) + 1
    
    const banner = await prisma.banner.create({
      data: {
        type,
        title,
        subtitle,
        description,
        imageUrl,
        imageKey,
        order,
        isActive
      }
    })

    revalidateTag('banners')
    revalidatePath('/')
    
    return NextResponse.json({ success: true, data: banner }, { status: 201 })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
  }
}
