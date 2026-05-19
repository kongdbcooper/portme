// =============================================================================
// src/app/api/products/route.js — Products API (List + Create)
// ใช้งานร่วมกับ: src/lib/prisma.js, src/lib/auth.js
// GET /api/products — ดึงรายการโปรดักซ์ทั้งหมด (public)
// POST /api/products — สร้างโปรดักซ์ใหม่ (admin only)
// =============================================================================


export const runtime = 'nodejs';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCachedProducts } from '@/lib/products-cache'
import { requireAdmin } from '@/lib/auth'
import { revalidateTag, revalidatePath } from 'next/cache'

// Schema สำหรับ validate create product
const CreateProductSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อโปรดักซ์').max(200),
  description: z.string().optional(),
  price: z.number().positive('ราคาต้องมากกว่า 0'),
  imageUrl: z.string().url().optional().nullable(),
  imageKey: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  abVariant: z.enum(['A', 'B', 'C']).default('A'),
  images: z.array(z.object({
    imageUrl: z.string().url(),
    imageKey: z.string().optional().nullable(),
  })).optional(),
})

// ------------------- GET: List Products -------------------
// Public endpoint — ทุกคนเข้าได้
// Admin ดูทุก product, User/Guest ดูเฉพาะ isActive = true
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const q = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '12')
    const page = parseInt(searchParams.get('page') || '1')
    const adminView = searchParams.get('admin') === 'true'

    if (adminView) {
      await requireAdmin()
    }

    const where = {
      ...(adminView ? {} : { isActive: true }), // admin เห็นทั้งหมด
      ...(category ? { category } : {}),
      ...(q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
        ]
      } : {}),
    }

    // เมื่อมีการระบุ limit แบบเฉพาะเจาะจง (เช่น limit=1000 สำหรับ frontend carousel)
    // จะไม่ใช้ pagination
    const isPaginationEnabled = limit <= 100

    let products
    let total

    if (!adminView && !q && !isPaginationEnabled) {
      products = await getCachedProducts(category || 'all')
      total = products.length
    } else {
      const [dbProducts, dbTotal] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: isPaginationEnabled ? (page - 1) * limit : 0,
          take: limit,
          include: { images: { orderBy: { order: 'asc' } } },
        }),
        prisma.product.count({ where }),
      ])
      products = dbProducts
      total = dbTotal
    }

    return new NextResponse(JSON.stringify({
      products,
      ...(isPaginationEnabled && {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })

  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    console.error('[Products] GET error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

// ------------------- POST: Create Product -------------------
// Admin only
export async function POST(request) {
  try {
    // ตรวจสอบว่าเป็น Admin
    await requireAdmin()

    const body = await request.json()
    const validation = CreateProductSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { images, ...productData } = validation.data

    const product = await prisma.product.create({
      data: {
        ...productData,
        images: images && images.length > 0 ? {
          create: images.map((img, index) => ({
            ...img,
            order: index,
          })),
        } : undefined,
      },
      include: { images: { orderBy: { order: 'asc' } } }
    })

    // Invalidate cache
    revalidateTag('products')
    revalidatePath('/')
    revalidatePath('/products')

    return NextResponse.json({ product }, { status: 201 })

  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    console.error('[Products] POST error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
