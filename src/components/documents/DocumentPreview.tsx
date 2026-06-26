'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { X, ExternalLink, AlertCircle } from 'lucide-react'
import { getPreviewUrl } from '@/lib/utils'

interface Document {
  id: string
  title: string
  type: string
  url: string
  locale: string
}

interface Props {
  document: Document | null
  onClose: () => void
}

export default function DocumentPreview({ document, onClose }: Props) {
  const t = useTranslations('documents')
  const [loadError, setLoadError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!document) return
    setLoadError(false)
    setIsLoading(true)

    // Timeout fallback: if iframe doesn't load within 10s, show error
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false)
      setLoadError(true)
    }, 10000)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [document?.id])

  if (!document) return null

  const previewUrl = getPreviewUrl(document.url)

  function handleLoad() {
    setIsLoading(false)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={document.title}
      tabIndex={-1}
    >
      <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-gray-800 truncate">{document.title}</span>
            <span className="text-xs text-gray-400 uppercase shrink-0">{document.type}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={document.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium"
            >
              <ExternalLink size={12} />
              {t('openNewTab')}
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
              aria-label="Đóng"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative">
          {isLoading && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <div className="h-6 w-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">{t('loading')}</span>
              </div>
            </div>
          )}

          {loadError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500 p-8 text-center">
              <AlertCircle size={32} className="text-gray-300" />
              <p className="font-medium">{t('previewError')}</p>
              <p className="text-sm text-gray-400">{t('previewErrorAction')}</p>
              <a
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium px-4 py-2 hover:bg-brand-700 transition-colors"
              >
                <ExternalLink size={14} />
                {t('openNewTab')}
              </a>
            </div>
          ) : (
            <iframe
              src={previewUrl}
              title={document.title}
              className="w-full h-full border-0"
              onLoad={handleLoad}
              onError={() => { setLoadError(true); setIsLoading(false) }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          )}
        </div>
      </div>
    </div>
  )
}
