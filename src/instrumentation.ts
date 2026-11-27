import { SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { LoggerProvider, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

const loggerProvider =
  token && host
    ? new LoggerProvider({
        resource: resourceFromAttributes({ "service.name": "wowresume" }),
        processors: [
          new SimpleLogRecordProcessor({
            exporter: new OTLPLogExporter({
              url: `${host.replace(/\/$/, "")}/i/v1/logs`,
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
          }),
        ],
      })
    : undefined;

const logger = loggerProvider?.getLogger("posthog-log-exporter");

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  if (!logger) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is not set: PostHog server logs are disabled.",
      );
    }
    return;
  }

  logger.emit({
    body: "PostHog log exporter configured",
    severityNumber: SeverityNumber.INFO,
    attributes: { lifecycle: "configured" },
  });
  logger.emit({
    body: "Next.js server instrumentation registered",
    severityNumber: SeverityNumber.INFO,
    attributes: { lifecycle: "registered" },
  });
}
