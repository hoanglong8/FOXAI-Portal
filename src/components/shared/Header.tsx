import { createClient } from '@/lib/supabase/server'
import { LanguageSwitcher } from './LanguageSwitcher'
import { SearchBar } from './SearchBar'
import { UserMenu } from './UserMenu'
import type { UserProfile } from '@/types'
import type { AppLocale } from '@/i18n/routing'

interface HeaderProps {
  locale: AppLocale
  userProfile: UserProfile | null
}

export async function Header({ locale, userProfile }: HeaderProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-gray-200 bg-white px-4 shadow-sm">
      {/* Search bar — hidden on mobile, shown on md+ */}
      <div className="flex-1 max-w-md hidden md:block">
        <SearchBar />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher />
        <div className="w-px h-5 bg-gray-200" />
        <UserMenu
          locale={locale}
          userProfile={userProfile}
          email={user?.email ?? ''}
        />
      </div>
    </header>
  )
}
