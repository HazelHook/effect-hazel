import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import { Effect, Option, TMap } from "effect"
import { ProviderNotFoundError, ResourceNotFoundError, ThirdPartyConnectionNotFoundError } from "../../errors"
import { Providers } from "../providers/providers-service"

import { eq, inArray } from "drizzle-orm"
import * as schema from "../../drizzle/schema"
import type { InsertItem } from "../db-service"
import { RedisQueueService } from "../redis-queue"

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

					const limit = 50

					if (resource.baseOptions.paginationType === "cursor") {
						let hasMore = true
						let cursorId: Option.Option<string> = Option.none()

						while (hasMore) {
							const { paginationInfo, items } = yield* resource.getEntries(
								thirdPartyConnection.accessToken,
								{
									type: "cursor",
									cursorId: cursorId,
									limit: limit,
								},
							)

							// TODO: This should be fixxed by typscript knowing this is an offset, since we literally input it above,
							// TODO: please fix this at some point
							if (paginationInfo.type === "offset") {
								return yield* Effect.fail("Should not get here")
							}

							yield* handleSync({
								collectionId,
								providerKey,
								resourceKey,
								items,
							})

							cursorId = paginationInfo.cursorId
							hasMore = paginationInfo.hasMore
						}
					}

					if (resource.baseOptions.paginationType === "offset") {
						const count = yield* resource.getCount(thirdPartyConnection.accessToken)
						yield* Effect.logInfo(`Synced ${count} items for ${providerKey}:${resourceKey}`)

						for (let i = 0; i < count; i += limit) {
							const { items } = yield* resource.getEntries(thirdPartyConnection.accessToken, {
								type: "offset",
								offset: i,
								limit: limit,
							})

							yield* handleSync({
								collectionId,
								providerKey,
								resourceKey,
								items,
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

const handleSync = ({
	collectionId,
	providerKey,
	resourceKey,
	items,
}: {
	collectionId: string
	providerKey: string
	resourceKey: string
	items: {
		id: string
		data: unknown
	}[]
}) =>
	Effect.gen(function* () {
		const db = yield* PgDrizzle

		// const queueService = yield* RedisQueueService

		// const queue = yield* queueService.new(`${collectionId}:${providerKey}:${resourceKey}`)

		const dbItems = yield* db
			.select()
			.from(schema.items)
			.where(
				inArray(
					schema.items.externalId,
					items.map((item) => item.id),
				),
			)

		const data: InsertItem[] = items.map((item) => {
			return {
				externalId: item.id,
				data: item.data,
				collectionId: collectionId,
				resourceKey: resourceKey,
			}
		})

		const ids = new Set(dbItems.map((item) => item.externalId))

		// Filter out items that already exist in the database and insert new items,
		// this
		const newItems = data.filter((item) => !ids.has(item.externalId))
		const existingItems = data.filter((item) => ids.has(item.externalId))
		const itemsToUpdate = existingItems.reduce((acc, item) => {
			const dbItem = dbItems.find((dbItem) => dbItem.id === item.externalId)

			if (!dbItem || dbItem.data === item.data) {
				return acc
			}

			acc.push({ ...dbItem, ...item })
			return acc
		}, [] as schema.Item[])

		if (newItems.length > 0) {
			yield* db.insert(schema.items).values(newItems)

			yield* Effect.logInfo(`created ${newItems.length} new items for ${providerKey}:${resourceKey}`)
		}

		if (itemsToUpdate.length > 0) {
			// Update existing items that have changed, maybe this should be done in a transaction?

			yield* Effect.all(
				itemsToUpdate.map((item) => db.update(schema.items).set(item)),
				{
					concurrency: "unbounded",
				},
			)

			yield* Effect.logInfo(`synced ${itemsToUpdate.length} items for ${providerKey}:${resourceKey}`)
		}
	})
