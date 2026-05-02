import Image from 'next/image'
import Link from 'next/link'

export default function BrandLogo({ logoUrl, className = '', iconClassName = '' }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-3 group ${className}`}>
      <div className={`relative w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center overflow-hidden ${iconClassName}`}>
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt="PortMe logo"
            fill
            sizes="40px"
            className="object-cover"
          />
        ) : (
          <span className="text-white font-bold text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>P</span>
        )}
      </div>
      <span className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
        Port<span className="gradient-text">Me</span>
      </span>
    </Link>
  )
}
