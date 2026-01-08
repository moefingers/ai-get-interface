import { redirect } from 'next/navigation'
import { stackServerApp } from '@/stack/server'
import { syncUser } from '@/lib/sync-user'
import { getUserLists } from '@/app/lists/actions'
import { HomeClient } from './HomeClient'
import Link from 'next/link'
import Image from 'next/image'

export default async function HomePage() {
  const stackUser = await stackServerApp.getUser()

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
    <main className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Image src="/icon.png" alt="AI Get Interface" width={40} height={40} />
          <span className="font-semibold text-xl">AI Get Interface</span>
        </div>
        <Link 
          href="/auth/sign-in"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          AI Get Interface
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Create lists and let AI assistants add items for you. Works with Gemini, 
          ChatGPT, and other AI assistants through simple voice or text commands.
        </p>
        <Link
          href="/auth/sign-up"
          className="inline-block px-8 py-3 bg-green-600 text-white text-lg font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          Get Started Free
        </Link>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-lg mb-2">Create a List</h3>
              <p className="text-gray-600">Sign up and create lists for groceries, todos, ideas, or anything else.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-lg mb-2">Connect Your AI</h3>
              <p className="text-gray-600">Add simple instructions to your AI assistant with your personal link.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-lg mb-2">Just Ask</h3>
              <p className="text-gray-600">&quot;Add milk to my groceries&quot; — your AI handles the rest.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">🤖 AI Assistant Integration</h3>
            <p className="text-gray-600">Works with Gemini, ChatGPT, Google Assistant, and more.</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">🔒 Secure by Design</h3>
            <p className="text-gray-600">Your lists are private. Only you can view them.</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">⚡ Instant Updates</h3>
            <p className="text-gray-600">Items appear in your list immediately after adding.</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">📱 Access Anywhere</h3>
            <p className="text-gray-600">View and manage your lists from any device.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">© 2026 AI Get Interface</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-gray-500 hover:text-gray-700 text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-700 text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
