import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(20, Math.max(5, parseInt(searchParams.get('limit') ?? '10', 10)))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return apiError('Không có quyền', 'FORBIDDEN', 403)

  const { data, error } = await supabase
    .from('solutions')
    .select(`
      id, slug, logo_url, view_count,
      solution_translations!inner(locale, name)
    `)
    .eq('solution_translations.locale', 'vi')
    .order('view_count', { ascending: false })
    .limit(limit)

  if (error) return apiError(error.message, 'DB_ERROR', 500)

  type SolRaw = {
    id: string; slug: string; logo_url: string | null; view_count: number
    solution_translations: { locale: string; name: string }[]
  }

  const result = ((data ?? []) as unknown as SolRaw[]).map((s, i) => ({
    rank: i + 1,
    id: s.id,
    slug: s.slug,
    logo_url: s.logo_url,
    view_count: s.view_count,
    name: s.solution_translations[0]?.name ?? s.slug,
  }))

  return apiSuccess(result)
}
