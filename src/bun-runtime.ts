import { Effect, Layer } from "effect"

import { Providers } from "./services/providers/providers-service"

import { BunRuntime } from "@effect/platform-bun"
import Hatchet from "@hatchet-dev/typescript-sdk"
import { collectionSyncWorkflow } from "./hatchet-workflows/collection-sync"
import { resourceSyncWorkflow } from "./hatchet-workflows/resource-sync"
import { withLogFormat, withMinimalLogLevel } from "./lib/logger"
import { SyncingService } from "./services/core/syncing-service"
import { DrizzleLive } from "./services/db-service"
import { DevToolsLive } from "./services/devtools-service"
import { OpenTelemtryLive } from "./services/open-telemntry-service"
import { SyncJobService } from "./services/sync-jobs-service"

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

const program = Effect.gen(function* (_) {
	const hatchet = Hatchet.init()

	const worker = yield* Effect.promise(() => hatchet.worker("typescript-worker"))

	worker.registerWorkflow(collectionSyncWorkflow)
	worker.registerWorkflow(resourceSyncWorkflow)

	yield* Effect.promise(() => worker.start())

	yield* Effect.addFinalizer(() => Effect.promise(() => worker.exitGracefully(true)))
})

const runnable = Effect.scoped(program)

BunRuntime.runMain(runnable.pipe(Effect.provide(MainLayer)))

// TODO: Implement Ratelimiting for CollectionService
