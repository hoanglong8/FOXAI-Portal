'use client'

import { useEffect, useState, Suspense } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Play, Download, ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DocumentPreview from '@/components/documents/DocumentPreview'
import ChangelogTimeline from '@/components/solutions/ChangelogTimeline'
import CommentSection from '@/components/solutions/CommentSection'
import { cn } from '@/lib/utils'

interface Document {
  id: string
  title: string
  type: string
  url: string
  locale: string
}

interface ChangelogEntry {
  id: string
  version: string
  release_date: string
  title: string
  content: string
}

interface SolutionDetail {
  id: string
  slug: string
  logo_url: string | null
  status: string
  demo_url: string | null
  video_url: string | null
  download_url: string | null
  view_count: number
  name: string
  short_desc: string
  full_desc: string
  sectors: { id: string; slug: string; name: string }[]
  tags: { id: string; name: string }[]
  documents: Document[]
  changelogs: ChangelogEntry[]
}

const DOCUMENT_TYPE_ICONS: Record<string, string> = {
  presentation: '📊',
  guide: '📖',
  brochure: '📄',
  demo: '🎬',
  report: '📑',
  other: '📎',
}

function SolutionDetailContent() {
  const locale = useLocale()
  const t = useTranslations('solutions')
  const tDocs = useTranslations('documents')
  const params = useParams()
  const slug = params.slug as string

  const [solution, setSolution] = useState<SolutionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/solutions/${slug}?locale=${locale}`)
        if (!res.ok) {
          setError('Không tìm thấy giải pháp')
          return
        }
        const json = await res.json()
        setSolution(json.data)

        // Fire-and-forget view tracking
        fetch(`/api/solutions/${slug}/view`, { method: 'POST' }).catch(() => {})
      } catch {
        setError('Không thể tải thông tin giải pháp')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug, locale])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-4 items-start">
          <Skeleton className="h-20 w-20 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !solution) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 font-medium">{error || 'Không tìm thấy giải pháp'}</p>
        <Link
          href={`/${locale}`}
          className="mt-4 text-sm text-brand-600 hover:underline"
        >
          ← Quay về trang chủ
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={14} />
        {t('allSectors')}
      </Link>

      {/* Hero */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {/* Logo */}
          <div className="flex-shrink-0 h-20 w-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
            {solution.logo_url ? (
              <Image
                src={solution.logo_url}
                alt={solution.name}
                width={80}
                height={80}
                className="object-contain"
              />
            ) : (
              <span className="text-3xl font-bold text-brand-600">
                {solution.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 mb-1">{solution.name}</h1>
            <p className="text-sm text-gray-500 mb-3">{solution.short_desc}</p>

            {/* Sectors */}
            {solution.sectors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {solution.sectors.map((s) => (
                  <Badge key={s.id} variant="outline" className="text-xs">
                    {s.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Tags */}
            {solution.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {solution.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs py-0">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {solution.demo_url && (
              <a
                href={solution.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 transition-colors"
              >
                <ExternalLink size={14} />
                {t('accessDemo')}
              </a>
            )}
            {solution.video_url && (
              <a
                href={solution.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 transition-colors"
              >
                <Play size={14} />
                {t('watchVideo')}
              </a>
            )}
            {solution.download_url && (
              <a
                href={solution.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 transition-colors"
              >
                <Download size={14} />
                {t('download')}
              </a>
            )}
          </div>
        </div>

        {/* View count */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {solution.view_count.toLocaleString()} {t('views')}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="documents">
        <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 rounded-none p-0 gap-0 h-auto">
          {(['documents', 'guide', 'changelog', 'feedback'] as const).map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className={cn(
                'rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-gray-500',
                'data-[state=active]:border-brand-600 data-[state=active]:text-brand-700 data-[state=active]:bg-transparent',
                'hover:text-gray-800 transition-colors'
              )}
            >
              {t(`tabs.${tab}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Documents tab */}
        <TabsContent value="documents" className="mt-4">
          {solution.documents.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">{tDocs('noDocuments')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {solution.documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setPreviewDoc(doc)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors text-left"
                >
                  <span className="text-2xl">
                    {DOCUMENT_TYPE_ICONS[doc.type] ?? '📎'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                    <p className="text-xs text-gray-400 uppercase">{doc.type}</p>
                  </div>
                  <span className="text-xs text-brand-600 font-medium shrink-0">{tDocs('preview')}</span>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Guide tab */}
        <TabsContent value="guide" className="mt-4">
          {solution.full_desc ? (
            <div className="prose prose-sm prose-foxai max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {solution.full_desc}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">{tDocs('noContent')}</p>
          )}
        </TabsContent>

        {/* Changelog tab */}
        <TabsContent value="changelog" className="mt-4">
          <ChangelogTimeline changelogs={solution.changelogs} />
        </TabsContent>

        {/* Feedback tab */}
        <TabsContent value="feedback" className="mt-4">
          <CommentSection solutionId={solution.id} />
        </TabsContent>
      </Tabs>

      {/* Document preview modal */}
      <DocumentPreview
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  )
}

export default function SolutionDetailPage() {
  return (
    <Suspense fallback={<div className="h-64" />}>
      <SolutionDetailContent />
    </Suspense>
  )
}
