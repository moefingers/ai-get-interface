'use client'

import { StackProvider, StackTheme } from '@stackframe/stack'
import { stackServerApp } from '@/lib/stack'

export interface AppStackProviderProps {
  children: React.ReactNode
}

export function AppStackProvider({ children }: AppStackProviderProps) {
  return (
    <StackProvider app={stackServerApp}>
      <StackTheme>
        {children}
      </StackTheme>
    </StackProvider>
  )
}
