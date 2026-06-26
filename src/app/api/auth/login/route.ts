import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { apiError, apiSuccess } from '@/lib/utils'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return apiError('Email và mật khẩu là bắt buộc', 'VALIDATION_ERROR', 400)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({ email, password })

  if (authError || !authData.user) {
    console.error('[LOGIN ERROR]', authError?.message, authError?.status)
    return apiError(authError?.message ?? 'Sai email hoặc mật khẩu', 'INVALID_CREDENTIALS', 401)
  }

  // Fetch profile for role info
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, role, language_pref, is_active')
    .eq('id', authData.user.id)
    .single()

  if (profile && !profile.is_active) {
    await supabase.auth.signOut()
    return apiError(
      'Tài khoản đã bị vô hiệu hoá. Vui lòng liên hệ admin.',
      'ACCOUNT_INACTIVE',
      403
    )
  }

  return apiSuccess({
    user: {
      id: authData.user.id,
      email: authData.user.email,
      profile,
    },
  })
}
