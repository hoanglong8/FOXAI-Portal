'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Loader2, Upload, X, Plus, Trash2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { generateSlug } from '@/lib/utils'
import MarkdownEditor from '@/components/shared/MarkdownEditor'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Translation {
  locale: string
  name: string
  short_desc: string
  full_desc: string
}

interface DocEntry {
  id?: string
  title: string
  type: string
  url: string
  locale: string
  isNew?: boolean
}

interface ChangelogEntry {
  id?: string
  version: string
  release_date: string
  translations: { locale: string; title: string; content: string }[]
  isNew?: boolean
}

interface SectorOption {
  id: string
  slug: string
  name: string
}

interface TagOption {
  id: string
  name: string
  slug: string
}

interface SolutionFormProps {
  solutionId?: string  // undefined = create mode
  initialData?: {
    slug: string
    demo_url: string
    video_url: string
    download_url: string
    logo_url: string
    status: string
    translations: Translation[]
    sector_ids: string[]
    tag_ids: string[]
    documents: DocEntry[]
    changelogs: ChangelogEntry[]
  }
}

const LOCALES = ['vi', 'en', 'la', 'zh'] as const
const LOCALE_LABELS: Record<string, string> = { vi: 'Tiếng Việt', en: 'English', la: 'ລາວ', zh: '中文' }
const DOC_TYPES = ['presentation', 'user_guide', 'technical'] as const
const DOC_TYPE_LABELS: Record<string, string> = { presentation: 'Thuyết trình', user_guide: 'Hướng dẫn', technical: 'Kỹ thuật' }

