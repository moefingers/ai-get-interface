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
  /** 
   * When true, container height adapts to active view's content.
   * Each view can have independent natural height.
   * Views not visible are clipped via overflow.
   */
  autoHeight?: boolean
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
  autoHeight = false,
}: SlidingViewProps) {
  return (
    <div className={cn('overflow-hidden w-full', !autoHeight && 'h-full', className)}>
      <div
        className={cn(
          'flex transition-transform ease-out',
          !autoHeight && 'h-full',
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
  /** When true (default false), allows natural height instead of h-full */
  autoHeight?: boolean
}

/**
 * SlidingViewItem - Individual view within a SlidingView.
 * Takes up full width of the visible area.
 */
export function SlidingViewItem({ children, className, autoHeight = false }: SlidingViewItemProps) {
  return (
    <div className={cn('flex-1 min-w-0 overflow-auto', !autoHeight && 'h-full', className)}>
      {children}
    </div>
  )
}
