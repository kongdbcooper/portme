'use client'

import { useState } from 'react'
import { FiSend, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import { Turnstile } from '@marsidev/react-turnstile'

export default function AnonymousReportForm() {
  const [report, setReport] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('')
  const [token, setToken] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!report.trim() || !token) {
      if (!token) setErrorMessage('กรุณายืนยันว่าคุณไม่ใช่บอท')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ report, token }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit report')
      }

      setStatus('success')
      setReport('')
      setToken('')
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setStatus('idle')
      }, 5000)
    } catch (error) {
      console.error('Error submitting report:', error)
      setStatus('error')
      setErrorMessage('เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง')
    }
  }

  return (
    <div className="glass-card p-6 md:p-8 rounded-3xl relative overflow-hidden group w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-orange-500/10 z-0 opacity-50"></div>
      
      <div className="relative z-10">
        <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          ส่งข้อเสนอแนะ / แจ้งปัญหา
        </h3>
        <p className="text-gray-400 mb-6 text-sm">
          ข้อมูลของคุณจะถูกส่งโดยไม่ระบุตัวตน (Anonymous) เพื่อให้เรารับฟังและนำไปปรับปรุงให้ดีขึ้น
        </p>

        {status === 'success' ? (
          <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <FiCheckCircle className="text-2xl flex-shrink-0" />
            <div>
              <p className="font-medium">ส่งข้อมูลสำเร็จ</p>
              <p className="text-sm opacity-90">ขอบคุณสำหรับความคิดเห็นของคุณ</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <textarea
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="พิมพ์ข้อความของคุณที่นี่..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all min-h-[120px] resize-y"
                required
                disabled={status === 'loading'}
              ></textarea>
            </div>

            {status === 'error' && (
              <div className="text-red-400 text-sm flex items-center gap-2">
                <FiAlertCircle />
                <span>{errorMessage}</span>
              </div>
            )}

            {!errorMessage && !token && status !== 'success' && (
              <div className="text-red-400 text-sm flex items-center gap-2">
                <FiAlertCircle />
                <span>กรุณายืนยันตัวตนในช่องด้านล่าง (Turnstile อาจกำลังโหลด)</span>
              </div>
            )}

            <div className="flex justify-center my-4">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} // Test key if env is missing
                onSuccess={(token) => {
                  setToken(token)
                  setErrorMessage('')
                }}
                onError={() => setErrorMessage('CAPTCHA Error. Please refresh.')}
                options={{
                  theme: 'dark',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading' || !report.trim() || !token}
              className="btn-gradient w-full md:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  กำลังส่ง...
                </>
              ) : (
                <>
                  ส่งข้อความ
                  <FiSend />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
