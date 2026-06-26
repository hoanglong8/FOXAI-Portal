'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ExternalLink, Play, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SolutionListItem } from '@/lib/queries/solutions'

interface Props {
  solution: SolutionListItem
  isAdmin?: boolean
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  inactive: 'bg-gray-100 text-gray-500',
  active: 'bg-green-100 text-green-700',
}

export default function SolutionCard({ solution, isAdmin }: Props) {
  const locale = useLocale()
  const t = useTranslations('solutions')

  const visibleTags = solution.tags.slice(0, 3)
  const hasActions = solution.demo_url || solution.video_url || solution.download_url

  return (
    <Link
      href={`/${locale}/solutions/${solution.slug}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-brand-300 transition-all"
    >
      {/* Header: logo + status badge (admin only) */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-shrink-0 h-14 w-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
          {solution.logo_url ? (
            <Image
              src={solution.logo_url}
              alt={solution.name}
              width={56}
              height={56}
              className="object-contain"
            />
          ) : (
            <span className="text-2xl font-bold text-brand-600">
              {solution.name.charAt(0)}
            </span>
          )}
        </div>

        {isAdmin && solution.status !== 'active' && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              STATUS_STYLE[solution.status] ?? STATUS_STYLE.inactive
            )}
          >
            {t(`statuses.${solution.status}`)}
          </span>
        )}
      </div>

      {/* Name + desc */}
      <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-brand-700 transition-colors line-clamp-1">
        {solution.name}
      </h3>
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{solution.short_desc}</p>

      {/* Tags */}
      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {visibleTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="text-xs py-0 px-2">
              {tag.name}
            </Badge>
          ))}
          {solution.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{solution.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Action icons */}
      {hasActions && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          {solution.demo_url && (
            <span className="inline-flex items-center gap-1 text-xs text-brand-600 font-medium">
              <ExternalLink size={12} />
              {t('viewDemo')}
            </span>
          )}
          {solution.video_url && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Play size={12} />
              Video
            </span>
          )}
          {solution.download_url && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Download size={12} />
              {t('download')}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
