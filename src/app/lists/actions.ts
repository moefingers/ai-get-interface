'use server'

import { prisma } from '@/lib/db'
import { syncUser } from '@/lib/sync-user'
import { generateListToken, generateSlug } from '@/lib/auth-utils'
import type { AiModel } from '@/lib/ai-instructions'
import type { ListFieldDefinition } from '@/types/list-fields'

// ============================================
// TYPES
// ============================================

export interface CreateDraftResult {
  success: true
  list: {
    id: string
    name: string
    slug: string
    isDraft: true
  }
}

export interface CreateDraftError {
  success: false
  error: string
}

export type CreateDraftResponse = CreateDraftResult | CreateDraftError

export interface PublishListInput {
  listId: string
  name: string
  aiModel: AiModel
  fields: ListFieldDefinition[]
}

export interface PublishListResult {
  success: true
  list: {
    id: string
    name: string
    slug: string
    authToken: string
    aiModel: string
    fields: ListFieldDefinition[]
  }
}

export interface PublishListError {
  success: false
  error: string
  code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'SLUG_EXISTS' | 'VALIDATION_ERROR' | 'UNKNOWN'
}

export type PublishListResponse = PublishListResult | PublishListError

// Legacy type aliases for compatibility
export type CreateListInput = PublishListInput
export type CreateListResult = PublishListResult
export type CreateListError = PublishListError
export type CreateListResponse = PublishListResponse

// ============================================
// DRAFT ACTIONS
// ============================================

/**
 * Creates a new draft list
 */
export async function createDraft(): Promise<CreateDraftResponse> {
  try {
    const user = await syncUser()
    if (!user) {
      return { success: false, error: 'You must be signed in' }
    }

    // Generate unique slug for draft
    const timestamp = Date.now()
    const slug = `draft-${timestamp}`
    const authToken = generateListToken()

    const list = await prisma.list.create({
      data: {
        name: 'New List',
        slug,
        authToken,
        isDraft: true,
        userId: user.id,
      },
    })

    return {
      success: true,
      list: {
        id: list.id,
        name: list.name,
        slug: list.slug,
        isDraft: true,
      },
    }
  } catch (error) {
    console.error('Failed to create draft:', error)
    return { success: false, error: 'Failed to create draft' }
  }
}

/**
 * Deletes a draft list
 */
export async function deleteDraft(listId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await syncUser()
    if (!user) {
      return { success: false, error: 'You must be signed in' }
    }

    // Only delete if it's actually a draft owned by this user
    const list = await prisma.list.findFirst({
      where: { id: listId, userId: user.id, isDraft: true },
    })

    if (!list) {
      return { success: false, error: 'Draft not found' }
    }

    await prisma.list.delete({ where: { id: listId } })
    return { success: true }
  } catch (error) {
    console.error('Failed to delete draft:', error)
    return { success: false, error: 'Failed to delete draft' }
  }
}

// ============================================
// UPDATE DRAFT ACTIONS
// ============================================

export interface UpdateDraftInput {
  listId: string
  name?: string
  aiModel?: AiModel
  fields?: ListFieldDefinition[]
}

export interface UpdateDraftResult {
  success: true
  list: {
    id: string
    name: string
    slug: string
    aiModel: string | null
    fields: ListFieldDefinition[]
  }
}

export interface UpdateDraftError {
  success: false
  error: string
}

export type UpdateDraftResponse = UpdateDraftResult | UpdateDraftError

/**
 * Updates a draft list (auto-save)
 */
