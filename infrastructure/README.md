# Infrastructure

This folder holds the **deployment & networking** assets used from the
Docker / deployment phase onward (Phase 7+). Nothing here is required to run
the app locally with `npm run dev`.

Planned contents:

```
infrastructure/
├── nginx/
│   └── nginx.conf          # reverse proxy: :443 -> api:5000 (+ gzip, headers)
├── docker/
│   └── docker-compose.prod.yml
└── deployment/
    ├── deploy.sh           # pull image from GHCR + restart on the VM
    └── systemd/pulsemarket-api.service
```

See the "Next phase" section of the root README for the step-by-step plan.
