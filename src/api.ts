import { HttpApi, OpenApi } from "@effect/platform"
import { CollectionApi } from "./routes/collections/api"
import { RootApi } from "./routes/root/api"

export class Api extends HttpApi.empty.add(RootApi).add(CollectionApi).annotate(OpenApi.Title, "Hazel API") {}
