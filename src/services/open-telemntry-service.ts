import { NodeSdk } from "@effect/opentelemetry"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node"

export const OpenTelemtryLive = NodeSdk.layer(() => ({
	resource: { serviceName: "provider-sync" },
	spanProcessor: new BatchSpanProcessor(
		new OTLPTraceExporter({
			url: "http://localhost:8000/traces",
			// TODO: Figure out how to get this working
			// headers: {
			// 	"x-api-key": Config.string("BASELIME_API_TOKEN"),
			// },
		}),
	),
}))
