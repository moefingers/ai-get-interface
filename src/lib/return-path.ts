/**
 * Where to send someone after sign-in, from the `auth_return_to` cookie: a path on
 * this site that starts with /go/ once resolved. Anything else is "/".
 */
export function safeReturnPath(value: string | null | undefined): string {
  if (!value || /[\u0000-\u001f\u007f]/.test(value)) return '/'
  const base = 'http://n'
  if (!URL.canParse(value, base)) return '/'
  const url = new URL(value, base)
  if (url.origin !== base || !url.pathname.startsWith('/go/')) return '/'
  return url.pathname + url.search
}
