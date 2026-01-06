# Critical Security Vulnerabilities in React Server Components

**Cached:** January 6, 2026
**Last Verified:** January 6, 2026

---

## 🚨 CRITICAL: CVE-2025-55182 (React2Shell) - RCE

**Source:** https://github.com/facebook/react/security/advisories/GHSA-fv66-9v8q-g76r
**Severity:** Critical 10.0/10

### Affected Packages
- react-server-dom-parcel (npm)
- react-server-dom-turbopack (npm)
- react-server-dom-webpack (npm)

### Affected Versions
19.0.0, 19.1.0, 19.1.1, 19.2.0

### Patched Versions
19.0.1, 19.1.2, 19.2.1

### Impact
**Unauthenticated remote code execution** vulnerability in React Server Components.

### Who Is Affected
- Apps using React Server Components
- Apps using frameworks with RSC support (Next.js App Router)
- Apps NOT affected: No server code, no RSC framework

---

## 🔴 HIGH: CVE-2025-55184 / CVE-2025-67779 (DoS)

**Source:** https://nextjs.org/blog/security-update-2025-12-11
**Severity:** High

### Impact
A specially crafted HTTP request to any App Router endpoint can cause an infinite loop that hangs the server process, preventing future HTTP requests.

### Note
The initial fix (CVE-2025-55184) was incomplete. CVE-2025-67779 provides the complete fix.

---

## 🟡 MEDIUM: CVE-2025-55183 (Source Code Exposure)

**Source:** https://nextjs.org/blog/security-update-2025-12-11
**Severity:** Medium

### Impact
A specially crafted HTTP request can cause a Server Function to return compiled source code of other Server Functions. This could reveal:
- Business logic
- Secrets defined directly in code (not from environment variables)

---

## ✅ REQUIRED ACTIONS

### Next.js Patched Versions

| Version Line | Patched Version |
|--------------|-----------------|
| 14.x | 14.2.35 |
| 15.0.x | 15.0.7 |
| 15.1.x | 15.1.11 |
| 15.2.x | 15.2.8 |
| 15.3.x | 15.3.8 |
| 15.4.x | 15.4.10 |
| 15.5.x | 15.5.9 |
| 16.0.x | 16.0.10 |
| 16.x canary | 16.1.0-canary.19 |

### Upgrade Command

```bash
# For Next.js 16
npm install next@16.0.10

# Interactive upgrade tool
npx fix-react2shell-next
```

### Best Practices

1. **Never define secrets in code** - Always use environment variables at runtime
2. **Keep dependencies updated** - Check for security advisories regularly
3. **Use NEXT_PUBLIC_ prefix carefully** - Only for truly public values

---

## 🛡️ VERIFICATION

After upgrading, verify your Next.js version:

```bash
npx next --version
```

Ensure it shows 16.0.10 or higher for 16.x line.

---

*This project must use Next.js 16.0.10+ to be secure*
