import { Model } from "@effect/sql"
import { Schema } from "effect"
import { baseFields } from "./utils"

export const CollectionId = Schema.String.pipe(Schema.brand("CollectionId"))
export type CollectionId = typeof CollectionId.Type

export const TenantId = Schema.String.pipe(Schema.brand("TenantId"))
export type TenantId = typeof TenantId.Type

export const Provider = Schema.Literal("github", "google", "clerk", "lemon_squezzy", "stripe")

export class Collection extends Model.Class<Collection>("Collection")({
	id: Model.Generated(CollectionId),
	name: Schema.NonEmptyTrimmedString,
	providerId: Provider,
	resources: Schema.Array(Schema.String),
	tenantId: TenantId,

	...baseFields,
}) {}

export class CollectionNotFound extends Schema.TaggedError<CollectionNotFound>()("CollectionNotFound", {
	id: CollectionId,
}) {}
