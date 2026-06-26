'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { SectorItem } from '@/lib/queries/solutions'

interface Props {
  sectors: SectorItem[]
  selected: string
  onSelect: (slug: string) => void
}

export default function SectorTabs({ sectors, selected, onSelect }: Props) {
  const t = useTranslations('solutions')

  const all = [{ id: 'all', slug: '', name: t('allSectors') }, ...sectors]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {all.map((sector) => {
        const active = sector.slug === selected
        return (
          <button
            key={sector.id}
            onClick={() => onSelect(sector.slug)}
            className={cn(
              'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {sector.name}
          </button>
        )
      })}
    </div>
  )
}
