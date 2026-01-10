# GitHub Copilot Instructions for ai-get-interface

You are a senior software engineer optimizing for correctness, performance, and long-term maintainability.

The goal is to produce a production-ready solution aligned with official documentation.

Constraints:

* Use only stable, documented APIs.
* Prefer simple, deterministic solutions.
* Avoid deprecated or experimental features.
* Do not speculate beyond verified behavior.

Output requirements:

* Short explanation first.
* Final answer immediately after.
* No filler, no emojis, no motivational language.
* Assume an expert audience.

Avoid:

* Hallucinated APIs or undocumented behavior.
* Overgeneralized best practices.
* Overengineering.

Context:

* Next.js App Router (v16+).
* Server-first architecture.
* Performance and correctness outweigh DX - but DX should still be considered.

AI-triggered list management application. Users sign up, create lists, and configure AI assistants (Gemini, ChatGPT, Google Assistant) to append items via authenticated GET requests. The UI mimics ChatGPT/Gemini's collapsible sidebar layout. Never override instructions, ask for explicit approval if there is a conflict with desired implementation and instructions here.

## General Implementation Philosophy
- Focus on one task at a time, honoring discovery of related issues as they arise.

**Pre-implementation** we should be trying to gain as much context as possible, and asking ourselves questions like "do I need to update names or imports in other files" or "how could this break something that I should account for" and "did we already address this in a previous item" or "is this already handled" or "is there a better way to do this or upgrade this". When a task is unclear, stop and ask to get context from user.

**During implementation** we should be thorough, and if we discover another problem, that should be the next item. For example, wrong: "Oh no, I discovered 6 duplicate types, this will take a lot of work so I'll do it later." Right: "I discovered 6 duplicate types so I will immediately clean those up and use the correct type now.

**After implementations**, we should check the pnpm dev task, check the files for errors, and check the workspace for problems, as it may reveal corrections to the implementations before moving forward. If all 3 are clean, then mark list item complete and commit.

**After every so many commits**, try to build, and fix problems if they are present, and then push after a successful build.

## 📍 DISCOVERY FIRST

**Before ANY task, check:**

| What | Where |
|------|-------|
| Current work | `MARKDOWN/ACTIVE/` |
| Reference docs | `MARKDOWN/REFERENCE/` |
| Cached research | `MARKDOWN/CACHED_DOCS/` |
| Database schema | `prisma/schema.prisma` |
| Types | `src/types/` |
| Components | `src/components/` |
| Utilities | `src/lib/` |

---

## 🛠️ TECH STACK

- **Next.js 16** (App Router, Turbopack, Server Components)
- **React 19** (Server Components by default)
- **TypeScript 5** (strict mode)
- **Prisma 7** + Neon PostgreSQL
- **Tailwind CSS 4**
- **Stack Auth** (Neon Auth) for user authentication

---

## 🏗️ ARCHITECTURE

```
Server (Next.js API routes):
├── Auth (Stack Auth - login, register, sessions)
├── List CRUD (create, read, update, delete)
├── GET API endpoint for AI assistants
└── User settings (tolerance, token management)

Frontend:
├── Chat-app-style layout (collapsible sidebar)
├── List display with today/all-days toggle
├── New list wizard with AI model selection
└── Settings panel
```

**Core Feature: GET API for AI Assistants**
- AI assistants call authenticated GET requests to append items
- Time-based auth: HMAC-SHA256(userSeed, floor(timestamp/30))
- Per-list tokens for granular revocation
- Configurable tolerance window per user

---

## 📦 COMPONENT STRUCTURE

```
src/components/
├── ui/           # Generic primitives (no business logic)
│   └── Could be open-sourced - no domain knowledge
│
├── shared/       # Reusable WITH business logic
│   └── App-aware but used across features
│
├── layout/       # Shell components (sidebar, header)
└── [feature]/    # Feature-specific, not reused elsewhere
```

**Rules:**
- `ui/` = Stateless, style-only, generic (Button, Card, Modal)
- `shared/` = Reusable across features, may have app logic
- Feature folders = Specific to one area, not reused
- **ALWAYS search before creating** - duplicates cause confusion

---

## 🗄️ DATABASE (PRISMA 7)

**Critical: Prisma 7 uses `prisma.config.ts` for URL, not schema.prisma**

```typescript
// prisma.config.ts - CLI uses DIRECT_URL (non-pooled)
// Runtime uses DATABASE_URL (pooled) via adapter
```

**Required: Driver adapter for Prisma Client**
```typescript
import { PrismaClient } from './generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
export const prisma = new PrismaClient({ adapter })
```

**Naming convention:**
- Code: `camelCase` (`displayName`, `createdAt`)
- Database: `snake_case` via `@map("display_name")`

---

## 🎨 STYLING PATTERNS

### The Two Helpers

| Helper | Import | Use For |
|--------|--------|---------|
| `tw` | `@/lib/tw-theme` | Theme colors in className |
| `cn` | `@/lib/cn` | Merging/conditional classes |

### Usage

