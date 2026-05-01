// =============================================================================
// src/components/sections/ContactSection.js — Contact Form (Section 3)
// ฟอร์มติดต่อที่ทันสมัย พร้อม validation และ animation
// ใช้งานร่วมกับ: src/app/page.js, src/app/globals.css
// =============================================================================

'use client'

import { useState } from 'react'
import { trackEvent } from '@/components/analytics/GoogleAnalytics'

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [focused, setFocused] = useState('')

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')

    try {
      // Track GA event
      trackEvent('contact_form_submit', { method: 'email' })

      // TODO: เชื่อมต่อ API ส่ง email จริง (เช่น Resend, SendGrid)
      await new Promise((r) => setTimeout(r, 1200))
      setStatus('success')
      setForm({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  const inputClass = (name) =>
    `form-input transition-all duration-200 ${focused === name ? 'ring-2 ring-brand-500/30' : ''}`

  return (
    <section
      id="contact"
      className="section-py relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #111118 100%)' }}
    >
      {/* Decorative orb */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #5a6bff 0%, transparent 70%)', filter: 'blur(60px)' }}
      />

      <div className="section-container relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-medium mb-4">
              ✉ ติดต่อเรา
            </div>
            <h2 className="section-heading text-white">
              พร้อมช่วยเหลือ<span className="gradient-text">คุณเสมอ</span>
            </h2>
            <p className="text-gray-500 mt-3">
              ส่งข้อความมาได้เลย ทีมงานของเราพร้อมตอบทุกคำถาม
            </p>
          </div>

          {/* Contact Form */}
          <div className="glass-card p-8">
            {status === 'success' ? (
              <div className="text-center py-8 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-white text-xl font-bold mb-2">ส่งข้อความสำเร็จ!</h3>
                <p className="text-gray-400">ขอบคุณที่ติดต่อเรา เราจะตอบกลับภายใน 24 ชั่วโมง</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-6 btn-ghost text-sm px-4 py-2"
                >
                  ส่งข้อความใหม่
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Name */}
                <div>
                  <label className="form-label" htmlFor="contact-name">ชื่อ - นามสกุล</label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    placeholder="กรอกชื่อของคุณ"
                    value={form.name}
                    onChange={handleChange}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused('')}
                    className={inputClass('name')}
                    disabled={status === 'loading'}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="form-label" htmlFor="contact-email">อีเมล</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={handleChange}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused('')}
                    className={inputClass('email')}
                    disabled={status === 'loading'}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="form-label" htmlFor="contact-message">ข้อความ</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    placeholder="เขียนข้อความที่ต้องการสอบถาม..."
                    value={form.message}
                    onChange={handleChange}
                    onFocus={() => setFocused('message')}
                    onBlur={() => setFocused('')}
                    className={`${inputClass('message')} resize-none`}
                    disabled={status === 'loading'}
                  />
                </div>

                {/* Error message */}
                {status === 'error' && (
                  <p className="text-red-400 text-sm">เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  id="contact-submit-btn"
                  disabled={status === 'loading' || !form.name || !form.email || !form.message}
                  className="btn-gradient w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      กำลังส่ง...
                    </span>
                  ) : 'ส่งข้อความ'}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { icon: '📧', label: 'Email', value: 'hello@portme.co' },
              { icon: '📱', label: 'Line', value: '@portme' },
              { icon: '🕐', label: 'เวลาทำการ', value: 'จ-ศ 9:00-18:00' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="glass-card p-4 text-center">
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-gray-500 text-xs mb-1">{label}</div>
                <div className="text-white text-sm font-medium">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
