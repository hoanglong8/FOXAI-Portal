import Link from 'next/link'
import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { ShieldX } from 'lucide-react'
import type { AppLocale } from '@/i18n/routing'

export default async function ForbiddenPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('common')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-red-100 rounded-full">
            <ShieldX size={40} className="text-red-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('forbidden')}
        </h1>
        <p className="text-gray-500 mb-6">{t('forbiddenDesc')}</p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {t('goHome')}
        </Link>
      </div>
    </div>
  )
}
