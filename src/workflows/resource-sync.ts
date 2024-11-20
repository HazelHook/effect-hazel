import { Effect, Schema } from "effect"
import { Workflow, makeWorkflow } from "~/lib/cloudflare/workflows"
import { SyncingService } from "~/services/core/syncing-service"
import { DrizzleLive } from "~/services/db-service"
import { MainLayer } from ".."

export const ResourceSyncWorkflow = makeWorkflow(
	{
		name: "ResourceSyncWorkflow",
		binding: "RESOURCE_SYNC_WORKFLOW",
		schema: Schema.Struct({
			resourceKey: Schema.String,
			providerKey: Schema.String,
			collectionId: Schema.String,
		}),
	},
	(args) =>
		Effect.gen(function* () {
			const workflow = yield* Workflow

			// const syncingService = yield* SyncingService

			// yield* workflow.do(
			// 	"syncResources",
			// 	syncingService
			// 		.syncResource(args.collectionId, args.providerKey, args.resourceKey)
			// 		.pipe(Effect.provide(DrizzleLive), Effect.catchAll(Effect.die)),
			// )

			return { success: true }
		}).pipe(Effect.withSpan("resource-sync-workflow"), Effect.catchAll(Effect.die)),
)
