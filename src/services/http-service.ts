import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientResponse } from "@effect/platform"
import { Schema } from "@effect/schema"
import { Config, Effect } from "effect"

export class StripeCustomer extends Schema.Class<StripeCustomer>("StripeCustomer")({
	id: Schema.String,
	object: Schema.String,
	address: Schema.NullOr(Schema.Any),
	balance: Schema.Number,
	created: Schema.Number,
	currency: Schema.NullOr(Schema.String),
	default_source: Schema.NullOr(Schema.Any),
	delinquent: Schema.Boolean,
	description: Schema.NullOr(Schema.String),
	discount: Schema.NullOr(Schema.Any),
	email: Schema.String,
	invoice_prefix: Schema.String,
	invoice_settings: Schema.Struct({
		custom_fields: Schema.NullOr(Schema.Any),
		default_payment_method: Schema.NullOr(Schema.Any),
		footer: Schema.NullOr(Schema.String),
		rendering_options: Schema.NullOr(Schema.Any),
	}),
	livemode: Schema.Boolean,
	metadata: Schema.Record({ key: Schema.String, value: Schema.Any }),
	name: Schema.NullOr(Schema.String),
	next_invoice_sequence: Schema.UndefinedOr(Schema.Number),
	phone: Schema.NullOr(Schema.String),
	preferred_locales: Schema.Array(Schema.String),
	shipping: Schema.NullOr(Schema.Any),
	tax_exempt: Schema.NullOr(Schema.String),
	test_clock: Schema.NullOr(Schema.Any),
}) {}

export class HttpService extends Effect.Service<HttpService>()("HttpService", {
	effect: Effect.gen(function* () {
		const defaultClient = yield* HttpClient.HttpClient

		const httpClient = defaultClient.pipe(
			HttpClient.filterStatusOk,
			HttpClient.mapRequest(HttpClientRequest.prependUrl("https://api.stripe.com/v1/")),
		)

		return {
			getEntry: (entityType: string, entryId: string) =>
				Effect.gen(function* () {
					const authToken = yield* Config.redacted("AUTH_TOKEN")
					return yield* HttpClientRequest.get(`/${entityType}/${entryId}`).pipe(
						HttpClientRequest.bearerToken(authToken),
						httpClient.execute,
						Effect.flatMap(HttpClientResponse.schemaBodyJson(StripeCustomer)),
						Effect.scoped,
					)
				}),
			// TODO: GetEntries
		}
	}).pipe(Effect.provide(FetchHttpClient.layer)),
}) {}
