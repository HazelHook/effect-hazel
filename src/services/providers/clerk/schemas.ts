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

export class ClerkExternalAccountSchema extends Schema.Class<ClerkExternalAccountSchema>("ClerkExternalAccount")({
	id: Schema.String,
	provider: Schema.String,
	identification_id: Schema.String,
	provider_user_id: Schema.String,
	approved_scopes: Schema.String,
	email_address: Schema.String,
	first_name: Schema.String,
	last_name: Schema.String,
	picture: Schema.String,
	username: Schema.NullOr(Schema.String),
	public_metadata: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
	label: Schema.NullOr(Schema.String),
	verification: Schema.Struct({
		status: Schema.String,
		strategy: Schema.String,
	}),
}) {}

export class ClerkUserSchema extends Schema.Class<ClerkUserSchema>("ClerkUser")({
	id: Schema.String,
	object: Schema.Literal("user"),
	username: Schema.NullOr(Schema.String),
	first_name: Schema.NullOr(Schema.String),
	last_name: Schema.NullOr(Schema.String),
	gender: Schema.NullOr(Schema.String),
	birthday: Schema.NullOr(Schema.String),
	image_url: Schema.String,
	has_image: Schema.Boolean,
	email_addresses: Schema.Array(ClerkEmailAddressSchema),
	primary_email_address_id: Schema.NullOr(Schema.String),
	phone_numbers: Schema.Array(ClerkPhoneNumberSchema),
	primary_phone_number_id: Schema.NullOr(Schema.String),
	primary_web3_wallet_id: Schema.NullOr(Schema.String),
	external_accounts: Schema.Array(ClerkExternalAccountSchema),
	password_enabled: Schema.Boolean,
	two_factor_enabled: Schema.Boolean,
	totp_enabled: Schema.Boolean,
	backup_code_enabled: Schema.Boolean,
	public_metadata: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
	private_metadata: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
	unsafe_metadata: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
	created_at: Schema.Number,
	updated_at: Schema.Number,
	last_sign_in_at: Schema.NullOr(Schema.Number),
	banned: Schema.Boolean,
	locked: Schema.Boolean,
	lockout_expires_in_seconds: Schema.NullOr(Schema.Number),
	verification_attempts_remaining: Schema.NullOr(Schema.Number),
	last_active_at: Schema.NullOr(Schema.Number),
	external_id: Schema.NullOr(Schema.String),
	delete_self_enabled: Schema.Boolean,
}) {}
