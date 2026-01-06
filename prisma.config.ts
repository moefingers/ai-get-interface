// Prisma 7 Configuration
// See: MARKDOWN/CACHED_DOCS/Prisma_v7_Neon_Setup.md
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DIRECT_URL'),
  },
})
