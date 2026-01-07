import { redirect } from 'next/navigation'
import { stackServerApp } from '@/stack/server'
import { syncUser } from '@/lib/sync-user'
import { getUserLists } from '@/app/lists/actions'
import { HomeClient } from './HomeClient'

export default async function HomePage() {
  const stackUser = await stackServerApp.getUser()

  // If not authenticated, redirect to sign in
  if (!stackUser) {
    redirect('/auth/sign-in')
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
