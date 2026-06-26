'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LogOut, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import type { UserProfile } from '@/types'
import type { AppLocale } from '@/i18n/routing'

interface UserMenuProps {
  locale: AppLocale
  userProfile: UserProfile | null
  email: string
}

export function UserMenu({ locale, userProfile, email }: UserMenuProps) {
  const t = useTranslations('nav')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const displayName = userProfile?.full_name || email
  const initials = getInitials(displayName)

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
        aria-expanded={open}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-semibold">
          {initials}
        </div>
        <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-md z-50">
            <div className="px-3 py-2.5 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{email}</p>
              {userProfile?.role === 'admin' && (
                <span className="mt-1 inline-block text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-medium">
                  Admin
                </span>
              )}
            </div>
            <div className="p-1">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              >
                <LogOut size={14} />
                {loggingOut ? '...' : t('logout')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
