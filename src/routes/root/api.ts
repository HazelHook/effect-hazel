import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { Schema } from "effect"
import { Authorization } from "~/authorization"
import { InternalError, NotFound, Unauthorized } from "~/errors"

export class RootApi extends HttpApiGroup.make("Root")
	.add(HttpApiEndpoint.get("health", "/").annotate(OpenApi.Summary, "Health Check").addSuccess(Schema.String))
	.add(
		HttpApiEndpoint.post("sync", "/sync")
			.annotate(OpenApi.Summary, "Sync")
			.addSuccess(Schema.String)
			.setPayload(
				Schema.Struct({
					collectionId: Schema.String,
				}),
			)
			.addError(Unauthorized)
			.addError(InternalError)
			.addError(NotFound)
			.middleware(Authorization),
	) {}
