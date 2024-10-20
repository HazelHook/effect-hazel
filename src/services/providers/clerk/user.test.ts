import { Config, Effect } from "effect"
import { ClerkUserProvider } from "./user"

import { expect, it, test } from "@effect/vitest"

it.effect("getEntries", () =>
	Effect.gen(function* () {
		const clerkUserProvider = yield* ClerkUserProvider

		const accessToken = yield* Config.string("TEST_CLERK_API_TOKEN")

		const entries = yield* clerkUserProvider.getEntries("oauth", accessToken, {
			type: "offset",
			offset: 0,
			limit: 10,
		})

		expect(entries.items.length).toBeGreaterThan(0)
	}).pipe(Effect.provide(ClerkUserProvider.Default)),
)
