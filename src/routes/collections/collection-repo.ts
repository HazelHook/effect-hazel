import { Effect } from "effect"
import { PgLive } from "~/services/db-service"

import { Model } from "@effect/sql"
import { Collection } from "~/models/collection"

export const make = Model.makeRepository(Collection, {
	tableName: "collections",
	spanPrefix: "CollectionsRepo",
	idColumn: "id",
})

export class CollectionRepo extends Effect.Service<CollectionRepo>()("CollectionRepo", {
	effect: Model.makeRepository(Collection, {
		tableName: "accounts",
		spanPrefix: "AccountsRepo",
		idColumn: "id",
	}),
	dependencies: [PgLive],
}) {}
