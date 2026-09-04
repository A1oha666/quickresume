// Local-only navigation helpers. No marketplace/login/showcase paths.

export function getSafeInternalPath(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback
  }

  return value
}
