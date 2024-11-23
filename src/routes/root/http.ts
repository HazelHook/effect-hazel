import { HttpApiBuilder } from "@effect/platform"
import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import { Effect } from "effect"
import { Api } from "~/api"
import { Authorization } from "~/authorization"
import { Workflows } from "~/lib/cloudflare/workflows"

import { eq } from "drizzle-orm"
import { NotFound } from "~/errors"
import * as schema from "../../drizzle/schema"

export const HttpRootLive = HttpApiBuilder.group(Api, "Root", (handlers) =>
	Effect.gen(function* () {
		const workflow = yield* Workflows
		const resourceSyncWorkflow = workflow.getWorkflow<WorkflowsBinding>("CollectionSyncWorkflow")
		const db = yield* PgDrizzle

		return handlers
			.handle("health", () =>
				Effect.gen(function* () {
					return yield* Effect.succeed("OK")
				}),
			)
			.handle("sync", ({ payload }) =>
				Effect.gen(function* () {
					const collection = (yield* db
						.select()
						.from(schema.collections)
						.where(eq(schema.collections.id, payload.collectionId)))[0]

					if (!collection) {
						return yield* Effect.fail(new NotFound({ message: "Collection not found" }))
					}

					const syncJob = (yield* db
						.insert(schema.syncJobs)
						.values({
							collectionId: payload.collectionId,
							status: "pending",
							trigger: "manual",
						})
						.returning())[0]!

					yield* resourceSyncWorkflow.create({
						params: {
							collectionId: payload.collectionId,
							syncJobId: syncJob.id,
						},
					})

					return yield* Effect.succeed("OK")
				}).pipe(
					Effect.tapError((e) => Effect.logError("Error", e)),
					Effect.catchTags({
						// TODO: Fix this
						ParseError: (e) => Effect.succeed(e.message),
						SqlError: (e) => Effect.succeed(e.message),
					}),
				),
			)
	}),
)
