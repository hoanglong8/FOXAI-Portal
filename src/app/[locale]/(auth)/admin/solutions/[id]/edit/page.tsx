'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'
import SolutionForm from '@/components/admin/SolutionForm'

export default function EditSolutionPage() {
  const params = useParams()
  const id = params.id as string
  const locale = useLocale()
  const t = useTranslations('admin.solutions')

  const [initialData, setInitialData] = useState<Parameters<typeof SolutionForm>[0]['initialData']>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        // Fetch solution detail by ID (admin can access via slug-as-id route)
        const res = await fetch(`/api/solutions/${id}?locale=vi`)
        if (!res.ok) { setError('Không tìm thấy giải pháp'); return }
        const json = await res.json()
        const s = json.data

        // Fetch all translations (not just VI)
        const allTranslations = await Promise.all(
          ['vi', 'en', 'la', 'zh'].map(async (loc) => {
            if (loc === 'vi') return { locale: 'vi', name: s.name, short_desc: s.short_desc, full_desc: s.full_desc }
            const r = await fetch(`/api/solutions/${s.slug}?locale=${loc}`)
            if (!r.ok) return { locale: loc, name: '', short_desc: '', full_desc: '' }
            const j = await r.json()
            return { locale: loc, name: j.data.name, short_desc: j.data.short_desc, full_desc: j.data.full_desc }
          })
        )

        // Fetch documents
        const docsRes = await fetch(`/api/solutions/${id}/documents`)
        const docsJson = await docsRes.json()

        // Fetch changelogs
        const clRes = await fetch(`/api/solutions/${id}/changelogs`)
        const clJson = await clRes.json()

        setInitialData({
          slug: s.slug,
          demo_url: s.demo_url ?? '',
          video_url: s.video_url ?? '',
          download_url: s.download_url ?? '',
          logo_url: s.logo_url ?? '',
          status: s.status,
          translations: allTranslations,
          sector_ids: s.sectors.map((sec: { id: string }) => sec.id),
          tag_ids: s.tags.map((tag: { id: string }) => tag.id),
          documents: (docsJson.data ?? []).map((d: { id: string; title: string; type: string; url: string; locale: string }) => ({
            id: d.id, title: d.title, type: d.type, url: d.url, locale: d.locale,
          })),
          changelogs: (clJson.data ?? []).map((cl: {
            id: string; version: string; release_date: string;
            changelog_translations: { locale: string; title: string; content: string }[]
          }) => ({
            id: cl.id,
            version: cl.version,
            release_date: cl.release_date,
            translations: ['vi', 'en', 'la', 'zh'].map(loc => {
              const t = cl.changelog_translations?.find((ct: { locale: string }) => ct.locale === loc)
              return { locale: loc, title: t?.title ?? '', content: t?.content ?? '' }
            }),
          })),
        })
      } catch {
        setError('Không thể tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, locale])

  if (loading) {
    return (
      <div className="max-w-4xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-gray-500 py-10 text-center">{error}</div>
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">{t('edit')}</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <SolutionForm solutionId={id} initialData={initialData} />
      </div>
    </div>
  )
}
