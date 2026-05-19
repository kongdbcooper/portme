import { unstable_cache } from 'next/cache'
import { prisma } from './prisma'

/**
 * ดึงข้อมูลสินค้าที่ใช้งานอยู่ทั้งหมด พร้อม Cache บน Vercel/Next.js Data Cache
 * ความเร็วในการตอบสนองเฉลี่ยต่ำกว่า 5ms ปลอดภัยจากการดึงคอขวดของฐานข้อมูล
 */
export const getCachedProducts = (category = 'all') => unstable_cache(
  async () => {
    return prisma.product.findMany({
      where: { 
        isActive: true,
        ...(category && category !== 'all' ? { category } : {})
      },
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { order: 'asc' } } }
    })
  },
  [`public-products-list-${category}`],
  { 
    revalidate: 60, // รีเฟรชฐานข้อมูลทุกๆ 60 วินาทีในพื้นหลังแบบ ISR
    tags: ['products'] 
  }
)()

/**
 * ดึงข้อมูลสินค้ารายชิ้นแบบละเอียด พร้อม Cache รายสินค้า
 */
export const getCachedProduct = (id) => unstable_cache(
  async () => {
    return prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { order: 'asc' } } }
    })
  },
  [`product-detail-${id}`],
  { 
    revalidate: 60, 
    tags: [`product-${id}`, 'products'] 
  }
)()
