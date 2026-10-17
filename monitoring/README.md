# Monitoring

Observability stack, wired up in the monitoring phase (Phase 12+).
The API already exposes the endpoints these tools will scrape today:

| Endpoint   | Purpose                                   |
|------------|-------------------------------------------|
| `/health`  | liveness - is the process up?             |
| `/ready`   | readiness - are DB and Redis reachable?   |
| `/metrics` | Prometheus text-format metrics             |

Planned contents:

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
