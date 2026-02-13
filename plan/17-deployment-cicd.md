# Step 17 – Deployment & CI/CD

## Goals
- Production Docker configuration
- GitHub Actions CI/CD pipeline
- Monitoring and alerting
- Deployment environments

---

## 1. Environments

| Environment | Purpose | Infrastructure |
|---|---|---|
| **Local** | Development | Docker Compose (all services) |
| **Staging** | Testing & QA | Cloud VM or container service |
| **Production** | Live users | Cloud container orchestration (ECS / GCP Cloud Run / DigitalOcean App Platform) |

---

## 2. Production Docker Configuration

### Multi-stage build for API (optimised)
```dockerfile
# infra/docker/api.prod.Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY services/api/package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY services/api/ .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 express
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
USER express
EXPOSE 4000
ENV NODE_ENV=production
CMD ["node", "dist/server.js"]
```

### Production Docker Compose
```yaml
# docker-compose.prod.yml
version: "3.9"
services:
  api:
    build:
      context: .
      dockerfile: infra/docker/api.prod.Dockerfile
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:4000/api/v1/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  ai-engine:
    build:
      context: .
      dockerfile: infra/docker/ai.prod.Dockerfile
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/nginx/nginx.prod.conf:/etc/nginx/nginx.conf
      - ./infra/nginx/certs:/etc/nginx/certs
    depends_on:
      api:
        condition: service_healthy
```

---

## 3. GitHub Actions CI/CD

### `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint

  test-api:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: medreminder_test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci -w services/api
      - run: npx prisma migrate deploy
        working-directory: services/api
      - run: npm -w services/api run test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/medreminder_test

  test-ai:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r services/ai-engine/requirements.txt
      - run: pytest services/ai-engine/tests/ -v

  build:
    needs: [lint, test-api, test-ai]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with:
          file: infra/docker/api.prod.Dockerfile
          push: false
          tags: medreminder-api:${{ github.sha }}
```

### `.github/workflows/deploy.yml` (on merge to main)
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build & push Docker images
        # Push to container registry (ECR / GCR / GHCR)
      - name: Deploy to production
        # SSH / API call to deploy updated containers
      - name: Run database migrations
        # npx prisma migrate deploy
      - name: Smoke test
        # curl health endpoint
      - name: Notify team
        # Slack / Discord notification
```

---

## 4. Monitoring & Alerting

### Tools
| Tool | Purpose |
|---|---|
| **Prometheus** | Metrics collection |
| **Grafana** | Dashboards & visualisation |
| **Sentry** | Error tracking (API + mobile) |
| **UptimeRobot / Better Uptime** | Uptime monitoring |
| **PgHero** | PostgreSQL performance monitoring |

### Key Metrics to Monitor
| Category | Metrics |
|---|---|
| **API** | Request rate, latency (p50/p95/p99), error rate, active connections |
| **Database** | Query time, connection pool, slow queries, disk usage |
| **Redis** | Memory usage, queue depth, job processing time |
| **Notifications** | Send rate, delivery rate, failure rate |
| **Business** | DAU, reminders sent, adherence rate, sign-ups, conversions |

### Alert Rules
| Condition | Action |
|---|---|
| API error rate > 5% for 5 min | PagerDuty alert |
| API p99 latency > 2s for 10 min | Slack warning |
| DB connections > 80% pool | Slack warning |
| Notification failure rate > 10% | PagerDuty alert |
| Disk usage > 85% | Slack warning |

---

## 5. Backup Strategy

| Data | Frequency | Retention |
|---|---|---|
| PostgreSQL | Daily automated snapshot | 30 days |
| S3/MinIO (photos) | Replicated to second region | Indefinite |
| Redis | AOF persistence + daily RDB snapshot | 7 days |

---

## 6. Rollback Plan

1. All deployments tagged with git SHA
2. Previous Docker image always available in registry
3. Database migrations must be **reversible** (every `up` has a `down`)
4. Feature flags for gradual rollout of risky features
5. Blue-green deployment for zero-downtime releases

---

> **🎉 Plan Complete!** Return to [Step 00 – Project Overview](./00-project-overview.md) for the full index.
