import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import slugifyLib from 'slugify'
import { createHash } from 'crypto'

// ─── Tailwind class merge ───────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Slug generation ───────────────────────────────────
export function generateSlug(text: string): string {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    locale: 'vi',
    trim: true,
  })
}

// ─── Document preview URL transform ────────────────────
export function getPreviewUrl(url: string): string {
  // Google Drive: .../file/d/{id}/view → .../file/d/{id}/preview
  const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (gdriveMatch) {
    return `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`
  }

  // Google Docs/Sheets/Slides embed
  const gDocsMatch = url.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/]+)/)
  if (gDocsMatch) {
    return url.replace(/\/edit.*$/, '/preview')
  }

  // SharePoint: append ?web=1 if not already present
  if (url.includes('sharepoint.com') && !url.includes('?web=1')) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}web=1`
  }

  return url
}

// ─── IP address hashing (SHA-256) ──────────────────────
export function hashIp(ip: string): string {
  return createHash('sha256').update(ip + process.env.NEXT_PUBLIC_APP_URL).digest('hex')
}

// ─── Get client IP from request headers ────────────────
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

// ─── Date formatting ───────────────────────────────────
export function formatDate(dateString: string, locale: string = 'vi'): string {
  return new Date(dateString).toLocaleDateString(locale === 'vi' ? 'vi-VN' : locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(dateString: string, locale: string = 'vi'): string {
  return new Date(dateString).toLocaleString(locale === 'vi' ? 'vi-VN' : locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Number formatting ─────────────────────────────────
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

// ─── Semver validation ─────────────────────────────────
export function isValidSemver(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version)
}

// ─── URL validation ────────────────────────────────────
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return url.startsWith('https://')
  } catch {
    return false
  }
}

// ─── Truncate text ─────────────────────────────────────
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

// ─── Avatar initials ───────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

// ─── Standard API error response ──────────────────────
export function apiError(
  message: string,
  code: string,
  status: number
): Response {
  return Response.json({ error: message, code }, { status })
}

export function apiSuccess<T>(data: T, status: number = 200): Response {
  return Response.json({ data }, { status })
}
