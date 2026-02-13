# Step 01 – Environment Setup, Docker & Git

## Goals
- Initialise Git repository with branching strategy
- Set up Docker Compose for all services
- Scaffold the monorepo with npm workspaces
- Configure linting, formatting, and editor settings

---

## 1. Git Initialisation

```bash
git init
git branch -M main
```

### Branching Strategy (Git Flow lite)
| Branch | Purpose |
|---|---|
| `main` | Production-ready code |
| `develop` | Integration branch |
| `feature/<name>` | Individual features |
| `hotfix/<name>` | Urgent production fixes |
| `release/<version>` | Release candidates |

### `.gitignore` essentials
```
node_modules/
dist/
.env
.env.*
*.log
__pycache__/
.venv/
*.pyc
.expo/
android/
ios/
coverage/
```

### Commit Convention
Use [Conventional Commits](https://www.conventionalcommits.org/):
```
feat(medications): add schedule builder
fix(reminders): correct timezone offset
docs: update API documentation
```

---

## 2. Docker Compose

### Services to containerise

| Service | Image / Build | Port |
|---|---|---|
| `postgres` | `postgres:16-alpine` | 5432 |
| `redis` | `redis:7-alpine` | 6379 |
| `api` | Custom (Node.js) | 4000 |
| `ai-engine` | Custom (Python) | 8000 |
| `minio` | `minio/minio` | 9000, 9001 |
| `nginx` | `nginx:alpine` | 80, 443 |
| `pgadmin` | `dpage/pgadmin4` (dev only) | 5050 |
| `redis-commander` | `rediscommander/redis-commander` (dev only) | 8081 |

### `docker-compose.yml` outline
```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: medreminder
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pg_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  api:
    build:
      context: .
      dockerfile: infra/docker/api.Dockerfile
    depends_on: [postgres, redis, minio]
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/medreminder
      REDIS_URL: redis://redis:6379
    ports:
      - "4000:4000"
    volumes:
      - ./services/api:/app
      - /app/node_modules

  ai-engine:
    build:
      context: .
      dockerfile: infra/docker/ai.Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./services/ai-engine:/app

volumes:
  pg_data:
  minio_data:
```

### Dockerfiles

**`infra/docker/api.Dockerfile`**
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY services/api/package*.json ./
RUN npm ci
COPY services/api/ .
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

**`infra/docker/ai.Dockerfile`**
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY services/ai-engine/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/ai-engine/ .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 3. Monorepo Scaffold

### Root `package.json`
```json
{
  "name": "medreminder",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*",
    "services/api"
  ],
  "scripts": {
    "dev:api": "npm -w services/api run dev",
    "dev:mobile": "npm -w apps/mobile start",
    "dev:web": "npm -w apps/web run dev",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "test": "npm -ws run test --if-present"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "prettier": "^3.2.0",
    "typescript": "^5.4.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0"
  }
}
```

### Directory creation checklist
```
mkdir -p apps/mobile apps/web
mkdir -p packages/shared-types packages/ui-kit packages/utils
mkdir -p services/api/src/{modules,common,config} services/api/prisma services/api/tests
mkdir -p services/ai-engine/app/{routers,models,services} services/ai-engine/tests
mkdir -p infra/docker infra/nginx infra/scripts
mkdir -p plan
```

---

## 4. Dev Tooling Configuration

### TypeScript (`tsconfig.base.json`)
- Strict mode enabled
- Path aliases for packages (`@medreminder/shared-types`, etc.)

### ESLint
- `@typescript-eslint` plugin
- Rules: no-unused-vars (error), no-any (warn), consistent-return

### Prettier
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### Husky + lint-staged
- Pre-commit: `lint-staged` (lint + format changed files)
- Commit-msg: validate conventional commit format

### Environment Variables
- `.env.example` committed to repo with placeholder values
- `.env` (actual secrets) in `.gitignore`
- `dotenv` + `zod` for runtime env validation

---

> **Next →** [Step 02 – Database Design](./02-database-design.md)
