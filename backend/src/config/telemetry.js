require("dotenv").config();

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

let meterProvider;
let loggerProvider;

function parseHeaders(value = "") {
  return Object.fromEntries(
    value.split(",").filter(Boolean).map((header) => {
      const separator = header.indexOf("=");
      if (separator < 1) throw new Error("Invalid OTEL_EXPORTER_OTLP_HEADERS entry");
      return [
        decodeURIComponent(header.slice(0, separator).trim()),
        decodeURIComponent(header.slice(separator + 1).trim()),
      ];
    })
  );
}

if (endpoint) {
  const { resourceFromAttributes } = require("@opentelemetry/resources");
  const { metrics } = require("@opentelemetry/api");
  const { logs } = require("@opentelemetry/api-logs");
  const { OTLPLogExporter } = require("@opentelemetry/exporter-logs-otlp-http");
  const { OTLPMetricExporter } = require("@opentelemetry/exporter-metrics-otlp-http");
  const {
    BatchLogRecordProcessor,
    LoggerProvider,
  } = require("@opentelemetry/sdk-logs");
  const {
    MeterProvider,
    PeriodicExportingMetricReader,
  } = require("@opentelemetry/sdk-metrics");

  const baseUrl = endpoint.replace(/\/+$/, "");
  const headers = parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);
  const resource = resourceFromAttributes({
    "service.name": process.env.OTEL_SERVICE_NAME || "pulsemarket-api",
  });

  meterProvider = new MeterProvider({
    resource,
    readers: [
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          url: `${baseUrl}/v1/metrics`,
          headers,
        }),
      }),
    ],
  });
  metrics.setGlobalMeterProvider(meterProvider);

  loggerProvider = new LoggerProvider({ resource });
  loggerProvider.addLogRecordProcessor(
    new BatchLogRecordProcessor(
      new OTLPLogExporter({
        url: `${baseUrl}/v1/logs`,
        headers,
      })
    )
  );
  logs.setGlobalLoggerProvider(loggerProvider);
  console.log(JSON.stringify({ level: "info", msg: "Grafana Cloud OTLP export enabled" }));
}

async function shutdown() {
  await Promise.all([
    meterProvider?.shutdown(),
    loggerProvider?.shutdown(),
  ].filter(Boolean));
}

module.exports = { shutdown };
