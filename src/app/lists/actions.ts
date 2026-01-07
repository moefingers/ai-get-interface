'use server'

import { prisma } from '@/lib/db'
import { syncUser } from '@/lib/sync-user'
import { generateListToken, generateSlug } from '@/lib/auth-utils'
import type { AiModel } from '@/lib/ai-instructions'

export interface CreateListInput {
  name: string
  aiModel: AiModel
}

export interface CreateListResult {
  success: true
  list: {
    id: string
    name: string
    slug: string
    authToken: string
    aiModel: string
  }
}

export interface CreateListError {
  success: false
  error: string
  code: 'UNAUTHORIZED' | 'SLUG_EXISTS' | 'VALIDATION_ERROR' | 'UNKNOWN'
}

export type CreateListResponse = CreateListResult | CreateListError

/**
 * Creates a new list for the authenticated user
 */
export async function createList(input: CreateListInput): Promise<CreateListResponse> {
  try {
    // Ensure user is authenticated and synced
    const user = await syncUser()
    if (!user) {
      return {
        success: false,
        error: 'You must be signed in to create a list',
        code: 'UNAUTHORIZED',
      }
    }

    // Validate input
    const name = input.name.trim()
    if (!name) {
      return {
        success: false,
        error: 'List name is required',
        code: 'VALIDATION_ERROR',
      }
    }

    if (name.length > 100) {
      return {
        success: false,
        error: 'List name must be 100 characters or less',
        code: 'VALIDATION_ERROR',
      }
    }

    // Generate slug from name
    const slug = generateSlug(name)
    if (!slug) {
      return {
        success: false,
        error: 'Could not generate a valid URL slug from this name',
        code: 'VALIDATION_ERROR',
      }
    }

    // Check for slug collision
    const existingList = await prisma.list.findUnique({
      where: {
        userId_slug: {
          userId: user.id,
          slug,
        },
      },
    })

    if (existingList) {
      return {
        success: false,
        error: `You already have a list with the URL "${slug}". Please choose a different name.`,
        code: 'SLUG_EXISTS',
      }
    }

    // Generate unique auth token
    const authToken = generateListToken()

    // Create the list
    const list = await prisma.list.create({
      data: {
        name,
        slug,
        authToken,
        aiModel: input.aiModel,
        userId: user.id,
      },
    })

    return {
      success: true,
      list: {
        id: list.id,
        name: list.name,
        slug: list.slug,
        authToken: list.authToken,
        aiModel: list.aiModel!,
      },
    }
  } catch (error) {
    console.error('Failed to create list:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN',
    }
  }
}

/**
 * Gets all lists for the authenticated user
 */
export async function getUserLists() {
  const user = await syncUser()
  if (!user) return []

  return prisma.list.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      aiModel: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: { items: true },
      },
    },
  })
}
