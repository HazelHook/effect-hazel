import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { Schema } from "effect"
import { Collection, InsertCollection } from "./models"

export class CollectionApi extends HttpApiGroup.make("Collection")
	.add(
		HttpApiEndpoint.post("createCollection", "/collections").annotate(OpenApi.Summary, "CreateCollection"),
		// .setPayload(InsertCollection as any)
		// .addSuccess(Collection as any),
	)
	.add(
		HttpApiEndpoint.del("deleteCollection", "/collections/:id")
			.annotate(OpenApi.Summary, "DeleteCollection")
			.setPath(
				Schema.Struct({
					id: Schema.String,
				}),
			)
			.addSuccess(Schema.String),
	)
	.add(
		HttpApiEndpoint.post("updateCollection", "/collections/:id")
			.annotate(OpenApi.Summary, "UpdateCollection")
			.setPath(
				Schema.Struct({
					id: Schema.String,
				}),
			),
		// .setPayload(Schema.partial(InsertCollection as any))
		// .addSuccess(Collection as any),
	) {}
