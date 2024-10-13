import { Effect, TMap } from "effect"
import type { HttpServiceImpl } from "../../http-service"

export class ClerkApi extends Effect.Service<ClerkApi>()("ClerkApi", {
	effect: Effect.gen(function* () {
		const collectionMap = yield* TMap.empty<string, HttpServiceImpl>()

		// yield* TMap.set(collectionMap, "customers", stripeCustomerProvider)

		return collectionMap
	}),
	dependencies: [],
}) {}
