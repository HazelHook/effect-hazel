import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers"
import { ConfigProvider, Effect, Layer } from "effect"

import { withLogFormat, withMinimalLogLevel } from "./lib/logger"
import { SyncingService } from "./services/core/syncing-service"
import { DrizzleLive } from "./services/db-service"
import { Providers } from "./services/providers/providers-service"
import { SyncJobService } from "./services/sync-jobs-service"

const MainLayer = Layer.mergeAll(
	withLogFormat,
	withMinimalLogLevel,
	// OpenTelemtryLive,
	// DevToolsLive,
	Providers.Default,
	SyncingService.Default,
	SyncJobService.Default,
	DrizzleLive,
)
// const MainLayer = Layer.mergeAll(Providers.Default, SyncingService.Default, SyncJobService.Default, DrizzleLive)

type Env = {
	RESOURCE_SYNC_WORKFLOW: Workflow
	POSTGRES_URL: string
	// SECOND_WORKFLOW: Workflow
}

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const workflow = await env.RESOURCE_SYNC_WORKFLOW.create({
			id: "resource-sync-workflow",
			params: {
				collectionId: "8106d54c-b6b1-4c75-80ad-11213cc1d99c",
				providerKey: "clerk",
				resourceKey: "users",
			},
		})

		return Response.json({ status: await workflow.status() })
	},
} satisfies ExportedHandler<Env>

type ResourceSyncWorkflowParams = {
	collectionId: string
	resourceKey: string
	providerKey: string
	resourceSyncJobId: string
}

export class ResourceSyncWorkflow extends WorkflowEntrypoint<Env, ResourceSyncWorkflowParams> {
	async run(event: Readonly<WorkflowEvent<ResourceSyncWorkflowParams>>, step: WorkflowStep): Promise<unknown> {
		const syncResourceProgram = (
			collectionId: string,
			providerKey: string,
			resourceKey: string,
			step: WorkflowStep,
		) =>
			Effect.gen(function* () {
				const syncingService = yield* SyncingService

				yield* syncingService.syncResource(collectionId, providerKey, resourceKey, step)

				return { success: true }
			})

		const configProvider = ConfigProvider.fromJson(this.env)
		const configLayer = Layer.setConfigProvider(configProvider)

		const credentials = await Effect.runPromise(
			syncResourceProgram(
				event.payload.collectionId,
				event.payload.providerKey,
				event.payload.resourceKey,
				step,
			).pipe(Effect.provide(MainLayer), Effect.provide(configLayer)),
		)

		return credentials
	}
}
