# Next.js 16 Upgrade Guide

**Source:** https://nextjs.org/docs/app/guides/upgrading/version-16
**Cached:** January 6, 2026
**Last Verified:** January 6, 2026

---

## 🚨 CRITICAL SECURITY ADVISORY

**MUST USE PATCHED VERSIONS:**
- Next.js 16.0.10+ or 16.1.0-canary.19+
- Vulnerabilities: CVE-2025-55184 (DoS), CVE-2025-55183 (Source Code Exposure), CVE-2025-67779 (DoS fix)

```bash
npm install next@16.0.10  # Minimum safe version
```

---

## 📦 MINIMUM REQUIREMENTS

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 20.9.0 | 22.x |
| TypeScript | 5.1.0 | 5.9.x |
| Browsers | Chrome/Edge 111+, Firefox 111+, Safari 16.4+ |

---

## 🔥 BREAKING CHANGES

### 1. Turbopack is Default

Turbopack is now the default bundler for both `next dev` and `next build`.

**No more flags needed:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

**Opt out with `--webpack` if needed:**
```json
{
  "scripts": {
    "build": "next build --webpack"
  }
}
```

**Turbopack config moved out of experimental:**
```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    // options (no longer under experimental)
  },
}

export default nextConfig
```

### 2. Async Request APIs (FULLY ENFORCED)

Synchronous access removed completely. These APIs are ONLY async now:

- `cookies()`
- `headers()`
- `draftMode()`
- `params` in layouts, pages, routes
- `searchParams` in pages

**Before (Next.js 15 - deprecated):**
```typescript
export default function Page({ params }) {
  const { slug } = params  // ❌ No longer works
}
```

**After (Next.js 16 - required):**
```typescript
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
  const query = await props.searchParams
  return <h1>Blog Post: {slug}</h1>
}
```

**Generate types with:**
```bash
npx next typegen
```

### 3. `next lint` Command Removed

Use ESLint or Biome directly. `next build` no longer runs linting.

```json
{
  "scripts": {
    "lint": "eslint",
    "lint:fix": "eslint --fix"
  }
}
```

**Migrate with codemod:**
```bash
npx @next/codemod@canary next-lint-to-eslint-cli .
```

### 4. `middleware` Renamed to `proxy`

```bash
mv middleware.ts proxy.ts
```

```typescript
// proxy.ts
export function proxy(request: Request) {}

// Config flags renamed:
// skipMiddlewareUrlNormalize → skipProxyUrlNormalize
```

**Note:** `edge` runtime NOT supported in `proxy`. Use `nodejs` runtime only.

### 5. Parallel Routes Require `default.js`

All parallel route slots now require explicit `default.js` files:

```typescript
// app/@modal/default.tsx
import { notFound } from 'next/navigation'

export default function Default() {
  notFound()
}

// OR return null:
export default function Default() {
  return null
}
```

### 6. ESLint Flat Config Default

`@next/eslint-plugin-next` now uses ESLint Flat Config format.

```javascript
// eslint.config.mjs (new format)
import { FlatCompat } from '@eslint/eslintrc'
import nextPlugin from '@next/eslint-plugin-next'
```

### 7. Runtime Configuration Removed

`serverRuntimeConfig` and `publicRuntimeConfig` removed. Use environment variables:

```typescript
// Server-only (in Server Components)
const dbUrl = process.env.DATABASE_URL

// Client-accessible (NEXT_PUBLIC_ prefix)
const apiUrl = process.env.NEXT_PUBLIC_API_URL
```

---

## ✨ NEW FEATURES

### React 19.2 Support
- View Transitions
- `useEffectEvent`
- `Activity` component

### React Compiler (Stable)
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  reactCompiler: true,  // No longer experimental
}
```

```bash
npm install -D babel-plugin-react-compiler
```

### New Caching APIs

**`revalidateTag` with cacheLife profile:**
```typescript
'use server'
import { revalidateTag } from 'next/cache'

export async function updateArticle(articleId: string) {
  revalidateTag(`article-${articleId}`, 'max')
}
```

**`updateTag` for read-your-writes:**
```typescript
'use server'
import { updateTag } from 'next/cache'

export async function updateUserProfile(userId: string, profile: Profile) {
  await db.users.update(userId, profile)
  updateTag(`user-${userId}`)  // Immediate refresh
}
```

**`refresh` from Server Actions:**
```typescript
'use server'
import { refresh } from 'next/cache'

export async function markNotificationAsRead(notificationId: string) {
  await db.notifications.markAsRead(notificationId)
  refresh()  // Refresh client router
}
```

**`cacheLife` and `cacheTag` stable:**
```typescript
import { cacheLife, cacheTag } from 'next/cache'
// No more unstable_ prefix
```

### Cache Components (replaces PPR)
```typescript
// next.config.js
module.exports = {
  cacheComponents: true,
}
```

### Turbopack File System Caching (Beta)
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
}
```

---

## 🖼️ next/image Changes

### Breaking Changes

**Local images with query strings require config:**
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      { pathname: '/assets/**', search: '?v=1' },
    ],
  },
}
```

**`minimumCacheTTL` default changed:** 60s → 4 hours (14400s)

**`imageSizes` default:** Removed `16` from array

**`qualities` default:** Only `[75]` allowed by default

**Local IP blocked by default:**
```typescript
images: {
  dangerouslyAllowLocalIP: true,  // Only for private networks
}
```

**Maximum redirects:** Unlimited → 3 max

### Deprecations
- `next/legacy/image` → Use `next/image`
- `images.domains` → Use `images.remotePatterns`

---

## 🔧 QUICK MIGRATION

1. **Install patched version:**
   ```bash
   npm install next@16.0.10 react@latest react-dom@latest
   ```

2. **Run codemod:**
   ```bash
   npx @next/codemod@canary upgrade latest
   ```

3. **Update async APIs:**
   ```bash
   npx @next/codemod@canary migrate-to-async-dynamic-apis .
   ```

4. **Generate types:**
   ```bash
   npx next typegen
   ```

5. **Migrate lint:**
   ```bash
   npx @next/codemod@canary next-lint-to-eslint-cli .
   ```

---

*This documentation applies to Next.js 16.0.10+ with security patches*
