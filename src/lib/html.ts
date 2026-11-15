/**
 * Escapes a value for HTML text or a quoted attribute value.
 */
export function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Headers for the small HTML pages route handlers answer with. The pages load
 * nothing; their only styles are inline style attributes.
 */
export const HTML_PAGE_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",
  'X-Content-Type-Options': 'nosniff',
}

export type ResultKind = 'success' | 'warning' | 'error'

const RESULT_STYLES: Record<ResultKind, { title: string; color: string; icon: string; closeNote: boolean }> = {
  success: { title: 'Success', color: '#3fb950', icon: '✓', closeNote: true },
  warning: { title: 'Warning', color: '#d29922', icon: '⚠', closeNote: true },
  error: { title: 'Error', color: '#f85149', icon: '✗', closeNote: false },
}

/**
 * The page GET /go/[slug]/add answers with. Every value is escaped here, and the
 * slug is also encoded as a path segment for the list link.
 */
export function resultPageHtml(
  kind: ResultKind,
  message: string,
  details?: string,
  listSlug?: string,
  listName?: string
): string {
  const { title, color, icon, closeNote } = RESULT_STYLES[kind]
  const listLink = listSlug
    ? `<a href="/lists/${escapeHtml(encodeURIComponent(listSlug))}" style="color:${color};text-decoration:underline;">Go to ${escapeHtml(listName || 'list')}</a>`
    : ''
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="background:#0d1117;color:${color};font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100dvh;margin:0;">
  <div style="text-align:center;">
    <h1 style="font-size:4rem;margin:0;">${icon}</h1>
    <h2>${escapeHtml(message)}</h2>
    ${details ? `<p style="color:#8b949e;">${escapeHtml(details)}</p>` : ''}
    <p style="color:#6e7681;margin-top:2rem;font-size:0.875rem;">${closeNote ? 'You may close this tab. ' : ''}${listLink}</p>
  </div>
</body>
</html>`
}
