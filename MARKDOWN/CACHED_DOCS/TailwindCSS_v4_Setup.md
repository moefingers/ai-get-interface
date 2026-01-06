# Tailwind CSS 4 Setup Guide

**Source:** https://tailwindcss.com/docs/installation/framework-guides/nextjs
**Cached:** January 6, 2026
**Last Verified:** January 6, 2026

---

## 🚨 MAJOR CHANGES IN TAILWIND CSS 4

Tailwind CSS 4 is a complete rewrite with significant breaking changes from v3.

### Key Changes

1. **No more `tailwind.config.js`** - Configuration moved to CSS
2. **PostCSS plugin renamed** - `@tailwindcss/postcss` instead of `tailwindcss`
3. **CSS-first configuration** - Use CSS variables and `@theme` directive
4. **Import syntax changed** - `@import "tailwindcss"` instead of `@tailwind` directives

---

## 📦 INSTALLATION FOR NEXT.JS

### 1. Install Dependencies

```bash
pnpm add tailwindcss @tailwindcss/postcss postcss
```

### 2. Create PostCSS Config

```javascript
// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### 3. Update CSS Entry Point

```css
/* app/globals.css */
@import "tailwindcss";

/* Custom theme variables */
@theme {
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-background: #0a0a0a;
  --color-background-card: #1a1a1a;
  --color-text: #ffffff;
  --color-text-muted: #a0a0a0;
}
```

### 4. Import in Layout

```tsx
// app/layout.tsx
import './globals.css'
```

---

## 🎨 CSS-FIRST CONFIGURATION

### The `@theme` Directive

All customization now happens in CSS using `@theme`:

```css
@import "tailwindcss";

@theme {
  /* Colors */
  --color-primary: #3b82f6;
  --color-secondary: #6366f1;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px rgb(0 0 0 / 0.1);
}
```

### Using Theme Variables

Tailwind automatically generates utilities from `@theme` variables:

```html
<!-- Color utilities auto-generated -->
<div class="bg-primary text-secondary">

<!-- Spacing utilities -->
<div class="p-md m-lg">

<!-- With arbitrary values if needed -->
 <!-- @tailwindcss-ignore -->
<div class="bg-[var(--color-primary)]">

<!-- or -->
<div class="bg-primary">
```

---

## 🔧 MIGRATION FROM V3

### Before (v3)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
      },
    },
  },
}
```

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### After (v4)

```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
}
```

### Import Syntax Changes

| v3 | v4 |
|----|-----|
| `@tailwind base;` | `@import "tailwindcss";` |
| `@tailwind components;` | (included in import) |
| `@tailwind utilities;` | (included in import) |
| `@apply` | `@apply` (unchanged) |

---

## 🎯 BEST PRACTICES FOR THIS PROJECT

### Using CSS Variables with tw-theme

We use a `tw` helper object to maintain type-safe theme classes:

```typescript
// src/lib/tw-theme.ts
export const tw = {
  text: {
    primary: 'text-[var(--color-text)]',
    muted: 'text-[var(--color-text-muted)]',
  },
  bg: {
    main: 'bg-[var(--color-background)]',
    card: 'bg-[var(--color-background-card)]',
    primary: 'bg-[var(--color-primary)]',
  },
  hover: {
    bg: {
      primaryHover: 'hover:bg-[var(--color-primary-hover)]',
    },
  },
}
```

### Why This Pattern?

1. **Type safety** - Autocomplete for theme values
2. **JIT compatibility** - Tailwind sees literal strings at build time
3. **Centralized** - One file to update theme classes
4. **No template literals** - Avoids JIT scanning issues

### Usage

```tsx
import { tw } from '@/lib/tw-theme'
import { cn } from '@/lib/cn'

<button className={cn(
  'px-4 py-2 rounded-lg',
  tw.bg.primary,
  tw.hover.bg.primaryHover,
  tw.text.primary
)}>
  Click me
</button>
```

---

## ⚠️ COMMON ISSUES

### "Class not being generated"

Tailwind 4 scans for class names at build time. Dynamic classes won't work:

```tsx
// ❌ Won't work - dynamic class
const color = 'blue'
<div className={`bg-${color}-500`}>

// ✅ Works - literal class
<div className="bg-blue-500">

// ✅ Works - CSS variable via tw helper
<div className={tw.bg.primary}>
```

### "PostCSS plugin error"

Make sure you're using the new plugin name:

```javascript
// ❌ Old
plugins: {
  tailwindcss: {},
}

// ✅ New
plugins: {
  "@tailwindcss/postcss": {},
}
```

### Content Detection

Tailwind 4 auto-detects content files. If classes aren't working, ensure your files are in standard locations:
- `app/**/*.{js,ts,jsx,tsx}`
- `components/**/*.{js,ts,jsx,tsx}`
- `src/**/*.{js,ts,jsx,tsx}`

---

## 📁 RECOMMENDED FILE STRUCTURE

```
src/
├── app/
│   ├── globals.css      # @import "tailwindcss" + @theme
│   └── layout.tsx       # imports globals.css
├── lib/
│   ├── cn.ts            # clsx + tailwind-merge helper
│   └── tw-theme.ts      # Type-safe theme class helper
└── components/
    └── ...

postcss.config.mjs       # @tailwindcss/postcss plugin
```

---

*This documentation applies to Tailwind CSS 4.1.x with Next.js 16*
