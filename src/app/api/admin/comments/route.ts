import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/utils'

const PAGE_SIZE = 25

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? ''
  const status = searchParams.get('status') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return apiError('Không có quyền', 'FORBIDDEN', 403)

  let query = supabase
    .from('comments')
    .select(
      `id, type, content, status, created_at, updated_at, user_id,
       user_profiles!inner(full_name),
       solutions!inner(id, slug, solution_translations(locale, name))`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)

  const from = (page - 1) * PAGE_SIZE
  query = query.range(from, from + PAGE_SIZE - 1)

  const { data, error, count } = await query
  if (error) return apiError(error.message, 'DB_ERROR', 500)

  type CommentRaw = {
    id: string; type: string; content: string; status: string
    created_at: string; updated_at: string; user_id: string
    user_profiles: { full_name: string }
    solutions: {
      id: string; slug: string
      solution_translations: { locale: string; name: string }[]
    }
  }

  const comments = ((data ?? []) as unknown as CommentRaw[]).map((c) => ({
    id: c.id,
    type: c.type,
    content: c.content,
    status: c.status,
    created_at: c.created_at,
    updated_at: c.updated_at,
    user_id: c.user_id,
    user_name: c.user_profiles.full_name,
    is_own: false, // admin view — always show delete
    solution_id: c.solutions.id,
    solution_name:
      c.solutions.solution_translations.find((t) => t.locale === 'vi')?.name ??
      c.solutions.solution_translations[0]?.name ??
      c.solutions.slug,
  }))

  return apiSuccess({
    comments,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
    },
  })
}
