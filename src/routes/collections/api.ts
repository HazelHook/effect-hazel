import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { Schema } from "effect"
import { Collection, InsertCollection } from "./models"

export class CollectionApi extends HttpApiGroup.make("Collection")
	.add(
		HttpApiEndpoint.post("createCollection", "/collections")
			.annotate(OpenApi.Summary, "CreateCollection")
			// .setPayload(InsertCollection as any)
			.addSuccess(Collection as any),
	)
	.add(
		HttpApiEndpoint.del("deleteCollection", "/collections/:id")
			.annotate(OpenApi.Summary, "DeleteCollection")
			.addSuccess(Schema.String),
	)
	.add(
		HttpApiEndpoint.post("updateCollection", "/collections")
			.annotate(OpenApi.Summary, "UpdateCollection")
			.addSuccess(Collection as any),
	) {}
