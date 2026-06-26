import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/utils'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: solutionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('solution_id', solutionId)
    .order('sort_order')

  if (error) return apiError(error.message, 'DB_ERROR', 500)
  return apiSuccess(data)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: solutionId } = await params
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return apiError('Không có quyền', 'FORBIDDEN', 403)

  const body = await request.json()
  const { title, type, url, locale, sort_order } = body

  if (!title || !url) return apiError('Thiếu trường bắt buộc', 'VALIDATION_ERROR', 400)

  const { data, error } = await supabase
    .from('documents')
    .insert({ solution_id: solutionId, title, type: type || 'presentation', url, locale: locale || 'vi', sort_order: sort_order ?? 0 })
    .select('*').single()

  if (error) return apiError(error.message, 'DB_ERROR', 500)
  return apiSuccess(data, 201)
}
