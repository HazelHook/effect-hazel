import { ConfigProvider, Effect, Layer, ManagedRuntime } from "effect"
import { HttpService } from "./services/http-service"
import { PokeApi } from "./services/poke-api"

const configProvider = ConfigProvider.fromJson({
	AUTH_TOKEN:
		"sk_test_51O49TKHnq6bnmaLKsiDm5RXHHJDitx8BWZAB6IPyT1P1zL72YratDZh9XpyIDVPT18lC7UPoEtY6FMbhaxRJ4ZZS00nVkrNXBR",
})

const MainLayer = Layer.mergeAll(Layer.setConfigProvider(configProvider), HttpService.Default)

const PokemonRuntime = ManagedRuntime.make(MainLayer)

const program = Effect.gen(function* () {
	const httpClient = yield* HttpService

	const res = yield* httpClient.getEntry("customers", "cus_PNOSY2QB1DXged")

	yield* Effect.log(res)
}).pipe(Effect.provide(MainLayer))

const main = program.pipe(
	Effect.catchTags({
		// ParseError: () => Effect.succeed("Parse error"),
	}),
)

PokemonRuntime.runPromise(main).then(console.log)
