import { HttpApiBuilder, HttpMiddleware } from "@effect/platform"
import { Layer, Logger } from "effect"

import { HttpAppLive } from "./http"
import { Workflows } from "./lib/cloudflare/workflows"
import { withMinimalLogLevel } from "./lib/logger"

import { SyncingService } from "./services/core/syncing-service"
import { DrizzleLive } from "./services/db-service"
import { DevToolsLive } from "./services/devtools-service"
import { OpenTelemtryLive } from "./services/open-telemntry-service"
import { Providers } from "./services/providers/providers-service"
import { SyncJobService } from "./services/sync-jobs-service"

import { workflows } from "./workflows"
export * from "./workflows"

declare global {
	var env: Env

	type WorkflowsBinding = typeof workflows
}

export const MainLayer = Layer.mergeAll(
	// withLogFormat,
	withMinimalLogLevel,
	OpenTelemtryLive,
	DevToolsLive,
	Providers.Default,
	SyncingService.Default,
	SyncJobService.Default,
	DrizzleLive,
	Logger.structured,
	Logger.pretty,
)

const HttpLive = Layer.mergeAll(HttpAppLive).pipe(Layer.provide(Workflows.fromRecord(() => workflows)))

const Live = HttpLive.pipe()

// TODO: Implement Ratelimiting for CollectionService

export default {
	async fetch(request, env): Promise<Response> {
		Object.assign(globalThis, {
			env,
		})

		Object.assign(process, {
			env,
		})

		const handler = HttpApiBuilder.toWebHandler(Live, {
			middleware: HttpMiddleware.logger,
		})

		return handler.handler(request)
	},
} satisfies ExportedHandler<Env>
