import { Config, Effect, Layer, Option, TMap } from "effect"

import * as PgDrizzle from "@effect/sql-drizzle/Pg"

import { PgClient } from "@effect/sql-pg"
import { CollectionNotFoundError, ProviderNotFoundError } from "./errors"
import { Providers } from "./services/providers/providers-service"

import { BunRuntime } from "@effect/platform-bun"
import { DevToolsLive } from "./services/devtools-service"
import { OpenTelemtryLive } from "./services/open-telemntry-service"

const PgLive = PgClient.layer({
	database: Config.succeed("postgres"),
	username: Config.succeed("postgres"),
})

const DrizzleLive = PgDrizzle.layer.pipe(Layer.provide(PgLive))

const MainLayer = Layer.mergeAll(DevToolsLive, Providers.Default)

const program = Effect.gen(function* () {
	const providers = yield* Providers

	const stripeProvider = yield* Effect.map(
		TMap.get(providers, "stripe"),
		Option.getOrThrowWith(() => new ProviderNotFoundError("stripe")),
	)
	const clerkProvider = yield* Effect.map(
		TMap.get(providers, "clerk"),
		Option.getOrThrowWith(() => new ProviderNotFoundError("clerk")),
	)

	const stripeCustomerApi = yield* Effect.map(
		TMap.get(stripeProvider, "customers"),
		Option.getOrThrowWith(() => new CollectionNotFoundError("clerk", "customers")),
	)

	const res = yield* stripeCustomerApi.getEntry("customers", yield* Config.string("TEST_TOKEN"), "cus_PNOSY2QB1DXged")
	const res2 = yield* stripeCustomerApi.getEntries("customers", yield* Config.string("TEST_TOKEN"), {
		type: "cursor",
		cursorId: Option.none(),
		limit: 3,
	})

	yield* Effect.log(res)
}).pipe(Effect.provide(MainLayer), Effect.provide(OpenTelemtryLive))

program.pipe(
	Effect.catchTags({
		// ParseError: () => Effect.succeed("Parse error"),
	}),
	BunRuntime.runMain,
)

// TODO: Implement Sync Function
// TODO: How to implement retries?
// TODO: Implement Ratelimiting for CollectionService
