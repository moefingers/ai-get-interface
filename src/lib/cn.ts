import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes with clsx
 * Handles conditional classes and deduplication
 * 
 * @example
 * cn('p-4', isActive && 'bg-blue-500', tw.text.primary)
 * cn('flex', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
