'use client'

import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'
import SolutionCard from './SolutionCard'
import type { SolutionListItem } from '@/lib/queries/solutions'

interface Props {
  solutions: SolutionListItem[]
  isLoading: boolean
  isAdmin?: boolean
  hasQuery?: boolean
  query?: string
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start gap-3 mb-3">
        <Skeleton className="h-14 w-14 rounded-xl" />
      </div>
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-2/3 mb-3" />
      <div className="flex gap-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  )
}

export default function SolutionGrid({ solutions, isLoading, isAdmin, hasQuery, query }: Props) {
  const t = useTranslations('solutions')

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (solutions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-gray-600 font-medium">
          {hasQuery && query ? t('noResultsFor', { query }) : t('noResults')}
        </p>
        <p className="text-sm text-gray-400 mt-1">{t('clearFilter')}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {solutions.map((solution) => (
        <SolutionCard key={solution.id} solution={solution} isAdmin={isAdmin} />
      ))}
    </div>
  )
}
