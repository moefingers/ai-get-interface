# Stack Auth Setup Guide

**Source:** https://docs.stack-auth.com/docs/getting-started/setup
**Cached:** January 6, 2026
**Last Verified:** January 6, 2026

---

## 📦 OVERVIEW

Stack Auth is an open-source authentication library. It provides pre-built UI components and handles sessions, OAuth, and password auth.

### Environment Variables

```bash
# Required in .env.local
NEXT_PUBLIC_STACK_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=<your-publishable-client-key>
STACK_SECRET_SERVER_KEY=<your-secret-server-key>
```

---

## 🔧 INSTALLATION

### Option 1: Setup Wizard (Recommended)

```bash
npx @stackframe/init-stack@latest
```

### Option 2: Manual Installation

```bash
pnpm add @stackframe/stack
```

---

## 🏗️ MANUAL SETUP (Next.js App Router)

### 1. Create Server App (`src/stack/server.ts`)

```typescript
import "server-only";
import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    home: "/",
  },
});
```

**CRITICAL:** The `"server-only"` import ensures this file is never imported on the client.

### 2. Create Client App (`src/stack/client.ts`)

```typescript
"use client";
import { StackClientApp } from "@stackframe/stack";

export const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    home: "/",
  },
});
```

### 3. Create Stack Handler (`src/app/handler/[...stack]/page.tsx`)

```typescript
import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/stack/server";

export default function Handler(props: { params: any; searchParams: any }) {
  return (
    <StackHandler
      app={stackServerApp}
      routeProps={props}
      fullPage={true}
    />
  );
}
```

### 4. Create StackProvider (`src/components/providers/StackProvider.tsx`)

```typescript
"use client";

import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/stack/server";

export function AppStackProvider({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider app={stackServerApp}>
      <StackTheme>
        {children}
      </StackTheme>
    </StackProvider>
  );
}
```

### 5. Wrap Layout (`src/app/layout.tsx`)

```typescript
import { AppStackProvider } from "@/components/providers/StackProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppStackProvider>
          {children}
        </AppStackProvider>
      </body>
    </html>
  );
}
```

### 6. Create Loading Boundary (`src/app/loading.tsx`)

```typescript
export default function Loading() {
  return null; // Or a spinner/skeleton
}
```

---

## 📄 AUTH PAGES

The `StackHandler` handles these routes automatically:
- `/handler/sign-in` - Sign in page
- `/handler/sign-up` - Sign up page  
- `/handler/sign-out` - Sign out
- `/handler/forgot-password` - Password reset
- `/handler/account-settings` - User settings

Or use standalone components:

```typescript
// app/auth/sign-in/page.tsx
import { SignIn } from "@stackframe/stack";

export default function SignInPage() {
  return <SignIn />;
}
```

---

## 🔐 USAGE

### Server Components

```typescript
import { stackServerApp } from "@/stack/server";

export default async function Page() {
  const user = await stackServerApp.getUser();
  
  if (!user) {
    // User not signed in
    redirect("/handler/sign-in");
  }
  
  return <div>Welcome, {user.displayName}</div>;
}
```

### Client Components

```typescript
"use client";

import { useUser, useStackApp } from "@stackframe/stack";

export function UserProfile() {
  const user = useUser();
  const app = useStackApp();
  
  if (!user) {
    return <button onClick={() => app.redirectToSignIn()}>Sign In</button>;
  }
  
  return (
    <div>
      <p>Email: {user.primaryEmail}</p>
      <button onClick={() => app.signOut()}>Sign Out</button>
    </div>
  );
}
```

### Protected Page Pattern

```typescript
import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const user = await stackServerApp.getUser({ or: "redirect" });
  // User is guaranteed to exist here
  return <div>Protected content for {user.displayName}</div>;
}
```

---

## 📁 EXPECTED FILE STRUCTURE

After setup, you should have:

```
src/
├── stack/
│   ├── server.ts    # StackServerApp instance
│   └── client.ts    # StackClientApp instance (optional)
├── app/
│   ├── layout.tsx   # Wrapped with StackProvider
│   ├── loading.tsx  # Suspense boundary
│   └── handler/
│       └── [...stack]/
│           └── page.tsx  # StackHandler
└── components/
    └── providers/
        └── StackProvider.tsx
```

---

## ⚠️ COMMON ISSUES

### "No secret server key provided"

1. Ensure `.env.local` contains `STACK_SECRET_SERVER_KEY`
2. Restart dev server after adding env vars
3. Clear `.next` cache: `rm -rf .next`

### Environment Variables Not Loading

- Next.js only loads `.env.local` automatically
- Non-public vars (no `NEXT_PUBLIC_` prefix) are server-only
- Restart required after env changes

---

## 🔗 REFERENCE

- Setup Guide: https://docs.stack-auth.com/docs/getting-started/setup
- SDK Reference: https://docs.stack-auth.com/docs/sdk
- Components: https://docs.stack-auth.com/docs/components
- StackHandler: https://docs.stack-auth.com/docs/components/stack-handler
- StackProvider: https://docs.stack-auth.com/docs/components/stack-provider

---

*This documentation applies to Stack Auth with Next.js App Router*
