import { unstable_cache } from 'next/cache'
import { prisma } from './prisma'

// ------------------- Get Cached Settings -------------------
// ดึงข้อมูล Site Settings จาก Database และ Cache ไว้ 5 นาที (300 วินาที)
// หากมีการแก้ไขผ่าน Dashboard จะถูก revalidate ทันทีด้วย tag 'site-settings'
export const getCachedSettings = unstable_cache(
  async () => {
    try {
      const settings = await prisma.siteSetting.findMany()
      const settingsMap = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value
        return acc
      }, {})
      return settingsMap
    } catch (error) {
      console.error('[Settings] Failed to fetch settings:', error)
      return {}
    }
  },
  ['site-settings-cache'], // unique key
  {
    revalidate: 300, // 5 minutes
    tags: ['site-settings'],
  }
)