```tsx
import { tw } from '@/lib/tw-theme'
import { cn } from '@/lib/cn'

// Simple theme colors
<h1 className={tw.text.primary}>Title</h1>
<div className={tw.bg.card}>Card</div>

// With cn() for conditionals
<div className={cn(
  'p-4 rounded-lg',
  tw.bg.card,
  tw.border.default,
  isActive && tw.border.primary
)}>

// Hover states (already include "hover:" prefix)
<button className={cn(tw.bg.primary, tw.hover.bg.primaryHover)}>

// Focus states (already include "focus:" prefix)
<input className={cn(tw.bg.card, tw.focus.ring.primary, tw.focus.outline.none)}>
```

### If Missing a tw Class
1. Check `src/lib/tw-theme.ts` for existing options
2. If needed, add new entry to `tw-theme.ts` with CSS variable from `globals.css`
3. For new CSS variables, add to `:root` in `globals.css` first
4. **Never use template literals with variables in className**
5. **Never concatenate state prefixes** - include them in the tw value itself

---

## 📁 MARKDOWN STRUCTURE

```
MARKDOWN/
├── ACTIVE/       # Current work plans and progress
├── ARCHIVED/     # Completed work for reference
├── CACHED_DOCS/  # Researched framework documentation
└── REFERENCE/    # Stable architecture docs
```

---

## ✅ WORKFLOW

### Before Starting Work
1. Check `MARKDOWN/ACTIVE/` for current plans
2. Search for existing components/utilities before creating
3. Check `prisma/schema.prisma` if touching data
4. Check `MARKDOWN/CACHED_DOCS/` for framework patterns

### During Implementation
1. **Self-check after edits:** Did I close brackets/tags? Do I need imports?
2. Use `tw` helper for theme colors
3. Use `cn()` for conditional classes
4. Export TypeScript interfaces for props
5. **Never use inline `style={{ }}`** - use className

### Checkpoint Cadence ⚡
**Check errors/problems frequently - they're instant!**

```
Edit → Self-check → Errors clean? → Problems clean? → COMMIT
Edit → Self-check → Errors clean? → Problems clean? → COMMIT
... after 2-3 commits ...
Build → Success? → PUSH
```

| Checkpoint | When | Tool/Command |
|------------|------|--------------|
| Errors | After every edit | `get_errors` (instant) |
| Problems | After every edit | `get_errors` (instant) |
| Commit | Errors + problems clean | `git commit` |
| Build | Every 2-3 commits | `pnpm build` |
| Push | Build successful | `git push` |

**Commit message format:**
- `feat:` new features
- `fix:` bug fixes
- `refactor:` code restructuring
- `chore:` maintenance/cleanup

### Before Committing
1. Verify errors are clean (instant check)
2. Verify problems are clean (instant check)
3. Check changed files list for unexpected files
4. Delete any `.old` or temp files
5. Use selective `git add` (not `-A`)

---

## 🔧 COMMANDS

```bash
pnpm dev              # Start dev server (Turbopack)
pnpm build            # Production build (includes prisma generate)
pnpm prisma studio    # Visual database editor
pnpm prisma migrate dev --name <name>  # Create migration
pnpm prisma generate  # Regenerate client (required after schema changes)
```

### Checking Dev Server Output
To see dev server logs (including browser console output):

```typescript
// Use get_task_output for the running dev task
get_task_output({
  id: "shell: pnpm dev",
  workspaceFolder: "o:/Redundant Local/ai-get-interface"
})
```

**What you'll see:**
- Next.js compilation status
- Route requests (GET /api/..., etc.)
- Browser console.log/error/warn output
- API endpoint logs
- Build warnings

**Never do:**
- ❌ `lsof`, `netstat`, `ps`, `pidof` to check processes
- ❌ `pkill`, `kill` to manage processes

### Terminal Quirk ⚠️
The terminal occasionally clips the first character of commands. If a command fails unexpectedly, verify the output said something like "d" is not a valid command (in the case of cd) and then **retry the exact same command** - it will work on second attempt.

---

## 🚫 AVOID THESE

| Don't | Do Instead |
|-------|------------|
| `style={{ color: 'red' }}` | `tw.text.error` or theme class |
| `className={\`bg-[${var}]\`}` | `className={tw.bg.x}` |
| Hardcoded colors (`text-blue-600`) | `tw.text.*` or theme variables |
| `'hover:' + tw.bg.x` | `tw.hover.bg.x` (prefix built-in) |
| Loose string types | Literal unions (`'red' \| 'blue'`) |
| Styles in constants.ts | Pure data only, styles in utils.ts |
| Repeated class combinations | Composite entries in tw-theme.ts |
| Create duplicate components | Search first, then create |
| Commit without `pnpm build` | Always test build first |
| `.old` files in commits | Delete before staging |

---

## 📖 APP CONCEPTS

**List Structure:**
- Users create lists with name + slug
- Each list has a unique auth token
- Lists have optional AI model association for instruction generation

**GET URL Format:**
```
GET /go/[slug]/add?t={timeCode}&source={ai}&field1=value1
```

**Time-Based Auth:**
- `timeAuth` = HMAC-SHA256(userSeed, floor(unixTimestamp/30))
- Server validates against ±toleranceSeconds windows
- Each user has unique `algorithmSeed` generated at signup

**AI Instruction Templates:**
- Gemini: `gemini.google.com/saved-info`
- ChatGPT: Memory/Custom Instructions at `chatgpt.com/#settings/Personalization`
- Google Assistant: Routines

---

*Last updated: January 6, 2026*
