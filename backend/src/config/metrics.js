/**
 * Prometheus-format metrics for /metrics plus OpenTelemetry metrics for Grafana Cloud.
 *
 * The small in-process registry keeps /metrics available without requiring
 * an external collector in local development.
 */
const { metrics } = require("@opentelemetry/api");

const meter = metrics.getMeter("pulsemarket-api");
const requestCounter = meter.createCounter("pulsemarket_http_requests_total", {
  description: "Total HTTP requests handled by PulseMarket.",
});
const serverErrorCounter = meter.createCounter("pulsemarket_http_requests_errors_total", {
  description: "Total HTTP requests that returned a 5xx response.",
});
const requestDuration = meter.createHistogram("pulsemarket_http_request_duration_ms", {
  description: "HTTP request duration in milliseconds.",
  unit: "ms",
});
meter.createObservableGauge("pulsemarket_process_uptime_seconds", {
  description: "Process uptime in seconds.",
  unit: "s",
}).addCallback((result) => result.observe(process.uptime()));
meter.createObservableGauge("pulsemarket_process_resident_memory_bytes", {
  description: "Resident memory size in bytes.",
  unit: "By",
}).addCallback((result) => result.observe(process.memoryUsage().rss));
meter.createObservableGauge("pulsemarket_nodejs_heap_used_bytes", {
  description: "Node.js heap used in bytes.",
  unit: "By",
}).addCallback((result) => result.observe(process.memoryUsage().heapUsed));

const counters = {
  http_requests_total: 0,
  http_requests_errors_total: 0,
};
const durations = []; // simple ring buffer of recent request durations (ms)
const MAX_SAMPLES = 1000;

function observeRequest(durationMs, statusCode, attributes) {
  counters.http_requests_total += 1;
  if (statusCode >= 500) counters.http_requests_errors_total += 1;
  requestCounter.add(1, attributes);
  if (statusCode >= 500) serverErrorCounter.add(1, attributes);
  requestDuration.record(durationMs, attributes);
  durations.push(durationMs);
  if (durations.length > MAX_SAMPLES) durations.shift();
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function render() {
  const sorted = [...durations].sort((a, b) => a - b);
  const mem = process.memoryUsage();
  const lines = [
    "# HELP http_requests_total Total number of HTTP requests handled.",
    "# TYPE http_requests_total counter",
    `http_requests_total ${counters.http_requests_total}`,
    "# HELP http_requests_errors_total Total number of 5xx responses.",
    "# TYPE http_requests_errors_total counter",
    `http_requests_errors_total ${counters.http_requests_errors_total}`,
    "# HELP http_request_duration_p95_ms Recent request latency p95 (ms).",
    "# TYPE http_request_duration_p95_ms gauge",
    `http_request_duration_p95_ms ${percentile(sorted, 95)}`,
    "# HELP process_uptime_seconds Process uptime in seconds.",
    "# TYPE process_uptime_seconds gauge",
    `process_uptime_seconds ${process.uptime()}`,
    "# HELP process_resident_memory_bytes Resident memory size in bytes.",
    "# TYPE process_resident_memory_bytes gauge",
    `process_resident_memory_bytes ${mem.rss}`,
    "# HELP nodejs_heap_used_bytes Node heap used in bytes.",
    "# TYPE nodejs_heap_used_bytes gauge",
    `nodejs_heap_used_bytes ${mem.heapUsed}`,
  ];
  return `${lines.join("\n")}\n`;
}

/** Express middleware that times every request. */
function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const route = req.route ? `${req.baseUrl}${req.route.path}` : "unmatched";
    observeRequest(durationMs, res.statusCode, {
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });
  next();
}

module.exports = { metricsMiddleware, render };
