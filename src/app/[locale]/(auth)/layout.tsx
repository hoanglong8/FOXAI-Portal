import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { Sidebar } from '@/components/shared/Sidebar'
import AuthInitializer from '@/components/providers/AuthInitializer'
import type { AppLocale } from '@/i18n/routing'
import type { UserProfile } from '@/types'

interface AuthLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: AppLocale }>
}

export default async function AuthLayout({ children, params }: AuthLayoutProps) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Middleware handles the redirect, but this is a server-side safety net
  if (!user) {
    redirect(`/${locale}/login`)
  }

  // Fetch user profile for role-based rendering
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const userProfile = profile as UserProfile | null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AuthInitializer user={user} profile={userProfile} />
      <Sidebar
        locale={locale}
        userProfile={userProfile}
        userEmail={user.email ?? ''}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header locale={locale} userProfile={userProfile} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-[1280px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
