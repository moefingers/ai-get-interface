import { redirect } from 'next/navigation'
import { stackServerApp } from '@/stack/server'
import { syncUser } from '@/lib/sync-user'
import { tw } from '@/lib/tw-theme'
import { cn } from '@/lib/cn'
import { AppShell } from '@/components/layout'

export default async function HomePage() {
  const stackUser = await stackServerApp.getUser()

  // If not authenticated, redirect to sign in
  if (!stackUser) {
    redirect('/auth/sign-in')
  }

  // Sync user to Prisma database
  const user = await syncUser()

  return (
    <AppShell>
      {/* Main content area - centered like chat apps */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className={cn('max-w-2xl w-full text-center', tw.card.default, 'p-8')}>
          <h1 className={cn('text-3xl font-bold mb-4', tw.text.primary)}>
            Welcome, {user?.displayName || stackUser.displayName || 'User'}
          </h1>
          <p className={cn('mb-6', tw.text.secondary)}>
            You&apos;re signed in. Create your first list to get started with AI-triggered item management.
          </p>
          <button
            className={cn(tw.btn.primary, 'px-6 py-3 text-lg font-medium')}
          >
            Create Your First List
          </button>
        </div>
      </div>

      {/* Input area at bottom - like chat input */}
      <div className={cn('border-t p-4', tw.border.muted, tw.bg.main)}>
        <div className="max-w-3xl mx-auto">
          <div className={cn('flex items-center gap-2 p-3 rounded-xl', tw.bg.card, 'border', tw.border.default)}>
            <input
              type="text"
              placeholder="Add a list item..."
              className={cn(
                'flex-1 bg-transparent border-none outline-none',
                tw.text.primary,
                tw.placeholder.default
              )}
              disabled
            />
            <button
              className={cn(tw.btn.primary, 'px-4 py-2')}
              disabled
            >
              Add
            </button>
          </div>
          <p className={cn('text-xs text-center mt-2', tw.text.muted)}>
            Select or create a list to start adding items
          </p>
        </div>
      </div>
    </AppShell>
  )
}
