"use client"

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ResetPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState({ type: '', text: '' })
  const [isLoading, setIsLoading] = useState(false)

  const submit = async () => {
    setStatus({ type: '', text: '' })
    if (!token) return setStatus({ type: 'error', text: 'Missing token' })
    if (!newPassword || newPassword.length < 8) return setStatus({ type: 'error', text: 'Password must be ≥8 chars' })
    if (newPassword !== confirm) return setStatus({ type: 'error', text: 'Passwords do not match' })

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, newPassword }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setStatus({ type: 'success', text: 'Password updated. You can now log in.' })
      setNewPassword('')
      setConfirm('')
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally { setIsLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto py-24">
      <h1 className="text-2xl font-bold text-white mb-4">Set a new password</h1>
      {status.text && <div className={`p-3 mb-4 rounded ${status.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{status.text}</div>}
      <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" type="password" className="w-full p-3 rounded bg-white/5 text-white mb-3" />
      <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" type="password" className="w-full p-3 rounded bg-white/5 text-white mb-4" />
      <div className="flex gap-3">
        <button onClick={submit} disabled={isLoading} className="px-4 py-2 bg-brand-500 rounded text-white">{isLoading ? 'Processing…' : 'Set password'}</button>
      </div>
    </div>
  )
}
