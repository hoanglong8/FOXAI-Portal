import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/utils'

// PATCH /api/comments/[id]/status — admin only
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return apiError('Không có quyền', 'FORBIDDEN', 403)

  const body = await request.json()
  const { status } = body
  const validStatuses = ['open', 'in_progress', 'resolved', 'closed']
  if (!validStatuses.includes(status)) {
    return apiError('Status không hợp lệ', 'VALIDATION_ERROR', 400)
  }

  const { data, error } = await supabase
    .from('comments')
    .update({ status })
    .eq('id', id)
    .select('id, status')
    .single()

  if (error) return apiError(error.message, 'DB_ERROR', 500)
  return apiSuccess(data)
}

// DELETE /api/comments/[id] — own or admin
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)

  // RLS will enforce own-or-admin; just attempt the delete
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) {
    if (error.code === 'PGRST301') return apiError('Không có quyền', 'FORBIDDEN', 403)
    return apiError(error.message, 'DB_ERROR', 500)
  }

  return new Response(null, { status: 204 })
}
