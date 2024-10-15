import { PgClient } from "@effect/sql-pg"
import { Config, Layer } from "effect"

import * as PgDrizzle from "@effect/sql-drizzle/Pg"
import type { InferInsertModel } from "drizzle-orm"

import type * as schema from "../drizzle/schema"

const PgLive = PgClient.layer({
	url: Config.redacted("POSTGRES_URL"),
})

export const DrizzleLive = PgDrizzle.layer.pipe(Layer.provide(PgLive))

export type InsertItem = InferInsertModel<typeof schema.items>
