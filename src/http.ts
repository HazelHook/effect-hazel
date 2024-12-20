import { HttpApiBuilder, HttpApiScalar, HttpServer } from "@effect/platform"
import { Layer, LogLevel, Logger, pipe } from "effect"
import { Api } from "./api"
import { HttpCollectionsLive } from "./routes/collections/http"
import { HttpRootLive } from "./routes/root/http"

export const ApiLive = Layer.provide(HttpApiBuilder.api(Api), [HttpRootLive, HttpCollectionsLive])

export const HttpAppLive = pipe(
	HttpApiBuilder.Router.Live,
	Layer.provide(HttpApiScalar.layer()),
	Layer.provideMerge(HttpApiBuilder.middlewareOpenApi()),
	Layer.provideMerge(HttpApiBuilder.middlewareCors()),
	Layer.provideMerge(HttpServer.layerContext),
	Layer.provideMerge(ApiLive),

	Layer.provide(Logger.minimumLogLevel(LogLevel.All)),
	Layer.provide(Logger.structured),
)
