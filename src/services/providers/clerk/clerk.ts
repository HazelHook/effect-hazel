import { Effect, TMap } from "effect"
import type { ResourceServiceImpl } from "../../resource-service"

export class ClerkApi extends Effect.Service<ClerkApi>()("ClerkApi", {
	effect: Effect.gen(function* () {
		const collectionMap = yield* TMap.empty<string, ResourceServiceImpl>()

		// yield* TMap.set(collectionMap, "customers", stripeCustomerProvider)

		return collectionMap
	}),
	dependencies: [],
}) {}
