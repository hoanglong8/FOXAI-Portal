'use client'

import { useState, useTransition, Suspense } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useSolutions, useSectors } from '@/lib/queries/solutions'
import { useAuthStore } from '@/lib/stores/auth'
import { SearchBar } from '@/components/shared/SearchBar'
import SectorTabs from '@/components/solutions/SectorTabs'
import SolutionGrid from '@/components/solutions/SolutionGrid'
import Pagination from '@/components/shared/Pagination'

function HomeContent() {
  const locale = useLocale()
  const t = useTranslations('solutions')
  const { isAdmin } = useAuthStore()
  const searchParams = useSearchParams()

  const query = searchParams.get('q') ?? ''
  const [sector, setSector] = useState('')
  const [page, setPage] = useState(1)
  const [, startTransition] = useTransition()

  const { data: sectorsData } = useSectors(locale)
  const { data, isLoading } = useSolutions({ locale, sector, q: query, page })

  function handleSectorChange(slug: string) {
    startTransition(() => {
      setSector(slug)
      setPage(1)
    })
  }

  function handlePageChange(p: number) {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const solutions = data?.solutions ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900 shrink-0">
          {t('allSectors')}
          {pagination && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({pagination.total})
            </span>
          )}
        </h1>
        <div className="w-full max-w-xs">
          <SearchBar />
        </div>
      </div>

      {/* Sector tabs */}
      <SectorTabs
        sectors={sectorsData ?? []}
        selected={sector}
        onSelect={handleSectorChange}
      />

      {/* Solution grid */}
      <SolutionGrid
        solutions={solutions}
        isLoading={isLoading}
        isAdmin={isAdmin}
        hasQuery={query.length > 0}
        query={query}
      />

      {/* Pagination */}
      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="h-64" />}>
      <HomeContent />
    </Suspense>
  )
}
