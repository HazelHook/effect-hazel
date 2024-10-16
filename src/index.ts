import { Effect, Exit, Layer } from "effect"

import { Providers } from "./services/providers/providers-service"

import Hatchet from "@hatchet-dev/typescript-sdk"
import { DrizzleLive } from "./services/db-service"
import { DevToolsLive } from "./services/devtools-service"
import { OpenTelemtryLive } from "./services/open-telemntry-service"
import { SyncingService } from "./services/syncing-service"
import { collectionSyncWorkflow } from "./workflows/collection-sync"

const hatchet = Hatchet.init()

export const MainLayer = Layer.mergeAll(
	DevToolsLive,
	Providers.Default,
	SyncingService.Default,
	DrizzleLive,
	OpenTelemtryLive,
)

const program = Effect.gen(function* () {
	const syncingService = yield* SyncingService

	yield* syncingService.syncResource("dd59064c-1615-4d0e-9897-e14a11722d04", "stripe", "customers")
}).pipe(Effect.provide(MainLayer))

const exit = await Effect.runPromiseExit(program)

Exit.match(exit, {
	onFailure: (cause) => {
		console.log(cause)
		console.log("Failure!")
	},
	onSuccess: () => {
		console.log("Success!")
	},
})

// program.pipe(
// 	Effect.catchTags({
// 		// ParseError: () => Effect.succeed("Parse error"),
// 	}),
// 	BunRuntime.runMain,
// )

// TODO: Implement Ratelimiting for CollectionService
// TODO: Implement Hatchet Worker Stuff

const worker = await hatchet.worker("typescript-worker")

worker.registerWorkflow(collectionSyncWorkflow)

await worker.start()
