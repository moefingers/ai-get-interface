/**
 * Type-Safe Tailwind Theme Classes
 *
 * CRITICAL: These are HARDCODED class strings that Tailwind's JIT can see at build time.
 * DO NOT use template literals or variables - Tailwind must see the literal strings.
 *
 * NOTE: Hardcoding var(--*) names is ONLY permitted in this file.
 * All CSS variables are validated against globals.css definitions.
 * Everywhere else in the codebase must use tw.* helpers.
 *
 * @example
 * ```tsx
 * import { tw } from '@/lib/tw-theme';
 *
 * // ✅ CORRECT - Static strings with autocomplete
 * <div className={tw.text.primary}>
 * <div className={tw.bg.card}>
 * <button className={cn(tw.bg.primary, tw.hover.bg.primaryHover)}>
 *
 * // ❌ WRONG - Never use template literals or hardcoded colors
 * <div className="text-gray-400"> // No hardcoded colors!
 * <div className={`bg-[${var}]`}> // JIT can't see this!
 * <div className={'hover:' + tw.bg.x}> // Don't concatenate hover:
 * ```
 */

export const tw = {
  /**
   * Text color classes
   */
  text: {
    /** Main text color (headings, high contrast) */
    primary: 'text-[var(--color-text)]',
    /** Body text, labels */
    secondary: 'text-[var(--color-text-secondary)]',
    /** Muted text, captions, placeholders */
    muted: 'text-[var(--color-text-muted)]',
    /** Text on primary/accent backgrounds */
    onPrimary: 'text-[var(--color-text-on-primary)]',
    /** Error text */
    error: 'text-[var(--color-error)]',
    /** Success text */
    success: 'text-[var(--color-success)]',
    /** Warning text */
    warning: 'text-[var(--color-warning)]',
    /** Accent/link color */
    accent: 'text-[var(--color-accent)]',
  },

  /**
   * Background color classes
   */
  bg: {
    /** Page background */
    main: 'bg-[var(--color-background)]',
    /** Cards, panels, elevated content */
    card: 'bg-[var(--color-background-card)]',
    /** Sidebar background */
    sidebar: 'bg-[var(--color-background-sidebar)]',
    /** Elevated content (modals, popovers) */
    elevated: 'bg-[var(--color-background-elevated)]',
    /** Modal overlay */
    overlay: 'bg-[var(--color-overlay)]',
    /** Hover state background */
    hover: 'bg-[var(--color-hover)]',
    /** Active/pressed state background */
    active: 'bg-[var(--color-active)]',
    /** Disabled background */
    disabled: 'bg-[var(--color-disabled)]',
    /** Primary brand color */
    primary: 'bg-[var(--color-primary)]',
    /** Primary muted/transparent */
    primaryMuted: 'bg-[var(--color-primary-muted)]',
    /** Accent color */
    accent: 'bg-[var(--color-accent)]',
    /** Success color */
    success: 'bg-[var(--color-success)]',
    /** Success muted */
    successMuted: 'bg-[var(--color-success-muted)]',
    /** Warning color */
    warning: 'bg-[var(--color-warning)]',
    /** Warning muted */
    warningMuted: 'bg-[var(--color-warning-muted)]',
    /** Error color */
    error: 'bg-[var(--color-error)]',
    /** Error muted */
    errorMuted: 'bg-[var(--color-error-muted)]',
  },

  /**
   * Border color classes
   */
  border: {
    /** Default border */
    default: 'border-[var(--color-border)]',
    /** Muted/subtle border */
    muted: 'border-[var(--color-border-muted)]',
    /** Primary color border */
    primary: 'border-[var(--color-primary)]',
    /** Accent color border */
    accent: 'border-[var(--color-accent)]',
    /** Error border */
    error: 'border-[var(--color-error)]',
    /** Focus ring color */
    focus: 'border-[var(--color-focus)]',
  },

  /**
   * Ring/outline color classes
   */
  ring: {
    /** Default focus ring */
    default: 'ring-[var(--color-focus)]',
    /** Primary ring */
    primary: 'ring-[var(--color-primary)]',
    /** Error ring */
    error: 'ring-[var(--color-error)]',
  },

  /**
   * Hover state classes (include hover: prefix)
   */
  hover: {
    bg: {
      /** Subtle hover background */
      subtle: 'hover:bg-[var(--color-hover)]',
      /** Card hover */
      card: 'hover:bg-[var(--color-background-card)]',
      /** Primary hover */
      primary: 'hover:bg-[var(--color-primary-hover)]',
      /** Accent hover */
      accent: 'hover:bg-[var(--color-accent-hover)]',
      /** Elevated hover */
      elevated: 'hover:bg-[var(--color-background-elevated)]',
    },
    text: {
      /** Primary text on hover */
      primary: 'hover:text-[var(--color-text)]',
      /** Accent text on hover */
      accent: 'hover:text-[var(--color-accent)]',
    },
    border: {
      /** Primary border on hover */
      primary: 'hover:border-[var(--color-primary)]',
      /** Default border on hover */
      default: 'hover:border-[var(--color-border)]',
    },
  },

  /**
   * Focus state classes (include focus: prefix)
   */
  focus: {
    ring: {
      /** Primary focus ring */
      primary: 'focus:ring-[var(--color-primary)]',
      /** Default focus ring */
      default: 'focus:ring-[var(--color-focus)]',
    },
    border: {
      /** Primary focus border */
      primary: 'focus:border-[var(--color-primary)]',
    },
    outline: {
      /** Remove outline on focus */
      none: 'focus:outline-none',
    },
  },

  /**
   * Active/pressed state classes
   */
  active: {
    bg: {
      /** Active background */
      default: 'active:bg-[var(--color-active)]',
      /** Primary active */
      primary: 'active:bg-[var(--color-primary-active)]',
    },
  },

  /**
   * Placeholder text classes
   */
  placeholder: {
    /** Default placeholder color */
    default: 'placeholder:text-[var(--color-text-muted)]',
  },

  /**
   * Composite button styles
   * These combine multiple utilities for common patterns
   */
  btn: {
    /** Primary button - solid background */
    primary: 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] rounded-lg transition-colors',
    /** Secondary button - outline style */
    secondary: 'bg-transparent border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)] active:bg-[var(--color-active)] rounded-lg transition-colors',
    /** Ghost button - no border, subtle hover */
    ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] active:bg-[var(--color-active)] rounded-lg transition-colors',
    /** Danger button */
    danger: 'bg-[var(--color-error)] text-[var(--color-text-on-primary)] hover:bg-[var(--color-error-hover)] active:bg-[var(--color-error-active)] rounded-lg transition-colors',
  },

  /**
   * Input field styles
   */
  input: {
    /** Default input styling */
    default: 'bg-[var(--color-background-card)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-none rounded-lg transition-colors',
    /** Error state input */
    error: 'bg-[var(--color-background-card)] border border-[var(--color-error)] text-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-error)] focus:outline-none rounded-lg',
  },

  /**
   * Card/panel styles
   */
  card: {
    /** Default card */
    default: 'bg-[var(--color-background-card)] border border-[var(--color-border)] rounded-xl',
    /** Interactive card with hover */
    interactive: 'bg-[var(--color-background-card)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-hover)] hover:border-[var(--color-border)] transition-colors cursor-pointer',
  },
} as const

/**
 * Type helper for accessing tw values
 */
export type TwTheme = typeof tw
