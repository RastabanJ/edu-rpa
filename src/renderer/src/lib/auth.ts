export const ALLOWED_IDS = ['rastabanj', 'hy'] as const

export type AllowedId = (typeof ALLOWED_IDS)[number]

export type Session = {
  id: AllowedId
  loggedInAt: string
}

export function normalizeId(id: string): string {
  return id.trim().toLowerCase()
}

export function isAllowedId(id: string): id is AllowedId {
  return (ALLOWED_IDS as readonly string[]).includes(normalizeId(id))
}
