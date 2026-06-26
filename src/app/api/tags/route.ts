import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, generateSlug } from '@/lib/utils'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)

  const { data, error } = await supabase
    .from('tags').select('id, name, slug').order('name')

  if (error) return apiError(error.message, 'DB_ERROR', 500)
  return apiSuccess(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return apiError('Không có quyền', 'FORBIDDEN', 403)

  const { name } = await request.json()
  if (!name?.trim()) return apiError('Tên tag là bắt buộc', 'VALIDATION_ERROR', 400)

  const slug = generateSlug(name)
  const { data, error } = await supabase
    .from('tags').insert({ name: name.trim(), slug }).select('*').single()

  if (error) {
    if (error.code === '23505') return apiError('Tag đã tồn tại', 'DUPLICATE', 409)
    return apiError(error.message, 'DB_ERROR', 500)
  }
  return apiSuccess(data, 201)
}
