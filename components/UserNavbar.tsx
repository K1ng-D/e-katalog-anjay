// components/UserNavbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useSession } from "./providers/AuthProvider";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiCoffee,
  FiShoppingBag,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronDown,
} from "react-icons/fi";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

export default function UserNavbar() {
  const { user, profile } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  const navItems: NavItem[] = [
    { href: "/dashboard/home", label: "Home", icon: FiHome },
    { href: "/dashboard/makanan", label: "Makanan", icon: FiCoffee },
    { href: "/dashboard/produk", label: "Produk", icon: FiShoppingBag },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="relative w-full bg-white shadow-lg border-b border-gray-100 px-6 sm:px-8 lg:px-24 py-4">
      <div className="flex justify-between items-center">
        {/* Logo/Brand */}
        <Link href="/dashboard/home" className="flex items-center space-x-3">
          <div className="h-25 w-auto flex items-center">
            <Image
              src="/images/LADUNIMART.png"
              alt="Logo LADUNIMART"
              width={300}
              height={300}
              className="h-25 w-auto object-contain"
              priority
            />
          </div>
         
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                  <Icon size={16} />
                </span>
                {label}
              </Link>
            );
          })}
        </div>

        {/* User Section */}
        <div className="flex items-center space-x-4">
          {/* Desktop User Info */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen((s) => !s)}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                aria-haspopup="menu"
                aria-expanded={isProfileDropdownOpen}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {profile?.displayName?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase() ||
                    "U"}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {profile?.displayName || user?.email?.split("@")[0]}
                  </div>
                  <div className="text-xs text-gray-500">{profile?.role || "user"}</div>
                </div>
                <span
                  className={`text-gray-400 inline-flex transition-transform ${
                    isProfileDropdownOpen ? "rotate-180" : ""
                  }`}
                >
                  <FiChevronDown size={16} />
                </span>
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                    role="menu"
                  >
                    <Link
                      href={`/dashboard/${user?.uid ?? ""}`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                        <FiSettings size={16} />
                      </span>
                      Pengaturan
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                        <FiLogOut size={16} />
                      </span>
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen((s) => !s)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 border-t border-gray-100 pt-4 bg-white rounded-b-2xl shadow-xl relative z-50"
          >
            <div className="space-y-2">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="mr-3 inline-flex h-5 w-5 items-center justify-center">
                      <Icon size={20} />
                    </span>
                    {label}
                  </Link>
                );
              })}

              {/* Mobile User Info */}
              {user && (
                <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
                  <div className="flex items-center px-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                      {profile?.displayName?.[0]?.toUpperCase() ||
                        user?.email?.[0]?.toUpperCase() ||
                        "U"}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {profile?.displayName || user?.email?.split("@")[0]}
                      </div>
                      <div className="text-xs text-gray-500">{profile?.role || "user"}</div>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/${user?.uid ?? ""}`}
                    className="flex items-center px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-xl"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="mr-3 inline-flex h-5 w-5 items-center justify-center">
                      <FiSettings size={20} />
                    </span>
                    Pengaturan
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <span className="mr-3 inline-flex h-5 w-5 items-center justify-center">
                      <FiLogOut size={20} />
                    </span>
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
            className="fixed inset-0 bg-white bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>
    </nav>
  );
}
