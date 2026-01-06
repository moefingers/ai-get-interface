import { PrismaClient } from '../../prisma/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

/**
 * Prisma Client with Neon Serverless Adapter
 * 
 * CRITICAL: Prisma 7 requires driver adapters for serverless environments
 * - DATABASE_URL (pooled) for runtime queries
 * - DIRECT_URL (non-pooled) for CLI operations (configured in prisma.config.ts)
 * 
 * See: MARKDOWN/CACHED_DOCS/Prisma_v7_Neon_Setup.md
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const adapter = new PrismaNeon({ 
  connectionString: process.env.DATABASE_URL! 
})

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
