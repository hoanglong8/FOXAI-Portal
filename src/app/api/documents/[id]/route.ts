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
  const { title, type, url, locale, sort_order } = body

  const { data, error } = await supabase
    .from('documents')
    .update({ title, type, url, locale, sort_order })
    .eq('id', id)
    .select('*').single()

  if (error) return apiError(error.message, 'DB_ERROR', 500)
  return apiSuccess(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  if (!(await requireAdmin(supabase))) return apiError('Không có quyền', 'FORBIDDEN', 403)

  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) return apiError(error.message, 'DB_ERROR', 500)
  return new Response(null, { status: 204 })
}
