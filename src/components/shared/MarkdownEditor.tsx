'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
}

export default function MarkdownEditor({ value, onChange, placeholder, rows = 10, disabled }: Props) {
  const [preview, setPreview] = useState(false)

  return (
    <div className="rounded-lg border border-gray-300 overflow-hidden">
      {/* Toolbar */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${!preview ? 'bg-white text-brand-700 border-b-2 border-brand-600 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Chỉnh sửa
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${preview ? 'bg-white text-brand-700 border-b-2 border-brand-600 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Xem trước
        </button>
        <span className="ml-auto px-3 py-1.5 text-xs text-gray-400">Markdown</span>
      </div>

      {preview ? (
        <div className="p-3 min-h-[160px] prose prose-sm prose-foxai max-w-none">
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-gray-400 italic">{placeholder ?? 'Chưa có nội dung'}</p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className="w-full p-3 text-sm text-gray-900 font-mono placeholder:text-gray-400 focus:outline-none resize-y disabled:bg-gray-50"
        />
      )}
    </div>
  )
}
