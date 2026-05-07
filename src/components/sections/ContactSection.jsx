'use client'

import { useRef, useState, useEffect } from 'react'
import EditableBlock from '../admin/EditableBlock'

export default function ContactSection({ settings = {} }) {
  return (
    <section
      id="contact"
      className="py-24 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #111118 100%)' }}
    >
      {/* Seamless Transition Overlay (Top) */}
      <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-[#0a0a0f] to-transparent z-10 pointer-events-none" />

      {/* Decorative orb */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #5a6bff 0%, transparent 70%)', filter: 'blur(60px)' }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-medium mb-4">
              <EditableBlock settingKey="contact_badge" defaultText={settings.contact_badge || "Contact Me"} />
            </div>
            <h2 className="text-4xl font-black text-white mb-6">
              <EditableBlock as="span" settingKey="contact_title_1" defaultText={settings.contact_title_1 || "สนใจร่วมงานกับเรา "} />
              <EditableBlock as="span" className="text-brand-500" settingKey="contact_title_2" defaultText={settings.contact_title_2 || "ติดต่อได้ทันที"} />
            </h2>
            <div className="text-gray-500 mt-3 max-w-2xl mx-auto">
              <EditableBlock 
                as="span" 
                settingKey="contact_desc" 
                multiline 
                defaultText={settings.contact_desc || "หากคุณสนใจในผลงานของเรา หรือต้องการปรึกษาโปรเจกต์ สามารถติดต่อเราได้ผ่านช่องทางด้านล่างนี้ครับ"} 
              />
            </div>
          </div>

          {/* Contact Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 animate-fade-up max-w-4xl mx-auto">
            {/* Email Card */}
            <div className="bg-surface-800/40 backdrop-blur-md border border-white/5 p-8 rounded-[2rem] text-center hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/10 group">
              <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">📧</span>
              </div>
              <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
                <EditableBlock settingKey="contact_label_1" defaultText={settings.contact_label_1 || "Email"} />
              </div>
              <div className="text-white text-lg font-bold">
                <EditableBlock settingKey="contact_value_1" defaultText={settings.contact_value_1 || "hello@portme.co"} />
              </div>
            </div>

            {/* Line Card */}
            <div className="bg-surface-800/40 backdrop-blur-md border border-white/5 p-8 rounded-[2rem] text-center hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/10 group">
              <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">📱</span>
              </div>
              <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
                <EditableBlock settingKey="contact_label_2" defaultText={settings.contact_label_2 || "Line"} />
              </div>
              <div className="text-white text-lg font-bold">
                <EditableBlock settingKey="contact_value_2" defaultText={settings.contact_value_2 || "@portme"} />
              </div>
            </div>

            {/* Hours Card */}
            <div className="bg-surface-800/40 backdrop-blur-md border border-white/5 p-8 rounded-[2rem] text-center hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/10 group">
              <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🕐</span>
              </div>
              <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
                <EditableBlock settingKey="contact_label_3" defaultText={settings.contact_label_3 || "Business Hours"} />
              </div>
              <div className="text-white text-lg font-bold">
                <EditableBlock settingKey="contact_value_3" defaultText={settings.contact_value_3 || "Mon-Fri 9:00-18:00"} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
