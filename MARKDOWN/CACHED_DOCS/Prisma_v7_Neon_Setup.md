# Prisma 7 + Neon PostgreSQL Setup Guide

**Source:** https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
**Cached:** January 6, 2026
**Last Verified:** January 6, 2026

---

## 🚨 CRITICAL BREAKING CHANGES IN PRISMA 7

### 1. Configuration Moved to `prisma.config.ts`

**The `url`, `directUrl`, and `shadowDatabaseUrl` fields in schema.prisma `datasource` block are DEPRECATED.**

**Old Way (Prisma 6 and earlier):**
```prisma
// ❌ DEPRECATED in Prisma 7
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**New Way (Prisma 7):**
```prisma
// ✅ schema.prisma - No URL here
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client"
  output   = "./generated/prisma"  // Required in v7
}
```

```typescript
// ✅ prisma.config.ts - CLI configuration here
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',  // Optional
  },
  datasource: {
    url: env('DIRECT_URL'),  // CLI uses direct connection
  },
})
```

### 2. ESM Required

Prisma 7 ships as ES module. Your `package.json` must have:
```json
{
  "type": "module"
}
```

Your `tsconfig.json` should have:
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

### 3. Environment Variables Not Auto-Loaded

Must explicitly load with dotenv:
```typescript
// prisma.config.ts
import 'dotenv/config'  // Required!
import { defineConfig, env } from 'prisma/config'
```

Install dotenv:
```bash
pnpm add dotenv
```

### 4. Minimum Versions

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 20.19.0 | 22.x |
| TypeScript | 5.4.0 | 5.9.x |

### 5. Automatic Seeding Removed

Seeding no longer runs automatically after `migrate dev` or `migrate reset`.

Must run explicitly:
```bash
pnpx prisma db seed
```

### 6. Client Middleware Removed

```typescript
// ❌ Old (removed)
prisma.$use(async (params, next) => { ... })

// ✅ New (use extensions)
const prisma = new PrismaClient().$extends({
  query: {
    user: {
      async findMany({ args, query }) {
        return query(args)
      }
    }
  }
})
```

### 7. Generator Changes

**Provider renamed:**
```prisma
// ❌ Old
generator client {
  provider = "prisma-client-js"
}

// ✅ New
generator client {
  provider = "prisma-client"
  output   = "./generated/prisma"  // REQUIRED
}
```

**Import path changed:**
```typescript
// ❌ Old
import { PrismaClient } from '@prisma/client'

// ✅ New (path depends on output config)
import { PrismaClient } from './generated/prisma/client'
```

### 8. Driver Adapters REQUIRED

**You cannot use `new PrismaClient()` without an adapter.**

```typescript
// src/lib/db.ts
import { PrismaClient } from '../prisma/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const adapter = new PrismaNeon({ 
  connectionString: process.env.DATABASE_URL! 
})

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Install the adapter:**
```bash
pnpm add @prisma/adapter-neon
```

---

## 🔌 NEON POSTGRESQL SETUP

### Connection Pooling Pattern

Neon provides connection pooling via PgBouncer (up to 10,000 connections).

**Key Pattern:**
- **Prisma CLI** (migrations, studio) → Use **DIRECT connection** (non-pooled)
- **Prisma Client** (runtime queries) → Use **POOLED connection**

### Environment Variables

```bash
# .env

# Pooled connection for runtime (has "-pooler" in hostname)
DATABASE_URL="postgres://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Direct connection for CLI (no "-pooler")
DIRECT_URL="postgres://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### prisma.config.ts

```typescript
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DIRECT_URL'),  // CLI uses direct connection
  },
})
```

### Connection Timeout Settings

For Neon's serverless compute (cold starts can take 500ms-few seconds):

```bash
DATABASE_URL="postgres://...?connect_timeout=15&sslmode=require"
```

---

## 📋 QUICK REFERENCE

### Commands
```bash
pnpm dev                    # Start dev server
pnpm build                  # Build (includes prisma generate)
pnpx prisma migrate dev --name <name>  # Create migration
pnpx prisma migrate reset   # Reset database
pnpx prisma db seed         # Run seed script (explicit in v7)
pnpx prisma studio          # Visual database editor
pnpx prisma generate        # Regenerate client
```

### File Locations
```
prisma.config.ts     # CLI configuration (project root)
prisma/schema.prisma # Schema definition
prisma/generated/    # Generated client (custom output)
prisma/migrations/   # Migration history
.env                 # Environment variables
```

### Schema Naming Convention
```prisma
model User {
  id          String   @id @default(cuid())
  displayName String   @map("display_name")  // camelCase in code
  createdAt   DateTime @default(now()) @map("created_at")
  
  @@map("users")  // snake_case table name
}
```

---

## ⚠️ COMMON ISSUES

### "Missing required environment variable"
The `env()` helper throws if variable is missing. For optional variables:
```typescript
datasource: {
  url: process.env.DATABASE_URL!,  // Use process.env directly
}
```

### Connection timeouts
Add `connect_timeout` parameter to connection string.

### "Can't reach database server"
Neon compute may be idle. Increase `connect_timeout` to 10-15 seconds.

### SSL Certificate Errors (P1010)
Since Prisma v7 uses node-pg instead of Rust engine:
```typescript
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },  // Or configure proper certs
})
```

---

## 🔧 MIGRATION FROM PRISMA 6

1. **Update packages:**
   ```bash
   pnpm add @prisma/client@7
   pnpm add -D prisma@7
   pnpm add @prisma/adapter-neon dotenv
   ```

2. **Create `prisma.config.ts`:**
   ```typescript
   import 'dotenv/config'
   import { defineConfig, env } from 'prisma/config'

   export default defineConfig({
     schema: 'prisma/schema.prisma',
     datasource: {
       url: env('DIRECT_URL'),
     },
   })
   ```

3. **Update `schema.prisma`:**
   ```prisma
   datasource db {
     provider = "postgresql"
   }

   generator client {
     provider = "prisma-client"
     output   = "./generated/prisma"
   }
   ```

4. **Update `package.json`:**
   ```json
   {
     "type": "module"
   }
   ```

5. **Update Prisma Client instantiation** to use adapter

6. **Update imports** to new generated path

7. **Regenerate client:**
   ```bash
   pnpx prisma generate
   ```

---

*This documentation applies to Prisma 7.x with Neon PostgreSQL*
