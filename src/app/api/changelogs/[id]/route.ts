import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/utils'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin'
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  if (!(await requireAdmin(supabase))) return apiError('Không có quyền', 'FORBIDDEN', 403)

  const body = await request.json()
  const { version, release_date, translations } = body

  if (version && !/^\d+\.\d+\.\d+$/.test(version)) {
    return apiError('Version phải theo định dạng x.y.z', 'VALIDATION_ERROR', 400)
  }

  const { error: updateErr } = await supabase
    .from('changelogs')
    .update({ version, release_date })
    .eq('id', id)

  if (updateErr) return apiError(updateErr.message, 'DB_ERROR', 500)

  if (translations?.length) {
    await supabase.from('changelog_translations').upsert(
      translations.map((t: { locale: string; title?: string; content: string }) => ({
        changelog_id: id, locale: t.locale, title: t.title || null, content: t.content,
      })),
      { onConflict: 'changelog_id,locale' }
    )
  }

  return apiSuccess({ id })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  if (!(await requireAdmin(supabase))) return apiError('Không có quyền', 'FORBIDDEN', 403)

  const { error } = await supabase.from('changelogs').delete().eq('id', id)
  if (error) return apiError(error.message, 'DB_ERROR', 500)
  return new Response(null, { status: 204 })
}
