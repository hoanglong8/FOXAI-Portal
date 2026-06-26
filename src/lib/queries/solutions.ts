import { useQuery } from '@tanstack/react-query'

interface SolutionFilters {
  locale: string
  sector?: string
  q?: string
  page?: number
}

export interface SolutionListItem {
  id: string
  slug: string
  logo_url: string | null
  status: string
  demo_url: string | null
  video_url: string | null
  download_url: string | null
  view_count: number
  name: string
  short_desc: string
  sectors: { id: string; slug: string; name: string }[]
  tags: { id: string; name: string }[]
}

export interface SolutionsResponse {
  solutions: SolutionListItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface SectorItem {
  id: string
  slug: string
  name: string
}

async function fetchSolutions(filters: SolutionFilters): Promise<SolutionsResponse> {
  const params = new URLSearchParams()
  params.set('locale', filters.locale)
  if (filters.sector) params.set('sector', filters.sector)
  if (filters.q) params.set('q', filters.q)
  if (filters.page) params.set('page', String(filters.page))

  const res = await fetch(`/api/solutions?${params}`)
  if (!res.ok) throw new Error('Failed to fetch solutions')
  const json = await res.json()
  return json.data
}

async function fetchSectors(locale: string): Promise<SectorItem[]> {
  const res = await fetch(`/api/sectors?locale=${locale}`)
  if (!res.ok) throw new Error('Failed to fetch sectors')
  const json = await res.json()
  return json.data
}

export function useSolutions(filters: SolutionFilters) {
  return useQuery({
    queryKey: ['solutions', filters],
    queryFn: () => fetchSolutions(filters),
    placeholderData: (prev) => prev,
  })
}

export function useSectors(locale: string) {
  return useQuery({
    queryKey: ['sectors', locale],
    queryFn: () => fetchSectors(locale),
    staleTime: 5 * 60 * 1000, // sectors rarely change
  })
}
