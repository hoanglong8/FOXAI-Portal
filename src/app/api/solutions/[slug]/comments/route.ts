import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/utils'

const PAGE_SIZE = 20

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: solutionId } = await params
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? ''
  const status = searchParams.get('status') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)

  let query = supabase
    .from('comments')
    .select(
      `id, type, content, status, created_at, updated_at,
       user_id,
       user_profiles!inner(full_name, role)`,
      { count: 'exact' }
    )
    .eq('solution_id', solutionId)
    .order('created_at', { ascending: false })

  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)

  const from = (page - 1) * PAGE_SIZE
  query = query.range(from, from + PAGE_SIZE - 1)

  const { data, error, count } = await query
  if (error) return apiError(error.message, 'DB_ERROR', 500)

  // Tag own comments so client can show delete button
  const comments = (data ?? []).map((c) => ({
    id: c.id,
    type: c.type,
    content: c.content,
    status: c.status,
    created_at: c.created_at,
    updated_at: c.updated_at,
    user_id: c.user_id,
    user_name: (c.user_profiles as unknown as { full_name: string; role: string }).full_name,
    is_own: c.user_id === user.id,
  }))

  return apiSuccess({
    comments,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
    },
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: solutionId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)

  const body = await request.json()
  const { type, content } = body

  if (!content?.trim()) return apiError('Nội dung không được để trống', 'VALIDATION_ERROR', 400)
  if (content.length > 2000) return apiError('Nội dung quá dài (tối đa 2000 ký tự)', 'VALIDATION_ERROR', 400)

  const validTypes = ['comment', 'feedback', 'bug', 'note']
  const commentType = validTypes.includes(type) ? type : 'comment'

  // Verify solution exists and is accessible
  const { data: solution } = await supabase
    .from('solutions')
    .select('id, status')
    .eq('id', solutionId)
    .single()

  if (!solution) return apiError('Không tìm thấy giải pháp', 'NOT_FOUND', 404)

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      solution_id: solutionId,
      user_id: user.id,
      type: commentType,
      content: content.trim(),
    })
    .select(`
      id, type, content, status, created_at,
      user_id,
      user_profiles!inner(full_name)
    `)
    .single()

  if (error) return apiError(error.message, 'DB_ERROR', 500)

  return apiSuccess({
    id: comment.id,
    type: comment.type,
    content: comment.content,
    status: comment.status,
    created_at: comment.created_at,
    user_id: comment.user_id,
    user_name: (comment.user_profiles as unknown as { full_name: string }).full_name,
    is_own: true,
  }, 201)
}
