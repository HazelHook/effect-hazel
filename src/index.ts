import { Config, Effect, Exit, Layer, Option, TMap } from "effect"

import * as PgDrizzle from "@effect/sql-drizzle/Pg"

import { PgClient } from "@effect/sql-pg"
import { CollectionNotFoundError, ProviderNotFoundError } from "./errors"
import { Providers } from "./services/providers/providers-service"

import { BunRuntime } from "@effect/platform-bun"
import { DevToolsLive } from "./services/devtools-service"
import { OpenTelemtryLive } from "./services/open-telemntry-service"
import { SyncingService } from "./services/syncing-service"

const PgLive = PgClient.layer({
	database: Config.succeed("postgres"),
	username: Config.succeed("postgres"),
})

const DrizzleLive = PgDrizzle.layer.pipe(Layer.provide(PgLive))

const MainLayer = Layer.mergeAll(DevToolsLive, Providers.Default, SyncingService.Default)

const program = Effect.gen(function* () {
	const syncingService = yield* SyncingService

	yield* syncingService.syncCollection("stripe", "customers")
}).pipe(Effect.provide(MainLayer), Effect.provide(OpenTelemtryLive))

const exit = await Effect.runPromiseExit(program)

Exit.match(exit, {
	onFailure: (cause) => {
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
