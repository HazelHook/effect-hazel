import { Effect, Exit, Layer } from "effect"

import { Providers } from "./services/providers/providers-service"

import { DrizzleLive } from "./services/db-service"
import { DevToolsLive } from "./services/devtools-service"
import { OpenTelemtryLive } from "./services/open-telemntry-service"
import { SyncingService } from "./services/syncing-service"

const MainLayer = Layer.mergeAll(DevToolsLive, Providers.Default, SyncingService.Default, DrizzleLive)

const program = Effect.gen(function* () {
	const syncingService = yield* SyncingService

	yield* syncingService.syncCollection("stripe", "customers")
}).pipe(Effect.provide(MainLayer), Effect.provide(OpenTelemtryLive))

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

// TODO: Implement Sync Function
// TODO: How to implement retries?
// TODO: Implement Ratelimiting for CollectionService
