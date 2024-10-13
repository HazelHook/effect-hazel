import { Context, Effect, Layer } from "effect"
import { HttpService } from "../http-service"

interface StripeApiImpl {
	readonly getEntry: () => Effect.Effect<string, never, HttpService>
}

export class StripeApi extends Context.Tag("PokeApiUrl")<StripeApi, StripeApiImpl>() {
	static readonly Live = Layer.effect(
		this,
		Effect.gen(function* () {
			return {
				getEntry: () =>
					Effect.gen(function* () {
						const httpService = yield* HttpService

						return "wow"
					}),
			}
		}),
	)
}
