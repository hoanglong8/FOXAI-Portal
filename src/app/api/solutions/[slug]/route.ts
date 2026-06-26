import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale') ?? 'vi'

  const supabase = await createClient()

  // Check if user is admin
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

  // Fetch solution with all related data
  const { data: solution, error } = await supabase
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
      created_at,
      updated_at,
      solution_translations (
        locale,
        name,
        short_desc,
        full_desc
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
      ),
      documents (
        id,
        title,
        type,
        url,
        locale,
        created_at
      ),
      changelogs (
        id,
        version,
        release_date,
        changelog_translations (
          locale,
          title,
          content
        )
      )
    `
    )
    .eq('slug', slug)
    .order('release_date', { referencedTable: 'changelogs', ascending: false })
    .order('created_at', { referencedTable: 'documents', ascending: true })
    .single()

  if (error || !solution) {
    return apiError('Không tìm thấy giải pháp', 'NOT_FOUND', 404)
  }

  // Non-admin can't see inactive/draft
  if (!isAdmin && solution.status !== 'active') {
    return apiError('Không tìm thấy giải pháp', 'NOT_FOUND', 404)
  }

  // Pick translation (prefer requested locale, fallback to VI)
  type Translation = { locale: string; name: string; short_desc: string; full_desc: string }
  const translations = solution.solution_translations as Translation[]
  const translation =
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === 'vi') ??
    translations[0]

  type SectorRaw = {
    sectors: {
      id: string
      slug: string
      sector_translations: { name: string; locale: string }[]
    } | null
  }
  const sectors = (solution.solution_sectors as unknown as SectorRaw[])
    .map((ss) => ss.sectors)
    .filter(Boolean)
    .map((sec) => ({
      id: sec!.id,
      slug: sec!.slug,
      name:
        sec!.sector_translations.find((t) => t.locale === locale)?.name ??
        sec!.sector_translations.find((t) => t.locale === 'vi')?.name ??
        sec!.slug,
    }))

  type TagRaw = { tags: { id: string; name: string } | null }
  const tags = (solution.solution_tags as unknown as TagRaw[])
    .map((st) => st.tags)
    .filter(Boolean)
    .map((tag) => ({ id: tag!.id, name: tag!.name }))

  type Document = {
    id: string
    title: string
    type: string
    url: string
    locale: string
    created_at: string
  }

  type ChangelogRaw = {
    id: string
    version: string
    release_date: string
    changelog_translations: { locale: string; title: string; content: string }[]
  }

  const changelogs = (solution.changelogs as ChangelogRaw[]).map((cl) => {
    const clTranslation =
      cl.changelog_translations.find((t) => t.locale === locale) ??
      cl.changelog_translations.find((t) => t.locale === 'vi') ??
      cl.changelog_translations[0]
    return {
      id: cl.id,
      version: cl.version,
      release_date: cl.release_date,
      title: clTranslation?.title ?? '',
      content: clTranslation?.content ?? '',
    }
  })

  const result = {
    id: solution.id,
    slug: solution.slug,
    logo_url: solution.logo_url,
    status: solution.status,
    demo_url: solution.demo_url,
    video_url: solution.video_url,
    download_url: solution.download_url,
    view_count: solution.view_count,
    created_at: solution.created_at,
    updated_at: solution.updated_at,
    name: translation?.name ?? '',
    short_desc: translation?.short_desc ?? '',
    full_desc: translation?.full_desc ?? '',
    sectors,
    tags,
    documents: solution.documents as Document[],
    changelogs,
  }

  return apiSuccess(result)
}

// Admin: full update (PUT /api/solutions/[id])
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return apiError('Không có quyền', 'FORBIDDEN', 403)

  const body = await request.json()
  const { slug, demo_url, video_url, download_url, logo_url, status, translations, sector_ids, tag_ids } = body

  if (demo_url && !demo_url.startsWith('https://')) return apiError('demo_url phải bắt đầu bằng https://', 'VALIDATION_ERROR', 400)
  if (slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return apiError('Slug không hợp lệ', 'VALIDATION_ERROR', 400)

  // Update base fields
  const { error: updateErr } = await supabase
    .from('solutions')
    .update({ slug, demo_url, video_url: video_url || null, download_url: download_url || null, logo_url: logo_url || null, status })
    .eq('id', id)

  if (updateErr) {
    if (updateErr.code === '23505') return apiError('Slug đã tồn tại', 'DUPLICATE_SLUG', 409)
    return apiError(updateErr.message, 'DB_ERROR', 500)
  }

  // Upsert translations
  if (translations?.length) {
    await supabase.from('solution_translations').upsert(
      translations.map((t: { locale: string; name: string; short_desc?: string; full_desc?: string }) => ({
        solution_id: id, locale: t.locale, name: t.name,
        short_desc: t.short_desc || null, full_desc: t.full_desc || null,
      })),
      { onConflict: 'solution_id,locale' }
    )
  }

  // Replace sectors
  if (sector_ids !== undefined) {
    await supabase.from('solution_sectors').delete().eq('solution_id', id)
    if (sector_ids.length) {
      await supabase.from('solution_sectors').insert(
        sector_ids.map((sector_id: string) => ({ solution_id: id, sector_id }))
      )
    }
  }

  // Replace tags
  if (tag_ids !== undefined) {
    await supabase.from('solution_tags').delete().eq('solution_id', id)
    if (tag_ids.length) {
      await supabase.from('solution_tags').insert(
        tag_ids.map((tag_id: string) => ({ solution_id: id, tag_id }))
      )
    }
  }

  return apiSuccess({ id })
}

// Admin: status-only patch (PATCH /api/solutions/[id])
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return apiError('Không có quyền', 'FORBIDDEN', 403)

  const body = await request.json()
  const { status } = body
  if (!['draft', 'active', 'inactive'].includes(status)) {
    return apiError('Status không hợp lệ', 'VALIDATION_ERROR', 400)
  }

  const { error } = await supabase.from('solutions').update({ status }).eq('id', id)
  if (error) return apiError(error.message, 'DB_ERROR', 500)

  return apiSuccess({ id, status })
}

// Admin: delete (DELETE /api/solutions/[id])
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return apiError('Không có quyền', 'FORBIDDEN', 403)

  const { error } = await supabase.from('solutions').delete().eq('id', id)
  if (error) return apiError(error.message, 'DB_ERROR', 500)

  return new Response(null, { status: 204 })
}
