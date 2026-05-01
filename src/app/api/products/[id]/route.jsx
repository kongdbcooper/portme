// =============================================================================
// src/app/api/products/[id]/route.js — Single Product API (Get, Update, Delete)
// ใช้งานร่วมกับ: src/lib/prisma.js, src/lib/auth.js, src/lib/r2.js
// GET /api/products/:id — ดูโปรดักซ์ (public)
// PATCH /api/products/:id — แก้ไขโปรดักซ์ (admin only)
// DELETE /api/products/:id — ลบโปรดักซ์ (admin only)
// =============================================================================


export const runtime = 'nodejs';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { deleteFromR2 } from '@/lib/r2'

// Schema สำหรับ validate update (ทุก field optional)
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

// ------------------- GET: Single Product -------------------
export async function GET(request, { params }) {
  try {
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json({ error: 'ไม่พบโปรดักซ์' }, { status: 404 })
    }

    return NextResponse.json({ product })

  } catch (error) {
    console.error('[Products] GET/:id error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

// ------------------- PATCH: Update Product -------------------
// Admin only — อัปเดตข้อมูลโปรดักซ์ รวมถึงรูปภาพ
export async function PATCH(request, { params }) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await request.json()

    const validation = UpdateProductSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // ถ้ามีการเปลี่ยนรูป ลบรูปเก่าจาก R2
    if (validation.data.imageKey) {
      const oldProduct = await prisma.product.findUnique({
        where: { id },
        select: { imageKey: true },
      })

      if (oldProduct?.imageKey && oldProduct.imageKey !== validation.data.imageKey) {
        await deleteFromR2(oldProduct.imageKey)
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: validation.data,
    })

    return NextResponse.json({ product })

  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    console.error('[Products] PATCH error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

// ------------------- DELETE: Delete Product -------------------
// Admin only — ลบโปรดักซ์และรูปภาพจาก R2
export async function DELETE(request, { params }) {
  try {
    await requireAdmin()

    const { id } = await params

    // ดึง imageKey ก่อนลบ เพื่อลบรูปจาก R2 ด้วย
    const product = await prisma.product.findUnique({
      where: { id },
      select: { imageKey: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'ไม่พบโปรดักซ์' }, { status: 404 })
    }

    // ลบ product จาก database
    await prisma.product.delete({ where: { id } })

    // ลบรูปจาก R2 (ถ้ามี)
    if (product.imageKey) {
      await deleteFromR2(product.imageKey)
    }

    return NextResponse.json({ success: true, message: 'ลบโปรดักซ์สำเร็จ' })

  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    console.error('[Products] DELETE error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
