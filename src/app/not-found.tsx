import Link from 'next/link'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'

export default function NotFound() {
  return (
    <div className={cn('min-h-dvh flex items-center justify-center', tw.bg.main)}>
      <div className="text-center">
        <h1 className={cn('text-6xl font-bold mb-4', tw.text.primary)}>404</h1>
        <p className={cn('text-xl mb-8', tw.text.secondary)}>Page not found</p>
        <Link
          href="/"
          className={cn(
            'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium',
            tw.bg.primary,
            tw.text.onPrimary,
            tw.hover.bg.primary,
            'transition-colors'
          )}
        >
          Go to Home
        </Link>
      </div>
    </div>
  )
}
