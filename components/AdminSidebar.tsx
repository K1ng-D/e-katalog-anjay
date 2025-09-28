
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from './providers/AuthProvider'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import {
  FiHome,
  FiUsers,
  FiBox,
  FiCoffee,
  FiSettings,
  FiLogOut,
} from 'react-icons/fi'
import { useMemo } from 'react'

export default function AdminSidebar() {
  const { user } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  const overviewHref = useMemo(() => `/admin/${user?.uid ?? ''}`, [user?.uid])

  const nav = [
    { href: overviewHref, label: 'Overview', icon: <FiHome /> },
    { href: '/admin/user', label: 'User', icon: <FiUsers /> },
    { href: '/admin/produk', label: 'Produk', icon: <FiBox /> },
    { href: '/admin/makanan', label: 'Makanan', icon: <FiCoffee /> },
 
  ]

  function isActive(href: string) {
    if (!pathname) return false
    // khusus overview dengan path dinamis /admin/[uid]
    if (href === overviewHref) return pathname === overviewHref
    return pathname.startsWith(href)
  }

  async function onLogout() {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (e: any) {
      alert(e?.message || 'Gagal logout')
    }
  }

  return (
    <aside className="h-screen w-64 bg-white border-r sticky top-0 p-4 flex flex-col gap-3">
      <div className="text-xl font-bold">Admin Panel</div>

      <nav className="flex-1 flex flex-col gap-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'flex items-center gap-2 p-2 rounded transition-colors',
              isActive(item.href) ? 'bg-gray-900 text-white' : 'hover:bg-gray-100',
              !item.href || item.href.endsWith('/') ? '' : '',
            ].join(' ')}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="space-y-2">
        <div className="text-xs text-gray-500">
          Logged in as <span className="font-medium">{user?.email || '-'}</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
        >
          <FiLogOut />
          Logout
        </button>
      </div>
    </aside>
  )
}
