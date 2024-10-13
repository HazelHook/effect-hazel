import { Effect, TMap } from "effect"
import type { CollectionServiceImpl } from "../../collection-service"

export class ClerkApi extends Effect.Service<ClerkApi>()("ClerkApi", {
	effect: Effect.gen(function* () {
		const collectionMap = yield* TMap.empty<string, CollectionServiceImpl>()

		// yield* TMap.set(collectionMap, "customers", stripeCustomerProvider)

		return collectionMap
	}),
	dependencies: [],
}) {}
