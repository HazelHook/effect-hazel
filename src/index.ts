import { DateTime, Effect, Layer, Schema, pipe } from "effect"

import { HttpApiBuilder, HttpMiddleware } from "@effect/platform"
import { HttpAppLive } from "./http"
import { Workflow, Workflows, makeWorkflow } from "./lib/cloudflare/workflows"

declare global {
	var env: Env

	type WorkflowsBinding = typeof workflows
}

// export const MainLayer = Layer.mergeAll(
// 	withLogFormat,
// 	withMinimalLogLevel,
// 	OpenTelemtryLive,
// 	DevToolsLive,
// 	Providers.Default,
// 	SyncingService.Default,
// 	SyncJobService.Default,
// 	DrizzleLive,
// )

export const MyWorkflow = makeWorkflow({ name: "MyWorkflow", binding: "MY_WORKFLOW", schema: Schema.Any }, (args) =>
	Effect.gen(function* () {
		const workflow = yield* Workflow

		yield* Effect.log("args", args)

		const step1Result = yield* workflow.do(
			"step1",
			pipe(Effect.log("step1"), Effect.andThen(Effect.sleep("1 second")), Effect.andThen(Effect.succeed(10))),
		)
		yield* Effect.log("step1-result", step1Result)

		yield* workflow.sleep("sleep 1", "1 minute")

		yield* workflow.do("step2", Effect.log("step2"))
		yield* Effect.log("step2-done")

		const now = yield* DateTime.now
		const until = DateTime.add(now, { minutes: 1 })
		yield* workflow.sleepUntil("sleep until", until)

		yield* workflow.do("step3", Effect.log("step3"))
		yield* Effect.log("step3-done")
	}),
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

const workflows = {
	MyWorkflow,
}
