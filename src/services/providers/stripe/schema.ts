import * as S from "@effect/schema/Schema"

export class Metadata extends S.Class<Metadata>("Metadata")({}) {}

export class StripeInvoiceSettings extends S.Class<StripeInvoiceSettings>("StripeInvoiceSettings")({
	custom_fields: S.Null,
	default_payment_method: S.Union(S.Null, S.String),
	footer: S.Null,
	rendering_options: S.Null,
}) {}

export class StripeAddress extends S.Class<StripeAddress>("StripeAddress")({
	city: S.String,
	country: S.String,
	line1: S.String,
	line2: S.Null,
	postal_code: S.String,
	state: S.Null,
}) {}

export class StripeCustomer extends S.Class<StripeCustomer>("StripeCustomer")({
	id: S.String,
	object: S.Literal("customer"),
	address: S.Union(StripeAddress, S.Null),
	balance: S.Number,
	created: S.Number,
	currency: S.Union(S.String, S.Null),
	default_source: S.Null,
	delinquent: S.Boolean,
	description: S.Null,
	discount: S.Null,
	email: S.Union(S.String, S.Null),
	invoice_prefix: S.String,
	invoice_settings: StripeInvoiceSettings,
	livemode: S.Boolean,
	metadata: Metadata,
	name: S.String,
	next_invoice_sequence: S.Number,
	phone: S.Union(S.Null, S.String),
	preferred_locales: S.Array(S.String),
	shipping: S.Null,
	tax_exempt: S.String,
	test_clock: S.Null,
}) {}
