import { HttpApiBuilder } from "@effect/platform"
import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import { Effect } from "effect"
import { Api } from "~/api"

export const HttpCollectionsLive = HttpApiBuilder.group(Api, "Collection", (handlers) =>
	Effect.gen(function* () {
		const db = yield* PgDrizzle
		return handlers
			.handle("createCollection", ({ payload }) =>
				Effect.gen(function* () {
					return yield* Effect.succeed("OK")
				}),
			)
			.handle("deleteCollection", () =>
				Effect.gen(function* () {
					return yield* Effect.succeed("OK")
				}),
			)
			.handle("updateCollection", () =>
				Effect.gen(function* () {
					return yield* Effect.succeed("OK")
				}),
			)
	}),
)
