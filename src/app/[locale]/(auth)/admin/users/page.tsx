'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, UserX, UserCheck, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface UserRow {
  id: string
  email: string
  full_name: string
  role: string
  department: string | null
  language_pref: string
  is_active: boolean
  created_at: string
}

const LOCALES = ['vi', 'en', 'la', 'zh'] as const

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── Create/Edit User Modal ───────────────────────────────────────────────────
function UserModal({
  user,
  onClose,
  onSave,
}: {
  user: Partial<UserRow> | null
  onClose: () => void
  onSave: (updated: UserRow) => void
}) {
  const t = useTranslations('admin.users')
  const isEdit = !!user?.id

  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(user?.role ?? 'user')
  const [department, setDepartment] = useState(user?.department ?? '')
  const [langPref, setLangPref] = useState(user?.language_pref ?? 'vi')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (isEdit) {
        const res = await fetch(`/api/admin/users/${user!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: fullName, role, department: department || null, language_pref: langPref }),
        })
        const json = await res.json()
        if (!res.ok) { setError(json.error ?? 'Lưu thất bại'); return }
        onSave({ ...user, ...json.data, email: user?.email ?? '' } as UserRow)
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, full_name: fullName, role, department: department || null, language_pref: langPref }),
        })
        const json = await res.json()
        if (!res.ok) { setError(json.error ?? 'Tạo thất bại'); return }
        onSave({ ...json.data, role, department: department || null, language_pref: langPref, is_active: true, created_at: new Date().toISOString() } as UserRow)
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{isEdit ? t('edit') : t('create')}</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.email')} *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.name')} *</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.role')}</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="user">{t('roles.user')}</option>
                <option value="admin">{t('roles.admin')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.language')}</label>
              <select value={langPref} onChange={e => setLangPref(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {LOCALES.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.department')}</label>
            <input value={department} onChange={e => setDepartment(e.target.value)}
              placeholder="Ví dụ: Kinh doanh, Kỹ thuật..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 transition-colors disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo tài khoản')}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg">
              Huỷ
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const t = useTranslations('admin.users')

  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalUser, setModalUser] = useState<Partial<UserRow> | null | undefined>(undefined)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  async function load(p = 1) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?page=${p}`)
      if (!res.ok) return
      const json = await res.json()
      setUsers(json.data.users)
      setTotalPages(json.data.pagination.totalPages)
      setTotal(json.data.pagination.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function toggleActive(user: UserRow) {
    setTogglingId(user.id)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active }),
      })
      const json = await res.json()
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: json.data.is_active } : u))
      } else {
        window.alert(json.error)
      }
    } finally {
      setTogglingId(null)
    }
  }

  function onUserSaved(saved: UserRow) {
    setUsers(prev => {
      const exists = prev.find(u => u.id === saved.id)
      if (exists) return prev.map(u => u.id === saved.id ? { ...u, ...saved } : u)
      return [saved, ...prev]
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          {t('title')}
          <span className="ml-2 text-sm font-normal text-gray-400">({total})</span>
        </h1>
        <button onClick={() => setModalUser({})}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 transition-colors">
          <Plus size={14} />
          {t('create')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">{t('fields.name')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">{t('fields.role')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">{t('fields.status')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">{t('fields.createdAt')}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    {user.department && <p className="text-xs text-gray-400">{user.department}</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                      user.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600')}>
                      {t(`roles.${user.role}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
                      {user.is_active ? t('statuses.active') : t('statuses.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModalUser(user)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title={t('edit')}>
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => toggleActive(user)}
                        disabled={togglingId === user.id}
                        className={cn('p-1.5 rounded-lg transition-colors',
                          user.is_active
                            ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50')}
                        title={user.is_active ? t('deactivate') : 'Kích hoạt'}>
                        {togglingId === user.id
                          ? <Loader2 size={15} className="animate-spin" />
                          : user.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => { const p = page - 1; setPage(p); load(p) }} disabled={page === 1}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Trước</button>
          <span className="text-sm px-3 py-1.5 text-gray-500">{page} / {totalPages}</span>
          <button onClick={() => { const p = page + 1; setPage(p); load(p) }} disabled={page === totalPages}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Sau →</button>
        </div>
      )}

      {/* Modal */}
      {modalUser !== undefined && (
        <UserModal
          user={modalUser}
          onClose={() => setModalUser(undefined)}
          onSave={onUserSaved}
        />
      )}
    </div>
  )
}
