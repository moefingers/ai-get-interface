import type { Metadata } from 'next'
import { AppStackProvider } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI List Interface',
  description: 'AI-triggered list management with GET-based API',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AppStackProvider>
          {children}
        </AppStackProvider>
      </body>
    </html>
  )
}
