import { Config, ConfigProvider, Effect, Layer } from "effect"

type Env = {
	FIRST_WORKFLOW: Workflow
	POSTGRES_URL: string
	// SECOND_WORKFLOW: Workflow
}

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const program = Effect.gen(function* () {
	const postgresUrl = yield* Config.string("POSTGRES_URL")
	yield* Effect.logInfo(postgresUrl)
	yield* Effect.logInfo("Hello World")

	return postgresUrl
})

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const configProvider = ConfigProvider.fromJson(env)
		const configLayer = Layer.setConfigProvider(configProvider)

		const test = await Effect.runPromise(program.pipe(Effect.provide(configLayer)))

		return Response.json({ test })
	},
} satisfies ExportedHandler<Env>
