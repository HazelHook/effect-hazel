import { BunRuntime } from "@effect/platform-bun"
import { Effect, Schema } from "effect"

import { Redis } from "ioredis"
import { nanoid } from "nanoid"

const Message = Schema.Struct({
	id: Schema.String,
	attempts: Schema.Number,
	timestamp: Schema.Number.pipe(
		Schema.propertySignature,
		Schema.withConstructorDefault(() => Date.now()),
	),
	payload: Schema.Any,
})

export class RedisService extends Effect.Service<RedisService>()("RedisService", {
	effect: Effect.gen(function* () {
		const redis = yield* Effect.acquireRelease(
			Effect.sync(
				() =>
					new Redis({
						port: 6379,
					}),
			),
			(redis) => Effect.promise(() => redis.quit()),
		)

		return {
			new: (name: string) =>
				Effect.gen(function* () {
					const getQueueName = (type: "processing" | "pending" | "hashed") => `${name}:${type}`

					return {
						enqueueMultiple: <T>(data: T[]) =>
							Effect.gen(function* () {
								const items = data.map((datum) =>
									Message.make({
										id: nanoid(),
										attempts: 0,
										timestamp: Date.now(),
										payload: datum,
									}),
								)

								yield* Effect.tryPromise({
									try: () =>
										redis
											.multi()
											.hset(
												getQueueName("hashed"),
												new Map(items.map((item) => [item.id, JSON.stringify(item)])),
											)
											.lpush(getQueueName("pending"), ...items.map((item) => item.id))
											.exec(),
									catch: (e) => Effect.fail(e),
								})

								yield* Effect.logInfo(`Enqueued ${items.length} for ${name}`)

								return items
							}).pipe(
								Effect.withSpan("enqueueMultiple", {
									attributes: {
										queueName: name,
										numberOfItems: data.length,
									},
								}),
							),
						enqueue: <T>(data: T) =>
							Effect.gen(function* () {
								const item = Message.make({
									id: nanoid(),
									attempts: 0,
									timestamp: Date.now(),
									payload: data,
								})

								yield* Effect.tryPromise({
									try: () =>
										redis
											.multi()
											.hset(getQueueName("hashed"), [item.id, JSON.stringify(item)])
											.lpush(getQueueName("pending"), item.id)
											.exec(),
									catch: (e) => Effect.fail(e),
								})

								yield* Effect.logInfo(`Enqueued ${item.id} for ${name}`)

								return item
							}).pipe(
								Effect.withSpan("enqueue", {
									attributes: {
										queueName: name,
										data: JSON.stringify(data),
									},
								}),
							),
						dequeue: () =>
							Effect.gen(function* () {
								const id = yield* Effect.tryPromise({
									try: () => redis.brpoplpush(getQueueName("pending"), getQueueName("processing"), 0),
									catch: (e) => Effect.fail(e),
								})

								if (!id) {
									return null
								}

								const item = yield* Effect.tryPromise({
									try: () => redis.hget(getQueueName("hashed"), id),
									catch: (e) => Effect.fail(e),
								})

								if (!item) return null

								const parsedMessage = yield* Schema.decodeUnknown(Message)(JSON.parse(item))

								yield* Effect.logInfo(`Dequeued ${parsedMessage.id} for ${name}`)

								return parsedMessage
							}).pipe(
								Effect.withSpan("dequeue", {
									attributes: {
										queueName: name,
									},
								}),
							),
						ack: (messageId: string) =>
							Effect.gen(function* () {
								const message = yield* Effect.tryPromise({
									try: () =>
										redis
											.multi()
											.lrem(getQueueName("processing"), 1, messageId)
											.hdel(getQueueName("hashed"), messageId)
											.del(`${getQueueName("processing")}:${messageId}`)
											.exec(),
									catch: (e) => Effect.fail(e),
								})

								yield* Effect.logInfo(`Acked ${messageId} for ${name}`)

								return true
							}).pipe(
								Effect.withSpan("ack", {
									attributes: {
										queueName: name,
									},
								}),
							),
						nack: (messageId: string) =>
							Effect.gen(function* () {
								yield* Effect.tryPromise({
									try: () =>
										redis
											.multi()
											.lrem(getQueueName("processing"), 1, messageId)
											.lpush(getQueueName("pending"), messageId)
											.exec(),
									catch: (e) => Effect.fail(e),
								})

								yield* Effect.logInfo(`Nacked ${messageId} for ${name}`)
							}).pipe(
								Effect.withSpan("nack", {
									attributes: {
										queueName: name,
									},
								}),
							),
					}
				}),
		}
	}),
}) {}

const program = Effect.gen(function* () {
	const start = yield* Effect.succeed(Date.now())
	const redisService = yield* RedisService
	const queue = yield* redisService.new("test")

	yield* queue.enqueue("hello")

	// const item = yield* queue.dequeue()

	// if (!item) return

	// yield* queue.ack(item.id)

	// const item2 = yield* queue.dequeue()

	// if (!item2) return

	// yield* queue.nack(item2.id)
	yield* Effect.logInfo(`Took ${Date.now() - start}ms`)
}).pipe(Effect.provide(RedisService.Default), Effect.scoped)

program.pipe(BunRuntime.runMain)
