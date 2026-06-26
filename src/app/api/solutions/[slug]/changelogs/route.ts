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
    .from('changelogs')
    .select('*, changelog_translations(*)')
    .eq('solution_id', solutionId)
    .order('release_date', { ascending: false })

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
  const { version, release_date, translations } = body

  if (!version || !release_date) return apiError('Thiếu trường bắt buộc', 'VALIDATION_ERROR', 400)
  if (!/^\d+\.\d+\.\d+$/.test(version)) return apiError('Version phải theo định dạng x.y.z', 'VALIDATION_ERROR', 400)

  const { data: changelog, error: clErr } = await supabase
    .from('changelogs')
    .insert({ solution_id: solutionId, version, release_date, created_by: admin.id })
    .select('id').single()

  if (clErr) {
    if (clErr.code === '23505') return apiError('Version đã tồn tại', 'DUPLICATE_VERSION', 409)
    return apiError(clErr.message, 'DB_ERROR', 500)
  }

  if (translations?.length) {
    await supabase.from('changelog_translations').insert(
      translations.map((t: { locale: string; title?: string; content: string }) => ({
        changelog_id: changelog.id, locale: t.locale, title: t.title || null, content: t.content,
      }))
    )
  }

  return apiSuccess({ id: changelog.id }, 201)
}
