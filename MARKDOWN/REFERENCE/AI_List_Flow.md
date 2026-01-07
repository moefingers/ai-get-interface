# AI List Flow

End-to-end flow from list creation to item append.

---

## Data Model: Multi-Field Items

Lists support **user-defined fields**, not just single items. Examples:

| List Type | Fields |
|-----------|--------|
| Grocery | `item` (text) |
| Pain Log | `level` (number), `activity` (text), `notes` (text, optional) |
| Workout | `exercise` (text), `sets` (number), `reps` (number), `weight` (number) |

**Storage:** `ListItem.content` is JSON containing field values:
```json
{ "level": 7, "activity": "running", "notes": "sharp pain in knee" }
```

**Why JSON:**
- Single row per item (performance)
- Flexible user-defined schemas
- PostgreSQL JSONB is optimized and indexable
- Clean TypeScript DX with runtime validation at API boundary

**Schema enforcement:** `List` stores field definitions; API validates incoming data against them before insert.

---

## 1. User Creates List (App UI)

```
User clicks "New List" → Modal opens
  ↓
Enters name: "Pain Log"
  ↓
Slug auto-generated: "pain-log" (lowercase kebab-case)
  ↓
Defines fields:
  - level (number, required)
  - activity (text, required)
  - notes (text, optional)
  ↓
Selects AI model: Gemini / ChatGPT / Google Assistant
  ↓
Server action creates list:
  - Generates unique listToken (64-char hex)
  - Stores: { name, slug, listToken, fields, aiModel, userId }
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
When I mention "pain log", do the following:

1. Get the current Unix timestamp in seconds
2. Calculate: floor(timestamp / 30)
3. Compute HMAC-SHA256:
   - Secret: "a1b2c3d4e5f6..."  (listToken)
   - Message: the number from step 2
   - Output: lowercase hex string
4. Make a GET request with field values as query params:
   GET https://app.com/api/list/pain-log/append?auth={hmac}&level={1-10}&activity={text}&notes={optional}
5. Confirm the entry was added

Field definitions:
- level (required): Pain intensity 1-10
- activity (required): What triggered it
- notes (optional): Additional details
```

---

## 3. User Prompts AI

```
User: "Log pain level 7 from running, sharp in my knee"
  ↓
AI recognizes "pain log" trigger, extracts field values
  ↓
AI calculates (internally):
  - timestamp: 1736200000
  - window: floor(1736200000 / 30) = 57873333
  - hmac: HMAC-SHA256("a1b2c3d4e5f6...", "57873333") = "b46b7ae..."
  ↓
AI makes GET request:
  GET https://app.com/api/list/pain-log/append?auth=b46b7ae...&level=7&activity=running&notes=sharp%20in%20my%20knee
```

---

## 4. Server Validates & Appends

```
Request hits /api/list/[slug]/append
  ↓
Extract: slug="pain-log", auth="b46b7ae...", field params
  ↓
Lookup list by slug → get listToken, fields schema, userId
  ↓
Lookup user → get toleranceSeconds (default 30)
  ↓
Validate auth code:
  - current_window = floor(now / 30)
  - Check windows: current, current-1, current+1 (based on tolerance)
  - For each window: compute HMAC-SHA256(listToken, window)
  - If any match auth param → VALID
  ↓
Validate field data against schema:
  - Check required fields present
  - Validate types (number, text)
  - Reject unknown fields or allow extras (configurable)
  ↓
If valid:
  - Insert ListItem { content: { level: 7, activity: "running", notes: "..." }, source: "ai", listId }
  - Return 200: { success: true, data: { level: 7, ... } }
  ↓
If invalid auth:
  - Return 401: { error: "Invalid or expired auth code" }
  ↓
If invalid data:
  - Return 400: { error: "Missing required field: level" }
```

---

## 5. User Sees Item (App UI)

```
User opens app → Selects "Pain Log"
  ↓
App fetches list items (ordered by createdAt desc)
  ↓
Displays (format based on field types):
  12:45 PM - Level 7 | running | sharp in my knee
  12:30 PM - Level 4 | sitting | dull ache
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
