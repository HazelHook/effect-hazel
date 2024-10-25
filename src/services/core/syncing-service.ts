import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import { Config, Effect, Option, TMap, pipe } from "effect"
import { ProviderNotFoundError, ResourceNotFoundError, ThirdPartyConnectionNotFoundError } from "../../errors"
import { Providers } from "../providers/providers-service"

import type { WorkflowStep } from "cloudflare:workers"
import { eq, sql } from "drizzle-orm"
import type { PgRemoteDatabase } from "drizzle-orm/pg-proxy"
import * as schema from "../../drizzle/schema"
import { stepEffect } from "../../lib/step-effect"
import type { InsertItem } from "../db-service"

const insertItems = ({
	items,
	db,
	resourceKey,
	providerKey,
	collectionId,
}: {
	collectionId: string
	resourceKey: string
	providerKey: string
	items: {
		id: string
		data: unknown
	}[]
	db: PgRemoteDatabase<Record<string, never>>
}) =>
	Effect.gen(function* () {
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

		yield* Effect.logInfo(`synced ${dbItems.length} items for ${providerKey}:${resourceKey}`)
	})

const getThirdPartyConnection = (collectionId: string, db: PgRemoteDatabase<Record<string, never>>) =>
	Effect.gen(function* () {
		const thirdPartyConnection = (yield* db
			.select()
			.from(schema.thirdPartyConnections)
			.where(eq(schema.thirdPartyConnections.collectionId, collectionId)))[0]

		if (!thirdPartyConnection) {
			return yield* new ThirdPartyConnectionNotFoundError(collectionId)
		}

		return thirdPartyConnection
	})

export class SyncingService extends Effect.Service<SyncingService>()("SyncingService", {
	effect: Effect.gen(function* () {
		const providers = yield* Providers

		return {
			syncResource: (collectionId: string, providerKey: string, resourceKey: string, step: WorkflowStep) =>
				Effect.gen(function* () {
					const db = yield* PgDrizzle

					const thirdPartyConnection = yield* stepEffect(
						step,
						"getThirdPartyConnection",
						getThirdPartyConnection(collectionId, db),
					)

					const provider = yield* Effect.map(
						TMap.get(providers, providerKey),
						Option.getOrThrowWith(() => new ProviderNotFoundError(providerKey)),
					)

					const resource = yield* Effect.map(
						TMap.get(provider, resourceKey),
						Option.getOrThrowWith(() => new ResourceNotFoundError(providerKey, resourceKey)),
					)

					const limit = 50

					if (resource.baseOptions.paginationType === "cursor") {
						let hasMore = true
						let cursorId: Option.Option<string> = Option.none()

						while (hasMore) {
							const { paginationInfo, items } = yield* stepEffect(
								step,
								"getEntries",
								resource.getEntries(thirdPartyConnection.accessToken, {
									type: "cursor",
									cursorId: cursorId,
									limit: limit,
								}),
							)

							if (paginationInfo.type === "offset") {
								return yield* Effect.fail("Should not get here")
							}

							yield* stepEffect(
								step,
								"insertItems",
								insertItems({ items, db, resourceKey, providerKey, collectionId }),
							)

							cursorId = paginationInfo.cursorId
							hasMore = paginationInfo.hasMore
						}
					}

					if (resource.baseOptions.paginationType === "offset") {
						const count = yield* resource.getCount(thirdPartyConnection.accessToken)
						yield* Effect.logInfo(`Found ${count} items for ${providerKey}:${resourceKey}`)

						for (let i = 0; i < count; i += limit) {
							const { items } = yield* stepEffect(
								step,
								"getEntries",
								resource.getEntries(thirdPartyConnection.accessToken, {
									type: "offset",
									offset: i,
									limit: limit,
								}),
							)

							yield* stepEffect(
								step,
								"insertItems",
								insertItems({ items, db, resourceKey, providerKey, collectionId }),
							)
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
