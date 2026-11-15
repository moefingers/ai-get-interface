import { randomBytes, createHmac } from 'crypto'

/**
 * Auth Utilities for Time-Based HMAC Authentication
 * 
 * Flow:
 * 1. User creates list → generateListToken() creates unique 64-char hex token
 * 2. AI computes auth code → HMAC-SHA256(token, floor(timestamp/30))
 * 3. Server validates → validateTimeAuth() checks code against tolerance window
 * 
 * See: MARKDOWN/REFERENCE/AI_List_Flow.md
 */

/** Window size in seconds for time-based auth */
const TIME_WINDOW_SECONDS = 30

/**
 * Generates a cryptographically secure list token (64-char hex string)
 */
export function generateListToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Generates a time-based auth code using HMAC-SHA256
 * This is what the AI calculates on each request
 * 
 * @param token - The list's secret token
 * @param timestamp - Unix timestamp in seconds (defaults to now)
 * @returns Lowercase hex HMAC-SHA256 hash
 */
export function generateTimeAuth(token: string, timestamp?: number): string {
  const ts = timestamp ?? Math.floor(Date.now() / 1000)
  const window = Math.floor(ts / TIME_WINDOW_SECONDS)
  
  return createHmac('sha256', token)
    .update(window.toString())
    .digest('hex')
}

/**
 * Validates a time-based auth code against the expected value
 * Checks current window plus adjacent windows based on tolerance
 * 
 * @param token - The list's secret token
 * @param code - The auth code to validate (from request)
 * @param toleranceSeconds - How many seconds of drift to allow (default 30)
 * @returns true if code matches any valid window
 */
export function validateTimeAuth(
  token: string,
  code: string,
  toleranceSeconds: number = 30
): boolean {
  const now = Math.floor(Date.now() / 1000)
  const currentWindow = Math.floor(now / TIME_WINDOW_SECONDS)
  
  // Calculate how many windows to check based on tolerance
  // e.g., tolerance=30 with window=30 means check current ± 1
  const windowsToCheck = Math.ceil(toleranceSeconds / TIME_WINDOW_SECONDS)
  
  for (let offset = -windowsToCheck; offset <= windowsToCheck; offset++) {
    const window = currentWindow + offset
    const expected = createHmac('sha256', token)
      .update(window.toString())
      .digest('hex')
    
    if (expected === code) {
      return true
    }
  }
  
  return false
}

/** Which check a GET /go/[slug]/add request has to pass */
export type AddAuthCheck =
  | { kind: 'session' }
  | { kind: 'token'; token: string }
  | { kind: 'time-code'; timeCode: string }
  | { kind: 'missing' }

/**
 * Picks the check from the list's authMethod first, then the request's params:
 * a 'session' list uses its signed-in owner's session; every other list ('token',
 * and older lists with no method or 'google') uses a token, then a time code.
 */
export function pickAddAuthCheck(
  authMethod: string | null,
  params: { token: string | null; timeCode: string | undefined }
): AddAuthCheck {
  if (authMethod === 'session') return { kind: 'session' }
  if (params.token) return { kind: 'token', token: params.token }
  if (params.timeCode) return { kind: 'time-code', timeCode: params.timeCode }
  return { kind: 'missing' }
}

/**
 * Generates a URL-friendly slug from a string
 * 
 * @param name - The input string (e.g., list name)
 * @returns Lowercase kebab-case slug
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Spaces to hyphens
    .replace(/-+/g, '-')       // Collapse multiple hyphens
    .replace(/^-|-$/g, '')     // Trim leading/trailing hyphens
}
