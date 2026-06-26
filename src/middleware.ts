import createIntlMiddleware from 'next-intl/middleware'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/routing'

const handleI18nRouting = createIntlMiddleware(routing)

function getLocaleFromPath(pathname: string): AppLocale {
  const found = routing.locales.find(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  )
  return (found ?? routing.defaultLocale) as AppLocale
}

export async function middleware(request: NextRequest) {
  const i18nResponse = handleI18nRouting(request)
  let response = i18nResponse ?? NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
          })
          response = i18nResponse ?? NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const locale = getLocaleFromPath(pathname)
  const isLoginPath = pathname === `/${locale}/login`

  if (!user && !isLoginPath) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = `/${locale}/login`
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isLoginPath) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = `/${locale}`
    homeUrl.search = ''
    return NextResponse.redirect(homeUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
