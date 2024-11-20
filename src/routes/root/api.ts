import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { Schema } from "effect"

export class RootApi extends HttpApiGroup.make("Root")
	.add(HttpApiEndpoint.get("health", "/").annotate(OpenApi.Summary, "Health Check").addSuccess(Schema.String))
	.add(
		HttpApiEndpoint.post("sync", "/sync")
			.annotate(OpenApi.Summary, "Sync")
			.addSuccess(Schema.String)
			.setPayload(
				Schema.Struct({
					collectionId: Schema.String,
					syncJobId: Schema.String,
				}),
			),
	) {}
