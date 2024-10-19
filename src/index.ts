import { Effect, Layer } from "effect"

import { Providers } from "./services/providers/providers-service"

import { BunRuntime } from "@effect/platform-bun"
import Hatchet from "@hatchet-dev/typescript-sdk"
import { withLogFormat, withMinimalLogLevel } from "./lib/logger"
import { SyncingService } from "./services/core/syncing-service"
import { DrizzleLive } from "./services/db-service"
import { DevToolsLive } from "./services/devtools-service"
import { OpenTelemtryLive } from "./services/open-telemntry-service"
import { collectionSyncWorkflow } from "./workflows/collection-sync"
import { resourceSyncWorkflow } from "./workflows/resource-sync"

const hatchet = Hatchet.init()

export const MainLayer = Layer.mergeAll(
	withLogFormat,
	withMinimalLogLevel,
	OpenTelemtryLive,
	DevToolsLive,
	Providers.Default,
	SyncingService.Default,
	DrizzleLive,
)

const program = Effect.gen(function* (_) {
	const worker = yield* Effect.promise(() => hatchet.worker("typescript-worker"))

	worker.registerWorkflow(collectionSyncWorkflow)
	worker.registerWorkflow(resourceSyncWorkflow)

	yield* Effect.promise(() => worker.start())
})

BunRuntime.runMain(program.pipe(Effect.provide(MainLayer)))

// TODO: Implement Ratelimiting for CollectionService
