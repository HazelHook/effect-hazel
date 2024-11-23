import { Effect, pipe } from "effect"
import { Collection } from "~/models/collection"
import { CollectionRepo } from "./collection-repo"

export class Collections extends Effect.Service<Collections>()("Collections", {
	effect: Effect.gen(function* () {
		const collectionRepo = yield* CollectionRepo

		const createCollection = (collection: typeof Collection.jsonCreate.Type) => {
			return pipe(
				collectionRepo.insert(Collection.insert.make(collection)),
				Effect.withSpan("Collection.create", { attributes: { collection } }),
			)
		}

		return { createCollection } as const
	}),
	dependencies: [CollectionRepo.Default],
}) {}
