import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale') ?? 'vi'

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sectors')
    .select(`
      id,
      slug,
      sector_translations!inner (
        name,
        locale
      )
    `)
    .eq('sector_translations.locale', locale)
    .order('id')

  if (error) {
    return apiError('Không thể tải danh sách khối', 'DB_ERROR', 500)
  }

  const sectors = (data ?? []).map((s) => ({
    id: s.id,
    slug: s.slug,
    name: (s.sector_translations as { name: string; locale: string }[])[0]?.name ?? s.slug,
  }))

  return apiSuccess(sectors)
}
