import { NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { deleteFromR2 } from '@/lib/r2'

export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  try {
    await requireAdmin()
    
    const { id } = await params
    const body = await request.json()
    const { title, subtitle, description } = body
    
      // Update using Prisma (more robust for partial updates)
    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(description !== undefined && { description }),
      }
    })

    revalidateTag('banners')
    revalidatePath('/')
    
    return NextResponse.json({ success: true, data: banner })
  } catch (error) {
    console.error('[Banner PATCH] Error:', error)
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'Failed to update banner' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()
    
    const { id } = await params
    
    const banner = await prisma.banner.findUnique({ where: { id } })
    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }
    
    await prisma.banner.delete({ where: { id } })
    
    // Delete from R2 if imageKey exists
    if (banner.imageKey) {
      await deleteFromR2(banner.imageKey).catch(err => console.error('Failed to delete image from R2', err))
    }

    revalidateTag('banners')
    revalidatePath('/')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 })
  }
}
