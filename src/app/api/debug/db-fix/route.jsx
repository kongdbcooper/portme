import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
    
    console.log('[Debug] Running database fix...')
    
    // Add column if not exists
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "banners" ADD COLUMN IF NOT EXISTS "description" TEXT;
    `)
    
    // Check if it exists now
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'banners'
    `
    
    return NextResponse.json({ 
      success: true, 
      message: 'Column ensured', 
      columns 
    })
  } catch (error) {
    console.error('[Debug] Fix failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
