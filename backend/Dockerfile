# ------------------------------------------------------------------
#  PulseMarket API - multi-stage production image
#  (Used from the Docker phase onward; harmless to keep now.)
# ------------------------------------------------------------------

# ---- Stage 1: install production dependencies ---------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Stage 2: runtime --------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Run as the non-root user that the node image ships with.
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5000

# Basic container healthcheck hitting our own /health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:5000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

USER node
CMD ["node", "src/server.js"]
