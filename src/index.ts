import { Effect, Layer, ManagedRuntime, Option } from "effect"
import { HttpService, type HttpServiceReturnType } from "./services/http-service"
import { StripeCustomerProvider } from "./services/providers/stripe/customer"

const MainLayer = Layer.mergeAll(HttpService.Default)

const MainRuntime = ManagedRuntime.make(StripeCustomerProvider.Default)

const program = Effect.gen(function* () {
	const stripeCustomerProvider = yield* StripeCustomerProvider

	// const res = yield* providerClient.getEntry("customers", "cus_PNOSY2QB1DXged")
	const res2 = yield* stripeCustomerProvider.getEntries(
		"customers",
		"sk_test_51O49TKHnq6bnmaLKsiDm5RXHHJDitx8BWZAB6IPyT1P1zL72YratDZh9XpyIDVPT18lC7UPoEtY6FMbhaxRJ4ZZS00nVkrNXBR",
		{ type: "cursor", cursorId: Option.none(), limit: 3 },
	)

	const collections = new Map<string, HttpServiceReturnType>()

	// TODO: this shoudl be a actual collection client instead of the http client
	collections.set("customer", stripeCustomerProvider)

	// yield* Effect.log(res)
	yield* Effect.log(res2)
}).pipe(Effect.provide(MainLayer))

const main = program.pipe(
	Effect.catchTags({
		// ParseError: () => Effect.succeed("Parse error"),
	}),
)

MainRuntime.runPromise(main)
