import { Effect, TMap } from "effect"
import type { ResourceServiceImpl } from "../core/resource-service"
import { ClerkApi } from "./clerk/clerk"
import { StripeApi } from "./stripe/stripe"

export class Providers extends Effect.Service<Providers>()("Providers", {
	effect: Effect.gen(function* () {
		const stripeProvider = yield* StripeApi
		const clerkProvider = yield* ClerkApi

		const providerMap = yield* TMap.empty<string, TMap.TMap<string, ResourceServiceImpl>>()

		yield* TMap.set(providerMap, "stripe", stripeProvider)
		yield* TMap.set(providerMap, "clerk", clerkProvider)

		return providerMap
	}),
	dependencies: [StripeApi.Default, ClerkApi.Default],
}) {}
