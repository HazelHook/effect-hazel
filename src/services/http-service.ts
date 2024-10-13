import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientResponse } from "@effect/platform"
import type { Schema } from "@effect/schema"
import { Effect, Option } from "effect"

export type HttpServiceReturnType<GetEntrySchema = unknown, GetEntriesSchema = unknown> = {
	getEntry: (
		entityType: string,
		bearerToken: string,
		entryId: string,
	) => Effect.Effect<GetEntrySchema, unknown, never>
	getEntries: (
		entityType: string,
		bearerToken: string,
		options: { type: "cursor"; cursorId: Option.Option<string>; limit: number },
	) => Effect.Effect<GetEntriesSchema, unknown, never>
}

export class HttpService extends Effect.Service<HttpService>()("HttpService", {
	effect: Effect.gen(function* () {
		const defaultClient = yield* HttpClient.HttpClient

		const httpClient = defaultClient.pipe(HttpClient.filterStatusOk)

		return {
			get: <GetEntrySchema, GetEntriesSchema>(
				baseUrl: string,
				baseOptions: {
					getEntry: {
						schema: Schema.Schema<GetEntrySchema, any>
					}
					getEntries: {
						schema: Schema.Schema<GetEntriesSchema, any>
					}
				},
			): HttpServiceReturnType<GetEntrySchema, GetEntriesSchema> => {
				return {
					getEntry: (entityType: string, bearerToken: string, entryId: string) =>
						Effect.gen(function* () {
							return yield* HttpClientRequest.get(`/${entityType}/${entryId}`).pipe(
								HttpClientRequest.prependUrl(baseUrl),
								HttpClientRequest.bearerToken(bearerToken),
								httpClient.execute,
								Effect.flatMap(HttpClientResponse.schemaBodyJson(baseOptions.getEntry.schema)),
								Effect.scoped,
							)
						}),
					getEntries: (
						entityType: string,
						bearerToken: string,
						options: { type: "cursor"; cursorId: Option.Option<string>; limit: number },
					) =>
						Effect.gen(function* () {
							const params = new URLSearchParams()

							params.set("limit", String(options.limit))

							if (Option.isSome(options.cursorId)) {
								params.set("starting_after", options.cursorId.value)
							}

							return yield* HttpClientRequest.get(`/${entityType}`).pipe(
								HttpClientRequest.prependUrl(baseUrl),
								HttpClientRequest.bearerToken(bearerToken),
								HttpClientRequest.appendUrlParams(params),
								httpClient.execute,
								Effect.flatMap(HttpClientResponse.schemaBodyJson(baseOptions.getEntries.schema)),
								Effect.scoped,
							)
						}),
				}
			},
		}
	}).pipe(Effect.provide(FetchHttpClient.layer)),
}) {}
