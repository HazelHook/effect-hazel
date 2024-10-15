import { NodeSdk } from "@effect/opentelemetry"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node"

export const OpenTelemtryLive = NodeSdk.layer(() => ({
	resource: { serviceName: "provider-sync" },
	spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter()),
}))
