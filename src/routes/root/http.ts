import { HttpApiBuilder } from "@effect/platform"
import { Effect } from "effect"
import { Api } from "~/api"
import { Workflows } from "~/lib/cloudflare/workflows"

export const HttpRootLive = HttpApiBuilder.group(Api, "Root", (handlers) =>
	Effect.gen(function* () {
		const workflow = yield* Workflows
		const resourceSyncWorkflow = workflow.getWorkflow<WorkflowsBinding>("MyWorkflow")

		return handlers
			.handle("health", () =>
				Effect.gen(function* () {
					return yield* Effect.succeed("OK")
				}),
			)
			.handle("sync", ({ payload }) =>
				Effect.gen(function* () {
					yield* resourceSyncWorkflow.create({
						params: {
							collectionId: payload.collectionId,
							syncJobId: payload.syncJobId,
						},
					})
					return yield* Effect.succeed("OK")
				}).pipe(
					Effect.tapError((e) => Effect.logError("Error", e)),
					Effect.catchTags({
						ParseError: (e) => Effect.succeed(e.message),
					}),
				),
			)
	}),
)
