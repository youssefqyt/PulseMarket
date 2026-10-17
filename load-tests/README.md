# Load tests

Performance / scaling validation (Phase 15-16), run with
[k6](https://k6.io/).

Planned contents:

```
load-tests/
├── k6/
│   ├── smoke.js       # 1 VU - does the API answer at all?
│   ├── load.js        # 100 VUs - steady-state throughput & latency
│   └── stress.js      # ramp to breaking point, watch error rate
└── results/           # exported summaries (p95, p99, RPS, errors)
```

Example (after the app is running):

```bash
k6 run load-tests/k6/load.js --out json=load-tests/results/run.json
```

The numbers reported on the CV should come from these runs - never invented.
