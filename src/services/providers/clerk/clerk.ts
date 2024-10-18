import { Effect, TMap } from "effect"
import type { ResourceServiceImpl } from "../../core/resource-service"
import { ClerkUserProvider } from "./user"

export class ClerkApi extends Effect.Service<ClerkApi>()("ClerkApi", {
	effect: Effect.gen(function* () {
		const clerkUserProvider = yield* ClerkUserProvider

		const collectionMap = yield* TMap.empty<string, ResourceServiceImpl>()

		yield* TMap.set(collectionMap, "users", clerkUserProvider)

		return collectionMap
	}),
	dependencies: [ClerkUserProvider.Default],
}) {}
