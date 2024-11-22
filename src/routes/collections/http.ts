import { HttpApiBuilder } from "@effect/platform"
import { Effect } from "effect"
import { Api } from "~/api"

export const HttpCollectionsLive = HttpApiBuilder.group(Api, "Collection", (handlers) =>
	Effect.gen(function* () {
		return handlers
			.handle("createCollection", () =>
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
