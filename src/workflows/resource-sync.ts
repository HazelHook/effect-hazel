import type { Context, Workflow } from "@hatchet-dev/typescript-sdk"
import { Effect } from "effect"
import { MainLayer } from ".."

export type ResourceSyncWorkflowInput = {
	collectionId: string
	resourceKey: string
	providerKey: string
	resourceSyncJobId: string
}

export const resourceSyncWorkflow: Workflow = {
	id: "resource-sync-ts",
	description: "Workflow to Sync a Resource of a collection",
	on: {
		event: "resource:sync",
	},
	steps: [
		{
			name: "sync-resource",
			run: async (ctx: Context<ResourceSyncWorkflowInput>) => {
				return { WOW: "SO COOL" }
			},
		},
		{
			name: "cleanup-resource",
			run: async (ctx: Context<ResourceSyncWorkflowInput>) => {
				return { WOW: "SO COOL CLEANUP!" }
			},
		},
	],
}
