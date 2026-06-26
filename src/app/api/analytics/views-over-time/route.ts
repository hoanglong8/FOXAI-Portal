import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = Math.min(90, Math.max(7, parseInt(searchParams.get('days') ?? '30', 10)))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return apiError('Không có quyền', 'FORBIDDEN', 403)

  // Use raw query via rpc to group by date
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const { data, error } = await supabase
    .from('page_views')
    .select('created_at')
    .gte('created_at', since)
    .order('created_at')

  if (error) return apiError(error.message, 'DB_ERROR', 500)

  // Group by date client-side
  const counts: Record<string, number> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    counts[key] = 0
  }
  for (const row of (data ?? [])) {
    const key = row.created_at.slice(0, 10)
    if (key in counts) counts[key]++
  }

  const result = Object.entries(counts).map(([date, views]) => ({ date, views }))
  return apiSuccess(result)
}
