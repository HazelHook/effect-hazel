import { Schema } from "@effect/schema"

export class ClerkEmailAddressSchema extends Schema.Class<ClerkEmailAddressSchema>("ClerkEmailAddress")({
	id: Schema.String,
	email_address: Schema.String,
	verification: Schema.Struct({
		status: Schema.String,
		strategy: Schema.String,
	}),
	linked_to: Schema.Array(
		Schema.Struct({
			id: Schema.String,
			type: Schema.String,
		}),
	),
}) {}

export class ClerkPhoneNumberSchema extends Schema.Class<ClerkEmailAddressSchema>("ClerkPhoneNumber")({
	id: Schema.String,
	phone_number: Schema.String,
	reserved_for_second_factor: Schema.Boolean,
	verification: Schema.Struct({
		status: Schema.String,
		strategy: Schema.String,
	}),
	linked_to: Schema.Array(
		Schema.Struct({
			id: Schema.String,
			type: Schema.String,
		}),
	),
}) {}

export class ClerkPasskeySchema extends Schema.Class<ClerkPasskeySchema>("ClerkPasskey")({
	id: Schema.String,
	object: Schema.Literal("passkey"),
	name: Schema.String,
	last_used_at: Schema.Number,
	verification: Schema.Unknown,
}) {}

export class ClerkWeb3WalletSchema extends Schema.Class<ClerkWeb3WalletSchema>("ClerkWeb3Wallet")({
	id: Schema.String,
	object: Schema.Literal("web3_wallet"),
	web3_wallet: Schema.String,
	verification: Schema.Unknown,

	created_at: Schema.Number,
	updated_at: Schema.Number,
}) {}

export class ClerkUserSchema extends Schema.Class<ClerkUserSchema>("ClerkUser")({
	id: Schema.String,
	object: Schema.Literal("user"),
	external_id: Schema.NullOr(Schema.String),

	primary_email_address_id: Schema.NullOr(Schema.String),
	primary_phone_number_id: Schema.NullOr(Schema.String),
	primary_web3_wallet_id: Schema.NullOr(Schema.String),

	username: Schema.NullOr(Schema.String),
	first_name: Schema.NullOr(Schema.String),
	last_name: Schema.NullOr(Schema.String),
	image_url: Schema.String,
	has_image: Schema.Boolean,

	public_metadata: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
	private_metadata: Schema.NullOr(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
	unsafe_metadata: Schema.Record({ key: Schema.String, value: Schema.Unknown }),

	email_addresses: Schema.Array(ClerkEmailAddressSchema),
	phone_numbers: Schema.Array(ClerkPhoneNumberSchema),
	passkeys: Schema.Array(ClerkPasskeySchema),
	web3_wallets: Schema.Array(ClerkWeb3WalletSchema),

	password_enabled: Schema.Boolean,
	two_factor_enabled: Schema.Boolean,
	totp_enabled: Schema.Boolean,
	backup_code_enabled: Schema.Boolean,

	mfa_enabled_at: Schema.NullOr(Schema.Number),
	mfa_disabled_at: Schema.NullOr(Schema.Number),

	external_accounts: Schema.Array(Schema.Record({ key: Schema.String, value: Schema.Unknown })),

	last_sign_in_at: Schema.NullOr(Schema.Number),
	banned: Schema.Boolean,
	locked: Schema.Boolean,
	lockout_expires_in_seconds: Schema.NullOr(Schema.Number),
	verification_attempts_remaining: Schema.NullOr(Schema.Number),

	created_at: Schema.Number,
	updated_at: Schema.Number,
	delete_self_enabled: Schema.Boolean,
	create_organization_enabled: Schema.Boolean,
	create_organizations_limit: Schema.NullishOr(Schema.Number),

	last_active_at: Schema.NullOr(Schema.Number),
	legal_accepted_at: Schema.NullOr(Schema.Number),
}) {}
