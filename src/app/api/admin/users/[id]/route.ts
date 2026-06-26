import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/utils'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? { supabase, currentUserId: user.id } : null
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ctx = await requireAdmin()
  if (!ctx) return apiError('Không có quyền', 'FORBIDDEN', 403)

  const body = await request.json()
  const { full_name, role, department, language_pref } = body

  if (!full_name?.trim()) return apiError('Họ tên không được để trống', 'VALIDATION_ERROR', 400)

  const { data, error } = await ctx.supabase
    .from('user_profiles')
    .update({ full_name, role, department: department ?? null, language_pref: language_pref ?? 'vi' })
    .eq('id', id)
    .select('id, full_name, role, department, language_pref, is_active')
    .single()

  if (error) return apiError(error.message, 'DB_ERROR', 500)
  return apiSuccess(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ctx = await requireAdmin()
  if (!ctx) return apiError('Không có quyền', 'FORBIDDEN', 403)

  // Guard: cannot deactivate self
  if (id === ctx.currentUserId) {
    return apiError('Không thể vô hiệu hoá tài khoản của chính mình', 'SELF_DEACTIVATE', 400)
  }

  const { is_active } = await request.json()

  const { data, error } = await ctx.supabase
    .from('user_profiles')
    .update({ is_active })
    .eq('id', id)
    .select('id, is_active')
    .single()

  if (error) return apiError(error.message, 'DB_ERROR', 500)
  return apiSuccess(data)
}
