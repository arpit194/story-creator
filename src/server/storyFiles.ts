import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/db/index'
import { storyFiles } from '#/db/schema'

export const listStoryFiles = createServerFn({ method: 'GET' }).handler(async () => {
  return db
    .select({ id: storyFiles.id, path: storyFiles.path, updatedAt: storyFiles.updatedAt })
    .from(storyFiles)
    .orderBy(storyFiles.path)
})

export const getStoryFile = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    const [row] = await db.select().from(storyFiles).where(eq(storyFiles.id, id)).limit(1)
    return row ?? null
  })

export const createStoryFile = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ path: z.string().min(1) }))
  .handler(async ({ data: { path } }) => {
    const [row] = await db.insert(storyFiles).values({ path }).returning()
    return row
  })

export const saveStoryFile = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().uuid(), content: z.string() }))
  .handler(async ({ data: { id, content } }) => {
    const [row] = await db
      .update(storyFiles)
      .set({ content, updatedAt: new Date() })
      .where(eq(storyFiles.id, id))
      .returning()
    return row
  })

export const renameStoryFile = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().uuid(), path: z.string().min(1) }))
  .handler(async ({ data: { id, path } }) => {
    const [row] = await db
      .update(storyFiles)
      .set({ path, updatedAt: new Date() })
      .where(eq(storyFiles.id, id))
      .returning()
    return row
  })

export const deleteStoryFile = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    await db.delete(storyFiles).where(eq(storyFiles.id, id))
  })
