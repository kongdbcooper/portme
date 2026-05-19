export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { deleteFromR2 } from '@/lib/r2'
import { revalidateTag, revalidatePath } from 'next/cache'

// POST: Add image to product
export async function POST(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const { imageUrl, imageKey } = body
    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
    }

    // Get the next order number
    const lastImage = await prisma.productImage.findFirst({
      where: { productId: id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const nextOrder = (lastImage?.order ?? -1) + 1

    const image = await prisma.productImage.create({
      data: {
        productId: id,
        imageUrl,
        imageKey: imageKey || null,
        order: nextOrder,
      },
    })

    // If this is the first image, also set it as the product's cover
    if (nextOrder === 0) {
      await prisma.product.update({
        where: { id },
        data: { imageUrl, imageKey: imageKey || null },
      })
    }

    revalidateTag('products')
    revalidatePath('/')
    revalidatePath('/products')

    return NextResponse.json({ image }, { status: 201 })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    console.error('[ProductImages] POST error:', error)
    return NextResponse.json({ error: 'Failed to add image' }, { status: 500 })
  }
}

// DELETE: Remove image from product
export async function DELETE(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')

    if (!imageId) {
      return NextResponse.json({ error: 'imageId is required' }, { status: 400 })
    }

    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
      select: { imageKey: true, productId: true, order: true },
    })

    if (!image || image.productId !== id) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    await prisma.productImage.delete({ where: { id: imageId } })

    // Delete from R2
    if (image.imageKey) {
      await deleteFromR2(image.imageKey)
    }

    // If deleted the cover image (order 0), promote the next image
    if (image.order === 0) {
      const nextCover = await prisma.productImage.findFirst({
        where: { productId: id },
        orderBy: { order: 'asc' },
      })
      await prisma.product.update({
        where: { id },
        data: {
          imageUrl: nextCover?.imageUrl || null,
          imageKey: nextCover?.imageKey || null,
        },
      })
    }

    revalidateTag('products')
    revalidatePath('/')
    revalidatePath('/products')

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    console.error('[ProductImages] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}

// PATCH: Reorder images / set cover
export async function PATCH(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()

    // Set a specific image as cover
    if (body.setCoverId) {
      const coverImage = await prisma.productImage.findUnique({
        where: { id: body.setCoverId },
      })
      if (!coverImage || coverImage.productId !== id) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 })
      }

      // Swap orders: current cover (order 0) gets this image's order, this image gets order 0
      const currentCover = await prisma.productImage.findFirst({
        where: { productId: id, order: 0 },
      })

      if (currentCover && currentCover.id !== coverImage.id) {
        await prisma.$transaction([
          prisma.productImage.update({
            where: { id: currentCover.id },
            data: { order: coverImage.order },
          }),
          prisma.productImage.update({
            where: { id: coverImage.id },
            data: { order: 0 },
          }),
          prisma.product.update({
            where: { id },
            data: { imageUrl: coverImage.imageUrl, imageKey: coverImage.imageKey },
          }),
        ])
      } else if (!currentCover) {
        await prisma.$transaction([
          prisma.productImage.update({
            where: { id: coverImage.id },
            data: { order: 0 },
          }),
          prisma.product.update({
            where: { id },
            data: { imageUrl: coverImage.imageUrl, imageKey: coverImage.imageKey },
          }),
        ])
      }

      revalidateTag('products')
      revalidatePath('/')
      revalidatePath('/products')

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'No action specified' }, { status: 400 })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    console.error('[ProductImages] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update images' }, { status: 500 })
  }
}