export async function updateDraft(input: UpdateDraftInput): Promise<UpdateDraftResponse> {
  try {
    const user = await syncUser()
    if (!user) {
      return { success: false, error: 'You must be signed in' }
    }

    // Verify ownership and draft status
    const existing = await prisma.list.findFirst({
      where: { id: input.listId, userId: user.id, isDraft: true },
    })

    if (!existing) {
      return { success: false, error: 'Draft not found' }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    
    if (input.name !== undefined) {
      updateData.name = input.name.trim() || 'New List'
    }
    
    if (input.aiModel !== undefined) {
      updateData.aiModel = input.aiModel
    }
    
    if (input.fields !== undefined) {
      // Ensure fields have proper order
      const orderedFields = input.fields.map((f, i) => ({ ...f, order: i }))
      updateData.fields = orderedFields
    }

    const list = await prisma.list.update({
      where: { id: input.listId },
      data: updateData,
    })

    // Parse fields back for response
    const parsedFields = Array.isArray(list.fields) 
      ? (list.fields as unknown as ListFieldDefinition[])
      : []

    return {
      success: true,
      list: {
        id: list.id,
        name: list.name,
        slug: list.slug,
        aiModel: list.aiModel,
        fields: parsedFields,
      },
    }
  } catch (error) {
    console.error('Failed to update draft:', error)
    return { success: false, error: 'Failed to save draft' }
  }
}

// ============================================
// PUBLISH ACTIONS
// ============================================

/**
 * Publishes a draft list (finalizes it)
 */
export async function publishList(input: PublishListInput): Promise<PublishListResponse> {
  try {
    const user = await syncUser()
    if (!user) {
      return {
        success: false,
        error: 'You must be signed in to publish a list',
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

    // Validate fields
    if (!input.fields || input.fields.length === 0) {
      return {
        success: false,
        error: 'At least one field is required',
        code: 'VALIDATION_ERROR',
      }
    }

    for (const field of input.fields) {
      if (!field.name || !field.label || !field.type) {
        return {
          success: false,
          error: 'Each field must have name, label, and type',
          code: 'VALIDATION_ERROR',
        }
      }
    }

    // Find the draft
    const draft = await prisma.list.findFirst({
      where: { id: input.listId, userId: user.id, isDraft: true },
    })

    if (!draft) {
      return {
        success: false,
        error: 'Draft not found',
        code: 'NOT_FOUND',
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

    // Check for slug collision (excluding this draft)
    const existingList = await prisma.list.findFirst({
      where: {
        userId: user.id,
        slug,
        id: { not: input.listId },
      },
    })

    if (existingList) {
      return {
        success: false,
        error: `You already have a list with the URL "${slug}". Please choose a different name.`,
        code: 'SLUG_EXISTS',
      }
    }

    // Ensure fields have proper order
    const orderedFields = input.fields.map((f, i) => ({ ...f, order: i }))

    // Update the draft to published
    const list = await prisma.list.update({
      where: { id: input.listId },
      data: {
        name,
        slug,
        fields: orderedFields,
        aiModel: input.aiModel,
        isDraft: false,
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
        fields: orderedFields,
      },
    }
  } catch (error) {
    console.error('Failed to publish list:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN',
    }
  }
}

// Legacy alias
export const createList = publishList

// ============================================
// READ ACTIONS
// ============================================

/**
 * Gets all lists for the authenticated user (including drafts)
 */
export async function getUserLists() {
  const user = await syncUser()
  if (!user) return []

  return prisma.list.findMany({
    where: { userId: user.id },
    orderBy: [
      { isDraft: 'desc' },  // Drafts first
      { createdAt: 'desc' },
    ],
    select: {
      id: true,
      name: true,
      slug: true,
      aiModel: true,
      fields: true,
      isDraft: true,
      isActive: true,
      authToken: true,
      createdAt: true,
      _count: {
        select: { items: true },
      },
    },
  })
}

/**
 * Gets a single list by ID
 */
export async function getListById(listId: string) {
  const user = await syncUser()
  if (!user) return null

  return prisma.list.findFirst({
    where: { id: listId, userId: user.id },
    select: {
      id: true,
      name: true,
      slug: true,
      aiModel: true,
      fields: true,
      isDraft: true,
      isActive: true,
      authToken: true,
      createdAt: true,
    },
  })
}
