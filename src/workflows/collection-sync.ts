import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import type { Context, Workflow } from "@hatchet-dev/typescript-sdk"
import { Effect } from "effect"

import { eq, sql } from "drizzle-orm"
import * as schema from "../drizzle/schema"
import { ChildJobError, CollectionNotFoundError } from "../errors"
import type { ResourceSyncWorkflowInput } from "./resource-sync"

type WorkflowInput = {
	collectionId: string
	syncJobId: string
}

const effectWorkflow = (ctx: Context<WorkflowInput>) =>
	Effect.gen(function* () {
		const db = yield* PgDrizzle

		const collection = (yield* db
			.select()
			.from(schema.collections)
			.where(eq(schema.collections.id, ctx.data.input.collectionId)))[0]

		if (!collection) {
			return yield* new CollectionNotFoundError(ctx.data.input.collectionId)
		}

		yield* db.update(schema.syncJobs).set({
			status: "running",
			syncJobId: ctx.data.input.syncJobId,
			startedAt: sql`now()`,
			completedAt: sql`NULL`,
			canceledAt: sql`NULL`,
		})

		const childJobs = []

		for (const resource of collection.resources) {
			const resourceSyncJob = (yield* db
				.insert(schema.syncJobs)
				.values({
					collectionId: ctx.data.input.collectionId,
					status: "pending",
					syncJobId: ctx.data.input.syncJobId,
					resourceKey: resource,
				})
				.returning())[0]!

			const resourceWorklfowInput: ResourceSyncWorkflowInput = {
				collectionId: ctx.data.input.collectionId,
				resourceKey: resource,
				providerKey: collection.providerId,
				resourceSyncJobId: resourceSyncJob.id,
			}

			childJobs.push(
				Effect.tryPromise({
					try: () => ctx.spawnWorkflow("resource-sync-ts", resourceWorklfowInput).result(),
					catch: (err) => new ChildJobError(),
				}),
			)
		}

		// TODO Collect all children jobs to collect error messages
		const finishedJobs = yield* Effect.all(childJobs, {
			concurrency: "unbounded",
			mode: "either",
		})

		yield* db.update(schema.syncJobs).set({
			status: "completed",
			completedAt: sql`now()`,
		})

		return
	})

const workflow: Workflow = {
	id: "collection-sync-ts",
	description: "Workflow to Sync a Collection with all of its resources",
	on: {
		event: "collection:sync",
	},
	steps: [
		{
			name: "step1",
			run: async (ctx: Context<WorkflowInput>) => {
				// Effect.runPromise(effectWorkflow(ctx).pipe)
			},
		},
	],
}
