import {
	FetchHttpClient,
	HttpClient,
	type HttpClientError,
	HttpClientRequest,
	HttpClientResponse,
} from "@effect/platform"
import type { Schema } from "@effect/schema"
import type { ParseError } from "@effect/schema/ParseResult"
import { Effect, Option } from "effect"

export type HttpServiceImpl<Item = unknown, GetEntrySchema = unknown, GetEntriesSchema = unknown> = {
	getEntry: (
		entityType: string,
		bearerToken: string,
		entryId: string,
	) => Effect.Effect<{ id: string; data: Item }, HttpClientError.HttpClientError | ParseError, never>
	getEntries: (
		entityType: string,
		bearerToken: string,
		options: { type: "cursor"; cursorId: Option.Option<string>; limit: number },
	) => Effect.Effect<{ id: string; data: Item }[], HttpClientError.HttpClientError | ParseError, never>
}

export type BaseOptions<Item = unknown, GetEntrySchema = unknown, GetEntriesSchema = unknown> = {
	itemSchema: Schema.Schema<Item, any>
	getEntry: {
		mapData: (data: GetEntrySchema) => Effect.Effect<{ id: string; data: Item }, never, never>
		schema: Schema.Schema<GetEntrySchema, any>
	}
	getEntries: {
		mapData: (data: GetEntriesSchema) => Effect.Effect<{ id: string; data: Item }[], never, never>
		schema: Schema.Schema<GetEntriesSchema, any>
	}
}

export class HttpService extends Effect.Service<HttpService>()("HttpService", {
	effect: Effect.gen(function* () {
		const defaultClient = yield* HttpClient.HttpClient

		const httpClient = defaultClient.pipe(HttpClient.filterStatusOk)

		return {
			get: <Item, GetEntrySchema, GetEntriesSchema>(
				baseUrl: string,
				baseOptions: BaseOptions<Item, GetEntrySchema, GetEntriesSchema>,
			): HttpServiceImpl<Item, GetEntrySchema, GetEntriesSchema> => {
				return {
					getEntry: (entityType: string, bearerToken: string, entryId: string) =>
						Effect.gen(function* () {
							return yield* HttpClientRequest.get(`/${entityType}/${entryId}`).pipe(
								HttpClientRequest.prependUrl(baseUrl),
								HttpClientRequest.bearerToken(bearerToken),
								httpClient.execute,
								Effect.flatMap(HttpClientResponse.schemaBodyJson(baseOptions.getEntry.schema)),
								Effect.flatMap(baseOptions.getEntry.mapData),
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
								Effect.flatMap(baseOptions.getEntries.mapData),
								Effect.scoped,
							)
						}),
				}
			},
		}
	}).pipe(Effect.provide(FetchHttpClient.layer)),
}) {}
