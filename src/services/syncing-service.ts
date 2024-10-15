import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import { Config, Effect, Option, TMap } from "effect"
import { ProviderNotFoundError, ResourceNotFoundError } from "../errors"
import { Providers } from "./providers/providers-service"

import { sql } from "drizzle-orm"
import * as schema from "../drizzle/schema"
import type { InsertItem } from "./db-service"

export class SyncingService extends Effect.Service<SyncingService>()("SyncingService", {
	effect: Effect.gen(function* () {
		const providers = yield* Providers

		return {
			syncResource: (collectionId: string, providerKey: string, resourceKey: string) =>
				Effect.gen(function* () {
					const db = yield* PgDrizzle

					const provider = yield* Effect.map(
						TMap.get(providers, providerKey),
						Option.getOrThrowWith(() => new ProviderNotFoundError(providerKey)),
					)

					const resource = yield* Effect.map(
						TMap.get(provider, resourceKey),
						Option.getOrThrowWith(() => new ResourceNotFoundError(providerKey, resourceKey)),
					)

					let hasMore = true
					let cursorId: Option.Option<string> = Option.none()

					while (hasMore) {
						const { paginationInfo, items } = yield* resource.getEntries(
							"customers",
							yield* Config.string("TEST_TOKEN"),
							{
								type: "cursor",
								cursorId: cursorId,
								limit: 3,
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

						yield* Effect.logInfo(
							`synced ${dbItems.length} items for ${providerKey}:${resourceKey}`,
							`hasMore ${hasMore}`,
						)

						cursorId = paginationInfo.cursorId
						hasMore = paginationInfo.hasMore
						yield* Effect.log(items.length, hasMore)
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
