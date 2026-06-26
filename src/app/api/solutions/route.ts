import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, generateSlug } from '@/lib/utils'

const PAGE_SIZE = 12

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return apiError('Không có quyền', 'FORBIDDEN', 403)

  const body = await request.json()
  const { slug, demo_url, video_url, download_url, logo_url, status, translations, sector_ids, tag_ids } = body

  if (!slug || !demo_url) return apiError('Thiếu trường bắt buộc', 'VALIDATION_ERROR', 400)
  if (!demo_url.startsWith('https://')) return apiError('demo_url phải bắt đầu bằng https://', 'VALIDATION_ERROR', 400)
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return apiError('Slug không hợp lệ', 'VALIDATION_ERROR', 400)

  const viTranslation = (translations as { locale: string; name: string }[])?.find(t => t.locale === 'vi')
  if (!viTranslation?.name) return apiError('Tên tiếng Việt là bắt buộc', 'VALIDATION_ERROR', 400)

  // Insert solution
  const { data: solution, error: sErr } = await supabase
    .from('solutions')
    .insert({ slug, demo_url, video_url: video_url || null, download_url: download_url || null, logo_url: logo_url || null, status: status || 'draft', created_by: user.id })
    .select('id').single()

  if (sErr) {
    if (sErr.code === '23505') return apiError('Slug đã tồn tại', 'DUPLICATE_SLUG', 409)
    return apiError(sErr.message, 'DB_ERROR', 500)
  }

  const solutionId = solution.id

  // Insert translations (upsert)
  if (translations?.length) {
    await supabase.from('solution_translations').insert(
      translations.map((t: { locale: string; name: string; short_desc?: string; full_desc?: string }) => ({
        solution_id: solutionId, locale: t.locale, name: t.name,
        short_desc: t.short_desc || null, full_desc: t.full_desc || null,
      }))
    )
  }

  // Sectors
  if (sector_ids?.length) {
    await supabase.from('solution_sectors').insert(
      sector_ids.map((sector_id: string) => ({ solution_id: solutionId, sector_id }))
    )
  }

  // Tags
  if (tag_ids?.length) {
    await supabase.from('solution_tags').insert(
      tag_ids.map((tag_id: string) => ({ solution_id: solutionId, tag_id }))
    )
  }

  return apiSuccess({ id: solutionId, slug }, 201)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale') ?? 'vi'
  const sector = searchParams.get('sector') ?? ''
  const q = searchParams.get('q') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const supabase = await createClient()

  // Check if current user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  // Build query — translations with locale fallback to VI
  let query = supabase
    .from('solutions')
    .select(
      `
      id,
      slug,
      logo_url,
      status,
      demo_url,
      video_url,
      download_url,
      view_count,
      solution_translations!inner (
        locale,
        name,
        short_desc
      ),
      solution_sectors (
        sectors (
          id,
          slug,
          sector_translations (
            name,
            locale
          )
        )
      ),
      solution_tags (
        tags (
          id,
          name
        )
      )
    `,
      { count: 'exact' }
    )

  // Non-admin can only see active solutions
  if (!isAdmin) {
    query = query.eq('status', 'active')
  }

  // Filter by locale (prefer requested locale, JOIN requires exact match)
  query = query.eq('solution_translations.locale', locale)

  // Sector filter
  if (sector) {
    query = query.eq('solution_sectors.sectors.slug', sector)
  }

  // Search filter (server-side ILIKE on name + short_desc)
  if (q) {
    query = query.or(
      `solution_translations.name.ilike.%${q}%,solution_translations.short_desc.ilike.%${q}%`
    )
  }

  // Pagination
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  query = query.range(from, to).order('created_at', { ascending: false })

  const { data, error, count } = await query

  if (error) {
    return apiError('Không thể tải danh sách giải pháp', 'DB_ERROR', 500)
  }

  type RawSolution = {
    id: string
    slug: string
    logo_url: string | null
    status: string
    demo_url: string | null
    video_url: string | null
    download_url: string | null
    view_count: number
    solution_translations: { locale: string; name: string; short_desc: string }[]
    solution_sectors: { sectors: { id: string; slug: string; sector_translations: { name: string; locale: string }[] } | null }[]
    solution_tags: { tags: { id: string; name: string } | null }[]
  }

  const solutions = ((data ?? []) as unknown as RawSolution[]).map((s) => {
    const translation = s.solution_translations[0]
    const sectors = s.solution_sectors
      .map((ss) => ss.sectors)
      .filter(Boolean)
      .map((sec) => ({
        id: sec!.id,
        slug: sec!.slug,
        name:
          sec!.sector_translations.find((t) => t.locale === locale)?.name ??
          sec!.sector_translations[0]?.name ??
          sec!.slug,
      }))
    const tags = s.solution_tags
      .map((st) => st.tags)
      .filter(Boolean)
      .map((tag) => ({ id: tag!.id, name: tag!.name }))

    return {
      id: s.id,
      slug: s.slug,
      logo_url: s.logo_url,
      status: s.status,
      demo_url: s.demo_url,
      video_url: s.video_url,
      download_url: s.download_url,
      view_count: s.view_count,
      name: translation?.name ?? '',
      short_desc: translation?.short_desc ?? '',
      sectors,
      tags,
    }
  })

  return apiSuccess({
    solutions,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
    },
  })
}
