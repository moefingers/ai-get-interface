import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple test endpoint for debugging
 * 
 * GET /api/test?good=true  → green success HTML
 * GET /api/test?good=false → red error HTML
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const good = request.nextUrl.searchParams.get('good')

  if (good === 'true') {
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head><title>Success</title></head>
<body style="background:#0d1117;color:#3fb950;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;">
    <h1 style="font-size:4rem;margin:0;">✓</h1>
    <h2>Everything went right!</h2>
    <p style="color:#8b949e;">good=true</p>
  </div>
</body>
</html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  }

  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body style="background:#0d1117;color:#f85149;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;">
    <h1 style="font-size:4rem;margin:0;">✗</h1>
    <h2>Everything went wrong!</h2>
    <p style="color:#8b949e;">good=${good ?? 'undefined'}</p>
  </div>
</body>
</html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  )
}
