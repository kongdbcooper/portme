// =============================================================================
// src/app/loading.js — Global Loading State
// แสดงผลขณะที่ Next.js กำลังเตรียมข้อมูล (Server Components)
// =============================================================================

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0f]">
      <div className="relative">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-brand-500/20 blur-[50px] animate-pulse rounded-full" />
        
        {/* Spinner */}
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <p className="mt-6 text-gray-500 font-medium tracking-widest uppercase text-[10px] animate-pulse">
            Loading Excellence
          </p>
        </div>
      </div>
    </div>
  )
}
