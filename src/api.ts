import { HttpApi, OpenApi } from "@effect/platform"
import { RootApi } from "./routes/root/api"

export class Api extends HttpApi.empty.add(RootApi).annotate(OpenApi.Title, "Hazel API") {}
