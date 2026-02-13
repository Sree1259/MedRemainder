# Step 16 – Security, Compliance & Testing

## Goals
- HIPAA and GDPR compliance measures
- Encryption at rest and in transit
- Comprehensive testing strategy (unit, integration, E2E)

---

## 1. Security Measures

### Encryption
| Layer | Method |
|---|---|
| **In transit** | TLS 1.3 (HTTPS everywhere) |
| **At rest (DB)** | PostgreSQL TDE or application-level AES-256 for sensitive fields |
| **At rest (files)** | S3/MinIO server-side encryption |
| **Tokens** | JWT signed with RS256 (asymmetric keys) |
| **Passwords** | bcrypt (cost factor 12) |
| **Sensitive fields** | Encrypt PII fields (email, phone) at application level |

### HIPAA Compliance Checklist
| Requirement | Implementation |
|---|---|
| Access controls | RBAC + row-level security |
| Audit trail | All data access logged in `audit_logs` |
| Encryption | AES-256 at rest, TLS 1.3 in transit |
| Data minimisation | Collect only necessary data |
| Breach notification | Monitoring + alerting system |
| BAA (Business Associate Agreement) | Required with all cloud providers |
| Employee training | N/A (technical measures only) |

### GDPR Compliance
| Requirement | Implementation |
|---|---|
| Right to access | `GET /user/data-export` → full data download |
| Right to erasure | `DELETE /user/account` → full data deletion |
| Data portability | Export as JSON or CSV |
| Consent management | Explicit opt-in for data processing |
| Privacy policy | In-app + web privacy policy |
| DPO contact | Configurable contact information |

### API Security
| Measure | Implementation |
|---|---|
| Rate limiting | 100 req/min general, 5 req/15min for auth |
| Input validation | Zod schemas on all endpoints |
| SQL injection prevention | Prisma ORM (parameterised queries) |
| XSS prevention | Helmet headers, sanitise user input |
| CORS | Whitelist allowed origins |
| Content Security Policy | Strict CSP headers |
| API key rotation | Rotate signing keys quarterly |

---

## 2. Testing Strategy

### Test Pyramid

```
         ┌───────┐
         │  E2E  │  ← 10% (critical user flows)
        ┌┴───────┴┐
        │ Integration│ ← 30% (API + DB)
       ┌┴───────────┴┐
       │    Unit      │ ← 60% (services, utils)
       └──────────────┘
```

### Unit Tests
- **Framework**: Jest + ts-jest
- **Coverage target**: 80% minimum for services and utils
- **What to test**:
  - Service layer business logic
  - Schedule builder strategies
  - Validation schemas
  - Utility functions
  - Error handling

```bash
# Run unit tests
npm -w services/api run test:unit

# With coverage
npm -w services/api run test:unit -- --coverage
```

### Integration Tests
- **Framework**: Jest + Supertest
- **Database**: Test PostgreSQL container (Docker)
- **What to test**:
  - Full API request/response cycles
  - Database CRUD operations
  - Auth flows (register → login → access → refresh)
  - Medication CRUD with validation
  - Reminder scheduling pipeline

```bash
# Start test database
docker compose -f docker-compose.test.yml up -d

# Run integration tests
npm -w services/api run test:integration
```

### End-to-End Tests (Mobile)
- **Framework**: Detox (React Native E2E)
- **What to test**:
  - Registration and login flow
  - Add medication with schedule
  - Receive and respond to reminder
  - Health measurement entry
  - Medfriend invitation flow

```bash
# Build and run Detox tests
npx detox build --configuration ios.sim.debug
npx detox test --configuration ios.sim.debug
```

### End-to-End Tests (Web Dashboard)
- **Framework**: Playwright
- **What to test**:
  - Provider login and dashboard view
  - Patient report generation
  - Subscription management

```bash
npx playwright test
```

### AI Engine Tests
```bash
# Run Python tests
cd services/ai-engine
pytest tests/ -v --cov=app
```

---

## 3. CI Test Matrix

| Stage | Tests | Gate |
|---|---|---|
| Pre-commit | Lint + format (Husky) | Must pass |
| PR check | Unit + integration tests | Must pass |
| Pre-merge | Full test suite + E2E | Must pass |
| Nightly | Full suite + performance benchmarks | Report only |

---

> **Next →** [Step 17 – Deployment & CI/CD](./17-deployment-cicd.md)
