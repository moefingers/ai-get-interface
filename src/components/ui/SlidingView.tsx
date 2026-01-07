'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface SlidingViewProps {
  /** Index of the currently active view (0-based) */
  activeIndex: number
  /** Total number of views */
  viewCount: number
  /** The view content elements */
  children: ReactNode
  /** Additional classes for the container */
  className?: string
  /** Additional classes for the inner sliding container */
  innerClassName?: string
  /** Transition duration in ms (default: 300) */
  duration?: number
}

/**
 * SlidingView - Container for horizontally sliding view transitions.
 * 
 * Renders all views in a row and slides to show the active one.
 * Each child should be a full-width view.
 * 
 * Usage:
 * ```tsx
 * <SlidingView activeIndex={currentView} viewCount={2}>
 *   <EditView />
 *   <PreviewView />
 * </SlidingView>
 * ```
 */
export function SlidingView({
  activeIndex,
  viewCount,
  children,
  className,
  innerClassName,
  duration = 300,
}: SlidingViewProps) {
  return (
    <div className={cn('overflow-hidden w-full h-full', className)}>
      <div
        className={cn(
          'flex h-full transition-transform ease-out',
          viewCount === 1 && 'w-full',
          viewCount === 2 && 'w-[200%]',
          viewCount === 3 && 'w-[300%]',
          viewCount === 4 && 'w-[400%]',

          activeIndex === 0 && viewCount === 4 && 'translate-x-[calc(0%)]',
          activeIndex === 1 && viewCount === 4 && 'translate-x-[calc(-100%/4)]',
          activeIndex === 2 && viewCount === 4 && 'translate-x-[calc(-200%/4)]',
          activeIndex === 3 && viewCount === 4 && 'translate-x-[calc(-300%/4)]',

          activeIndex === 0 && viewCount === 3 && 'translate-x-[calc(0%)]',
          activeIndex === 1 && viewCount === 3 && 'translate-x-[calc(-100%/3)]',
          activeIndex === 2 && viewCount === 3 && 'translate-x-[calc(-200%/3)]',

          activeIndex === 0 && viewCount === 2 && 'translate-x-[calc(0%)]',
          activeIndex === 1 && viewCount === 2 && 'translate-x-[calc(-100%/2)]',

          duration === 300 && 'duration-300',
          duration === 500 && 'duration-500',
          duration === 700 && 'duration-700',
          duration === 1000 && 'duration-1000',
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}

interface SlidingViewItemProps {
  children: ReactNode
  className?: string
}

/**
 * SlidingViewItem - Individual view within a SlidingView.
 * Takes up full width of the visible area.
 */
export function SlidingViewItem({ children, className }: SlidingViewItemProps) {
  return (
    <div className={cn('flex-1 min-w-0 h-full overflow-auto', className)}>
      {children}
    </div>
  )
}