function emptyTranslations(): Translation[] {
  return LOCALES.map((locale) => ({ locale, name: '', short_desc: '', full_desc: '' }))
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SolutionForm({ solutionId, initialData }: SolutionFormProps) {
  const router = useRouter()
  const locale = useLocale()

  // General fields
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [demoUrl, setDemoUrl] = useState(initialData?.demo_url ?? '')
  const [videoUrl, setVideoUrl] = useState(initialData?.video_url ?? '')
  const [downloadUrl, setDownloadUrl] = useState(initialData?.download_url ?? '')
  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url ?? '')
  const [status, setStatus] = useState(initialData?.status ?? 'draft')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!solutionId)
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Content
  const [translations, setTranslations] = useState<Translation[]>(
    initialData?.translations ?? emptyTranslations()
  )

  // Documents
  const [docs, setDocs] = useState<DocEntry[]>(initialData?.documents ?? [])

  // Changelogs
  const [changelogs, setChangelogs] = useState<ChangelogEntry[]>(initialData?.changelogs ?? [])

  // Classification
  const [sectors, setSectors] = useState<SectorOption[]>([])
  const [allTags, setAllTags] = useState<TagOption[]>([])
  const [selectedSectorIds, setSelectedSectorIds] = useState<Set<string>>(
    new Set(initialData?.sector_ids ?? [])
  )
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
    new Set(initialData?.tag_ids ?? [])
  )
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<TagOption[]>([])

  // Form state
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeLocale, setActiveLocale] = useState('vi')

  // Load sectors + tags on mount
  useEffect(() => {
    fetch(`/api/sectors?locale=${locale}`)
      .then(r => r.json()).then(j => setSectors(j.data ?? []))
    fetch('/api/tags')
      .then(r => r.json()).then(j => setAllTags(j.data ?? []))
  }, [locale])

  // Auto-generate slug from VI name (create mode)
  function handleViNameChange(name: string) {
    updateTranslation('vi', 'name', name)
    if (!slugManuallyEdited) {
      setSlug(generateSlug(name))
    }
  }

  function updateTranslation(loc: string, field: keyof Translation, value: string) {
    setTranslations(prev => prev.map(t => t.locale === loc ? { ...t, [field]: value } : t))
  }

  // Tag autocomplete
  function handleTagInput(v: string) {
    setTagInput(v)
    if (v.trim()) {
      setTagSuggestions(allTags.filter(t =>
        t.name.toLowerCase().includes(v.toLowerCase()) && !selectedTagIds.has(t.id)
      ).slice(0, 6))
    } else {
      setTagSuggestions([])
    }
  }

  async function addTag(tag: TagOption | null, inputName?: string) {
    if (selectedTagIds.size >= 10) return
    if (tag) {
      setSelectedTagIds(prev => new Set(Array.from(prev).concat(tag.id)))
      setTagInput('')
      setTagSuggestions([])
    } else if (inputName?.trim()) {
      // Create new tag
      const res = await fetch('/api/tags', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inputName.trim() }),
      })
      if (res.ok) {
        const json = await res.json()
        setAllTags(prev => [...prev, json.data])
        setSelectedTagIds(prev => new Set(Array.from(prev).concat(json.data.id)))
        setTagInput('')
        setTagSuggestions([])
      }
    }
  }

  // Logo upload
  async function handleLogoUpload(file: File) {
    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/logo', { method: 'POST', body: fd })
      if (res.ok) {
        const json = await res.json()
        setLogoUrl(json.data.url)
      } else {
        const json = await res.json()
        setErrors(prev => ({ ...prev, logo: json.error ?? 'Upload thất bại' }))
      }
    } finally {
      setLogoUploading(false)
    }
  }

  // Documents management
  function addDoc() {
    setDocs(prev => [...prev, { title: '', type: 'presentation', url: '', locale: 'vi', isNew: true }])
  }

  function removeDoc(idx: number) {
    setDocs(prev => prev.filter((_, i) => i !== idx))
  }

  function updateDoc(idx: number, field: keyof DocEntry, value: string) {
    setDocs(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d))
  }

  // Changelogs management
  function addChangelog() {
    setChangelogs(prev => [...prev, {
      version: '', release_date: new Date().toISOString().slice(0, 10),
      translations: LOCALES.map(l => ({ locale: l, title: '', content: '' })),
      isNew: true,
    }])
  }

  function removeChangelog(idx: number) {
    setChangelogs(prev => prev.filter((_, i) => i !== idx))
  }

  function updateChangelog(idx: number, field: string, value: string) {
    setChangelogs(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }

  function updateChangelogTranslation(clIdx: number, loc: string, field: string, value: string) {
    setChangelogs(prev => prev.map((c, i) => {
      if (i !== clIdx) return c
      return {
        ...c,
        translations: c.translations.map(t => t.locale === loc ? { ...t, [field]: value } : t),
      }
    }))
  }

  // Validation
  function validate(): boolean {
    const errs: Record<string, string> = {}
    const viT = translations.find(t => t.locale === 'vi')

    if (!viT?.name.trim()) errs.vi_name = 'Tên tiếng Việt là bắt buộc'
    if (!slug.trim()) errs.slug = 'Slug là bắt buộc'
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errs.slug = 'Slug chỉ gồm chữ thường, số và dấu gạch ngang'
    if (!demoUrl.trim()) errs.demo_url = 'Demo URL là bắt buộc'
    else if (!demoUrl.startsWith('https://')) errs.demo_url = 'Demo URL phải bắt đầu bằng https://'

    for (const cl of changelogs) {
      if (!cl.version) { errs.changelog = 'Phiên bản changelog là bắt buộc'; break }
      if (!/^\d+\.\d+\.\d+$/.test(cl.version)) { errs.changelog = 'Version phải theo định dạng x.y.z'; break }
      const viCl = cl.translations.find(t => t.locale === 'vi')
      if (!viCl?.content.trim()) { errs.changelog = 'Nội dung changelog (VI) là bắt buộc'; break }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)

    const payload = {
      slug,
      demo_url: demoUrl,
      video_url: videoUrl || null,
      download_url: downloadUrl || null,
      logo_url: logoUrl || null,
      status,
      translations: translations.filter(t => t.name.trim()),
      sector_ids: Array.from(selectedSectorIds),
      tag_ids: Array.from(selectedTagIds),
    }

    try {
      let savedId = solutionId

      if (solutionId) {
        // Update
        const res = await fetch(`/api/solutions/${solutionId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const json = await res.json()
          setErrors({ submit: json.error ?? 'Lưu thất bại' })
          return
        }
      } else {
        // Create
        const res = await fetch('/api/solutions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const json = await res.json()
          setErrors({ submit: json.error ?? 'Tạo thất bại' })
          return
        }
        const json = await res.json()
        savedId = json.data.id
      }

      // Save documents
      for (const doc of docs) {
        if (doc.isNew && savedId) {
          await fetch(`/api/solutions/${savedId}/documents`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: doc.title, type: doc.type, url: doc.url, locale: doc.locale }),
          })
        } else if (doc.id) {
          await fetch(`/api/documents/${doc.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: doc.title, type: doc.type, url: doc.url, locale: doc.locale }),
          })
        }
      }

      // Save changelogs
      for (const cl of changelogs) {
        if (cl.isNew && savedId) {
          await fetch(`/api/solutions/${savedId}/changelogs`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ version: cl.version, release_date: cl.release_date, translations: cl.translations.filter(t => t.content.trim()) }),
          })
        } else if (cl.id) {
          await fetch(`/api/changelogs/${cl.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ version: cl.version, release_date: cl.release_date, translations: cl.translations.filter(t => t.content.trim()) }),
          })
        }
      }

      router.push(`/${locale}/admin/solutions`)
    } finally {
      setSubmitting(false)
    }
  }

  const viTranslation = translations.find(t => t.locale === 'vi')!

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="general">
        <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 rounded-none p-0 gap-0 h-auto mb-6">
          {[
            { value: 'general', label: 'Thông tin chung' },
            { value: 'content', label: 'Nội dung' },
            { value: 'documents', label: 'Tài liệu' },
            { value: 'classification', label: 'Phân loại' },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-gray-500 data-[state=active]:border-brand-600 data-[state=active]:text-brand-700 data-[state=active]:bg-transparent"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Tab 1: General ─────────────────────────────────────────── */}
        <TabsContent value="general" className="space-y-4">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
            <div className="flex items-center gap-3">
              {logoUrl && (
                <div className="relative">
                  <img src={logoUrl} alt="logo" className="h-16 w-16 rounded-xl border object-contain" />
                  <button type="button" onClick={() => setLogoUrl('')}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <X size={10} />
                  </button>
                </div>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }} />
              <button type="button" onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60">
                {logoUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {logoUploading ? 'Đang tải...' : 'Chọn file'}
              </button>
              <span className="text-xs text-gray-400">JPG, PNG, WebP, SVG — tối đa 2MB</span>
            </div>
            {errors.logo && <p className="text-xs text-red-500 mt-1">{errors.logo}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* VI name → auto-slug */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên giải pháp (VI) <span className="text-red-500">*</span>
              </label>
              <input value={viTranslation.name} onChange={e => handleViNameChange(e.target.value)}
                placeholder="Tên tiếng Việt"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              {errors.vi_name && <p className="text-xs text-red-500 mt-1">{errors.vi_name}</p>}
            </div>

            {/* Slug */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-red-500">*</span>
              </label>
              <input value={slug}
                onChange={e => { setSlug(e.target.value.toLowerCase()); setSlugManuallyEdited(true) }}
                placeholder="ten-giai-phap"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" />
              {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="draft">Nháp</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>

            {/* Demo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Demo URL <span className="text-red-500">*</span>
              </label>
              <input value={demoUrl} onChange={e => setDemoUrl(e.target.value)}
                placeholder="https://demo.example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              {errors.demo_url && <p className="text-xs text-red-500 mt-1">{errors.demo_url}</p>}
            </div>

            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
              <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>

            {/* Download URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Download URL</label>
              <input value={downloadUrl} onChange={e => setDownloadUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 2: Content ─────────────────────────────────────────── */}
        <TabsContent value="content" className="space-y-4">
          {/* Locale selector */}
          <div className="flex gap-1 border-b border-gray-200 pb-0">
            {LOCALES.map(loc => (
              <button key={loc} type="button" onClick={() => setActiveLocale(loc)}
                className={`px-3 py-1.5 text-sm font-medium rounded-t-lg transition-colors ${activeLocale === loc ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                {LOCALE_LABELS[loc]}
                {loc === 'vi' && <span className="ml-1 text-xs opacity-70">*</span>}
              </button>
            ))}
          </div>

          {(() => {
            const t = translations.find(tr => tr.locale === activeLocale)!
            return (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên {activeLocale === 'vi' && <span className="text-red-500">*</span>}
                  </label>
                  <input value={t.name}
                    onChange={e => activeLocale === 'vi' ? handleViNameChange(e.target.value) : updateTranslation(activeLocale, 'name', e.target.value)}
                    placeholder={`Tên giải pháp (${LOCALE_LABELS[activeLocale]})`}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                  <textarea value={t.short_desc} onChange={e => updateTranslation(activeLocale, 'short_desc', e.target.value)}
                    placeholder="Tối đa 500 ký tự" rows={2} maxLength={500}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
                  <p className="text-xs text-gray-400 mt-1">{t.short_desc.length}/500</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hướng dẫn chi tiết (Markdown)</label>
                  <MarkdownEditor value={t.full_desc} onChange={v => updateTranslation(activeLocale, 'full_desc', v)}
                    placeholder="Nhập hướng dẫn sử dụng bằng Markdown..." rows={12} />
                </div>
              </div>
            )
          })()}
        </TabsContent>

        {/* ── Tab 3: Documents ───────────────────────────────────────── */}
        <TabsContent value="documents" className="space-y-3">
          {docs.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">Chưa có tài liệu nào</p>
          )}
          {docs.map((doc, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start p-3 border border-gray-200 rounded-lg">
              <div className="col-span-12 sm:col-span-5">
                <input value={doc.title} onChange={e => updateDoc(i, 'title', e.target.value)}
                  placeholder="Tiêu đề tài liệu"
                  className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" />
              </div>
              <div className="col-span-6 sm:col-span-2">
                <select value={doc.type} onChange={e => updateDoc(i, 'type', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500">
                  {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="col-span-6 sm:col-span-1">
                <select value={doc.locale} onChange={e => updateDoc(i, 'locale', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500">
                  {LOCALES.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="col-span-11 sm:col-span-3">
                <input value={doc.url} onChange={e => updateDoc(i, 'url', e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" />
              </div>
              <div className="col-span-1 flex justify-center pt-1">
                <button type="button" onClick={() => removeDoc(i)}
                  className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addDoc}
            className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 font-medium">
            <Plus size={14} /> Thêm tài liệu
          </button>
        </TabsContent>

        {/* ── Tab 4: Classification ──────────────────────────────────── */}
        <TabsContent value="classification" className="space-y-6">
          {/* Sectors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Khối ngành</label>
            <div className="flex flex-wrap gap-2">
              {sectors.map(s => {
                const checked = selectedSectorIds.has(s.id)
                return (
                  <button key={s.id} type="button"
                    onClick={() => setSelectedSectorIds(prev => {
                      const next = new Set(prev)
                      checked ? next.delete(s.id) : next.add(s.id)
                      return next
                    })}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${checked ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags <span className="text-gray-400 font-normal">({selectedTagIds.size}/10)</span>
            </label>
            {/* Selected tags */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {Array.from(selectedTagIds).map(tagId => {
                const tag = allTags.find(t => t.id === tagId)
                if (!tag) return null
                return (
                  <Badge key={tagId} variant="secondary" className="gap-1 pr-1">
                    {tag.name}
                    <button type="button" onClick={() => setSelectedTagIds(prev => { const next = new Set(prev); next.delete(tagId); return next })}>
                      <X size={10} />
                    </button>
                  </Badge>
                )
              })}
            </div>
            {/* Tag input */}
            {selectedTagIds.size < 10 && (
              <div className="relative">
                <input value={tagInput} onChange={e => handleTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); tagSuggestions[0] ? addTag(tagSuggestions[0]) : addTag(null, tagInput) } }}
                  placeholder="Tìm hoặc tạo tag..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                {tagSuggestions.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
                    {tagSuggestions.map(t => (
                      <button key={t.id} type="button" onClick={() => addTag(t)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">{t.name}</button>
                    ))}
                    {tagInput.trim() && !allTags.some(t => t.name.toLowerCase() === tagInput.trim().toLowerCase()) && (
                      <button type="button" onClick={() => addTag(null, tagInput)}
                        className="w-full text-left px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 border-t border-gray-100">
                        + Tạo tag "{tagInput.trim()}"
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Changelogs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Changelog</label>
              <button type="button" onClick={addChangelog}
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium">
                <Plus size={12} /> Thêm phiên bản
              </button>
            </div>
            {errors.changelog && <p className="text-xs text-red-500 mb-2">{errors.changelog}</p>}
            <div className="space-y-4">
              {changelogs.map((cl, ci) => (
                <div key={ci} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Version *</label>
                      <input value={cl.version} onChange={e => updateChangelog(ci, 'version', e.target.value)}
                        placeholder="1.0.0" className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-brand-500" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Ngày phát hành</label>
                      <input type="date" value={cl.release_date} onChange={e => updateChangelog(ci, 'release_date', e.target.value)}
                        className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" />
                    </div>
                    <button type="button" onClick={() => removeChangelog(ci)} className="mt-4 text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {/* VI content only (required) */}
                  {cl.translations.filter(t => t.locale === 'vi').map(t => (
                    <div key={t.locale}>
                      <label className="block text-xs text-gray-500 mb-1">Nội dung (VI) *</label>
                      <MarkdownEditor value={t.content}
                        onChange={v => updateChangelogTranslation(ci, t.locale, 'content', v)}
                        placeholder="Mô tả thay đổi..." rows={4} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Submit */}
      {errors.submit && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
          {errors.submit}
        </div>
      )}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
        <button type="submit" disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2 transition-colors disabled:opacity-60">
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting ? 'Đang lưu...' : solutionId ? 'Cập nhật' : 'Tạo giải pháp'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700">
          Huỷ
        </button>
      </div>
    </form>
  )
}
