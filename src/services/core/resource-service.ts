import {
	FetchHttpClient,
	HttpClient,
	type HttpClientError,
	HttpClientRequest,
	HttpClientResponse,
} from "@effect/platform"
import { Effect, Option, Schedule, type Schema } from "effect"
import type { ParseError } from "effect/ParseResult"
import { GetCountNotImplemented } from "../../errors"

export type PaginationOffsetOptions = {
	type: "offset"
}

export type PaginationCursorOptions = {
	type: "cursor"
	cursorId: Option.Option<string>
	hasMore: boolean
}

export type ResourceServiceImpl<
	Item = unknown,
	GetEntrySchema = unknown,
	GetEntriesSchema = unknown,
	GetCountSchema = unknown,
	PaginationType = "cursor" | "offset",
> = {
	// TODO: Get the types of these right without
	baseOptions: BaseOptions<any, any, any, any, PaginationType>
	getEntry: (
		bearerToken: string,
		entryId: string,
	) => Effect.Effect<{ id: string; data: Item }, HttpClientError.HttpClientError | ParseError, never>
	getEntries: (
		bearerToken: string,
		options:
			| { type: "cursor"; cursorId: Option.Option<string>; limit: number }
			| { type: "offset"; offset: number; limit: number },
	) => Effect.Effect<
		{
			items: { id: string; data: Item }[]
			paginationInfo: PaginationType extends "cursor" ? PaginationCursorOptions : PaginationOffsetOptions
		},
		HttpClientError.HttpClientError | ParseError,
		never
	>
	getCount: (
		bearerToken: string,
	) => Effect.Effect<number, HttpClientError.HttpClientError | ParseError | GetCountNotImplemented, never>
}

export type BaseOptions<
	Item = unknown,
	GetEntrySchema = unknown,
	GetEntriesSchema = unknown,
	GetCountSchema = unknown,
	PaginationType = "cursor" | "offset",
> = {
	paginationType: PaginationType
	itemSchema: Schema.Schema<Item, any>
	getEntry: {
		path: string
		mapData: (data: GetEntrySchema) => Effect.Effect<{ id: string; data: Item }, never, never>
		schema: Schema.Schema<GetEntrySchema, any>
	}
	getEntries: GetEntries<Item, GetEntriesSchema, PaginationType>
	getCount: PaginationType extends "cursor"
		? undefined
		: {
				path: string
				schema: Schema.Schema<GetCountSchema, any>
				mapData: (data: GetCountSchema) => Effect.Effect<number, never, never>
			}
}

export interface GetEntries<Item, GetEntriesSchema, PaginationType = "cursor" | "offset"> {
	path: string
	mapData: (data: GetEntriesSchema) => Effect.Effect<
		{
			items: { id: string; data: Item }[]
			paginationInfo: PaginationType extends "cursor" ? PaginationCursorOptions : PaginationOffsetOptions
		},
		never,
		never
	>
	schema: Schema.Schema<GetEntriesSchema, any>
}

export class ResourceService extends Effect.Service<ResourceService>()("ResourceService", {
	effect: Effect.gen(function* () {
		const defaultClient = yield* HttpClient.HttpClient

		const httpClient = defaultClient.pipe(
			HttpClient.filterStatusOk,
			HttpClient.retry({ times: 3, schedule: Schedule.exponential("300 millis") }),
		)

		return {
			init: <Item, GetEntrySchema, GetEntriesSchema, GetCountSchema, PaginationType extends "cursor" | "offset">(
				baseUrl: string,
				baseOptions: BaseOptions<Item, GetEntrySchema, GetEntriesSchema, GetCountSchema, PaginationType>,
			): ResourceServiceImpl<Item, GetEntrySchema, GetEntriesSchema, GetCountSchema, PaginationType> => {
				return {
					baseOptions: baseOptions,
					getEntry: (bearerToken, entryId) =>
						Effect.gen(function* () {
							return yield* HttpClientRequest.get(`/${baseOptions.getEntry.path}/${entryId}`).pipe(
								HttpClientRequest.prependUrl(baseUrl),
								HttpClientRequest.bearerToken(bearerToken),
								httpClient.execute,
								Effect.flatMap(
									HttpClientResponse.schemaBodyJson(baseOptions.getEntry.schema, { errors: "all" }),
								),
								Effect.tapError((e) => Effect.logError("Error", e)),
								Effect.flatMap(baseOptions.getEntry.mapData),
								Effect.scoped,
							)
						}).pipe(Effect.withSpan("getEntry")),
					getEntries: (bearerToken, options) =>
						Effect.gen(function* () {
							const params = new URLSearchParams()

							params.set("limit", String(options.limit))

							if (options.type === "cursor") {
								if (Option.isSome(options.cursorId)) {
									params.set("starting_after", options.cursorId.value)
								}
							}

							if (options.type === "offset") {
								params.set("offset", String(options.offset))
							}

							return yield* HttpClientRequest.get(`/${baseOptions.getEntries.path}`).pipe(
								HttpClientRequest.prependUrl(baseUrl),
								HttpClientRequest.bearerToken(bearerToken),
								HttpClientRequest.appendUrlParams(params),
								httpClient.execute,
								Effect.flatMap(HttpClientResponse.schemaBodyJson(baseOptions.getEntries.schema)),
								Effect.tapError((e) => Effect.logError("Error", e)),
								Effect.flatMap(baseOptions.getEntries.mapData),
								Effect.scoped,
							)
						}).pipe(Effect.withSpan("getEntries")),
					getCount: (bearerToken) =>
						Effect.gen(function* () {
							if (!baseOptions.getCount) {
								return yield* new GetCountNotImplemented()
							}

							return yield* HttpClientRequest.get(baseOptions.getCount.path).pipe(
								HttpClientRequest.prependUrl(baseUrl),
								HttpClientRequest.bearerToken(bearerToken),
								httpClient.execute,
								Effect.flatMap(HttpClientResponse.schemaBodyJson(baseOptions.getCount.schema)),
								Effect.flatMap(baseOptions.getCount.mapData),
								Effect.scoped,
							)
						}).pipe(Effect.withSpan("getCount")),
				}
			},
		}
	}).pipe(Effect.provide(FetchHttpClient.layer)),
}) {}
