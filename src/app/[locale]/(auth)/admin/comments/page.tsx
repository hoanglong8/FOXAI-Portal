'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Trash2, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { getInitials } from '@/lib/utils'
import { useUpdateCommentStatus, useDeleteComment } from '@/lib/queries/comments'
import type { Comment } from '@/lib/queries/comments'

interface AdminComment extends Comment {
  solution_name?: string
  solution_id: string
}

interface AdminCommentsResponse {
  comments: AdminComment[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

const COMMENT_TYPES = ['', 'comment', 'feedback', 'bug', 'note'] as const
const COMMENT_STATUSES = ['', 'open', 'in_progress', 'resolved', 'closed'] as const

const TYPE_BADGE: Record<string, string> = {
  comment: 'bg-blue-50 text-blue-700',
  feedback: 'bg-purple-50 text-purple-700',
  bug: 'bg-red-50 text-red-700',
  note: 'bg-yellow-50 text-yellow-700',
}

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-200 text-gray-500',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminCommentsPage() {
  const t = useTranslations('comments')
  const tAdmin = useTranslations('admin.comments')

  const [comments, setComments] = useState<AdminComment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const updateStatus = useUpdateCommentStatus()

  async function load(p = page, type = filterType, status = filterStatus) {
    setLoading(true)
    try {
      // Admin needs to fetch comments across all solutions
      // We'll use a special endpoint pattern: GET /api/admin/comments
      const params = new URLSearchParams({ page: String(p) })
      if (type) params.set('type', type)
      if (status) params.set('status', status)
      const res = await fetch(`/api/admin/comments?${params}`)
      if (!res.ok) return
      const json = await res.json()
      const data: AdminCommentsResponse = json.data
      setComments(data.comments)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function applyFilters(type: string, status: string) {
    setFilterType(type)
    setFilterStatus(status)
    setPage(1)
    load(1, type, status)
  }

  async function handleStatusChange(commentId: string, status: string) {
    await updateStatus.mutateAsync({ commentId, status })
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, status } : c))
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm(t('deleteConfirm'))) return
    await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
    setComments(prev => prev.filter(c => c.id !== commentId))
    setTotal(n => n - 1)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-gray-900">
          {tAdmin('title')}
          <span className="ml-2 text-sm font-normal text-gray-400">({total})</span>
        </h1>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => applyFilters(e.target.value, filterStatus)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Tất cả loại</option>
            {COMMENT_TYPES.slice(1).map(type => (
              <option key={type} value={type}>{t(`types.${type}`)}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => applyFilters(filterType, e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Tất cả trạng thái</option>
            {COMMENT_STATUSES.slice(1).map(status => (
              <option key={status} value={status}>{t(`statuses.${status}`)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Comment list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {loading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p>Chưa có phản hồi nào</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-4 flex gap-3 items-start hover:bg-gray-50">
              {/* Avatar */}
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
                {getInitials(comment.user_name)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-medium text-gray-900">{comment.user_name}</span>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${TYPE_BADGE[comment.type] ?? TYPE_BADGE.comment}`}>
                    {t(`types.${comment.type}`)}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                </div>

                {comment.solution_name && (
                  <p className="text-xs text-brand-600 mb-1">📦 {comment.solution_name}</p>
                )}

                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words mb-2">{comment.content}</p>

                {/* Status update */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${STATUS_BADGE[comment.status] ?? STATUS_BADGE.open}`}>
                    {t(`statuses.${comment.status}`)}
                  </span>
                  <select
                    value={comment.status}
                    onChange={(e) => handleStatusChange(comment.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-400"
                  >
                    {COMMENT_STATUSES.slice(1).map(s => (
                      <option key={s} value={s}>{t(`statuses.${s}`)}</option>
                    ))}
                  </select>
                  {updateStatus.isPending && (
                    <Loader2 size={12} className="animate-spin text-gray-400" />
                  )}
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(comment.id)}
                className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                title="Xoá"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => { const p = page - 1; setPage(p); load(p) }}
            disabled={page === 1}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            ← Trước
          </button>
          <span className="text-sm px-3 py-1.5 text-gray-500">{page} / {totalPages}</span>
          <button
            onClick={() => { const p = page + 1; setPage(p); load(p) }}
            disabled={page === totalPages}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  )
}
