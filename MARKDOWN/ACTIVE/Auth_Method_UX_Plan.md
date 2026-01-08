# Authentication Method UX Plan

## Overview

During list creation, users choose their preferred authentication/execution method. This determines:
1. How the AI instruction is generated
2. How the `/go/[slug]/add` endpoint validates requests

## Methods

### 1. Static Token (Recommended)
```
GET /go/{slug}/add?token={authToken}&item=milk
```
- **Security:** Secret URL (anyone with token can add items)
- **Execution:** AI fetches URL directly → item added automatically ✅
- **Setup:** Copy URL template into AI saved instructions
- **Works with:** Gemini, ChatGPT (if they support URL fetching), voice assistants, IFTTT, Shortcuts

### 2. Google Apps Script Relay (Stronger)
```
GET {appsScriptUrl}?list={slug}&item=milk
```
- **Security:** Google identity verification via email
- **Execution:** AI fetches URL → Apps Script gets Google identity → POSTs to /api/relay
- **Setup:** One-time Google authorization, then copy URL into AI instructions
- **Works with:** Gemini (since it's Google's ecosystem), requires user's Google session

**Key insight:** AIs CAN fetch URLs programmatically. They CANNOT:
- Open a browser window
- Complete OAuth flows requiring interaction
- Click buttons or fill forms
- Handle redirects requiring user action

This means the static token method can be **fully automatic** if the AI supports HTTP fetches!

## Schema Changes

```prisma
model List {
  // ... existing fields ...
  
  /// Authentication method for AI access
  /// 'token' = static token in URL
  /// 'google' = Google Apps Script relay
  authMethod String @default("token") @map("auth_method")
}
```

## UI Flow

### Step 1: Name (existing)
### Step 2: Fields (existing)  
### Step 3: Security Method (NEW)

```
How should AI assistants authenticate?

○ Simple Token (Recommended)
  Anyone with your URL can add items. Best for personal use 
  or when sharing with trusted AIs.
  
○ Google Account Required  
  Only you (or people logged into your Google account) can 
  add items. Requires clicking the link.
```

### Step 4: AI Model (existing)
### Step 5: Success - show generated instructions

## Endpoint Changes

### /go/[slug]/add
Add support for `token` param alongside existing `t` (time code):

```typescript
// Option 1: Static token auth
const token = searchParams.get('token')
if (token && token === list.authToken) {
  // Authorized via static token
}

// Option 2: Time-based auth (legacy/HMAC)
const timeCode = searchParams.get('t')
if (timeCode && validateTimeAuth(...)) {
  // Authorized via time code
}
```

### /api/relay (existing)
Already handles Google identity auth. No changes needed.

## Instruction Generation

Based on `list.authMethod`:

**Token method:**
```
When I ask to add something to {listName}, make a GET request:
{baseUrl}/go/{slug}/add?token={authToken}&item={item}
```

**Google method:**
```
When I ask to add something to {listName}, give me this link to click:
{appsScriptUrl}?list={slug}&item={item}
```

## Migration

1. Add `authMethod` column with default 'token'
2. Update NewListModal with security step
3. Update /go/[slug]/add to accept static token
4. Update ai-instructions.ts to generate method-specific instructions

## Future Considerations

- Per-AI-model method (e.g., Google method for Gemini, token for ChatGPT)
- Hybrid: show both options in instructions
- Token rotation UI
- Usage analytics per method
