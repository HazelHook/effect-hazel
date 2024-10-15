import { DevTools } from "@effect/experimental"
import { BunSocket } from "@effect/platform-bun"
import { Layer } from "effect"

export const DevToolsLive = DevTools.layerWebSocket().pipe(Layer.provide(BunSocket.layerWebSocketConstructor))
