import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import { Effect } from "effect"
import { DrizzleLive, type SyncJob } from "./db-service"

import { eq, sql } from "drizzle-orm"
import * as schema from "../drizzle/schema"

export class SyncJobService extends Effect.Service<SyncJobService>()("SyncJobService", {
	effect: Effect.gen(function* () {
		const db = yield* PgDrizzle

		return {
			startSyncJob: (syncJobId: string) =>
				Effect.gen(function* () {
					yield* db
						.update(schema.syncJobs)
						.set({
							status: "running",
							startedAt: sql`now()`,
							updatedAt: sql`now()`,
						})
						.where(eq(schema.syncJobs.id, syncJobId))
				}),
			setSyncJobStatus: (syncJobId: string, status: SyncJob["status"], errorMessage?: string) =>
				Effect.gen(function* () {
					if (status === "error") {
						yield* db
							.update(schema.syncJobs)
							.set({
								status: "error",
								errorMessage: errorMessage,
								completedAt: sql`now()`,
								updatedAt: sql`now()`,
							})
							.where(eq(schema.syncJobs.id, syncJobId))
					}

					if (status === "canceled") {
						yield* db
							.update(schema.syncJobs)
							.set({
								status: "canceled",
								canceledAt: sql`now()`,
								updatedAt: sql`now()`,
							})
							.where(eq(schema.syncJobs.id, syncJobId))
					}

					if (status === "completed") {
						yield* db
							.update(schema.syncJobs)
							.set({
								status: "completed",
								completedAt: sql`now()`,
								updatedAt: sql`now()`,
							})
							.where(eq(schema.syncJobs.id, syncJobId))
					}

					if (status === "running") {
						yield* db
							.update(schema.syncJobs)
							.set({
								status: "running",
								startedAt: sql`now()`,
								updatedAt: sql`now()`,
							})
							.where(eq(schema.syncJobs.id, syncJobId))
					}

					return
				}),
		}
	}),
	dependencies: [DrizzleLive],
}) {}
