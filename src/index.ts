import { DateTime, Effect, Either, Layer, Schema, pipe } from "effect"

import { HttpApiBuilder, HttpMiddleware } from "@effect/platform"
import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import { ChildJobError, CollectionNotFoundError } from "./errors"
import { HttpAppLive } from "./http"
import { Workflow, Workflows, makeWorkflow } from "./lib/cloudflare/workflows"
import { withLogFormat, withMinimalLogLevel } from "./lib/logger"
import { SyncingService } from "./services/core/syncing-service"
import { DrizzleLive } from "./services/db-service"
import { DevToolsLive } from "./services/devtools-service"
import { OpenTelemtryLive } from "./services/open-telemntry-service"
import { Providers } from "./services/providers/providers-service"
import { SyncJobService } from "./services/sync-jobs-service"

import { eq } from "drizzle-orm"
import * as schema from "./drizzle/schema"
import type { ResourceSyncWorkflowInput } from "./workflows/resource-sync"

declare global {
	var env: Env

	type WorkflowsBinding = typeof workflows
}

export const MainLayer = Layer.mergeAll(
	withLogFormat,
	withMinimalLogLevel,
	OpenTelemtryLive,
	DevToolsLive,
	Providers.Default,
	SyncingService.Default,
	SyncJobService.Default,
	DrizzleLive,
)

export const MyWorkflow = makeWorkflow(
	{
		name: "MyWorkflow",
		binding: "MY_WORKFLOW",
		schema: Schema.Struct({
			collectionId: Schema.String,
			syncJobId: Schema.String,
		}),
	},
	(args) =>
		Effect.gen(function* () {
			const db = yield* PgDrizzle

			const syncJobService = yield* SyncJobService

			const collection = (yield* db
				.select()
				.from(schema.collections)
				.where(eq(schema.collections.id, args.collectionId)))[0]

			if (!collection) {
				return yield* new CollectionNotFoundError(args.collectionId)
			}

			yield* Effect.logInfo("Syncing Collection", collection.name)

			// yield* syncJobService.startSyncJob(args.syncJobId, ctx.workflowRunId())

			// const childJobs = []

			// for (const resource of collection.resources) {
			// 	// TODO: Extract to service
			// 	const resourceSyncJob = (yield* db
			// 		.insert(schema.syncJobs)
			// 		.values({
			// 			collectionId: args.collectionId,
			// 			status: "pending",
			// 			syncJobId: args.syncJobId,
			// 			resourceKey: resource,
			// 		})
			// 		.returning())[0]!

			// 	const resourceWorklfowInput: ResourceSyncWorkflowInput = {
			// 		collectionId: args.collectionId,
			// 		resourceKey: resource,
			// 		providerKey: collection.providerId,
			// 		resourceSyncJobId: resourceSyncJob.id,
			// 	}

			// 	// childJobs.push(
			// 	// 	Effect.tryPromise({
			// 	// 		try: () => Effect.logInfo("WOW"),
			// 	// 		// try: () => ctx.spawnWorkflow("resource-sync-ts", resourceWorklfowInput).result(),
			// 	// 		catch: (err) => new ChildJobError(),
			// 	// 	}),
			// 	// )
			// }

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

			yield* syncJobService.setSyncJobStatus(args.syncJobId, "completed")

			return { success: true }
		}).pipe(Effect.withSpan("collection-sync-workflow"), Effect.provide(MainLayer), Effect.catchAll(Effect.die)),
)

const HttpLive = Layer.mergeAll(HttpAppLive).pipe(Layer.provide(Workflows.fromRecord(() => workflows)))

const Live = HttpLive.pipe()

// TODO: Implement Ratelimiting for CollectionService

export default {
	async fetch(request, env): Promise<Response> {
		Object.assign(globalThis, {
			env,
		})

		Object.assign(process, {
			env,
		})

		const handler = HttpApiBuilder.toWebHandler(Live, {
			middleware: HttpMiddleware.logger,
		})

		return handler.handler(request)
	},
} satisfies ExportedHandler<Env>

const workflows = {
	MyWorkflow,
}
