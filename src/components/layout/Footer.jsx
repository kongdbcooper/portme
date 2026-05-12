'use client'

import BrandLogo from './BrandLogo'
import EditableBlock from '../admin/EditableBlock'

const FOOTER_LINKS = {
  'Menu': [
    { label: 'Main', href: '#hero' },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact Me', href: '#contact' },
  ],
  'Information': [
    { label: 'About Me', href: '/about' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
}

export default function Footer({ settings = {} }) {
  const currentYear = new Date().getFullYear()
  const logoUrl = settings.site_logo || ''

  return (
    <footer className="relative border-t border-white/5" style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #0d0d1a 100%)' }}>

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

      <div className="section-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* ------------------- Brand Column ------------------- */}
          <div className="md:col-span-2 space-y-4">
            {/* Logo */}
            <BrandLogo href="/" logoUrl={logoUrl} />

            {/* Description */}
            <div className="text-gray-500 text-sm leading-relaxed max-w-sm">
              <EditableBlock settingKey="footer_desc" defaultText="Personal website with Admin Dashboard that can manage projects and images." />
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              {[
                { label: 'Facebook', icon: 'F', href: 'https://www.facebook.com/share/1BCib8bJRz/?mibextid=wwXIfr' },
                { label: 'Twitter/X', icon: 'X', href: '#' },
                { label: 'Instagram', icon: 'IG', href: 'https://www.instagram.com/k.xnq_?igsh=MXE3OHB4emd6Nzc4Nw%3D%3D&utm_source=qr' },
                { label: 'Line', icon: 'L', href: 'https://line.me/ti/p/Mbh0j2qwAH' },
              ].map(({ label, icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-white hover:border-brand-500/50 hover:bg-brand-500/10 transition-all duration-200"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* ------------------- Links Columns ------------------- */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title} className="space-y-4">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                <EditableBlock as="span" settingKey={`footer_links_${title.toLowerCase().replace(/\s+/g,'_')}_title`} defaultText={title} />
              </h3>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <a
                      href={href}
                      className="text-gray-500 text-sm hover:text-gray-300 transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-brand-500 transition-colors" />
                      <EditableBlock as="span" settingKey={`footer_link_${href.replace(/[^a-zA-Z0-9]/g,'_')}_label`} defaultText={label} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ------------------- Bottom Bar ------------------- */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs">
            © {currentYear} <EditableBlock as="span" settingKey="footer_copyright" defaultText="Monkey" />. <EditableBlock as="span" settingKey="footer_rights" defaultText="สงวนลิขสิทธิ์ทุกประการ" />
          </p>
          <div className="flex items-center gap-4">
            <EditableBlock as="span" className="text-gray-700 text-xs" settingKey="footer_built_with" defaultText="Built with Next.js 16 + Tailwind CSS" />
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-gray-600 text-xs">
                <EditableBlock as="span" settingKey="footer_status" defaultText="All systems operational" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
