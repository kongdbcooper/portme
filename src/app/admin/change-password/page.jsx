import ChangePasswordForm from '@/components/admin/ChangePasswordForm'

export default function AdminChangePasswordPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Change Password
        </h1>
        <p className="text-gray-400">Update the admin account password from this page only.</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM6 20v-1a4 4 0 014-4h4a4 4 0 014 4v1" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Change Password</h2>
        </div>

        <ChangePasswordForm />
      </section>
    </div>
  )
}
