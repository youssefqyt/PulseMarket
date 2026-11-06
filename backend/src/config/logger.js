/**
 * Tiny structured logger.
 * Levels: error > warn > info > debug.
 * Kept dependency-free so it works before the Loki/Prometheus phase.
 */
const config = require("../config");
const { logs } = require("@opentelemetry/api-logs");

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const OTEL_SEVERITY = { error: 17, warn: 13, info: 9, debug: 5 };
const current = LEVELS[config.logLevel] ?? LEVELS.info;
const otelLogger = logs.getLogger("pulsemarket-api");

function log(level, message, meta) {
  if (LEVELS[level] > current) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...(meta ? { meta } : {}),
  };
  const out = level === "error" ? console.error : console.log;
  out(JSON.stringify(line));
  const attributes = Object.fromEntries(
    Object.entries(meta || {}).filter(([, value]) =>
      ["string", "number", "boolean"].includes(typeof value)
    )
  );
  otelLogger.emit({
    severityNumber: OTEL_SEVERITY[level],
    severityText: level.toUpperCase(),
    body: message,
    attributes,
  });
}

module.exports = {
  error: (msg, meta) => log("error", msg, meta),
  warn: (msg, meta) => log("warn", msg, meta),
  info: (msg, meta) => log("info", msg, meta),
  debug: (msg, meta) => log("debug", msg, meta),
};
