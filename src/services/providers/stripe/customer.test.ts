import { Config, Console, Effect, Option } from "effect"

import { describe, expect, it, test } from "@effect/vitest"
import { StripeCustomerProvider } from "./customer"

describe("stripe customer provider", () => {
	it.effect("getEntries", () =>
		Effect.gen(function* () {
			const stripeCustomerProvider = yield* StripeCustomerProvider

			const accessToken = yield* Config.string("TEST_STRIPE_API_TOKEN")

			const entries = yield* stripeCustomerProvider.getEntries(accessToken, {
				type: "cursor",
				cursorId: Option.none(),
				limit: 10,
			})

			yield* Console.log(entries)

			expect(entries.items.length).toBeGreaterThan(0)

			expect(entries.paginationInfo.type).toBe("cursor")
		}).pipe(Effect.provide(StripeCustomerProvider.Default)),
	)
})
