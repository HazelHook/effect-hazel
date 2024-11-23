import { createClerkClient } from "@clerk/backend"
import { HttpApi, HttpServerRequest, OpenApi } from "@effect/platform"
import { Config, Effect, Layer } from "effect"
import { Authorization, User } from "./authorization"
import { Unauthorized } from "./errors"
import { CollectionApi } from "./routes/collections/api"
import { RootApi } from "./routes/root/api"

export const AuthorizationLive = Layer.effect(
	Authorization,
	Effect.gen(function* () {
		const clerkSecretKey = yield* Config.string("CLERK_SECRET_KEY")
		const clerkPublishableKey = yield* Config.string("CLERK_PUBLISHABLE_KEY")
		const clerkClient = createClerkClient({
			secretKey: clerkSecretKey,
			publishableKey: clerkPublishableKey,
		})

		yield* Effect.log("creating Authorization middleware")

		return Authorization.of({
			bearer: (bearerToken) =>
				Effect.gen(function* () {
					const req = yield* HttpServerRequest.HttpServerRequest

					const requestState = yield* Effect.tryPromise({
						try: () =>
							clerkClient.authenticateRequest(req.source as Request, {
								// jwtKey: process.env.CLERK_JWT_KEY,
								// authorizedParties: ["https://example.com"],
							}),
						catch: (e) => new Unauthorized({ message: "Clerk doesnt seem to be setup" }),
					})

					if (!requestState.isSignedIn) {
						return yield* Effect.fail(new Unauthorized({ message: "User is not singed in" }))
					}

					const subId = requestState.toAuth().sessionClaims.sub

					return User.make({
						id: subId,
					})
				}),
		})
	}),
)

export class Api extends HttpApi.empty.add(RootApi).add(CollectionApi).annotate(OpenApi.Title, "Hazel API") {}
