import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { deleteFromR2 } from '@/lib/r2'
import { z } from 'zod'

const MEDIA_KEY_SETTINGS = new Set(['hero_background_key', 'site_logo_key'])
const ALLOWED_KEYS = [
  'site_logo_url',
  'site_logo_key',
  'hero_background_url',
  'hero_background_key',
  'hero_background_images',
  'prod_profile_images',
]

const SettingSchema = z.object({
  key: z.enum(ALLOWED_KEYS, { error: 'Invalid setting key' }),
  value: z.string(),
})

export async function POST(request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const validation = SettingSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { key, value } = validation.data

    const previous = await prisma.siteSetting.findUnique({ where: { key } })

    const setting = await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    revalidateTag('site-settings')

    // If this is a single-media key, delete previous R2 object
    if (MEDIA_KEY_SETTINGS.has(key)) {
      if (previous?.value && previous.value !== value) {
        await deleteFromR2(previous.value)
      }
    }

    // If this is the profile images array, compare previous and new keys and delete removed objects
    if (key === 'prod_profile_images') {
      try {
        const prevArr = previous?.value ? JSON.parse(previous.value) : []
        const newArr = value ? JSON.parse(value) : []

        const prevKeys = new Set(prevArr.map((i) => i.key).filter(Boolean))
        const newKeys = new Set(newArr.map((i) => i.key).filter(Boolean))

        for (const k of prevKeys) {
          if (!newKeys.has(k)) {
            await deleteFromR2(k)
          }
        }
      } catch (err) {
        console.error('[Admin Settings] Failed to diff profile images for cleanup:', err)
      }
    }

    return NextResponse.json({
      success: true,
      data: setting,
    })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }

    console.error('[Admin Settings] Save error:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
