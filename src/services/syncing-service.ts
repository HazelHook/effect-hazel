import { Config, Effect, Option, TMap } from "effect"
import { CollectionNotFoundError, ProviderNotFoundError } from "../errors"
import { Providers } from "./providers/providers-service"

export class SyncingService extends Effect.Service<SyncingService>()("SyncingService", {
	effect: Effect.gen(function* () {
		const providers = yield* Providers

		return {
			syncCollection: (providerKey: string, collectionKey: string) =>
				Effect.gen(function* () {
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

						cursorId = paginationInfo.cursorId
						hasMore = paginationInfo.hasMore
						yield* Effect.log(items.length, hasMore)
					}
				}).pipe(Effect.withSpan("syncCollection")),
		}
	}),
	dependencies: [Providers.Default],
}) {}
