import { NextResponse } from 'next/server'
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
    
    // Fallback to Raw SQL if Prisma Client is having sync issues
    await prisma.$executeRawUnsafe(`
      UPDATE "banners" 
      SET "title" = $1, "subtitle" = $2, "description" = $3, "updatedAt" = NOW()
      WHERE "id" = $4
    `, title, subtitle, description, id)

    // Return the updated banner (fetching it back)
    const banner = await prisma.banner.findUnique({ where: { id } })
    
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
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 })
  }
}
