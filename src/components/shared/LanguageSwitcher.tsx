'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Globe } from 'lucide-react'
import { routing, type AppLocale } from '@/i18n/routing'

const LOCALE_FLAGS: Record<AppLocale, string> = {
  vi: '🇻🇳',
  en: '🇬🇧',
  la: '🇱🇦',
  zh: '🇨🇳',
}

export function LanguageSwitcher() {
  const t = useTranslations('common.languages')
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(newLocale: AppLocale) {
    if (newLocale === locale) return
    // Replace current locale prefix in the path
    const segments = pathname.split('/')
    segments[1] = newLocale
    const newPath = segments.join('/')
    localStorage.setItem('foxai-locale', newLocale)
    router.push(newPath)
  }

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Change language"
      >
        <Globe size={15} />
        <span>{LOCALE_FLAGS[locale]}</span>
        <span className="uppercase font-medium">{locale}</span>
      </button>

      <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {routing.locales.map((l) => (
          <button
            key={l}
            onClick={() => switchLocale(l as AppLocale)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
              l === locale ? 'text-primary font-medium bg-primary/5' : 'text-gray-700'
            }`}
          >
            <span>{LOCALE_FLAGS[l as AppLocale]}</span>
            <span>{t(l)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
