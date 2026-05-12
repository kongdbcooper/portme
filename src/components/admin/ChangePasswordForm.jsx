'use client'

import { useState } from 'react'

export default function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('request') // 'request' or 'verify'
  const [isRequesting, setIsRequesting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const resetForm = () => {
    setNewPassword('')
    setConfirmPassword('')
    setCode('')
    setStep('request')
    setMessage({ type: '', text: '' })
  }

  const requestPasswordChange = async () => {
    setMessage({ type: '', text: '' })

    if (!newPassword) {
      setMessage({ type: 'error', text: 'กรุณากรอกรหัสผ่านใหม่' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'รหัสใหม่และยืนยันรหัสไม่ตรงกัน' })
      return
    }

    setIsRequesting(true)

    try {
      const res = await fetch('/api/admin/change-password/request', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code')
      }

      setStep('verify')
      setMessage({
        type: 'success',
        text: `Verification code sent to your email. The code expires in ${data.expiresInMinutes || 10} minutes.`,
      })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsRequesting(false)
    }
  }

  const verifyPasswordChange = async () => {
    setMessage({ type: '', text: '' })

    if (!code) {
      setMessage({ type: 'error', text: 'กรุณากรอกรหัสยืนยัน' })
      return
    }

    setIsVerifying(true)

    try {
      const res = await fetch('/api/admin/change-password/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      setMessage({ type: 'success', text: 'รหัสผ่านถูกเปลี่ยนเรียบร้อยแล้ว' })

      try {
        await fetch('/api/auth/refresh-session', { method: 'POST', credentials: 'include' })
      } catch (error) {
        console.debug('Refresh session failed (non-fatal):', error)
      }

      resetForm()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="p-6 rounded-xl bg-white/5 border border-white/10 max-w-md">
      {message.text && (
        <div className={`p-3 rounded mb-4 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.text}
        </div>
      )}

      <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
        <h3 className="text-sm font-medium text-white mb-2">Verification flow</h3>
        <ul className="text-xs text-gray-400 flex flex-wrap gap-x-6 gap-y-2 list-disc list-inside">
          <li>Enter your new password and confirm it.</li>
          <li>A 6-digit verification code will be sent to your admin email.</li>
          <li>The code expires in 10 minutes and only the latest request stays active.</li>
        </ul>
      </div>

      {step === 'request' && (
        <>
          <label className="block text-sm font-medium text-gray-300">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full mt-2 p-3 rounded bg-white/5 border border-white/5 text-white text-sm"
            placeholder="Enter new password"
          />

          <label className="block text-sm font-medium text-gray-300 mt-4">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full mt-2 p-3 rounded bg-white/5 border border-white/5 text-white text-sm"
            placeholder="Confirm new password"
          />

          <div className="mt-6 flex gap-3">
            <button
              onClick={requestPasswordChange}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-400 disabled:opacity-50"
              disabled={isRequesting}
            >
              {isRequesting ? 'Sending…' : 'Send Verification Code'}
            </button>

            <button
              onClick={resetForm}
              className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10"
              disabled={isRequesting}
            >
              Reset
            </button>
          </div>
        </>
      )}

      {step === 'verify' && (
        <>
          <label className="block text-sm font-medium text-gray-300">Verification Code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
            className="w-full mt-2 p-3 rounded bg-white/5 border border-white/5 text-white text-sm tracking-[0.35em]"
          />
          <p className="text-xs text-gray-500 mt-2">
            Enter the code sent to your admin email.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={verifyPasswordChange}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-400 disabled:opacity-50"
              disabled={isVerifying}
            >
              {isVerifying ? 'Verifying…' : 'Verify and Change Password'}
            </button>

            <button
              onClick={() => setStep('request')}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/15"
              disabled={isVerifying}
            >
              Back to Request
            </button>

            <button
              onClick={resetForm}
              className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10"
              disabled={isVerifying}
            >
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  )
}
