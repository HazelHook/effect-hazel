import type { Context, Workflow } from "@hatchet-dev/typescript-sdk"
import { Effect, Exit } from "effect"
import { MainLayer } from ".."
import { SyncingService } from "../services/core/syncing-service"

export type ResourceSyncWorkflowInput = {
	collectionId: string
	resourceKey: string
	providerKey: string
	resourceSyncJobId: string
}

// TODO: Better Error Managment
const resourceSyncWorkflowEffect = (ctx: Context<ResourceSyncWorkflowInput>) =>
	Effect.gen(function* () {
		const syncingService = yield* SyncingService

		yield* syncingService.syncResource(
			ctx.data.input.collectionId,
			ctx.data.input.providerKey,
			ctx.data.input.resourceKey,
		)

		return { success: true }
	}).pipe(Effect.provide(MainLayer))

export const resourceSyncWorkflow: Workflow = {
	id: "resource-sync-ts",
	description: "Workflow to Sync a Resource of a collection",
	on: {
		event: "resource:sync",
	},
	scheduleTimeout: "36h",
	steps: [
		{
			name: "sync-resource",
			run: async (ctx: Context<ResourceSyncWorkflowInput>) => {
				return await Effect.runPromise(resourceSyncWorkflowEffect(ctx))
			},
		},
		{
			name: "cleanup-resource",
			parents: ["sync-resource"],
			run: async (ctx: Context<ResourceSyncWorkflowInput>) => {
				return { WOW: "SO COOL CLEANUP!" }
			},
		},
	],
}
