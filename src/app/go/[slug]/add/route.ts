import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateTimeAuth } from '@/lib/auth-utils'
import { validateItemData, type ListFieldDefinition } from '@/types/list-fields'
import { stackServerApp } from '@/stack/server'

/**
 * AI List Add Endpoint
 * 
 * Three authentication modes:
 * 1. Static token: GET /go/[slug]/add?token={authToken}&source={source}&field1=val1
 * 2. HMAC time code: GET /go/[slug]/add?t={code}&source={source}&field1=val1 (dormant)
 * 3. Session auth: GET /go/[slug]/add?source={source}&field1=val1 (requires logged-in browser)
 * 
 * Called by AI assistants to add items to a user's list.
 * 
 * Query Parameters:
 * - token (for static auth): Per-list auth token
 * - t (for HMAC auth): Time-based code (dormant)
 * - source (optional): Which AI sent it (gemini, chatgpt, etc)
 * - [field params]: Values for the list fields
 */

// CORS headers for AI tools
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Helper to create HTML response with CORS (for AI readability)
// Auto-closes the tab after a countdown for session auth flow
function successHtml(message: string, details?: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Success</title></head>
<body style="background:#0d1117;color:#3fb950;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;cursor:pointer;">
  <div style="text-align:center;">
    <h1 style="font-size:4rem;margin:0;">✓</h1>
    <h2>${message}</h2>
    ${details ? `<p style="color:#8b949e;">${details}</p>` : ''}
    <p id="countdown" style="color:#8b949e;margin-top:2rem;font-size:0.875rem;">Closing in 3...</p>
    <p id="cancel-hint" style="color:#6e7681;font-size:0.75rem;">Click anywhere to cancel</p>
  </div>
  <script>
    let seconds = 3;
    let cancelled = false;
    const countdownEl = document.getElementById('countdown');
    const cancelHintEl = document.getElementById('cancel-hint');
    
    const timer = setInterval(() => {
      if (cancelled) return;
      seconds--;
      if (seconds <= 0) {
        clearInterval(timer);
        window.close();
      } else {
        countdownEl.textContent = 'Closing in ' + seconds + '...';
      }
    }, 1000);
    
    document.body.addEventListener('click', () => {
      if (!cancelled) {
        cancelled = true;
        clearInterval(timer);
        countdownEl.textContent = 'Auto-close cancelled';
        cancelHintEl.style.display = 'none';
        document.body.style.cursor = 'default';
      }
    });
  </script>
</body>
</html>`,
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

function errorHtml(message: string, details?: string, status: number = 400): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Error</title></head>
<body style="background:#0d1117;color:#f85149;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;">
    <h1 style="font-size:4rem;margin:0;">✗</h1>
    <h2>${message}</h2>
    ${details ? `<p style="color:#8b949e;">${details}</p>` : ''}
  </div>
</body>
</html>`,
    { status, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

interface RouteParams {
  params: Promise<{ slug: string }>
}

// Handle CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { slug } = await params
  const searchParams = request.nextUrl.searchParams

  // 1. Extract auth params
  const staticToken = searchParams.get('token')
  const timeCode = searchParams.get('t')?.toLowerCase()

  // 2. Extract source (optional, defaults to "ai")
  const source = searchParams.get('source') || 'ai'

  // 3. Look up list by slug (include user for session validation)
  const list = await prisma.list.findFirst({
    where: { slug },
    include: { user: true },
  })

  if (!list) {
    return errorHtml('List not found', `No list exists with slug: ${slug}`, 404)
  }

  // 4. Check list is published and active
  if (list.isDraft) {
    return errorHtml('List is not published', 'This list is still a draft', 404)
  }

  if (!list.isActive) {
    return errorHtml('List is not active', 'This list has been deactivated', 404)
  }

  // 5. Validate authentication based on list's authMethod and provided params
  let isAuthorized = false
  
  if (staticToken) {
    // Static token auth: direct comparison (works for 'token' authMethod)
    isAuthorized = staticToken === list.authToken
    if (!isAuthorized) {
      console.log(`[GO] Invalid static token for list ${slug}`)
      return errorHtml('Invalid token', 'The provided token is incorrect', 401)
    }
  } else if (timeCode) {
    // HMAC time code auth: validate against user's seed (dormant feature)
    isAuthorized = validateTimeAuth(
      list.authToken,
      timeCode,
      list.user.toleranceSeconds
    )
    if (!isAuthorized) {
      console.log(`[GO] Invalid time code for list ${slug}`)
      return errorHtml('Invalid or expired code', 'The time code is incorrect or has expired', 401)
    }
  } else if (list.authMethod === 'session') {
    // Session auth: check if user is logged in and owns this list
    const stackUser = await stackServerApp.getUser()
    
    if (!stackUser) {
      // Not logged in - redirect to login with return URL
      const returnUrl = request.nextUrl.toString()
      const loginUrl = new URL('/auth/sign-in', request.nextUrl.origin)
      loginUrl.searchParams.set('after_auth_return_to', returnUrl)
      return NextResponse.redirect(loginUrl)
    }
    
    // Check if logged-in user owns this list
    if (stackUser.id !== list.user.stackAuthId) {
      console.log(`[GO] Session user ${stackUser.id} does not own list ${slug} (owner: ${list.user.stackAuthId})`)
      return errorHtml('Not authorized', 'You do not own this list', 403)
    }
    
    isAuthorized = true
    console.log(`[GO] Session auth successful for list ${slug}`)
  } else {
    // No auth provided and list doesn't use session auth
    return errorHtml('Missing authentication', 'A token parameter is required', 401)
  }

  // 6. Parse and validate field data
  const fields = list.fields as unknown as ListFieldDefinition[]
  
  // Build query params object (excluding reserved params)
  // Note: URLSearchParams already decodes %20 and + as spaces
  const reservedParams = ['t', 'token', 'source']
  const queryParams: Record<string, string | undefined> = {}
  searchParams.forEach((value, key) => {
    if (!reservedParams.includes(key)) {
      queryParams[key] = value
    }
  })

  const validation = validateItemData(queryParams, fields)
  if (!validation.valid) {
    return errorHtml('Validation failed', validation.errors.join(', '), 400)
  }

  // 7. Check for duplicates (same content within same minute)
  const contentJson = JSON.stringify(validation.data)
  const now = new Date()
  const minuteStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0, 0)
  const minuteEnd = new Date(minuteStart.getTime() + 60000)

  const duplicate = await prisma.listItem.findFirst({
    where: {
      listId: list.id,
      createdAt: {
        gte: minuteStart,
        lt: minuteEnd,
      },
    },
  })

  // Check if content matches (Prisma stores JSON, compare stringified)
  if (duplicate) {
    const existingContent = JSON.stringify(duplicate.content)
    if (existingContent === contentJson) {
      console.log(`[GO] Duplicate detected for list ${slug}, skipping`)
      const contentPreview = Object.entries(validation.data)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')
      return successHtml('Item already exists', `Duplicate skipped: ${contentPreview}`)
    }
  }

  // 8. Create the item
  const item = await prisma.listItem.create({
    data: {
      listId: list.id,
      content: validation.data,
      source,
    },
  })

  console.log(`[GO] Item added to list ${slug} from ${source}`)

  const contentPreview = Object.entries(item.content as Record<string, unknown>)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ')
  return successHtml(`Added to ${list.name}`, contentPreview)
}
