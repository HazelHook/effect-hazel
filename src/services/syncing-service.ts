import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import { Config, Effect, Option, TMap } from "effect"
import { CollectionNotFoundError, ProviderNotFoundError } from "../errors"
import { Providers } from "./providers/providers-service"

import { sql } from "drizzle-orm"
import * as schema from "../drizzle/schema"
import type { InsertItem } from "./db-service"

export class SyncingService extends Effect.Service<SyncingService>()("SyncingService", {
	effect: Effect.gen(function* () {
		const providers = yield* Providers

		return {
			syncCollection: (providerKey: string, collectionKey: string) =>
				Effect.gen(function* () {
					const db = yield* PgDrizzle

					const provider = yield* Effect.map(
						TMap.get(providers, providerKey),
						Option.getOrThrowWith(() => new ProviderNotFoundError(providerKey)),
					)

					const collection = yield* Effect.map(
						TMap.get(provider, collectionKey),
						Option.getOrThrowWith(() => new CollectionNotFoundError(providerKey, collectionKey)),
					)

					let hasMore = true
					let cursorId: Option.Option<string> = Option.none()

					while (hasMore) {
						const { paginationInfo, items } = yield* collection.getEntries(
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
								// TODO: HERE
								collectionId: "fb830b70-7493-4801-befe-bd02e0960a8f",
								resourceKey: collectionKey,
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

						cursorId = paginationInfo.cursorId
						hasMore = paginationInfo.hasMore
						yield* Effect.log(items.length, hasMore)
					}
				}).pipe(Effect.withSpan("syncCollection")),
		}
	}),
	dependencies: [Providers.Default],
}) {}
