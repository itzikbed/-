'use server'

export { applyAsPublisherAction } from './publisher-actions'
export { upsertCatAction, deleteCatAction, markAsAdoptedAction } from './cat-actions'
export type { ActionResult } from '@/app/(auth)/actions'
export type { PublisherApplicationInput } from '@/lib/schemas/publisher'
export type { CatInput } from '@/lib/schemas/cat'
