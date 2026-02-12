export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-02-11'

/** Safe for bundle: no throw. Use when Sanity Studio is optional (e.g. production without Studio). */
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''

export function isSanityConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID && process.env.NEXT_PUBLIC_SANITY_DATASET)
}
