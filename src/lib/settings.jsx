import { unstable_cache } from 'next/cache'
import { prisma } from './prisma'

// ------------------- Cache Variables -------------------
const CACHE_DURATION = 60000; // 60 วินาที

let settingsCache = null;
let settingsLastFetch = 0;
let settingsPromise = null;

export function clearSettingsCache() {
  settingsCache = null;
  settingsLastFetch = 0;
}

// ------------------- Get Fresh Settings (Robust) -------------------
export async function getFreshSettings() {
  const now = Date.now();
  if (settingsCache && (now - settingsLastFetch < CACHE_DURATION)) {
    return settingsCache;
  }
  if (settingsPromise) {
    return settingsPromise;
  }

  settingsPromise = (async () => {
    try {
      const dbSettings = await prisma.siteSetting.findMany();
      if (!dbSettings) {
        throw new Error("Database returned empty payload for settings");
      }

      const formattedSettings = dbSettings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});

      // ถ้าฐานข้อมูลไม่ได้ล่มแต่ค่าในฐานข้อมูลว่างเปล่าจริงๆ
      if (Object.keys(formattedSettings).length === 0 && settingsCache) {
        throw new Error("Database returned 0 settings, preventing empty overwrite.");
      }

      settingsCache = formattedSettings;
      settingsLastFetch = Date.now();
      return settingsCache;
    } catch (error) {
      console.error('[Settings] Fetch failed (Database Issue):', error.message);
      if (settingsCache) return settingsCache; // ห้ามคืนค่า {} เด็ดขาดถ้าเคยมีข้อมูลแล้ว
      throw error; // โยน Error ไปให้ Next.js ดีกว่าแสดงเว็บพังๆ (default) แก่ผู้ใช้ 1000 คน
    } finally {
      settingsPromise = null;
    }
  })();

  return settingsPromise;
}

// ------------------- Get Cached Settings -------------------
export const getCachedSettings = unstable_cache(
  async () => {
    return getFreshSettings()
  },
  ['site-settings-cache-v4'], 
  {
    revalidate: 60, // Next.js ISR Cache 60s
    tags: ['site-settings'],
  }
)
