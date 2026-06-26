// ─────────────────────────────────────────────
// Primitive types
// ─────────────────────────────────────────────
export type Locale = 'vi' | 'en' | 'la' | 'zh'
export type SolutionStatus = 'draft' | 'active' | 'inactive'
export type UserRole = 'admin' | 'user'
export type DocumentType = 'presentation' | 'user_guide' | 'technical'
export type CommentType = 'comment' | 'feedback' | 'bug' | 'note'
export type CommentStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

// ─────────────────────────────────────────────
// User
// ─────────────────────────────────────────────
export interface UserProfile {
  id: string
  full_name: string
  role: UserRole
  language_pref: Locale
  department: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserWithEmail extends UserProfile {
  email: string
}

// ─────────────────────────────────────────────
// Sector
// ─────────────────────────────────────────────
export interface SectorTranslation {
  id: string
  sector_id: string
  locale: Locale
  name: string
  description: string | null
}

export interface Sector {
  id: string
  slug: string
  icon: string
  sort_order: number
  created_at: string
  name?: string        // from join
  description?: string // from join
}

// ─────────────────────────────────────────────
// Tag
// ─────────────────────────────────────────────
export interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
}

// ─────────────────────────────────────────────
// Solution
// ─────────────────────────────────────────────
export interface SolutionTranslation {
  id: string
  solution_id: string
  locale: Locale
  name: string
  short_desc: string | null
  full_desc: string | null
}

export interface Solution {
  id: string
  slug: string
  demo_url: string
  video_url: string | null
  download_url: string | null
  logo_url: string | null
  status: SolutionStatus
  view_count: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface SolutionListItem extends Solution {
  translation: SolutionTranslation
  sectors: Pick<Sector, 'id' | 'slug' | 'name'>[]
  tags: Pick<Tag, 'id' | 'name' | 'slug'>[]
}

export interface SolutionDetail extends Solution {
  translations: SolutionTranslation[]
  sectors: Sector[]
  tags: Tag[]
  documents: Document[]
  latest_changelog: Pick<Changelog, 'version' | 'release_date'> | null
}

// Form payload for create/update
export interface SolutionPayload {
  slug: string
  demo_url: string
  video_url?: string | null
  download_url?: string | null
  logo_url?: string | null
  status: SolutionStatus
  sector_ids: string[]
  tag_ids: string[]
  translations: {
    locale: Locale
    name: string
    short_desc?: string | null
    full_desc?: string | null
  }[]
}

// ─────────────────────────────────────────────
// Document
// ─────────────────────────────────────────────
export interface Document {
  id: string
  solution_id: string
  type: DocumentType
  title: string
  url: string
  preview_url?: string  // computed by server: GDrive → /preview, SharePoint + ?web=1
  locale: Locale
  sort_order: number
  created_at: string
  updated_at: string
}

export interface DocumentPayload {
  type: DocumentType
  title: string
  url: string
  locale: Locale
  sort_order?: number
}

// ─────────────────────────────────────────────
// Changelog
// ─────────────────────────────────────────────
export interface ChangelogTranslation {
  id: string
  changelog_id: string
  locale: Locale
  title: string | null
  content: string
}

export interface Changelog {
  id: string
  solution_id: string
  version: string
  release_date: string
  created_by: string
  created_at: string
  translation?: ChangelogTranslation
  translations?: ChangelogTranslation[]
}

export interface ChangelogPayload {
  version: string
  release_date: string
  translations: {
    locale: Locale
    title?: string | null
    content: string
  }[]
}

// ─────────────────────────────────────────────
// Comment
// ─────────────────────────────────────────────
export interface Comment {
  id: string
  solution_id: string
  user_id: string
  type: CommentType
  content: string
  status: CommentStatus
  created_at: string
  updated_at: string
  user?: {
    full_name: string
    role: UserRole
  }
}

// ─────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────
export interface AnalyticsOverview {
  total_solutions: number
  active_solutions: number
  total_views: number
  views_this_month: number
  total_comments: number
  open_bugs: number
  total_users: number
  active_users: number
}

export interface ViewOverTime {
  date: string
  views: number
}

export interface TopSolution {
  solution_id: string
  name: string
  slug: string
  views: number
}

export interface ViewsBySector {
  sector_id: string
  sector_name: string
  slug: string
  views: number
  percentage: number
}

// ─────────────────────────────────────────────
// API Response wrapper
// ─────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  meta?: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

export interface ApiError {
  error: string
  code?: string
}

// Common error codes (from API-SPEC.md)
export const ERROR_CODES = {
  UNAUTHENTICATED:       'UNAUTHENTICATED',
  FORBIDDEN:             'FORBIDDEN',
  NOT_FOUND:             'NOT_FOUND',
  INVALID_CREDENTIALS:   'INVALID_CREDENTIALS',
  SLUG_EXISTS:           'SLUG_EXISTS',
  INVALID_URL:           'INVALID_URL',
  MISSING_VI_TRANSLATION:'MISSING_VI_TRANSLATION',
  VERSION_EXISTS:        'VERSION_EXISTS',
  INVALID_FILE:          'INVALID_FILE',
  SELF_DEACTIVATE:       'SELF_DEACTIVATE',
  INTERNAL_ERROR:        'INTERNAL_ERROR',
} as const
