import { prisma } from '@/lib/db'
import { stackServerApp } from '@/stack/server'
import { randomBytes } from 'crypto'

/**
 * Generates a secure random hex string for algorithm seed
 */
function generateAlgorithmSeed(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Syncs the current Stack Auth user to Prisma database.
 * Creates user if first time, updates display name on subsequent calls.
 * 
 * @returns The Prisma user record, or null if not authenticated
 */
export async function syncUser() {
  const stackUser = await stackServerApp.getUser()
  
  if (!stackUser) return null

  const user = await prisma.user.upsert({
    where: { stackAuthId: stackUser.id },
    update: {
      displayName: stackUser.displayName ?? undefined,
    },
    create: {
      stackAuthId: stackUser.id,
      displayName: stackUser.displayName,
      algorithmSeed: generateAlgorithmSeed(),
      toleranceSeconds: 30,
    },
  })

  return user
}

/**
 * Gets the current user from Prisma (if synced).
 * Does not sync - use syncUser() to ensure user exists.
 * 
 * @returns The Prisma user record, or null if not found/authenticated
 */
export async function getCurrentUser() {
  const stackUser = await stackServerApp.getUser()
  
  if (!stackUser) return null

  return prisma.user.findUnique({
    where: { stackAuthId: stackUser.id },
  })
}

/**
 * Gets the current user with their lists.
 * 
 * @returns User with lists, or null if not authenticated
 */
export async function getCurrentUserWithLists() {
  const stackUser = await stackServerApp.getUser()
  
  if (!stackUser) return null

  return prisma.user.findUnique({
    where: { stackAuthId: stackUser.id },
    include: {
      lists: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}
