// GIPHY integration for the chat GIF picker.
const GIPHY_KEY = 'OxgPkke3hgvNaVDRBFtVny8WblVb2MDo'
const BASE = 'https://api.giphy.com/v1/gifs'

export interface Gif {
  id: string
  url: string // downsized gif for sending
  preview: string // small still/preview
}

function map(data: any[]): Gif[] {
  return data.map((g) => ({
    id: g.id,
    url: g.images?.downsized?.url || g.images?.original?.url,
    preview: g.images?.fixed_width_small?.url || g.images?.preview_gif?.url,
  }))
}

export async function trendingGifs(limit = 24): Promise<Gif[]> {
  const r = await fetch(`${BASE}/trending?api_key=${GIPHY_KEY}&limit=${limit}&rating=pg-13`)
  if (!r.ok) return []
  const j = await r.json()
  return map(j.data || [])
}

export async function searchGifs(q: string, limit = 24): Promise<Gif[]> {
  if (!q.trim()) return trendingGifs(limit)
  const r = await fetch(
    `${BASE}/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=${limit}&rating=pg-13`,
  )
  if (!r.ok) return []
  const j = await r.json()
  return map(j.data || [])
}
