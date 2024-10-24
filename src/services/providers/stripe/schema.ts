import { Schema as S } from "effect"

export class Metadata extends S.Class<Metadata>("Metadata")({}) {}

export class StripeInvoiceSettings extends S.Class<StripeInvoiceSettings>("StripeInvoiceSettings")({
	custom_fields: S.NullOr(S.Array(S.Any)),
	default_payment_method: S.NullOr(S.String),
	footer: S.NullOr(S.String),
	rendering_options: S.NullOr(S.Record({ key: S.String, value: S.Any })),
}) {}

export class StripeAddress extends S.Class<StripeAddress>("StripeAddress")({
	city: S.NullOr(S.String),
	country: S.NullOr(S.String),
	line1: S.NullOr(S.String),
	line2: S.NullOr(S.String),
	postal_code: S.NullOr(S.String),
	state: S.NullOr(S.String),
}) {}

export class StripeDiscount extends S.Class<StripeDiscount>("StripeDiscount")({
	id: S.String,
	object: S.Literal("discount"),
	checkout_session: S.NullOr(S.String),
	coupon: S.Any,
	customer: S.String,
	end: S.NullOr(S.Number),
	invoice: S.NullOr(S.String),
	invoice_item: S.NullOr(S.String),
	promotion_code: S.NullOr(S.String),
	start: S.Number,
	subscription: S.NullOr(S.String),
}) {}

export class StripeShipping extends S.Class<StripeShipping>("StripeShipping")({
	address: StripeAddress,
	name: S.String,
	phone: S.NullOr(S.String),
}) {}

export class StripeCustomer extends S.Class<StripeCustomer>("StripeCustomer")({
	id: S.String,
	object: S.Literal("customer"),
	address: S.NullOr(StripeAddress),
	balance: S.Number,
	created: S.Number,
	currency: S.NullOr(S.String),
	default_source: S.NullOr(S.String),
	delinquent: S.NullOr(S.Boolean),
	description: S.NullOr(S.String),
	discount: S.NullOr(StripeDiscount),
	email: S.NullOr(S.String),
	invoice_prefix: S.String,
	invoice_settings: StripeInvoiceSettings,
	livemode: S.Boolean,
	metadata: Metadata,
	name: S.NullOr(S.String),
	next_invoice_sequence: S.Number,
	phone: S.NullOr(S.String),
	preferred_locales: S.Array(S.String),
	shipping: S.NullOr(StripeShipping),
	tax_exempt: S.Union(S.Literal("none"), S.Literal("exempt"), S.Literal("reverse")),
	test_clock: S.NullOr(S.String),

	// Additional fields
	cash_balance: S.NullishOr(S.Any), // Cash balance object
	default_currency: S.NullishOr(S.String),
	deleted: S.NullishOr(S.Boolean),
	sources: S.NullishOr(S.Any), // List object
	subscriptions: S.NullishOr(S.Any), // List object
	tax_ids: S.NullishOr(S.Any), // List object
}) {}
