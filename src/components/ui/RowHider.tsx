'use client'

import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

export interface RowHiderProps {
    /** Content to show/hide */
    children: ReactNode
    /** When true, content is visible; when false, collapsed to 0 height */
    showWhen: boolean
    /** Transition duration in ms (default: 300) */
    duration?: number
    /** Additional className for the outer grid container */
    className?: string
}

/**
 * RowHider - Smoothly animates content visibility using CSS grid rows
 * 
 * Uses the grid-rows-[0fr]/[1fr] pattern to animate height from 0 to auto.
 * Content is not removed from DOM, just visually collapsed.
 * 
 * @example
 * <RowHider showWhen={isVisible}>
 *   <MyContent />
 * </RowHider>
 */
export function RowHider({
    children,
    showWhen,
    duration = 300,
    className,
}: RowHiderProps) {
    return (
        <div
            className={cn(
                'grid transition-[grid-template-rows]',
                showWhen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                className
            )}
            style={{ transitionDuration: `${duration}ms` }}
        >
            <div className="overflow-hidden">
                {children}
            </div>
        </div>
    )
}
