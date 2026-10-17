/**
 * Dependency-free metrics registry.
 *
 * Exposes a Prometheus text-format payload at GET /metrics so the later
 * Prometheus + Grafana phase can scrape the API with zero changes.
 * (A full prom-client integration can replace this file later.)
 */
const counters = {
  http_requests_total: 0,
  http_requests_errors_total: 0,
};
const durations = []; // simple ring buffer of recent request durations (ms)
const MAX_SAMPLES = 1000;

function observeRequest(durationMs, statusCode) {
  counters.http_requests_total += 1;
  if (statusCode >= 500) counters.http_requests_errors_total += 1;
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
    observeRequest(durationMs, res.statusCode);
  });
  next();
}

module.exports = { metricsMiddleware, render };
