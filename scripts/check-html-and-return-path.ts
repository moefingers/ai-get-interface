// Checks the HTML escaper, the /go/[slug]/add result page, the sign-in return path
// and the add endpoint's auth order. Run with `pnpm test` (Node runs this file's
// TypeScript directly; `tsc --noEmit` typechecks it with the rest of the project).
import assert from 'node:assert/strict'
import { escapeHtml, HTML_PAGE_HEADERS, resultPageHtml, type ResultKind } from '../src/lib/html.ts'
import { safeReturnPath } from '../src/lib/return-path.ts'
import { pickAddAuthCheck } from '../src/lib/auth-utils.ts'

let failures = 0

function check(name: string, fn: () => void): void {
  try {
    fn()
    console.log(`ok   ${name}`)
  } catch (err) {
    failures++
    console.log(`FAIL ${name}`)
    console.log(err instanceof Error ? err.message : err)
  }
}

// --- escapeHtml ---

check('escapeHtml escapes & < > " \'', () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;')
})

check('escapeHtml escapes & first, so an entity stays literal text', () => {
  assert.equal(escapeHtml('&lt;'), '&amp;lt;')
})

check('escapeHtml leaves plain text and numbers as they are', () => {
  assert.equal(escapeHtml('Bench press: 3 sets'), 'Bench press: 3 sets')
  assert.equal(escapeHtml(185), '185')
})

// --- resultPageHtml: every value each caller passes ---

const kinds: ResultKind[] = ['success', 'warning', 'error']

for (const kind of kinds) {
  check(`${kind} page escapes the message, details, list name and slug`, () => {
    const html = resultPageHtml(
      kind,
      'Added to <b>Groceries</b>',
      `Item: "milk" & 'eggs' <br>`,
      `it's<i>`,
      '<i>Mine</i>'
    )
    assert.ok(html.includes('<h2>Added to &lt;b&gt;Groceries&lt;/b&gt;</h2>'), 'message')
    assert.ok(html.includes('>Item: &quot;milk&quot; &amp; &#39;eggs&#39; &lt;br&gt;</p>'), 'details')
    assert.ok(html.includes('href="/lists/it&#39;s%3Ci%3E"'), 'slug in the link')
    assert.ok(html.includes('>Go to &lt;i&gt;Mine&lt;/i&gt;</a>'), 'list name')
    for (const raw of ['<b>', '<i>', '<br>', `'eggs'`, '"milk"']) {
      assert.ok(!html.includes(raw), `no raw ${raw}`)
    }
  })
}

check('"List not found" page escapes the slug from the URL', () => {
  const slug = '<b>x</b>"'
  const html = resultPageHtml('error', 'List not found', `No list exists with slug: ${slug}`)
  assert.ok(html.includes('No list exists with slug: &lt;b&gt;x&lt;/b&gt;&quot;</p>'))
  assert.ok(!html.includes('<b>'))
  assert.ok(!html.includes('<a '), 'no list link without a list')
})

check('validation errors are escaped', () => {
  const html = resultPageHtml('error', 'Validation failed', ['"<b>" is not a number', 'Note is required'].join(', '), 'log', 'Log')
  assert.ok(html.includes('&quot;&lt;b&gt;&quot; is not a number, Note is required'))
})

check('a page for ordinary values is unchanged', () => {
  const expected = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Success</title></head>
<body style="background:#0d1117;color:#3fb950;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100dvh;margin:0;">
  <div style="text-align:center;">
    <h1 style="font-size:4rem;margin:0;">✓</h1>
    <h2>Added to Groceries</h2>
    <p style="color:#8b949e;">Item: milk</p>
    <p style="color:#6e7681;margin-top:2rem;font-size:0.875rem;">You may close this tab. <a href="/lists/groceries" style="color:#3fb950;text-decoration:underline;">Go to Groceries</a></p>
  </div>
</body>
</html>`
  assert.equal(resultPageHtml('success', 'Added to Groceries', 'Item: milk', 'groceries', 'Groceries'), expected)
})

check('the error page has no "You may close this tab" line', () => {
  assert.ok(!resultPageHtml('error', 'Invalid token', undefined, 'groceries', 'Groceries').includes('You may close this tab'))
})

// --- safeReturnPath ---

check('safeReturnPath keeps a /go/ path', () => {
  assert.equal(safeReturnPath('/go/groceries/add?item=milk&source=gemini'), '/go/groceries/add?item=milk&source=gemini')
  assert.equal(safeReturnPath('/go/a/add'), '/go/a/add')
})

check('safeReturnPath turns anything else into "/"', () => {
  for (const value of [
    '//other.example',
    '/\\other.example',
    'https://x',
    'mailto:a@b.c',
    '/\t/other.example',
    '/\n/other.example',
    '/go/a\tb/add',
    '/go/..',
    '/go/%2e%2e/lists/a',
    '/go/../lists/a',
    'https://',
    'lists/a',
    '/lists/a',
    '/?x',
    '/#x',
    '/',
    '',
    null,
    undefined,
  ]) {
    assert.equal(safeReturnPath(value), '/', JSON.stringify(value))
  }
})

// --- HTML_PAGE_HEADERS ---

check('HTML pages send the content policy and nosniff headers', () => {
  assert.equal(HTML_PAGE_HEADERS['Content-Type'], 'text/html; charset=utf-8')
  assert.equal(
    HTML_PAGE_HEADERS['Content-Security-Policy'],
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"
  )
  assert.equal(HTML_PAGE_HEADERS['X-Content-Type-Options'], 'nosniff')
})

// --- pickAddAuthCheck ---

check('a session list uses the session check, whatever the URL holds', () => {
  assert.deepEqual(pickAddAuthCheck('session', { token: 'abc', timeCode: undefined }), { kind: 'session' })
  assert.deepEqual(pickAddAuthCheck('session', { token: null, timeCode: '123' }), { kind: 'session' })
  assert.deepEqual(pickAddAuthCheck('session', { token: null, timeCode: undefined }), { kind: 'session' })
})

check('a token list takes a token, then a time code', () => {
  assert.deepEqual(pickAddAuthCheck('token', { token: 'abc', timeCode: undefined }), { kind: 'token', token: 'abc' })
  assert.deepEqual(pickAddAuthCheck('token', { token: 'abc', timeCode: '123' }), { kind: 'token', token: 'abc' })
  assert.deepEqual(pickAddAuthCheck('token', { token: null, timeCode: '123' }), { kind: 'time-code', timeCode: '123' })
  assert.deepEqual(pickAddAuthCheck('token', { token: null, timeCode: undefined }), { kind: 'missing' })
})

check('older lists (no method, or google) take a token, then a time code', () => {
  for (const method of [null, 'google']) {
    assert.deepEqual(pickAddAuthCheck(method, { token: 'abc', timeCode: undefined }), { kind: 'token', token: 'abc' })
    assert.deepEqual(pickAddAuthCheck(method, { token: null, timeCode: '123' }), { kind: 'time-code', timeCode: '123' })
    assert.deepEqual(pickAddAuthCheck(method, { token: null, timeCode: undefined }), { kind: 'missing' })
  }
})

if (failures > 0) {
  console.log(`${failures} check(s) failed`)
  process.exitCode = 1
} else {
  console.log('all checks passed')
}
