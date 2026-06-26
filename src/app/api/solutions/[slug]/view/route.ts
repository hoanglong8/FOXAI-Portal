import { createClient } from '@/lib/supabase/server'
import { hashIp } from '@/lib/utils'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const supabase = await createClient()

    const { data: solution } = await supabase
      .from('solutions')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'active')
      .single()

    if (!solution) {
      return new Response(null, { status: 204 })
    }

    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor?.split(',')[0]?.trim() ?? 'unknown'
    const ipHash = hashIp(ip)

    // Atomic increment + page_view insert in parallel
    await Promise.all([
      supabase.rpc('increment_view_count', { solution_id: solution.id }),
      supabase.from('page_views').insert({
        solution_id: solution.id,
        ip_hash: ipHash,
        user_agent: request.headers.get('user-agent') ?? '',
        referrer: request.headers.get('referer') ?? null,
      }),
    ])
  } catch {
    // Fire-and-forget: never fail the client
  }

  return new Response(null, { status: 204 })
}
