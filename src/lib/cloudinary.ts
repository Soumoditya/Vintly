// Cloudinary media uploads (free) — used for chat photos, files & voice notes.
//
// IMPORTANT: a phone app uploads with an *unsigned upload preset*, so we never
// embed the API secret. Two values are needed (both from your Cloudinary
// dashboard, doable on a phone):
//
//   1. CLOUD_NAME — shown at the top of your Cloudinary dashboard
//      (Programmable Media → looks like "dxxxxxxx", NOT the API key/number).
//
//   2. UPLOAD_PRESET — create an unsigned preset:
//      Settings (gear) → Upload → "Upload presets" → "Add upload preset" →
//      set "Signing Mode" = Unsigned → Save. Name it exactly: vintly_unsigned
//
// After filling CLOUD_NAME below, chat media uploads work in the next build.

const CLOUD_NAME = 'YOUR_CLOUD_NAME'
const UPLOAD_PRESET = 'vintly_unsigned'

export const cloudinaryReady = !CLOUD_NAME.startsWith('YOUR_')

// Uploads any blob/file and returns a hosted URL.
export async function uploadToCloudinary(file: Blob, resourceType: 'image' | 'video' | 'raw' = 'auto' as any): Promise<string> {
  if (!cloudinaryReady) throw new Error('Cloudinary not configured (set CLOUD_NAME in src/lib/cloudinary.ts).')
  // "auto" lets Cloudinary detect images/video/audio; raw is used for misc files.
  const type = resourceType || 'auto'
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', UPLOAD_PRESET)
  const res = await fetch(url, { method: 'POST', body: form })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Cloudinary upload failed: ${res.status} ${detail}`)
  }
  const json = await res.json()
  return json.secure_url as string
}
