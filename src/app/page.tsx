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

  return (
    <HomeClient
      userName={userName}
      initialLists={lists.map((l) => ({
        id: l.id,
        name: l.name,
        slug: l.slug,
        aiModel: l.aiModel,
        fields: JSON.stringify(l.fields),
        isDraft: l.isDraft,
        isActive: l.isActive,
      }))}
    />
  )
}
