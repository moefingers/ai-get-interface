import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const RELAY_API_KEY = process.env.GOOGLE_APP_SCRIPT_API_KEY

/**
 * POST /api/relay
 * 
 * Accepts requests from the shared Google Apps Script relay.
 * Uses Google user email (from Session.getActiveUser().getEmail()) to identify the user.
 * 
 * Headers:
 *   X-Relay-Key: The shared relay API key
 * 
 * Body:
 *   { email: string, list: string, item: string }
 */
export async function POST(request: NextRequest) {
  // Validate relay API key
  const relayKey = request.headers.get('X-Relay-Key')
  if (!RELAY_API_KEY || relayKey !== RELAY_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { email?: string; list?: string; item?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, list, item } = body

  if (!email || !list || !item) {
    return NextResponse.json(
      { error: 'Missing required fields: email, list, item' },
      { status: 400 }
    )
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user) {
    return NextResponse.json(
      { error: 'User not found for this email' },
      { status: 404 }
    )
  }

  // Find the list by slug and verify ownership
  const listRecord = await prisma.list.findFirst({
    where: {
      slug: list,
      userId: user.id,
    },
  })

  if (!listRecord) {
    return NextResponse.json(
      { error: 'List not found or not owned by this user' },
      { status: 404 }
    )
  }

  // Create the list item
  const listItem = await prisma.listItem.create({
    data: {
      listId: listRecord.id,
      content: { text: item },
      source: 'gemini-relay',
    },
  })

  return NextResponse.json({
    success: true,
    itemId: listItem.id,
    list: listRecord.name,
  })
}
