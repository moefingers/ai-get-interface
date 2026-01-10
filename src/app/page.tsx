import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { stackServerApp } from '@/stack/server'
import { syncUser } from '@/lib/sync-user'
import { getUserLists } from '@/app/lists/actions'
import { HomeClient } from './HomeClient'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/cn'
import { tw } from '@/lib/tw-theme'

export default async function HomePage() {
  const stackUser = await stackServerApp.getUser()

  // If authenticated, check for auth return cookie (from session auth flow)
  if (stackUser) {
    const cookieStore = await cookies()
    const returnUrl = cookieStore.get('auth_return_to')?.value
    if (returnUrl) {
      // Cookie will be cleared by the callback route after successful add
      redirect(returnUrl)
    }
  }

  // If not authenticated, show public landing page
  if (!stackUser) {
    return <LandingPage />
  }

  // Sync user to Prisma database
  const user = await syncUser()
  
  // Get user's lists
  const lists = await getUserLists()

  const userName = user?.displayName || stackUser.displayName || 'User'

  // If user has lists, redirect to the first one (drafts first, then published)
  if (lists.length > 0) {
    // Drafts are sorted first by getUserLists
    redirect(`/lists/${lists[0].slug}`)
  }

  // No lists - show welcome/empty state
  return (
    <HomeClient
      userName={userName}
      initialLists={[]}
    />
  )
}

function LandingPage() {
  return (
    <main className={cn('min-h-screen', tw.bg.main)}>
      {/* Header */}
      <header className={cn('px-6 py-4 flex justify-between items-center max-w-6xl mx-auto border-b', tw.border.muted)}>
        <div className="flex items-center gap-3">
          <Image src="/icon.png" alt="AI Get Interface" width={40} height={40} />
          <span className={cn('font-semibold text-xl', tw.text.primary)}>AI Get Interface</span>
        </div>
        <Link 
          href="/auth#sign-in"
          prefetch={true}
          className={cn('px-4 py-2', tw.btn.primary)}
        >
          Sign In
        </Link>
      </header>

      {/* Hero - Two column on desktop */}
      <section className="px-6 py-16 md:py-24 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className={cn('text-4xl md:text-5xl font-bold mb-6', tw.text.primary)}>
              Let AI manage your lists
            </h1>
            <p className={cn('text-lg md:text-xl mb-8', tw.text.secondary)}>
              Create lists and let AI assistants add items for you. Works with Gemini, 
              ChatGPT, and other AI assistants through simple voice or text commands.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth#sign-up"
                prefetch={true}
                className={cn('px-8 py-3 text-lg font-medium text-center', tw.btn.primary)}
              >
                Get Started Free
              </Link>
            </div>
          </div>
          <div className={cn('p-8 rounded-2xl', tw.bg.card, 'border', tw.border.default)}>
            <div className={cn('space-y-4', tw.text.secondary)}>
              <div className="flex items-start gap-3">
                <span className={cn('text-2xl')}>🗣️</span>
                <div>
                  <p className={cn('font-medium', tw.text.primary)}>&quot;Log bench press, 3 sets of 8 at 185&quot;</p>
                  <p className="text-sm">→ Bench press: 3×8 @ 185lb added to Workout Log</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className={cn('text-2xl')}>🗣️</span>
                <div>
                  <p className={cn('font-medium', tw.text.primary)}>&quot;Pain level 4, lower back after sitting&quot;</p>
                  <p className="text-sm">→ Level 4, lower back, sitting added to Pain Log</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className={cn('text-2xl')}>🗣️</span>
                <div>
                  <p className={cn('font-medium', tw.text.primary)}>&quot;Called Dr. Smith about test results&quot;</p>
                  <p className="text-sm">→ Dr. Smith, test results added to Call Log</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className={cn('px-6 py-16', tw.bg.sidebar)}>
        <div className="max-w-6xl mx-auto">
          <h2 className={cn('text-3xl font-bold text-center mb-12', tw.text.primary)}>How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className={cn('text-center p-6 rounded-xl', tw.bg.card, 'border', tw.border.default)}>
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4', tw.bg.primaryMuted, tw.text.accent)}>1</div>
              <h3 className={cn('font-semibold text-lg mb-2', tw.text.primary)}>Create a List</h3>
              <p className={tw.text.secondary}>Sign up and create lists for groceries, todos, ideas, or anything else.</p>
            </div>
            <div className={cn('text-center p-6 rounded-xl', tw.bg.card, 'border', tw.border.default)}>
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4', tw.bg.primaryMuted, tw.text.accent)}>2</div>
              <h3 className={cn('font-semibold text-lg mb-2', tw.text.primary)}>Connect Your AI</h3>
              <p className={tw.text.secondary}>Add simple instructions to your AI assistant with your personal link.</p>
            </div>
            <div className={cn('text-center p-6 rounded-xl', tw.bg.card, 'border', tw.border.default)}>
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4', tw.bg.primaryMuted, tw.text.accent)}>3</div>
              <h3 className={cn('font-semibold text-lg mb-2', tw.text.primary)}>Just Ask</h3>
              <p className={tw.text.secondary}>&quot;Add milk to my groceries&quot; — your AI handles the rest.</p>
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className={cn('px-6 py-8 border-t', tw.border.muted)}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className={cn('text-sm', tw.text.muted)}>© 2026 AI Get Interface</p>
          <div className="flex gap-6">
            <Link href="/privacy" className={cn('text-sm', tw.text.muted, tw.hover.text.primary)}>
              Privacy Policy
            </Link>
            <Link href="/terms" className={cn('text-sm', tw.text.muted, tw.hover.text.primary)}>
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
