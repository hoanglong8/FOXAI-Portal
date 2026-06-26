import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/utils'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return apiError('Không có quyền', 'FORBIDDEN', 403)

  const [
    { count: totalSolutions },
    { count: totalViews },
    { count: activeUsers },
    { count: openFeedback },
  ] = await Promise.all([
    supabase.from('solutions').select('*', { count: 'exact', head: true }),
    supabase.from('page_views').select('*', { count: 'exact', head: true }),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  return apiSuccess({
    totalSolutions: totalSolutions ?? 0,
    totalViews: totalViews ?? 0,
    activeUsers: activeUsers ?? 0,
    openFeedback: openFeedback ?? 0,
  })
}
