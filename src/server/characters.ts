import { createServerFn } from '@tanstack/react-start'
import { eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/db/index'
import { characters } from '#/db/schema'

export const getCharacters = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select()
      .from(characters)
      .where(isNull(characters.deletedAt))
      .orderBy(characters.name)
  },
)

const characterInput = z.object({
  name: z.string().min(1),
  nickname: z.string(),
  age: z.number().int().min(0),
  gender: z.string(),
  occupation: z.string(),
  description: z.string(),
})

export const createCharacter = createServerFn({ method: 'POST' })
  .inputValidator(characterInput)
  .handler(async ({ data }) => {
    const [row] = await db.insert(characters).values(data).returning()
    return row
  })

export const updateCharacter = createServerFn({ method: 'POST' })
  .inputValidator(characterInput.extend({ id: z.string().uuid() }))
  .handler(async ({ data: { id, ...fields } }) => {
    const [row] = await db
      .update(characters)
      .set(fields)
      .where(eq(characters.id, id))
      .returning()
    return row
  })

export const deleteCharacter = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await db
      .update(characters)
      .set({ deletedAt: new Date() })
      .where(eq(characters.id, data.id))
  })
