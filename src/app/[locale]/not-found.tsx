import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-brand-100 rounded-full">
            <FileQuestion size={40} className="text-brand-600" />
          </div>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-lg font-medium text-gray-700 mb-1">Không tìm thấy trang</p>
        <p className="text-gray-500 mb-6">Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
        <Link
          href="/vi"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
