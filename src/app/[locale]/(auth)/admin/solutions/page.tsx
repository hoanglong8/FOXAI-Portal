'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SolutionRow {
  id: string
  slug: string
  logo_url: string | null
  status: string
  view_count: number
  name: string
  sectors: { id: string; name: string }[]
  created_at: string
}

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-800',
  inactive: 'bg-gray-100 text-gray-500',
}

export default function AdminSolutionsPage() {
  const locale = useLocale()
  const t = useTranslations('solutions')
  const tAdmin = useTranslations('admin.solutions')

  const [solutions, setSolutions] = useState<SolutionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      // Fetch all statuses for admin (no status filter)
      const res = await fetch(`/api/solutions?locale=${locale}&limit=100`)
      const json = await res.json()
      setSolutions(json.data?.solutions ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [locale])

  async function toggleStatus(sol: SolutionRow) {
    const newStatus = sol.status === 'active' ? 'inactive' : 'active'
    await fetch(`/api/solutions/${sol.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setSolutions(prev => prev.map(s => s.id === sol.id ? { ...s, status: newStatus } : s))
  }

  async function deleteSolution(id: string) {
    if (!window.confirm('Xoá giải pháp này? Hành động không thể hoàn tác.')) return
    setDeleting(id)
    try {
      await fetch(`/api/solutions/${id}`, { method: 'DELETE' })
      setSolutions(prev => prev.filter(s => s.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{tAdmin('list')}</h1>
        <Link
          href={`/${locale}/admin/solutions/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 transition-colors"
        >
          <Plus size={14} />
          {tAdmin('new')}
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : solutions.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="mb-3">{t('noSolutions')}</p>
            <Link
              href={`/${locale}/admin/solutions/new`}
              className="text-sm text-brand-600 hover:underline"
            >
              {tAdmin('new')}
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Giải pháp</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Khối</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Lượt xem</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {solutions.map((sol) => (
                <tr key={sol.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {sol.logo_url ? (
                        <img src={sol.logo_url} alt={sol.name} className="h-8 w-8 rounded-lg object-contain border border-gray-100" />
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
                          {sol.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{sol.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{sol.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_STYLE[sol.status] ?? STATUS_STYLE.inactive)}>
                      {t(`statuses.${sol.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {sol.sectors.slice(0, 2).map(s => (
                        <Badge key={s.id} variant="outline" className="text-xs py-0">{s.name}</Badge>
                      ))}
                      {sol.sectors.length > 2 && <span className="text-xs text-gray-400">+{sol.sectors.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden lg:table-cell">
                    {sol.view_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Toggle status */}
                      <button
                        onClick={() => toggleStatus(sol)}
                        title={sol.status === 'active' ? 'Tạm ẩn' : 'Kích hoạt'}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        {sol.status === 'active' ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      {/* Edit */}
                      <Link
                        href={`/${locale}/admin/solutions/${sol.id}/edit`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <Pencil size={15} />
                      </Link>
                      {/* Delete */}
                      <button
                        onClick={() => deleteSolution(sol.id)}
                        disabled={deleting === sol.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
