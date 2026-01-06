'use client'

import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

export interface ColumnHiderProps {
    /** Content to show/hide */
    children: ReactNode
    /** When true, content is visible; when false, collapsed to 0 width */
    showWhen: boolean
    /** Deprecated, not in use - Transition duration in ms (default: 300) */
    duration?: number
    /** Additional className for the outer grid container */
    className?: string
}

/**
 * ColumnHider - Smoothly animates content visibility using CSS grid columns
 * 
 * Uses the grid-cols-[0fr]/[1fr] pattern to animate width from 0 to auto.
 * Content is not removed from DOM, just visually collapsed.
 * 
 * @example
 * <ColumnHider showWhen={isVisible}>
 *   <MyContent />
 * </ColumnHider>
 */
export function ColumnHider({
    children,
    showWhen,
    duration = 300,
    className,
}: ColumnHiderProps) {
    return (
        <div
            className={cn(
                'grid transition-[grid-template-columns,margin] duration-300',
                showWhen ? 'grid-cols-[1fr] mx-1' : 'grid-cols-[0fr] mx-0',
                className
            )}
            // style={{ transitionDuration: `${duration}ms` }}
        >
            <div className="overflow-hidden">
                {children}
            </div>
        </div>
    )
}
