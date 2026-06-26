'use client'

import { useTranslations } from 'next-intl'
import SolutionForm from '@/components/admin/SolutionForm'

export default function NewSolutionPage() {
  const t = useTranslations('admin.solutions')

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">{t('new')}</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <SolutionForm />
      </div>
    </div>
  )
}
