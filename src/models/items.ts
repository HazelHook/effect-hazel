import { Model } from "@effect/sql"
import { Schema } from "effect"
import { CollectionId } from "./collection"
import { baseFields } from "./utils"

export const ItemId = Schema.String.pipe(Schema.brand("ItemId"))
export type ItemId = typeof ItemId.Type

export class Item extends Model.Class<Item>("Item")({
	id: Model.Generated(ItemId),
	collectionId: CollectionId,
	externalId: Schema.String,
	resourceKey: Schema.String,

	data: Schema.Any,

	lastSeenAt: Model.DateTimeUpdate,

	...baseFields,
}) {}
