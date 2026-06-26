'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Home,
  LayoutDashboard,
  Package,
  Users,
  BarChart2,
  MessageSquare,
  LogOut,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { UserProfile } from '@/types'
import type { AppLocale } from '@/i18n/routing'

interface SidebarProps {
  locale: AppLocale
  userProfile: UserProfile | null
  userEmail: string
}

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

export function Sidebar({ locale, userProfile, userEmail }: SidebarProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = userProfile?.role === 'admin'

  const navItems: NavItem[] = [
    {
      href: `/${locale}`,
      label: t('home'),
      icon: <Home size={18} />,
    },
    {
      href: `/${locale}/admin`,
      label: t('dashboard'),
      icon: <LayoutDashboard size={18} />,
      adminOnly: true,
    },
    {
      href: `/${locale}/admin/solutions`,
      label: t('solutions'),
      icon: <Package size={18} />,
      adminOnly: true,
    },
    {
      href: `/${locale}/admin/users`,
      label: t('users'),
      icon: <Users size={18} />,
      adminOnly: true,
    },
    {
      href: `/${locale}/admin/analytics`,
      label: t('analytics'),
      icon: <BarChart2 size={18} />,
      adminOnly: true,
    },
    {
      href: `/${locale}/admin/comments`,
      label: 'Phản hồi',
      icon: <MessageSquare size={18} />,
      adminOnly: true,
    },
  ]

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  )

  function isActive(href: string): boolean {
    if (href === `/${locale}`) {
      return pathname === `/${locale}` || pathname === `/${locale}/`
    }
    return pathname.startsWith(href)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
  }

  const displayName = userProfile?.full_name || userEmail
  const initials = getInitials(displayName)

  return (
    <aside className="flex w-[220px] flex-shrink-0 flex-col bg-brand-900 text-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-brand-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
          F
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">FOXAI</p>
          <p className="text-[11px] text-brand-400 leading-none mt-0.5">Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {/* Section: Overview */}
        <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-brand-500">
          Tổng quan
        </p>

        {visibleItems
          .filter((i) => !i.adminOnly)
          .map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}

        {isAdmin && (
          <>
            <p className="px-2 mt-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-brand-500">
              Quản lý
            </p>
            {visibleItems
              .filter((i) => i.adminOnly)
              .map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item.href)} />
              ))}
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-brand-800 p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-700 text-white text-xs font-semibold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{displayName}</p>
            <span className="text-[10px] text-brand-400 capitalize">
              {userProfile?.role ?? 'user'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex-shrink-0 p-1 rounded text-brand-400 hover:text-white hover:bg-brand-800 transition-colors"
            title="Đăng xuất"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavLink({
  item,
  active,
}: {
  item: NavItem
  active: boolean
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors mb-0.5',
        active
          ? 'bg-brand-600 text-white font-medium'
          : 'text-brand-300 hover:bg-brand-800 hover:text-white'
      )}
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  )
}
