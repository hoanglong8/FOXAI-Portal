import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/utils'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return apiSuccess({
    id: user.id,
    email: user.email,
    profile,
  })
}
