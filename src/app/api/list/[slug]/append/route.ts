import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateTimeAuth } from '@/lib/auth-utils'
import { validateItemData, type ListFieldDefinition } from '@/types/list-fields'

/**
 * AI-Triggered List Append API
 * 
 * GET /api/list/[slug]/append?auth={hmac}&source={source}&field1=val1&field2=val2
 * 
 * This endpoint is called by AI assistants (Gemini, ChatGPT, Google Assistant)
 * to append items to a user's list. Uses HMAC-SHA256 time-based authentication.
 * 
 * Query Parameters:
 * - auth (required): HMAC-SHA256 auth code calculated by AI
 * - source (optional): AI provider name (gemini, chatgpt, google-assistant)
 * - [field params]: Values matching the list's field schema
 * 
 * AI Compatibility Notes:
 * - Auth codes are case-insensitive (normalized to lowercase)
 * - Plus signs (+) in query params are decoded as spaces
 * - CORS headers allow cross-origin requests from AI tools
 * - Simple text responses available for tools that struggle with JSON
 */

// CORS headers for AI tools that use browser-based fetch
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Helper to create JSON response with CORS
function jsonResponse(data: object, status: number = 200): NextResponse {
  return NextResponse.json(data, { status, headers: corsHeaders })
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

  // 1. Extract auth code (normalize to lowercase for case-insensitive comparison)
  const authCode = searchParams.get('auth')?.toLowerCase()
  if (!authCode) {
    return jsonResponse(
      { success: false, error: 'Missing auth parameter' },
      401
    )
  }

  // 2. Extract source (optional, defaults to "ai")
  const source = searchParams.get('source') || 'ai'

  // 3. Look up list by slug (include user for toleranceSeconds)
  const list = await prisma.list.findFirst({
    where: { slug },
    include: { user: true },
  })

  if (!list) {
    return jsonResponse(
      { success: false, error: 'List not found' },
      404
    )
  }

  // 4. Check list is published and active
  if (list.isDraft) {
    return jsonResponse(
      { success: false, error: 'List is not published' },
      404
    )
  }

  if (!list.isActive) {
    return jsonResponse(
      { success: false, error: 'List is not active' },
      404
    )
  }

  // 5. Validate HMAC auth code
  const isValid = validateTimeAuth(
    list.authToken,
    authCode,
    list.user.toleranceSeconds
  )

  if (!isValid) {
    console.log(`[API] Auth failed for list ${slug}`)
    return jsonResponse(
      { success: false, error: 'Invalid or expired auth code' },
      401
    )
  }

  // 6. Parse and validate field data
  const fields = list.fields as unknown as ListFieldDefinition[]
  
  // Build query params object (excluding reserved params)
  // Note: URLSearchParams already decodes %20 and + as spaces
  const queryParams: Record<string, string | undefined> = {}
  searchParams.forEach((value, key) => {
    if (key !== 'auth' && key !== 'source') {
      queryParams[key] = value
    }
  })

  const validation = validateItemData(queryParams, fields)
  if (!validation.valid) {
    return jsonResponse(
      { success: false, error: 'Validation failed', details: validation.errors },
      400
    )
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
      console.log(`[API] Duplicate detected for list ${slug}, skipping`)
      return jsonResponse({
        success: true,
        duplicate: true,
        message: 'Item already exists (duplicate within same minute)',
        item: {
          id: duplicate.id,
          content: duplicate.content as Record<string, string | number>,
          source: duplicate.source,
          createdAt: duplicate.createdAt.toISOString(),
        },
      })
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

  console.log(`[API] Item added to list ${slug} from ${source}`)

  return jsonResponse({
    success: true,
    item: {
      id: item.id,
      content: item.content as Record<string, string | number>,
      source: item.source,
      createdAt: item.createdAt.toISOString(),
    },
  })
}
