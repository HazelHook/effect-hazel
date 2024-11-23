import { Model } from "@effect/sql"
import { Schema } from "effect"
import { CollectionId } from "./collection"
import { baseFields } from "./utils"

export const ThirdPartyConnectionId = Schema.String.pipe(Schema.brand("ThirdPartyConnectionId"))
export type ThirdPartyConnectionId = typeof ThirdPartyConnectionId.Type

export const ConnectionType = Schema.Literal("oauth", "api_key")

export class ThirdPartyConnection extends Model.Class<ThirdPartyConnection>("ThirdPartyConnection")({
	id: Model.Generated(ThirdPartyConnectionId),
	collectionId: CollectionId,
	type: ConnectionType,
	provider: Schema.String,
	accessToken: Schema.String,
	refreshToken: Schema.OptionFromNullOr(Schema.String),

	...baseFields,
}) {}
