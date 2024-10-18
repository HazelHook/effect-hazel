import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import type { Context, Workflow } from "@hatchet-dev/typescript-sdk"
import { Effect, Either, Exit } from "effect"

import { BunRuntime } from "@effect/platform-bun"
import { eq, sql } from "drizzle-orm"
import { MainLayer } from ".."
import * as schema from "../drizzle/schema"
import { ChildJobError, CollectionNotFoundError, HazelError } from "../errors"
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

		yield* Effect.logInfo("Syncing Collection", collection.name)

		yield* db
			.update(schema.syncJobs)
			.set({
				status: "running",
				syncJobId: ctx.data.input.syncJobId,
				startedAt: sql`now()`,
				completedAt: sql`NULL`,
				canceledAt: sql`NULL`,
			})
			.where(eq(schema.syncJobs.id, ctx.data.input.syncJobId))

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

		const finishedJobs = yield* Effect.all(childJobs, {
			concurrency: "unbounded",
			mode: "either",
		})

		const sucessfulJobs = finishedJobs.filter((job) => Either.isRight(job))
		const failedJobs = finishedJobs.filter((job) => Either.isLeft(job))

		yield* Effect.logInfo("Successful Jobs", sucessfulJobs.length)
		yield* Effect.logInfo("Failed Jobs", failedJobs.length)

		if (failedJobs.length > 0) {
			// TODO: Do something smarter here with these errors
			yield* db
				.update(schema.syncJobs)
				.set({
					status: "error",
					errorMessage: `Failed to sync ${failedJobs.length} resources`,
				})
				.where(eq(schema.syncJobs.id, ctx.data.input.syncJobId))

			return { success: true }
		}

		yield* db
			.update(schema.syncJobs)
			.set({
				status: "completed",
				completedAt: sql`now()`,
			})
			.where(eq(schema.syncJobs.id, ctx.data.input.syncJobId))

		return { success: true }
	}).pipe(Effect.withSpan("collection-sync"))

export const collectionSyncWorkflow: Workflow = {
	id: "collection-sync-ts",
	description: "Workflow to Sync a Collection with all of its resources",
	on: {
		event: "collection:sync",
	},
	steps: [
		{
			name: "sync",
			run: async (ctx: Context<WorkflowInput>) => {
				const exit = await Effect.runPromiseExit(effectWorkflow(ctx).pipe(Effect.provide(MainLayer)))

				return Exit.match(exit, {
					onFailure: (cause) => {
						throw new Error(`Failed with failure state ${cause._tag}`)
					},
					onSuccess: (values) => {
						return values
					},
				})
			},
		},
	],
}
