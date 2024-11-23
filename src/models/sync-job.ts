import { Model } from "@effect/sql"
import { Schema } from "effect"
import { CollectionId } from "./collection"
import { baseFields } from "./utils"

export const SyncJobId = Schema.String.pipe(Schema.brand("SyncJobId"))
export type SyncJobId = typeof SyncJobId.Type

export const SyncJobStatus = Schema.Literal("pending", "running", "completed", "canceled", "error")

export class SyncJob extends Model.Class<SyncJob>("SyncJob")({
	id: Model.Generated(SyncJobId),
	externalId: Schema.String,
	collectionId: CollectionId,
	status: SyncJobStatus,
	resourceKey: Schema.OptionFromNullOr(Schema.String),
	errorMessage: Schema.OptionFromNullOr(Schema.String),

	startedAt: Schema.OptionFromNullOr(Schema.Date),
	completedAt: Schema.OptionFromNullOr(Schema.Date),
	canceledAt: Schema.OptionFromNullOr(Schema.Date),

	trigger: Schema.Literal("manual", "cron"),

	...baseFields,
}) {}
