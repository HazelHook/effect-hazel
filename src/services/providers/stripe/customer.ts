import { Effect, Option } from "effect"
import { ResourceService } from "../../core/resource-service"

import * as S from "@effect/schema/Schema"
import { StripeCustomer } from "./schema"

class GetCustomerEntriesSchema extends S.Class<GetCustomerEntriesSchema>("GetCustomerEntriesSchema")({
	object: S.Literal("list"),
	data: S.Array(StripeCustomer),
	has_more: S.Boolean,
	url: S.Literal("/v1/customers"),
}) {}

export class StripeCustomerProvider extends Effect.Service<StripeCustomerProvider>()("StripeCustomerProvider", {
	effect: Effect.gen(function* () {
		const resourceService = yield* ResourceService

		const providerClient = resourceService.init("https://api.stripe.com/v1/", {
			itemSchema: StripeCustomer,
			paginationType: "cursor",
			getEntry: {
				path: "customers",
				schema: StripeCustomer,
				mapData(data) {
					return Effect.succeed({
						id: data.id,
						data: data,
					})
				},
			},
			getEntries: {
				path: "customers",
				schema: GetCustomerEntriesSchema,
				mapData(data) {
					const cursorId = data.data[data.data.length - 1]?.id
					return Effect.succeed({
						items: data.data.map((datum) => ({ id: datum.id, data: datum })),
						paginationInfo: {
							type: "cursor",
							hasMore: data.has_more,
							cursorId: cursorId ? Option.some(cursorId) : Option.none(),
						},
					})
				},
			},
			getCount: undefined,
		})

		return providerClient
	}),
	dependencies: [ResourceService.Default],
}) {}
