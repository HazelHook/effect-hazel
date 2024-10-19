import { sql } from "drizzle-orm"
import {
	bigint,
	boolean,
	char,
	customType,
	foreignKey,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core"

export const connectionType = pgEnum("connection_type", ["oauth", "api_key"])
export const provider = pgEnum("provider", ["github", "google", "clerk", "lemon_squezzy"])
export const status = pgEnum("status", ["pending", "running", "completed", "canceled", "error"])
export const triggerType = pgEnum("trigger_type", ["manual", "cron"])

export const customJsonb = customType<{ data: any }>({
	dataType() {
		return "jsonb"
	},
	toDriver(val) {
		return val as any
	},
	fromDriver(value) {
		if (typeof value === "string") {
			try {
				return JSON.parse(value) as any
			} catch {}
		}
		return value as any
	},
})

export const items = pgTable(
	"items",
	{
		id: text().default(sql`gen_random_uuid()`).primaryKey().notNull(),
		collectionId: text("collection_id").notNull(),
		externalId: text("external_id").notNull(),
		resourceKey: text("resource_key").default("users").notNull(),
		data: customJsonb("data").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
		deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
		lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
	},
	(table) => {
		return {
			itemsCollectionIdFkey: foreignKey({
				columns: [table.collectionId],
				foreignColumns: [collections.id],
				name: "items_collection_id_fkey",
			}),
			itemsExternalIdCollectionIdKey: unique("items_external_id_collection_id_key").on(
				table.collectionId,
				table.externalId,
			),
		}
	},
)

export const collections = pgTable("collections", {
	id: text().default(sql`gen_random_uuid()`).primaryKey().notNull(),
	name: text().notNull(),
	providerId: provider("provider_id").notNull(),
	resources: text().array().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
	tenantId: text("tenant_id").notNull(),
})

export const thirdPartyConnections = pgTable(
	"third_party_connections",
	{
		id: text().default(sql`gen_random_uuid()`).primaryKey().notNull(),
		collectionId: text("collection_id").notNull(),
		type: connectionType().notNull(),
		provider: text().notNull(),
		accessToken: text("access_token").notNull(),
		refreshToken: text("refresh_token"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
		deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
	},
	(table) => {
		return {
			thirdPartyConnectionsCollectionIdFkey: foreignKey({
				columns: [table.collectionId],
				foreignColumns: [collections.id],
				name: "third_party_connections_collection_id_fkey",
			}),
		}
	},
)

export const syncJobs = pgTable(
	"sync_jobs",
	{
		id: text().default(sql`gen_random_uuid()`).primaryKey().notNull(),
		externalId: text("external_id"),
		collectionId: text("collection_id").notNull(),
		status: status().default("pending").notNull(),
		syncJobId: char("sync_job_id", { length: 26 }),
		resourceKey: text("resource_key"),
		errorMessage: text("error_message"),
		startedAt: timestamp("started_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
		canceledAt: timestamp("canceled_at", { withTimezone: true, mode: "string" }),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
		deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
		trigger: triggerType().default("manual").notNull(),
	},
	(table) => {
		return {
			syncJobsCollectionIdFkey: foreignKey({
				columns: [table.collectionId],
				foreignColumns: [collections.id],
				name: "sync_jobs_collection_id_fkey",
			}),
			syncJobsSyncJobIdFkey: foreignKey({
				columns: [table.syncJobId],
				foreignColumns: [table.id],
				name: "sync_jobs_sync_job_id_fkey",
			}),
		}
	},
)

export const schemaMigrations = pgTable("schema_migrations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	version: bigint({ mode: "number" }).primaryKey().notNull(),
	dirty: boolean().notNull(),
})
