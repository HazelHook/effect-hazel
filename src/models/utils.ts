import { Model } from "@effect/sql"
import { Schema } from "effect"

export const baseFields = {
	createdAt: Model.DateTimeInsert,
	updatedAt: Model.DateTimeUpdate,
	deletedAt: Schema.OptionFromNullOr(Schema.Date),
}
