import { Effect, TMap } from "effect"
import type { ResourceServiceImpl } from "../../resource-service"
import { StripeCustomerProvider } from "./customer"

export class StripeApi extends Effect.Service<StripeApi>()("StripeApi", {
	effect: Effect.gen(function* () {
		const stripeCustomerProvider = yield* StripeCustomerProvider

		const collectionMap = yield* TMap.empty<string, ResourceServiceImpl>()

		yield* TMap.set(collectionMap, "customers", stripeCustomerProvider)

		return collectionMap
	}),
	dependencies: [StripeCustomerProvider.Default],
}) {}
