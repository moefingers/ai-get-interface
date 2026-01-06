# Stack Auth (Neon Auth) Setup Guide

**Source:** https://stack-auth.com/docs
**Cached:** January 6, 2026
**Last Verified:** January 6, 2026

---

## 📦 OVERVIEW

Stack Auth is the authentication layer provided by Neon. It integrates with Neon PostgreSQL for user management.

### Environment Variables (from Neon)

```bash
# Already in .env
NEXT_PUBLIC_STACK_PROJECT_ID=...
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=...
STACK_SECRET_SERVER_KEY=...
```

---

## 🔧 INSTALLATION

```bash
pnpm add @stackframe/stack
```

---

## 🏗️ SETUP

### 1. Create Stack Handler

```typescript
// src/lib/stack.ts
import { StackServerApp } from '@stackframe/stack'

export const stackServerApp = new StackServerApp({
  tokenStore: 'nextjs-cookie',
})
```

### 2. Create Stack Provider

```typescript
// src/components/providers/StackProvider.tsx
'use client'

import { StackProvider, StackTheme } from '@stackframe/stack'
import { stackServerApp } from '@/lib/stack'

export function AppStackProvider({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider app={stackServerApp}>
      <StackTheme>
        {children}
      </StackTheme>
    </StackProvider>
  )
}
```

### 3. Wrap App in Provider

```typescript
// app/layout.tsx
import { AppStackProvider } from '@/components/providers/StackProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AppStackProvider>
          {children}
        </AppStackProvider>
      </body>
    </html>
  )
}
```

---

## 🔐 USAGE

### Server Components

```typescript
// In Server Component
import { stackServerApp } from '@/lib/stack'

export default async function Page() {
  const user = await stackServerApp.getUser()
  
  if (!user) {
    redirect('/auth/sign-in')
  }
  
  return <div>Welcome, {user.displayName}</div>
}
```

### Client Components

```typescript
'use client'

import { useUser, useStackApp } from '@stackframe/stack'

export function UserProfile() {
  const user = useUser()
  const app = useStackApp()
  
  if (!user) {
    return <button onClick={() => app.redirectToSignIn()}>Sign In</button>
  }
  
  return (
    <div>
      <p>Email: {user.primaryEmail}</p>
      <button onClick={() => app.signOut()}>Sign Out</button>
    </div>
  )
}
```

### Protected Routes

```typescript
// app/(protected)/layout.tsx
import { stackServerApp } from '@/lib/stack'
import { redirect } from 'next/navigation'

export default async function ProtectedLayout({ children }) {
  const user = await stackServerApp.getUser()
  
  if (!user) {
    redirect('/auth/sign-in')
  }
  
  return children
}
```

---

## 📄 AUTH PAGES

### Sign In Page

```typescript
// app/auth/sign-in/page.tsx
import { SignIn } from '@stackframe/stack'

export default function SignInPage() {
  return <SignIn />
}
```

### Sign Up Page

```typescript
// app/auth/sign-up/page.tsx
import { SignUp } from '@stackframe/stack'

export default function SignUpPage() {
  return <SignUp />
}
```

### Account Settings

```typescript
// app/settings/page.tsx
import { AccountSettings } from '@stackframe/stack'

export default function SettingsPage() {
  return <AccountSettings />
}
```

---

## 🗄️ DATABASE INTEGRATION

Stack Auth can sync user data with your Prisma database using webhooks or on-demand fetching.

### Sync User on Login

```typescript
// src/lib/sync-user.ts
import { prisma } from '@/lib/db'
import { stackServerApp } from '@/lib/stack'

export async function syncUser() {
  const stackUser = await stackServerApp.getUser()
  
  if (!stackUser) return null
  
  const user = await prisma.user.upsert({
    where: { stackId: stackUser.id },
    update: {
      email: stackUser.primaryEmail,
      displayName: stackUser.displayName,
    },
    create: {
      stackId: stackUser.id,
      email: stackUser.primaryEmail!,
      displayName: stackUser.displayName,
      algorithmSeed: crypto.randomUUID(),  // Generate unique seed for auth
      toleranceSeconds: 60,
    },
  })
  
  return user
}
```

### Prisma Schema Addition

```prisma
model User {
  id              String   @id @default(cuid())
  stackId         String   @unique @map("stack_id")
  email           String   @unique
  displayName     String?  @map("display_name")
  algorithmSeed   String   @map("algorithm_seed")
  toleranceSeconds Int     @default(60) @map("tolerance_seconds")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  lists           List[]
  
  @@map("users")
}
```

---

## ⚠️ NOTES

- Stack Auth handles password hashing, sessions, and OAuth
- User metadata stored in Stack's database, sync to Prisma as needed
- Environment variables from Neon console are already configured

---

*This documentation applies to Stack Auth with Neon PostgreSQL*
