export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { deleteFromR2 } from '@/lib/r2'
import { revalidateTag, revalidatePath } from 'next/cache'

const UpdateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  price: z.number().positive().optional(),
  imageUrl: z.string().url().optional().nullable(),
  imageKey: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  abVariant: z.enum(['A', 'B', 'C']).optional(),
})

export async function GET(request, { params }) {
  try {
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('[Products] GET/:id error:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await request.json()
    const validation = UpdateProductSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid product data', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const oldProduct = Object.hasOwn(validation.data, 'imageKey')
      ? await prisma.product.findUnique({
          where: { id },
          select: { imageKey: true },
        })
      : null

    const product = await prisma.product.update({
      where: { id },
      data: validation.data,
    })

    revalidateTag('products')
    revalidatePath('/', 'layout')

    if (oldProduct?.imageKey && oldProduct.imageKey !== validation.data.imageKey) {
      await deleteFromR2(oldProduct.imageKey)
    }

    return NextResponse.json({ product })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    console.error('[Products] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()

    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      select: { imageKey: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await prisma.product.delete({ where: { id } })

    if (product.imageKey) {
      await deleteFromR2(product.imageKey)
    }

    // Invalidate cache and re-render public page
    revalidateTag('products')
    revalidatePath('/', 'layout')

    return NextResponse.json({ success: true, message: 'Product deleted' })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    console.error('[Products] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
