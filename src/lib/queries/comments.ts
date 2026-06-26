import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Comment {
  id: string
  type: string
  content: string
  status: string
  created_at: string
  updated_at: string
  user_id: string
  user_name: string
  is_own: boolean
}

export interface CommentsResponse {
  comments: Comment[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

async function fetchComments(solutionId: string, page = 1): Promise<CommentsResponse> {
  const res = await fetch(`/api/solutions/${solutionId}/comments?page=${page}`)
  if (!res.ok) throw new Error('Failed to fetch comments')
  const json = await res.json()
  return json.data
}

export function useComments(solutionId: string, page = 1) {
  return useQuery({
    queryKey: ['comments', solutionId, page],
    queryFn: () => fetchComments(solutionId, page),
    enabled: !!solutionId,
  })
}

export function useCreateComment(solutionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { type: string; content: string }) => {
      const res = await fetch(`/api/solutions/${solutionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Không thể gửi phản hồi')
      }
      const json = await res.json()
      return json.data as Comment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', solutionId] })
    },
  })
}

export function useDeleteComment(solutionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) {
        const json = await res.json()
        throw new Error(json.error ?? 'Không thể xóa')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', solutionId] })
    },
  })
}

export function useUpdateCommentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, status }: { commentId: string; status: string }) => {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Không thể cập nhật')
      }
      const json = await res.json()
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] })
    },
  })
}
