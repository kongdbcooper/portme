import { unstable_cache } from 'next/cache'
import { prisma } from './prisma'

// ------------------- Get Fresh Settings (No Cache) -------------------
export async function getFreshSettings() {
  try {
    const settings = await prisma.siteSetting.findMany()
    return settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {})
  } catch (error) {
    console.error('[Settings] Fresh fetch failed:', error)
    return {}
  }
}

// ------------------- Get Cached Settings -------------------
export const getCachedSettings = unstable_cache(
  async () => {
    return getFreshSettings()
  },
  ['site-settings-cache-v3'], 
  {
    revalidate: 60,
    tags: ['site-settings'],
  }
)
