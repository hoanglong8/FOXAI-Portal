import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/utils'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return apiError('Không có quyền', 'FORBIDDEN', 403)

  // Get view counts per solution
  const { data: solutions, error } = await supabase
    .from('solutions')
    .select(`
      id, view_count,
      solution_sectors(
        sectors(
          id, slug,
          sector_translations(locale, name)
        )
      )
    `)

  if (error) return apiError(error.message, 'DB_ERROR', 500)

  type SolRaw = {
    id: string; view_count: number
    solution_sectors: {
      sectors: {
        id: string; slug: string
        sector_translations: { locale: string; name: string }[]
      } | null
    }[]
  }

  // Aggregate views per sector
  const sectorViews: Record<string, { id: string; slug: string; name: string; views: number }> = {}

  for (const sol of ((solutions ?? []) as unknown as SolRaw[])) {
    for (const ss of sol.solution_sectors) {
      const sector = ss.sectors
      if (!sector) continue
      const name =
        sector.sector_translations.find((t) => t.locale === 'vi')?.name ??
        sector.sector_translations[0]?.name ??
        sector.slug
      if (!sectorViews[sector.id]) {
        sectorViews[sector.id] = { id: sector.id, slug: sector.slug, name, views: 0 }
      }
      sectorViews[sector.id].views += sol.view_count
    }
  }

  const result = Object.values(sectorViews).sort((a, b) => b.views - a.views)
  return apiSuccess(result)
}
