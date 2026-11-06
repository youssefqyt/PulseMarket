# Monitoring

The API exposes these endpoints:

| Endpoint   | Purpose                                   |
|------------|-------------------------------------------|
| `/health`  | liveness - is the process up?             |
| `/ready`   | readiness - is the required database reachable? |
| `/metrics` | Prometheus text-format metrics             |

For managed hosting, the API can export metrics and structured logs directly
to Grafana Cloud over OTLP. Set `OTEL_EXPORTER_OTLP_ENDPOINT` to the Grafana
Cloud OTLP endpoint ending in `/otlp`, and set
`OTEL_EXPORTER_OTLP_HEADERS` to the URL-encoded
`Authorization=Basic <base64(instance-id:token)>` header. Set
`OTEL_SERVICE_NAME=pulsemarket-api` (the default) to label the service.
Without an OTLP endpoint, exporting is disabled; the API still writes JSON
logs to stdout for Render's built-in log viewer and retains `/metrics` for a
Prometheus scraper.

Grafana Cloud receives **metrics and logs**; Prometheus itself only collects
metrics. For local Docker practice, the planned self-hosted stack is:

```
monitoring/
├── prometheus/
│   └── prometheus.yml       # scrape config: api:5000/metrics, node-exporter
├── grafana/
│   ├── provisioning/
│   └── dashboards/
│       └── pulsemarket.json # CPU / RAM / RPS / latency / error-rate panels
└── loki/
    └── loki-config.yml      # log aggregation, queried from Grafana
```

The OTLP exporter requires Grafana Cloud credentials; do not commit them to
`.env.example`, `render.yaml`, or source control. Configure them as secret
environment variables in Render.
