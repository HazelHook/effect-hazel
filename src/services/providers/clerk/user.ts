import { Schema } from "@effect/schema"
import { Effect } from "effect"
import { ResourceService } from "../../core/resource-service"
import { ClerkUserSchema } from "./schemas"

class ClerkUserCountResSchema extends Schema.Class<ClerkUserCountResSchema>("ClerkUserCountRes")({
	total_count: Schema.Number,
	object: Schema.Literal("total_count"),
}) {}

export class ClerkUserProvider extends Effect.Service<ClerkUserProvider>()("StripeCustoClerkUserProvidermerProvider", {
	effect: Effect.gen(function* () {
		const httpClient = yield* ResourceService

		const providerClient = httpClient.init("https:/api.clerk.com/v1", {
			itemSchema: ClerkUserSchema,
			paginationType: "offset",
			getEntry: {
				schema: ClerkUserSchema,
				mapData(data) {
					return Effect.succeed({
						id: data.id,
						data: data,
					})
				},
			},
			getEntries: {
				schema: Schema.Array(ClerkUserSchema),
				mapData(data) {
					return Effect.succeed({
						items: data.map((datum) => ({ id: datum.id, data: datum })),
						paginationInfo: {
							type: "offset",
						},
					})
				},
			},
			getCount: {
				path: "/users/count",
				schema: ClerkUserCountResSchema,
				mapData(data) {
					return Effect.succeed(data.total_count)
				},
			},
		})

		return providerClient
	}),
	dependencies: [ResourceService.Default],
}) {}
