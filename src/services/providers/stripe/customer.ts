import { Schema } from "@effect/schema"
import { Effect, Option } from "effect"
import { ResourceService } from "../../core/resource-service"

export class StripeGetMultipleSchema extends Schema.Class<StripeGetMultipleSchema>("StripeGetMultiple")({
	object: Schema.String,
	url: Schema.String,
	has_more: Schema.Boolean,
}) {}

export class StripeCustomerSchema extends Schema.Class<StripeCustomerSchema>("StripeCustomer")({
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

export class StripeGetCustomersResSchema extends StripeGetMultipleSchema.extend<StripeGetCustomersResSchema>(
	"StripeCustomersRes",
)({
	data: Schema.Array(StripeCustomerSchema),
}) {}

export class StripeCustomerProvider extends Effect.Service<StripeCustomerProvider>()("StripeCustomerProvider", {
	effect: Effect.gen(function* () {
		const resourceService = yield* ResourceService

		const providerClient = resourceService.init("https://api.stripe.com/v1/", {
			itemSchema: StripeCustomerSchema,
			paginationType: "cursor",
			getEntry: {
				schema: StripeCustomerSchema,
				mapData(data) {
					return Effect.succeed({
						id: data.id,
						data: data,
					})
				},
			},
			getEntries: {
				schema: StripeGetCustomersResSchema,
				mapData(data) {
					const cursorId = data.data[data.data.length - 1]?.id
					return Effect.succeed({
						items: data.data.map((datum) => ({ id: datum.id, data: datum })),
						paginationInfo: {
							type: "cursor",
							hasMore: data.has_more,
							cursorId: cursorId ? Option.some(cursorId) : Option.none(),
						},
					})
				},
			},
			getCount: undefined,
		})

		return providerClient
	}),
	dependencies: [ResourceService.Default],
}) {}
