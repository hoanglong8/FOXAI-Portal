import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/utils'

const PAGE_SIZE = 20

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? { supabase, user } : null
}

export async function GET(request: Request) {
  const ctx = await requireAdmin()
  if (!ctx) return apiError('Không có quyền', 'FORBIDDEN', 403)

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role') ?? ''
  const isActive = searchParams.get('is_active') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  let query = ctx.supabase
    .from('user_profiles')
    .select('id, full_name, role, language_pref, department, is_active, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (role) query = query.eq('role', role)
  if (isActive !== '') query = query.eq('is_active', isActive === 'true')

  const from = (page - 1) * PAGE_SIZE
  query = query.range(from, from + PAGE_SIZE - 1)

  const { data, error, count } = await query
  if (error) return apiError(error.message, 'DB_ERROR', 500)

  // Get emails from auth.users via admin API — one call for the page
  const adminClient = await createAdminClient()
  const userIds = (data ?? []).map((u) => u.id)

  const emailMap: Record<string, string> = {}
  for (const uid of userIds) {
    const { data: authUser } = await adminClient.auth.admin.getUserById(uid)
    if (authUser?.user?.email) emailMap[uid] = authUser.user.email
  }

  const users = (data ?? []).map((u) => ({
    ...u,
    email: emailMap[u.id] ?? '',
  }))

  return apiSuccess({
    users,
    pagination: { page, pageSize: PAGE_SIZE, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / PAGE_SIZE) },
  })
}

export async function POST(request: Request) {
  const ctx = await requireAdmin()
  if (!ctx) return apiError('Không có quyền', 'FORBIDDEN', 403)

  const body = await request.json()
  const { email, password, full_name, role, department, language_pref } = body

  if (!email || !password || !full_name) {
    return apiError('Email, mật khẩu và họ tên là bắt buộc', 'VALIDATION_ERROR', 400)
  }
  if (!email.includes('@')) return apiError('Email không hợp lệ', 'VALIDATION_ERROR', 400)
  if (password.length < 8) return apiError('Mật khẩu tối thiểu 8 ký tự', 'VALIDATION_ERROR', 400)

  const adminClient = await createAdminClient()

  // Create auth user
  const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authErr) {
    if (authErr.message.includes('already')) return apiError('Email đã tồn tại', 'DUPLICATE_EMAIL', 409)
    return apiError(authErr.message, 'AUTH_ERROR', 500)
  }

  const uid = authData.user.id

  // Insert user_profile
  const { error: profileErr } = await ctx.supabase
    .from('user_profiles')
    .insert({
      id: uid,
      full_name,
      role: role ?? 'user',
      department: department ?? null,
      language_pref: language_pref ?? 'vi',
    })

  if (profileErr) {
    // Rollback: delete the auth user we just created
    await adminClient.auth.admin.deleteUser(uid)
    return apiError(profileErr.message, 'DB_ERROR', 500)
  }

  return apiSuccess({ id: uid, email, full_name }, 201)
}
