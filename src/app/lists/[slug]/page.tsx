import { redirect, notFound } from 'next/navigation'
import { stackServerApp } from '@/stack/server'
import { syncUser } from '@/lib/sync-user'
import { getListBySlug, getUserLists } from '@/app/lists/actions'
import { ListPageClient } from './ListPageClient'

interface ListPageProps {
  params: Promise<{ slug: string }>
}

export default async function ListPage({ params }: ListPageProps) {
  const { slug } = await params
  const stackUser = await stackServerApp.getUser()

  // If not authenticated, redirect to sign in
  if (!stackUser) {
    redirect('/auth/sign-in')
  }

  // Sync user to Prisma database
  const user = await syncUser()
  if (!user) {
    redirect('/auth/sign-in')
  }

  // Get the specific list by slug
  const list = await getListBySlug(slug)
  if (!list) {
    notFound()
  }

  // Get all lists for sidebar
  const lists = await getUserLists()

  const userName = user.displayName || stackUser.displayName || 'User'

  return (
    <ListPageClient
      userName={userName}
      currentList={{
        id: list.id,
        name: list.name,
        slug: list.slug,
        aiModel: list.aiModel,
        fields: JSON.stringify(list.fields),
        isDraft: list.isDraft,
        isActive: list.isActive,
        authToken: list.authToken,
      }}
      allLists={lists.map((l) => ({
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
