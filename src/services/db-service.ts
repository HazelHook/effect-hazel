import { PgClient } from "@effect/sql-pg"
import { Config, ConfigError, Effect, Layer, Match } from "effect"

import * as PgDrizzle from "@effect/sql-drizzle/Pg"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm"

import type * as schema from "../drizzle/schema"
import { HazelError } from "../errors"
import { IsDevelopment } from "../lib/config"

const PgLive = PgClient.layer({
	url: Config.redacted("POSTGRES_URL"),
	ssl: IsDevelopment.pipe((v) => Config.succeed(!v)),
})

const MappedPgLive = Layer.mapError(PgLive, (err) => {
	if (ConfigError.isConfigError(err)) {
		return new HazelError({
			code: "INVALID_SERVER_CONFIG",
			message: "Invalid Server Config",
			cause: err,
		})
	}

	console.log(err)

	return new HazelError({
		code: "CANNOT_REACH_SERVER",
		message: err.message,
		cause: err.cause,
	})
})

export const DrizzleLive = PgDrizzle.layer.pipe(Layer.provide(MappedPgLive))

export type InsertItem = InferInsertModel<typeof schema.items>
export type SyncJob = InferSelectModel<typeof schema.syncJobs>
