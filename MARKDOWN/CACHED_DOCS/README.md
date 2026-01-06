# Cached Documentation

This folder contains pre-researched documentation for frameworks and libraries used in this project.

## Contents

| File | Description | Last Updated |
|------|-------------|--------------|
| [NextJS_16_Upgrade_Guide.md](NextJS_16_Upgrade_Guide.md) | Next.js 16 breaking changes, new features, migration guide | Jan 6, 2026 |
| [Prisma_v7_Neon_Setup.md](Prisma_v7_Neon_Setup.md) | Prisma 7 configuration, driver adapters, Neon setup | Jan 6, 2026 |
| [TailwindCSS_v4_Setup.md](TailwindCSS_v4_Setup.md) | Tailwind CSS 4 installation, CSS-first config, PostCSS setup | Jan 6, 2026 |
| [React_RSC_Security_Vulnerabilities.md](React_RSC_Security_Vulnerabilities.md) | Critical CVEs for React Server Components | Jan 6, 2026 |
| [Stack_Auth_Setup.md](Stack_Auth_Setup.md) | Stack Auth (Neon Auth) integration guide | Jan 6, 2026 |

## Version Summary

| Package | Version | Notes |
|---------|---------|-------|
| Next.js | 16.0.10+ | **Must use patched version for security** |
| React | 19.2.1+ | Server Components security patches |
| Prisma | 7.x | Requires driver adapter, ESM only |
| Tailwind CSS | 4.1.x | CSS-first config, no tailwind.config.js |
| Stack Auth | Latest | Neon-provided authentication |

## Security Notes

⚠️ **Critical:** Next.js must be version 16.0.10 or higher to patch:
- CVE-2025-55182 (Critical RCE)
- CVE-2025-55184 / CVE-2025-67779 (DoS)
- CVE-2025-55183 (Source Code Exposure)

## When to Update These Docs

- When upgrading package versions
- When discovering new breaking changes
- When finding better patterns
- When security advisories are released

---

*Last updated: January 6, 2026*
