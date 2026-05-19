import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import TeamSection from '@/components/sections/TeamSection'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'About Me | PortMe',
  description: 'รู้จักกับเราให้มากขึ้น ประวัติและวิสัยทัศน์',
}

export default async function AboutPage() {
  const siteSettings = await prisma.siteSetting.findMany()
  const settings = siteSettings.reduce((acc, curr) => {
    acc[curr.key] = curr.value
    return acc
  }, {})

  const aboutImageUrl = settings.about_image_url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 section-container">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            รู้จักกับ<span className="gradient-text">เรา</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            เราคือผู้นำในการสร้างสรรค์และนำเสนอผลิตภัณฑ์ที่มีคุณภาพ มุ่งเน้นความพึงพอใจของลูกค้าและนวัตกรรม
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          {/* Image Placeholder */}
          <div className="relative aspect-square md:aspect-[4/5] rounded-3xl overflow-hidden glass-card group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-orange-500/20 z-10 opacity-50 group-hover:opacity-30 transition-opacity duration-500"></div>
            <img 
              src={aboutImageUrl} 
              alt="About Us Team" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>

          {/* Text Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>วิสัยทัศน์ของเรา</h2>
              <p className="text-gray-400 leading-relaxed">
                เป้าหมายของเราคือการส่งมอบผลิตภัณฑ์และบริการที่ตอบโจทย์ความต้องการของผู้คนในยุคดิจิทัล 
                เราคัดสรรสินค้าอย่างพิถีพิถัน และมุ่งหวังให้ลูกค้าทุกคนได้รับประสบการณ์ที่ดีที่สุด
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>ทำไมต้องเลือกเรา?</h3>
              <ul className="space-y-3">
                {[
                  'สินค้าคุณภาพที่ผ่านการคัดกรองมาอย่างดี',
                  'บริการด้วยความใส่ใจและรวดเร็ว',
                  'การพัฒนาอย่างต่อเนื่องเพื่อตอบสนองความต้องการ',
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-400">
                    <span className="text-brand-400 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6">
              <Link href="/#contact" className="btn-gradient">
                ติดต่อเรา
              </Link>
            </div>
          </div>
        </div>

        {/* Team Preview Section */}
        <TeamSection settings={settings} />
      </div>
    </div>
  )
}
