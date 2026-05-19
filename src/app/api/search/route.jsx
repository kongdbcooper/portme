import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const { query } = await request.json()

    if (!query || query.trim() === '') {
      return NextResponse.json({ error: 'Query is empty' }, { status: 400 })
    }

    await prisma.searchLog.create({
      data: { query: query.trim().toLowerCase() }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to log search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
