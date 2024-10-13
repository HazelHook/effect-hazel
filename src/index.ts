import { Effect, Layer, ManagedRuntime, Option, TMap } from "effect"
import { HttpService } from "./services/http-service"
import { StripeApi } from "./services/providers/stripe"

const MainLayer = Layer.mergeAll(HttpService.Default)

const MainRuntime = ManagedRuntime.make(StripeApi.Default)

const program = Effect.gen(function* () {
	const stripeApi = yield* StripeApi

	const stripeCustomerApi = yield* Effect.map(TMap.get(stripeApi, "customers"), Option.getOrThrow)

	const res = yield* stripeCustomerApi.getEntry(
		"customers",
		"sk_test_51O49TKHnq6bnmaLKsiDm5RXHHJDitx8BWZAB6IPyT1P1zL72YratDZh9XpyIDVPT18lC7UPoEtY6FMbhaxRJ4ZZS00nVkrNXBR",
		"cus_PNOSY2QB1DXged",
	)
	const res2 = yield* stripeCustomerApi.getEntries(
		"customers",
		"sk_test_51O49TKHnq6bnmaLKsiDm5RXHHJDitx8BWZAB6IPyT1P1zL72YratDZh9XpyIDVPT18lC7UPoEtY6FMbhaxRJ4ZZS00nVkrNXBR",
		{ type: "cursor", cursorId: Option.none(), limit: 3 },
	)

	yield* Effect.log(res)
}).pipe(Effect.provide(MainLayer))

const main = program.pipe(
	Effect.catchTags({
		// ParseError: () => Effect.succeed("Parse error"),
	}),
)

MainRuntime.runPromise(main)

// TODOS: Implement Sync Function
