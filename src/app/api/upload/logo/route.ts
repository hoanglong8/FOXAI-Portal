import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/utils'
import sharp from 'sharp'

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const BUCKET = 'logos'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Chưa đăng nhập', 'UNAUTHENTICATED', 401)
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return apiError('Không có quyền', 'FORBIDDEN', 403)

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return apiError('Không có file', 'VALIDATION_ERROR', 400)
  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError('Chỉ hỗ trợ JPEG, PNG, WebP, SVG', 'INVALID_FILE_TYPE', 400)
  }
  if (file.size > MAX_SIZE_BYTES) {
    return apiError('File quá lớn (tối đa 2MB)', 'FILE_TOO_LARGE', 400)
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Convert to WEBP (skip for SVG)
  let uploadBuffer: Buffer
  let contentType: string
  let ext: string

  if (file.type === 'image/svg+xml') {
    uploadBuffer = buffer
    contentType = 'image/svg+xml'
    ext = 'svg'
  } else {
    uploadBuffer = await sharp(buffer)
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 85 })
      .toBuffer()
    contentType = 'image/webp'
    ext = 'webp'
  }

  const filename = `${crypto.randomUUID()}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(filename, uploadBuffer, { contentType, upsert: false })

  if (uploadErr) return apiError(uploadErr.message, 'UPLOAD_ERROR', 500)

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)

  return apiSuccess({ url: publicUrl }, 201)
}
