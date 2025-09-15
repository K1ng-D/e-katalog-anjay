// components/UserNavbar.tsx
'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useSession } from './providers/AuthProvider'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiHome, 
  FiCoffee, 
  FiShoppingBag, 
  FiSettings, 
  FiLogOut, 
  FiUser, 
  FiMenu, 
  FiX,
  FiChevronDown
} from 'react-icons/fi'
import { IconType, IconContext } from 'react-icons'

interface NavItem {
  href: string;
  label: string;
  icon: IconType;
}

export default function UserNavbar() {
  const { user, profile } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

  async function handleLogout() {
    await signOut(auth)
    router.push('/login')
  }

  const navItems: NavItem[] = [
    { href: '/dashboard/home', label: 'Home', icon: FiHome },
    { href: '/dashboard/makanan', label: 'Makanan', icon: FiCoffee },
    { href: '/dashboard/produk', label: 'Produk', icon: FiShoppingBag },
  ]

  const isActive = (path: string) => pathname === path

  return (
    <nav className="w-full bg-white shadow-lg border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex justify-between items-center">
        {/* Logo/Brand */}
        <Link href="/dashboard/home" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">EK</span>
          </div>
          <span className="font-bold text-gray-900 text-xl hidden sm:block">E-Katalog</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <IconContext.Provider value={{ className: "w-4 h-4 mr-2" }}>
                  <Icon />
                </IconContext.Provider>
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* User Section */}
        <div className="flex items-center space-x-4">
          {/* Desktop User Info */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {profile?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {profile?.displayName || user?.email?.split('@')[0]}
                  </div>
                  <div className="text-xs text-gray-500">
                    {profile?.role || 'user'}
                  </div>
                </div>
                <IconContext.Provider value={{ className: `w-4 h-4 text-gray-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}` }}>
                  <FiChevronDown />
                </IconContext.Provider>
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                  >
                    <Link
                      href={`/dashboard/${user?.uid}`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <IconContext.Provider value={{ className: "w-4 h-4 mr-2" }}>
                        <FiSettings />
                      </IconContext.Provider>
                      Pengaturan
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <IconContext.Provider value={{ className: "w-4 h-4 mr-2" }}>
                        <FiLogOut />
                      </IconContext.Provider>
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <IconContext.Provider value={{ className: "w-6 h-6" }}>
              {isMobileMenuOpen ? <FiX /> : <FiMenu />}
            </IconContext.Provider>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 border-t border-gray-100 pt-4"
          >
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive(item.href)
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <IconContext.Provider value={{ className: "w-5 h-5 mr-3" }}>
                      <Icon />
                    </IconContext.Provider>
                    {item.label}
                  </Link>
                )
              })}

              {/* Mobile User Info */}
              {user && (
                <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
                  <div className="flex items-center px-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                      {profile?.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {profile?.displayName || user.email?.split('@')[0]}
                      </div>
                      <div className="text-xs text-gray-500">
                        {profile?.role || 'user'}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/${user.uid}`}
                    className="flex items-center px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-xl"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <IconContext.Provider value={{ className: "w-5 h-5 mr-3" }}>
                      <FiSettings />
                    </IconContext.Provider>
                    Pengaturan
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <IconContext.Provider value={{ className: "w-5 h-5 mr-3" }}>
                      <FiLogOut />
                    </IconContext.Provider>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </nav>
  )
}