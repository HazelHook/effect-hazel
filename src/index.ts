import { Effect, Layer } from "effect"

import { Providers } from "./services/providers/providers-service"

import { BunRuntime } from "@effect/platform-bun"
import Hatchet from "@hatchet-dev/typescript-sdk"
import { HazelError } from "./errors"
import { withLogFormat, withMinimalLogLevel } from "./lib/logger"
import { SyncingService } from "./services/core/syncing-service"
import { DrizzleLive } from "./services/db-service"
import { DevToolsLive } from "./services/devtools-service"
import { OpenTelemtryLive } from "./services/open-telemntry-service"
import { SyncJobService } from "./services/sync-jobs-service"
import { collectionSyncWorkflow } from "./workflows/collection-sync"
import { resourceSyncWorkflow } from "./workflows/resource-sync"

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

const workerAcquire = Effect.gen(function* () {
	const hatchet = Hatchet.init()

	return yield* Effect.tryPromise({
		try: () => hatchet.worker("typescript-worker"),
		catch: (e) =>
			new HazelError({
				code: "WORKER_NOT_FOUND",
				message: "Worker not found",
				cause: e,
			}),
	})
})

const program = Effect.gen(function* (_) {
	const worker = yield* Effect.acquireRelease(workerAcquire, (worker) =>
		Effect.promise(() => worker.exitGracefully(true)),
	)

	worker.registerWorkflow(collectionSyncWorkflow)
	worker.registerWorkflow(resourceSyncWorkflow)

	yield* Effect.promise(() => worker.start())

	yield* Effect.addFinalizer(() => Effect.promise(() => worker.exitGracefully(true)))
})

const runnable = Effect.scoped(program)

BunRuntime.runMain(runnable.pipe(Effect.provide(MainLayer)))

// TODO: Implement Ratelimiting for CollectionService
