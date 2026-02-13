# Step 03 – Backend API Foundation

## Goals
- Set up Express.js with TypeScript
- Implement layered architecture (Controller → Service → Repository)
- Configure middleware stack, error handling, and logging

---

## 1. Backend Structure

```
services/api/src/
├── server.ts                 # Entry point
├── app.ts                    # Express app factory
├── config/
│   ├── env.ts                # Zod-validated environment variables
│   ├── database.ts           # Prisma client singleton
│   └── redis.ts              # Redis client singleton
├── common/
│   ├── middleware/
│   │   ├── auth.middleware.ts       # JWT verification
│   │   ├── rbac.middleware.ts       # Role-based access guard
│   │   ├── validate.middleware.ts   # Zod request validation
│   │   ├── rateLimit.middleware.ts  # Rate limiting
│   │   ├── cors.middleware.ts       # CORS configuration
│   │   └── errorHandler.middleware.ts  # Global error handler
│   ├── errors/
│   │   ├── AppError.ts             # Base error class
│   │   ├── NotFoundError.ts
│   │   ├── ValidationError.ts
│   │   └── UnauthorizedError.ts
│   ├── types/
│   │   └── express.d.ts            # Extended Request type
│   └── utils/
│       ├── logger.ts               # Winston / Pino logger
│       ├── asyncHandler.ts         # Wrap async route handlers
│       └── pagination.ts           # Cursor/offset pagination helper
├── modules/
│   ├── auth/                       # (Step 04)
│   ├── medications/                # (Step 05)
│   ├── reminders/                  # (Step 06)
│   ├── interactions/               # (Step 07)
│   ├── health/                     # (Step 08)
│   ├── medfriends/                 # (Step 09)
│   ├── pharmacy/                   # (Step 10)
│   ├── ai/                         # (Step 11)
│   └── reports/                    # (Step 12)
└── tests/
    ├── unit/
    ├── integration/
    └── helpers/
```

---

## 2. Module Pattern (applied to every feature)

Each module follows the same structure for consistency (DRY, SRP):

```
modules/<feature>/
├── <feature>.controller.ts   # Route definitions, request parsing
├── <feature>.service.ts      # Business logic
├── <feature>.repository.ts   # Database queries (Prisma)
├── <feature>.schema.ts       # Zod validation schemas
├── <feature>.routes.ts       # Express Router
├── <feature>.types.ts        # TypeScript interfaces
└── __tests__/
    ├── <feature>.service.test.ts
    └── <feature>.controller.test.ts
```

### Design Patterns in Use

| Pattern | Where | Why |
|---|---|---|
| **Repository** | `*.repository.ts` | Abstracts DB; easy to mock in tests |
| **Service Layer** | `*.service.ts` | Business logic isolated from HTTP concerns |
| **Dependency Injection** | Constructor injection | Services receive repository via constructor |
| **Factory** | `app.ts` | `createApp()` factory for testability |
| **Chain of Responsibility** | Middleware stack | Auth → RBAC → Validate → Controller |

---

## 3. Middleware Stack Order

```typescript
// app.ts
app.use(helmet());                    // Security headers
app.use(cors(corsOptions));           // CORS
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);              // Log every request
app.use(rateLimiter);                // Global rate limit

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/medications', authMiddleware, medRoutes);
// ... more routes

// Error handling (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);
```

---

## 4. API Conventions

| Aspect | Convention |
|---|---|
| Base path | `/api/v1/` |
| Response format | `{ success: boolean, data?: T, error?: { code, message, details } }` |
| Pagination | `?page=1&limit=20` or cursor-based `?cursor=<id>&limit=20` |
| Sorting | `?sort=created_at&order=desc` |
| Filtering | `?status=active&form=pill` |
| HTTP status codes | 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable, 429 Too Many Requests, 500 Internal |
| Versioning | URL path (`/v1/`) |
| Date format | ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`) |

### Standard Response Wrapper

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
```

---

## 5. Logging

- Use **Pino** (structured JSON logs, high performance)
- Log levels: `fatal`, `error`, `warn`, `info`, `debug`, `trace`
- Request logging: method, path, status, duration, user ID
- Sensitive data redacted (passwords, tokens)

---

## 6. Health Check

```
GET /api/v1/health
→ { status: "ok", uptime: 12345, db: "connected", redis: "connected" }
```

---

> **Next →** [Step 04 – Authentication](./04-authentication.md)
