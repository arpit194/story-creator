import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const characters = pgTable('characters', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  nickname: text().notNull().default(''),
  age: integer().notNull().default(0),
  gender: text().notNull().default(''),
  occupation: text().notNull().default(''),
  description: text().notNull().default(''),
  deletedAt: timestamp('deleted_at'),
})

export const buildings = pgTable('buildings', {
  id: uuid().primaryKey().defaultRandom(),
  buildingName: text('building_name').notNull(),
  deletedAt: timestamp('deleted_at'),
})

export const storyFiles = pgTable('story_files', {
  id: uuid().primaryKey().defaultRandom(),
  path: text().notNull().unique(), // e.g. "notes" or "lore/world-building"
  content: text().notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const graphVersions = pgTable('graph_versions', {
  id: uuid().primaryKey().defaultRandom(),
  label: text(),
  data: jsonb().notNull().default({}),
  isCurrent: boolean('is_current').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})
