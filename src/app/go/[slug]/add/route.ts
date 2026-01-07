import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateTimeAuth } from '@/lib/auth-utils'
import { validateItemData, type ListFieldDefinition } from '@/types/list-fields'

/**
 * AI List Add Endpoint
 * 
 * GET /go/[slug]/add?t={code}&source={source}&field1=val1&field2=val2
 * 
 * Called by AI assistants to add items to a user's list.
 * 
 * Query Parameters:
 * - t (required): Time-based code
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
function successHtml(message: string, details?: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Success</title></head>
<body style="background:#0d1117;color:#3fb950;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;">
    <h1 style="font-size:4rem;margin:0;">OK</h1>
    <h2>${message}</h2>
    ${details ? `<p style="color:#8b949e;">${details}</p>` : ''}
  </div>
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
    <h1 style="font-size:4rem;margin:0;">ERR</h1>
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

  // 1. Extract time code (normalize to lowercase for case-insensitive comparison)
  const timeCode = searchParams.get('t')?.toLowerCase()
  if (!timeCode) {
    return errorHtml('Missing t parameter', 'The t query parameter is required', 401)
  }

  // 2. Extract source (optional, defaults to "ai")
  const source = searchParams.get('source') || 'ai'

  // 3. Look up list by slug (include user for toleranceSeconds)
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

  // 5. Validate time code
  const isValid = validateTimeAuth(
    list.authToken,
    timeCode,
    list.user.toleranceSeconds
  )

  if (!isValid) {
    console.log(`[GO] Invalid time code for list ${slug}`)
    return errorHtml('Invalid or expired code', 'The time code is incorrect or has expired', 401)
  }

  // 6. Parse and validate field data
  const fields = list.fields as unknown as ListFieldDefinition[]
  
  // Build query params object (excluding reserved params)
  // Note: URLSearchParams already decodes %20 and + as spaces
  const queryParams: Record<string, string | undefined> = {}
  searchParams.forEach((value, key) => {
    if (key !== 't' && key !== 'source') {
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
