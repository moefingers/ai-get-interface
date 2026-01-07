# AI List Flow

End-to-end flow from list creation to item append.

---

## 1. User Creates List (App UI)

```
User clicks "New List" → Modal opens
  ↓
Enters name: "Grocery List"
  ↓
Slug auto-generated: "grocery-list" (lowercase kebab-case)
  ↓
Selects AI model: Gemini / ChatGPT / Google Assistant
  ↓
Server action creates list:
  - Generates unique listToken (64-char hex)
  - Stores: { name, slug, listToken, aiModel, userId }
  ↓
Success screen shows AI instructions preview
  ↓
User clicks "Copy" → Instructions copied to clipboard
```

---

## 2. User Pastes Instructions into AI

**Destination by model:**
- Gemini: `gemini.google.com/saved-info`
- ChatGPT: `chatgpt.com/#settings/Personalization` (Memory or Custom Instructions)
- Google Assistant: Routines

**Instruction content (example for ChatGPT):**

```
When I mention "grocery list", do the following:

1. Get the current Unix timestamp in seconds
2. Calculate: floor(timestamp / 30)
3. Compute HMAC-SHA256:
   - Secret: "a1b2c3d4e5f6..."  (listToken)
   - Message: the number from step 2
   - Output: lowercase hex string
4. Make a GET request:
   GET https://app.com/api/list/grocery-list/append?auth={hmac}&item={item}
5. Confirm the item was added
```

---

## 3. User Prompts AI

```
User: "Add eggs to my grocery list"
  ↓
AI recognizes "grocery list" trigger
  ↓
AI calculates (internally):
  - timestamp: 1736200000
  - window: floor(1736200000 / 30) = 57873333
  - hmac: HMAC-SHA256("a1b2c3d4e5f6...", "57873333") = "b46b7ae..."
  ↓
AI makes GET request:
  GET https://app.com/api/list/grocery-list/append?auth=b46b7ae...&item=eggs
```

---

## 4. Server Validates & Appends

```
Request hits /api/list/[slug]/append
  ↓
Extract: slug="grocery-list", auth="b46b7ae...", item="eggs"
  ↓
Lookup list by slug → get listToken, userId
  ↓
Lookup user → get toleranceSeconds (default 30)
  ↓
Validate auth code:
  - current_window = floor(now / 30)
  - Check windows: current, current-1, current+1 (based on tolerance)
  - For each window: compute HMAC-SHA256(listToken, window)
  - If any match auth param → VALID
  ↓
If valid:
  - Insert ListItem { content: { item: "eggs" }, source: "ai", listId }
  - Return 200: { success: true, item: "eggs" }
  ↓
If invalid:
  - Return 401: { error: "Invalid or expired auth code" }
```

---

## 5. User Sees Item (App UI)

```
User opens app → Selects "Grocery List"
  ↓
App fetches list items (ordered by createdAt desc)
  ↓
Displays:
  12:45 PM - eggs
  12:30 PM - milk
  ...
```

---

## Security Properties

| Property | How |
|----------|-----|
| No reusable tokens in URLs | Auth code expires in ≤30-60 seconds |
| Per-list revocation | Regenerate listToken, update AI instructions |
| User-configurable tolerance | `toleranceSeconds` on User model |
| Replay protection | Same code only valid within time window |

---

## Future: Read Access

Same auth pattern:
```
GET /api/list/[slug]/read?auth={hmac}
→ Returns recent items for AI to read back to user
```
