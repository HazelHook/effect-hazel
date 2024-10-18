import { Effect, Exit, Layer, Logger } from "effect"

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
	DevToolsLive,
	Providers.Default,
	SyncingService.Default,
	DrizzleLive,
	OpenTelemtryLive,
	Logger.pretty,
)

const program = Effect.gen(function* () {
	const syncingService = yield* SyncingService

	yield* syncingService.syncResource("e76af4f0-fa25-4387-bc64-97ff310ad5f7", "stripe", "customers")
}).pipe(Effect.provide(MainLayer))

program.pipe(
	Effect.catchTags({
		// ParseError: () => Effect.succeed("Parse error"),
	}),
	BunRuntime.runMain,
)

// TODO: Implement Ratelimiting for CollectionService
// TODO: Implement Hatchet Worker Stuff

const worker = await hatchet.worker("typescript-worker")

worker.registerWorkflow(collectionSyncWorkflow)
worker.registerWorkflow(resourceSyncWorkflow)

await worker.start()
