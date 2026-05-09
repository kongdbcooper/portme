"use client"

import { useState } from 'react'

export default function RequestResetPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ type: '', text: '' })

  const submit = async () => {
    setStatus({ type: '', text: '' })
    try {
      const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      if (!res.ok) throw new Error('Failed')
      setStatus({ type: 'success', text: 'ถ้าอีเมลอยู่ในระบบ เราจะส่งลิงก์สำหรับรีเซ็ตให้' })
      setEmail('')
    } catch (err) {
      setStatus({ type: 'error', text: 'เกิดข้อผิดพลาด ลองใหม่' })
    }
  }

  return (
    <div className="max-w-md mx-auto py-24">
      <h1 className="text-2xl font-bold text-white mb-4">Reset your password</h1>
      <p className="text-gray-400 text-sm mb-6">Enter your account email. If it exists, you&#39;ll receive a reset link.</p>
      {status.text && <div className={`p-3 mb-4 rounded ${status.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{status.text}</div>}
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full p-3 rounded bg-white/5 text-white mb-4" />
      <div className="flex gap-3">
        <button onClick={submit} className="px-4 py-2 bg-brand-500 rounded text-white">Send reset email</button>
      </div>
    </div>
  )
}
