import { createServerFn } from '@tanstack/react-start'
import { eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/db/index'
import { buildings } from '#/db/schema'

export const getBuildings = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select()
      .from(buildings)
      .where(isNull(buildings.deletedAt))
      .orderBy(buildings.buildingName)
  },
)

const buildingInput = z.object({
  buildingName: z.string().min(1),
})

export const createBuilding = createServerFn({ method: 'POST' })
  .inputValidator(buildingInput)
  .handler(async ({ data }) => {
    const [row] = await db.insert(buildings).values(data).returning()
    return row
  })

export const updateBuilding = createServerFn({ method: 'POST' })
  .inputValidator(buildingInput.extend({ id: z.string().uuid() }))
  .handler(async ({ data: { id, ...fields } }) => {
    const [row] = await db
      .update(buildings)
      .set(fields)
      .where(eq(buildings.id, id))
      .returning()
    return row
  })

export const deleteBuilding = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await db
      .update(buildings)
      .set({ deletedAt: new Date() })
      .where(eq(buildings.id, data.id))
  })
