import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import { eq } from "drizzle-orm"
import { Effect, Schema, pipe } from "effect"
import { Workflow, makeWorkflow } from "~/lib/cloudflare/workflows"
import { SyncJobService } from "~/services/sync-jobs-service"

import { CollectionNotFoundError } from "~/errors"
import { SyncingService } from "~/services/core/syncing-service"
import { DrizzleLive } from "~/services/db-service"
import { MainLayer } from ".."
import * as schema from "../drizzle/schema"

export const CollectionSyncWorkflow = makeWorkflow(
	{
		name: "CollectionSyncWorkflow",
		binding: "COLLECTION_SYNC_WORKFLOW",
		schema: Schema.Struct({
			collectionId: Schema.String,
			syncJobId: Schema.String,
		}),
	},
	(args) =>
		Effect.gen(function* () {
			const workflow = yield* Workflow

			const db = yield* PgDrizzle

			const syncJobService = yield* SyncJobService

			yield* Effect.log("args", args)

			const collection = yield* workflow.do(
				"getCollection",
				pipe(
					db.select().from(schema.collections).where(eq(schema.collections.id, args.collectionId)),
					Effect.map((value) => value[0]),
				).pipe(Effect.catchAll(Effect.die)),
			)

			if (!collection) {
				return yield* new CollectionNotFoundError(args.collectionId)
			}

			yield* Effect.logInfo("Syncing Collection", collection)

			yield* workflow.do(
				"startSyncJob",
				syncJobService.startSyncJob(args.syncJobId).pipe(Effect.catchAll(Effect.die)),
			)

			// const childJobs = []

			for (const resource of collection.resources) {
				// TODO: Extract to service
				const resourceSyncJob = yield* workflow.do(
					"createResourceSyncJob",
					pipe(
						db
							.insert(schema.syncJobs)
							.values({
								collectionId: args.collectionId,
								status: "pending",
								syncJobId: args.syncJobId,
								resourceKey: resource,
							})
							.returning(),
						Effect.map((items) => items[0]!),
					).pipe(Effect.catchAll(Effect.die)),
				)

				const syncingService = yield* SyncingService

				yield* workflow.do(
					"syncResource",
					syncingService
						.syncResource(args.collectionId, collection.providerId, resource)
						.pipe(Effect.provide(DrizzleLive), Effect.catchAll(Effect.die)),
				)
				// 	// childJobs.push(
				// 	// 	Effect.tryPromise({
				// 	// 		try: () => Effect.logInfo("WOW"),
				// 	// 		// try: () => ctx.spawnWorkflow("resource-sync-ts", resourceWorklfowInput).result(),
				// 	// 		catch: (err) => new ChildJobError(),
				// 	// 	}),
				// 	// )
			}

			// const finishedJobs = yield* Effect.all(childJobs, {
			// 	concurrency: "unbounded",
			// 	mode: "either",
			// })

			// const sucessfulJobs = finishedJobs.filter((job) => Either.isRight(job))
			// const failedJobs = finishedJobs.filter((job) => Either.isLeft(job))

			// yield* Effect.logInfo("Successful Jobs", sucessfulJobs.length)
			// yield* Effect.logInfo("Failed Jobs", failedJobs.length)

			// if (failedJobs.length > 0) {
			// 	// TODO: Do something smarter here with these errors
			// 	yield* syncJobService.setSyncJobStatus(
			// 		args.syncJobId,
			// 		"error",
			// 		`Failed to sync ${failedJobs.length} resources`,
			// 	)

			// 	return { success: true }
			// }

			yield* Effect.logInfo("Syncing Collection", collection.name)

			yield* workflow.do(
				"completeJob",
				syncJobService.setSyncJobStatus(args.syncJobId, "completed").pipe(Effect.catchAll(Effect.die)),
			)

			return { success: true }
		}).pipe(Effect.withSpan("collection-sync-workflow"), Effect.provide(MainLayer), Effect.catchAll(Effect.die)),
)
