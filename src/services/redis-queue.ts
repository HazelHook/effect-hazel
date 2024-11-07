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
											.hset(getQueueName("hashed"), item.id, JSON.stringify(item))
											.lpush(getQueueName("pending"), item.id)
											.exec(),
									catch: (e) => Effect.fail(e),
								})

								yield* Effect.logInfo(`Enqueued ${item.id} for ${name}`)

								return item
							}),
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

								return parsedMessage
							}),
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

								return true
							}),
						nack: (messageId: string) =>
							Effect.gen(function* () {
								const message = yield* Effect.tryPromise({
									try: () => redis.hget(getQueueName("hashed"), messageId),
									catch: (e) => Effect.fail(e),
								})

								if (!message) {
									return yield* Effect.fail("Message not found")
								}

								const parsedMessage = yield* Schema.decodeUnknown(Message)(JSON.parse(message))

								const xd = yield* Effect.tryPromise({
									try: () =>
										redis.brpoplpush(
											getQueueName("processing"),
											getQueueName("pending"),
											messageId,
										),
									catch: (e) => Effect.fail(e),
								})
							}),
					}
				}),
		}
	}),
}) {}

const program = Effect.gen(function* () {
	const redisService = yield* RedisService
	const queue = yield* redisService.new("test")
	yield* queue.enqueue("hello")
	yield* queue.enqueue("hello2")
	yield* queue.enqueue("hello3")

	const item = yield* queue.dequeue()

	console.log(item)

	if (!item) return

	yield* queue.ack(item.id)
}).pipe(Effect.provide(RedisService.Default), Effect.scoped)

Effect.runPromise(program)
