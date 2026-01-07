'use client'

import { StackProvider, StackTheme } from '@stackframe/stack'
import { stackClientApp } from '@/stack/client'

export interface AppStackProviderProps {
  children: React.ReactNode
}

export function AppStackProvider({ children }: AppStackProviderProps) {
  return (
    <StackProvider app={stackClientApp}>
      <StackTheme>
        {children}
      </StackTheme>
    </StackProvider>
  )
}
