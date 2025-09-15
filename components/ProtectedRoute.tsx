// components/ProtectedRoute.tsx
'use client'

import { useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from './providers/AuthProvider'

type Role = 'admin' | 'user'

type Props = {
  children: React.ReactNode
  requireRole?: Role
  /** Wajib survey saat mengakses /dashboard/** (default: true) */
  requireSurvey?: boolean
}

export function ProtectedRoute({
  children,
  requireRole,
  requireSurvey = true,
}: Props) {
  const { user, profile, loading } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  // nilai yang dipakai baik di effect maupun render guard
  const guards = useMemo(() => {
    const isDashboard = pathname?.startsWith('/dashboard/') ?? false
    const hasCompleted = (profile as any)?.surveyCompleted === true
    const bypass =
      typeof window !== 'undefined' && sessionStorage.getItem('surveyDone') === '1'
    return { isDashboard, hasCompleted, bypass }
  }, [pathname, profile])

  useEffect(() => {
    if (loading) return

    // 1) Harus login
    if (!user) {
      router.replace('/login')
      return
    }

    // 2) Role guard
    if (requireRole && profile?.role !== requireRole) {
      router.replace(profile?.role === 'admin' ? `/admin/${user.uid}` : `/dashboard/${user.uid}`)
      return
    }

    // 3) Survey gate untuk /dashboard/**
    if (requireSurvey) {
      const { isDashboard, hasCompleted, bypass } = guards

      if (isDashboard && !hasCompleted && !bypass) {
        const next = encodeURIComponent(pathname || '/dashboard/home')
        router.replace(`/survey?next=${next}`)
        return
      }

      // ✅ Hapus BYPASS HANYA setelah profile sudah updated (surveyCompleted = true)
      if (bypass && hasCompleted && typeof window !== 'undefined') {
        sessionStorage.removeItem('surveyDone')
      }
    }
  }, [loading, user, profile, requireRole, requireSurvey, pathname, router, guards])

  // ---- Render guards supaya tidak flicker ----
  if (loading) return <div className="p-8">Loading…</div>
  if (!user) return null
  if (requireRole && profile?.role !== requireRole) return null

  if (requireSurvey) {
    const { isDashboard, hasCompleted, bypass } = guards
    // Saat butuh survey & belum selesai & tidak ada bypass → tunggu redirect
    if (isDashboard && !hasCompleted && !bypass) return null
  }

  return <>{children}</>
}
