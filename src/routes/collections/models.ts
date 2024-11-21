import { createInsertSchema, createSelectSchema } from "~/lib/drizzle-effect"

import { Schema } from "effect"
import * as schema from "../../drizzle/schema"

export const Collection = createSelectSchema(schema.collections, "Collection")

export const InsertCollection = createInsertSchema(schema.collections)
