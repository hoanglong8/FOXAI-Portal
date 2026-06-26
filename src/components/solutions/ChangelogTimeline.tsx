'use client'

import { useTranslations } from 'next-intl'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Badge } from '@/components/ui/badge'

interface ChangelogEntry {
  id: string
  version: string
  release_date: string
  title: string
  content: string
}

interface Props {
  changelogs: ChangelogEntry[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function ChangelogTimeline({ changelogs }: Props) {
  const t = useTranslations('changelog')

  if (changelogs.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <p>{t('empty')}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />

      <div className="space-y-8">
        {changelogs.map((entry, index) => (
          <div key={entry.id} className="relative flex gap-4">
            {/* Dot */}
            <div
              className={`relative z-10 flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center ${
                index === 0
                  ? 'border-brand-600 bg-brand-600'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  index === 0 ? 'bg-white' : 'bg-gray-400'
                }`}
              />
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant={index === 0 ? 'default' : 'secondary'}
                  className="font-mono text-xs"
                >
                  v{entry.version}
                </Badge>
                <span className="text-xs text-gray-400">{formatDate(entry.release_date)}</span>
                {index === 0 && (
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    {t('latest')}
                  </span>
                )}
              </div>

              {entry.title && (
                <h4 className="text-sm font-semibold text-gray-800 mb-2">{entry.title}</h4>
              )}

              {entry.content && (
                <div className="prose prose-sm prose-foxai max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {entry.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
