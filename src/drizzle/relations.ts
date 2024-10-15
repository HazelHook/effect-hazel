import { relations } from "drizzle-orm/relations";
import { collections, items, thirdPartyConnections, syncJobs } from "./schema";

export const itemsRelations = relations(items, ({one}) => ({
	collection: one(collections, {
		fields: [items.collectionId],
		references: [collections.id]
	}),
}));

export const collectionsRelations = relations(collections, ({many}) => ({
	items: many(items),
	thirdPartyConnections: many(thirdPartyConnections),
	syncJobs: many(syncJobs),
}));

export const thirdPartyConnectionsRelations = relations(thirdPartyConnections, ({one}) => ({
	collection: one(collections, {
		fields: [thirdPartyConnections.collectionId],
		references: [collections.id]
	}),
}));

export const syncJobsRelations = relations(syncJobs, ({one, many}) => ({
	collection: one(collections, {
		fields: [syncJobs.collectionId],
		references: [collections.id]
	}),
	syncJob: one(syncJobs, {
		fields: [syncJobs.syncJobId],
		references: [syncJobs.id],
		relationName: "syncJobs_syncJobId_syncJobs_id"
	}),
	syncJobs: many(syncJobs, {
		relationName: "syncJobs_syncJobId_syncJobs_id"
	}),
}));