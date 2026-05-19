import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/index";
import { graphVersions } from "#/db/schema";
import type { GraphData } from "#/types/mission";

export const loadCurrentGraph = createServerFn({ method: "GET" }).handler(
	async () => {
		const [row] = await db
			.select()
			.from(graphVersions)
			.where(
				and(eq(graphVersions.isCurrent, true), isNull(graphVersions.deletedAt)),
			)
			.limit(1);
		return {
			id: row?.id ?? null,
			label: row?.label ?? null,
			data: (row?.data ?? { missions: [], edges: [] }) as GraphData,
		};
	},
);

export const listGraphVersions = createServerFn({ method: "GET" }).handler(
	async () => {
		return db
			.select({
				id: graphVersions.id,
				label: graphVersions.label,
				isCurrent: graphVersions.isCurrent,
				createdAt: graphVersions.createdAt,
			})
			.from(graphVersions)
			.where(isNull(graphVersions.deletedAt))
			.orderBy(desc(graphVersions.createdAt))
			.limit(50);
	},
);

// Overwrite an existing version in place (regular Save)
export const updateGraph = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string().uuid(), data: z.any() }))
	.handler(async ({ data: { id, data } }) => {
		const [row] = await db
			.update(graphVersions)
			.set({ data })
			.where(eq(graphVersions.id, id))
			.returning();
		return row;
	});

// Insert a new snapshot row and mark it as current
export const saveGraphVersion = createServerFn({ method: "POST" })
	.inputValidator(z.object({ data: z.any(), label: z.string().min(1) }))
	.handler(async ({ data: { data, label } }) => {
		await db.update(graphVersions).set({ isCurrent: false });
		const [row] = await db
			.insert(graphVersions)
			.values({ data, label, isCurrent: true })
			.returning();
		return row;
	});

// Soft-delete a version; if it was current, promote the most-recent non-deleted version
export const deleteGraphVersion = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string().uuid() }))
	.handler(async ({ data: { id } }) => {
		const [deleted] = await db
			.update(graphVersions)
			.set({ deletedAt: new Date(), isCurrent: false })
			.where(eq(graphVersions.id, id))
			.returning();
		if (deleted?.isCurrent) {
			const [next] = await db
				.select()
				.from(graphVersions)
				.where(isNull(graphVersions.deletedAt))
				.orderBy(desc(graphVersions.createdAt))
				.limit(1);
			if (next) {
				await db
					.update(graphVersions)
					.set({ isCurrent: true })
					.where(eq(graphVersions.id, next.id));
			}
		}
	});

// Set a specific version as current (clears all others first)
export const setCurrentVersion = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string().uuid() }))
	.handler(async ({ data: { id } }) => {
		await db.update(graphVersions).set({ isCurrent: false });
		const [row] = await db
			.update(graphVersions)
			.set({ isCurrent: true })
			.where(eq(graphVersions.id, id))
			.returning();
		return row;
	});
