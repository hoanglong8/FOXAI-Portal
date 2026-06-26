'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Send, Trash2, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getInitials } from '@/lib/utils'
import { useComments, useCreateComment, useDeleteComment } from '@/lib/queries/comments'
import type { Comment } from '@/lib/queries/comments'

interface Props {
  solutionId: string
}

const COMMENT_TYPES = ['comment', 'feedback', 'bug', 'note'] as const

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

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ngày trước`
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

function CommentItem({
  comment,
  onDelete,
}: {
  comment: Comment
  onDelete: (id: string) => void
}) {
  const t = useTranslations('comments')
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!window.confirm(t('deleteConfirm'))) return
    setDeleting(true)
    onDelete(comment.id)
  }

  return (
    <div className="flex gap-3">
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
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${STATUS_BADGE[comment.status] ?? STATUS_BADGE.open}`}>
            {t(`statuses.${comment.status}`)}
          </span>
          <span className="text-xs text-gray-400 ml-auto">{formatRelative(comment.created_at)}</span>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{comment.content}</p>
      </div>

      {/* Delete */}
      {comment.is_own && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-shrink-0 p-1 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
          aria-label="Xoá"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      )}
    </div>
  )
}

function CommentForm({ solutionId }: { solutionId: string }) {
  const t = useTranslations('comments')
  const [type, setType] = useState<typeof COMMENT_TYPES[number]>('comment')
  const [content, setContent] = useState('')
  const { mutateAsync, isPending, error } = useCreateComment(solutionId)
  const [success, setSuccess] = useState(false)

  const maxChars = 2000

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || content.length > maxChars) return

    try {
      await mutateAsync({ type, content })
      setContent('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      // error shown via `error` from mutation
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">{t('leaveComment')}</h3>

      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        {COMMENT_TYPES.map((ct) => (
          <button
            key={ct}
            type="button"
            onClick={() => setType(ct)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              type === ct ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t(`types.${ct}`)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('placeholder')}
            rows={4}
            maxLength={maxChars}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow resize-none"
          />
          <span className="absolute bottom-2 right-2 text-xs text-gray-400">
            {content.length}/{maxChars}
          </span>
        </div>

        {error && (
          <p className="text-xs text-red-600">{(error as Error).message}</p>
        )}
        {success && (
          <p className="text-xs text-green-600 font-medium">{t('submitSuccess')}</p>
        )}

        <button
          type="submit"
          disabled={isPending || !content.trim() || content.length > maxChars}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {isPending ? t('submitting') : t('submit')}
        </button>
      </form>
    </div>
  )
}

export default function CommentSection({ solutionId }: Props) {
  const t = useTranslations('comments')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useComments(solutionId, page)
  const { mutate: deleteComment } = useDeleteComment(solutionId)

  const comments = data?.comments ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      {/* Submit form */}
      <CommentForm solutionId={solutionId} />

      {/* Divider */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400 mb-4">
          {pagination ? `${pagination.total} phản hồi` : ''}
        </p>

        {/* Comment list */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">{t('noComments')}</p>
        ) : (
          <div className="space-y-5">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onDelete={(id) => deleteComment(id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              ← Trước
            </button>
            <span className="text-xs px-3 py-1.5 text-gray-500">
              {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Sau →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
