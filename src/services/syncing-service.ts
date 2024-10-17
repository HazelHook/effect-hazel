import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import { Config, Effect, Option, TMap } from "effect"
import { ProviderNotFoundError, ResourceNotFoundError, ThirdPartyConnectionNotFoundError } from "../errors"
import { Providers } from "./providers/providers-service"

import { eq, sql } from "drizzle-orm"
import * as schema from "../drizzle/schema"
import type { InsertItem } from "./db-service"

export class SyncingService extends Effect.Service<SyncingService>()("SyncingService", {
	effect: Effect.gen(function* () {
		const providers = yield* Providers

		return {
			syncResource: (collectionId: string, providerKey: string, resourceKey: string) =>
				Effect.gen(function* () {
					const db = yield* PgDrizzle

					const thirdPartyConnection = (yield* db
						.select()
						.from(schema.thirdPartyConnections)
						.where(eq(schema.thirdPartyConnections.collectionId, collectionId)))[0]

					if (!thirdPartyConnection) {
						return yield* new ThirdPartyConnectionNotFoundError(collectionId)
					}

					const provider = yield* Effect.map(
						TMap.get(providers, providerKey),
						Option.getOrThrowWith(() => new ProviderNotFoundError(providerKey)),
					)

					const resource = yield* Effect.map(
						TMap.get(provider, resourceKey),
						Option.getOrThrowWith(() => new ResourceNotFoundError(providerKey, resourceKey)),
					)

					if (resource.baseOptions.paginationType === "cursor") {
						let hasMore = true
						let cursorId: Option.Option<string> = Option.none()

						while (hasMore) {
							const { paginationInfo, items } = yield* resource.getEntries(
								"customers",
								thirdPartyConnection.accessToken,
								{
									type: "cursor",
									cursorId: cursorId,
									limit: 3,
								},
							)

							if (paginationInfo.type === "offset") {
								return yield* Effect.fail("Should not get here")
							}

							const dbItems: InsertItem[] = items.map((item) => {
								return {
									externalId: item.id,
									data: item.data,
									collectionId: collectionId,
									resourceKey: resourceKey,
								}
							})

							yield* db
								.insert(schema.items)
								.values(dbItems)
								.onConflictDoUpdate({
									target: [schema.items.collectionId, schema.items.externalId],
									set: {
										data: sql`CASE WHEN ${schema.items.data} <> excluded.data THEN excluded.data ELSE ${schema.items.data} END`,
										lastSeenAt: sql`now()`,
										deletedAt: sql`NULL`,
										updatedAt: sql`CASE WHEN ${schema.items.data} <> excluded.data THEN now() ELSE ${schema.items.updatedAt} END`,
									},
								})

							yield* Effect.logInfo(
								`synced ${dbItems.length} items for ${providerKey}:${resourceKey}`,
								`hasMore ${paginationInfo.hasMore}`,
							)

							cursorId = paginationInfo.cursorId
							hasMore = paginationInfo.hasMore
						}
					}

					if (resource.baseOptions.paginationType === "offset") {
						const limit = 3
						const count = yield* resource.getCount("customers", yield* Config.string("TEST_TOKEN"))
						yield* Effect.logInfo(`Synced ${count} items for ${providerKey}:${resourceKey}`)

						for (let i = 0; i < count; i += limit) {
							const { items } = yield* resource.getEntries(
								"customers",
								thirdPartyConnection.accessToken,
								{
									type: "offset",
									offset: i,
									limit: limit,
								},
							)

							const dbItems: InsertItem[] = items.map((item) => {
								return {
									externalId: item.id,
									data: item.data,
									collectionId: collectionId,
									resourceKey: resourceKey,
								}
							})

							yield* db
								.insert(schema.items)
								.values(dbItems)
								.onConflictDoUpdate({
									target: [schema.items.collectionId, schema.items.externalId],
									set: {
										data: sql`CASE WHEN ${schema.items.data} <> excluded.data THEN excluded.data ELSE ${schema.items.data} END`,
										lastSeenAt: sql`now()`,
										deletedAt: sql`NULL`,
										updatedAt: sql`CASE WHEN ${schema.items.data} <> excluded.data THEN now() ELSE ${schema.items.updatedAt} END`,
									},
								})
						}
					}
				}).pipe(
					Effect.withSpan("syncCollection", {
						attributes: {
							collectionId: collectionId,
							resourceKey: resourceKey,
							providerKey: providerKey,
						},
					}),
				),
		}
	}),
	dependencies: [Providers.Default],
}) {}
