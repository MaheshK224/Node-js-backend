# Inventory API

A production-style REST API starter built with **Node.js, Express 5, TypeScript, Prisma 7 and PostgreSQL**.
It manages **categories** and **products** and is designed to be consumed by a React frontend.

> Authentication is intentionally **not** included. See [Adding authentication later](#adding-authentication-later).

---

## Tech stack

| Area          | Tool                                      | Why it is used                                              |
| ------------- | ----------------------------------------- | ----------------------------------------------------------- |
| Runtime       | Node.js 24 (`.nvmrc`)                     | Current LTS                                                 |
| Language      | TypeScript (strict)                       | Type safety, better editor support                          |
| Web framework | Express 5                                 | Most widely used Node framework; native async error support |
| ORM           | Prisma 7 + `@prisma/adapter-pg`           | Type-safe queries, migrations, seeding, Prisma Studio       |
| Database      | PostgreSQL                                |                                                             |
| Validation    | Zod 4                                     | Validates requests, env variables, and generates API docs   |
| API docs      | OpenAPI 3 + Swagger UI (`zod-to-openapi`) | Interactive docs generated from the same Zod schemas        |
| Logging       | Pino + pino-http                          | Fast structured (JSON) logs with request IDs                |
| Security      | helmet, cors, express-rate-limit          | Secure headers, allowed origins, abuse protection           |
| Performance   | compression                               | Gzip responses                                              |
| Testing       | Vitest + Supertest                        | Unit tests and HTTP integration tests                       |
| Code quality  | ESLint (typescript-eslint) + Prettier     | Consistent, bug-free code style                             |
| Git hooks     | Husky + lint-staged + commitlint          | Lint/format on commit, Conventional Commit messages         |
| Containers    | Docker (multi-stage) + docker-compose     | Same environment everywhere                                 |
| CI            | GitHub Actions                            | Lint, type-check, test and build on every push / PR         |

---

## Project structure

```
├── .github/workflows/ci.yml     # CI pipeline
├── .husky/                      # Git hooks (pre-commit, commit-msg)
├── docker/postgres/init.sql     # Creates extra databases in the Docker Postgres
├── prisma/
│   ├── schema.prisma            # Database models (source of truth)
│   ├── migrations/              # Generated SQL migrations (commit these!)
│   └── seed.ts                  # Sample data
├── src/
│   ├── api/v1/                  # API version 1
│   │   ├── index.ts             # v1 router + OpenAPI document
│   │   └── modules/
│   │       ├── health/          # Liveness & readiness checks
│   │       ├── categories/      # routes → controller → service → repository
│   │       └── products/
│   ├── config/                  # env validation, logger, cors, swagger, app info
│   ├── db/prisma.ts             # Single shared Prisma client
│   ├── generated/prisma/        # Prisma client (generated, git-ignored)
│   ├── middlewares/             # requestId, logger, validate, rate limit, 404, errors
│   ├── types/express.d.ts       # Custom properties on Express Request
│   ├── utils/                   # AppError, response helpers, pagination
│   ├── app.ts                   # Builds the Express app (no listen → testable)
│   └── server.ts                # Starts the server, graceful shutdown
├── tests/
│   ├── unit/                    # No database needed
│   └── integration/             # Real HTTP + test database
├── .env.example                 # Template for all .env files
├── Dockerfile
└── docker-compose.yml
```

### How a request flows

```
HTTP request
  → requestId → requestLogger → helmet → cors → compression → json parser → rate limiter
  → /api/v1 router → module router
  → validate (Zod)        ← rejects bad input with 400
  → controller            ← HTTP only (req/res)
  → service               ← business rules, throws AppError
  → repository            ← database only (Prisma)
  → response helper       ← { success, data, meta }
  ↘ any error → errorHandler → { success: false, error: {...} }
```

Each layer has one job, which keeps code easy to test and change.

---

## Getting started (local PostgreSQL)

### 1. Install

```bash
nvm use            # optional, uses Node 24 from .nvmrc
npm install        # also generates the Prisma client
```

### 2. Create the databases

Using pgAdmin or psql (`/Library/PostgreSQL/18/bin/psql -U postgres`):

```sql
CREATE DATABASE inventory_dev;
CREATE DATABASE inventory_test;
```

### 3. Configure environment

Edit `.env.development` and `.env.test` and set your PostgreSQL username and password in `DATABASE_URL`:

```
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/inventory_dev?schema=public
```

> If your password has special characters (`@ # / ? :` etc.), URL-encode them, e.g. `@` → `%40`.

### 4. Create tables and sample data

```bash
npm run db:migrate     # applies migrations to inventory_dev
npm run db:seed        # inserts sample categories & products
```

### 5. Run

```bash
npm run dev
```

- API: http://localhost:4000/api/v1/health
- Swagger docs: http://localhost:4000/api-docs
- OpenAPI JSON: http://localhost:4000/api-docs.json
- Browse data: `npm run db:studio`

### 6. Test

```bash
npm run db:deploy:test   # once (and after every new migration)
npm test
```

---

## Getting started (Docker)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
npm run docker:up        # postgres + pgadmin + migrations + api
npm run docker:logs      # follow API logs
npm run docker:down      # stop
```

| Service  | URL / port            | Credentials               |
| -------- | --------------------- | ------------------------- |
| API      | http://localhost:4000 |                           |
| Postgres | localhost:**5433**    | inventory / inventory     |
| pgAdmin  | http://localhost:5050 | admin@example.com / admin |

In pgAdmin, register a server with host `postgres`, port `5432`, user `inventory`, password `inventory`.

To seed the Docker database from your machine:

```bash
DATABASE_URL="postgresql://inventory:inventory@localhost:5433/inventory_dev" npx prisma db seed
```

---

## Environments

`NODE_ENV` selects which `.env.<NODE_ENV>` file is loaded. All values are validated at startup in
`src/config/env.ts`; the app refuses to start if anything is missing or invalid.

| NODE_ENV      | File               | Database         | Logs          | Swagger |
| ------------- | ------------------ | ---------------- | ------------- | ------- |
| `development` | `.env.development` | `inventory_dev`  | pretty, debug | on      |
| `test`        | `.env.test`        | `inventory_test` | silent        | off     |
| `qa`          | `.env.qa`          | `inventory_qa`   | JSON, info    | on      |
| `production`  | `.env.production`  | `inventory_prod` | JSON, warn    | off     |

- `.env.*` files are **git-ignored**. Only `.env.example` is committed.
- Real environment variables always win over the file. In real deployments, secrets come from
  the CI/CD system or a secret manager, not from files.

---

## npm scripts

| Script                                    | What it does                                          |
| ----------------------------------------- | ----------------------------------------------------- |
| `dev`                                     | Run with auto-reload (tsx watch)                      |
| `build`                                   | Compile TypeScript to `dist/`                         |
| `start:qa` / `start:prod`                 | Run compiled app with QA / production config          |
| `typecheck`, `lint`, `lint:fix`           | Static checks                                         |
| `format`, `format:check`                  | Prettier                                              |
| `test`, `test:watch`, `test:coverage`     | Vitest                                                |
| `db:migrate`                              | Create/apply a migration in dev (`-- --name add_xyz`) |
| `db:deploy:test/qa/prod`                  | Apply existing migrations (never creates new ones)    |
| `db:seed`, `db:reset`, `db:studio`        | Seed, drop+recreate dev DB, open Prisma Studio        |
| `docker:up`, `docker:down`, `docker:logs` | Docker compose helpers                                |

---

## API

Base URL: `http://localhost:4000/api/v1`. Full, interactive reference: **`/api-docs`**.

| Method | Path              | Description                              |
| ------ | ----------------- | ---------------------------------------- |
| GET    | `/health`         | Liveness                                 |
| GET    | `/health/ready`   | Readiness (checks database)              |
| GET    | `/categories`     | List (`page`, `limit`, `search`, `sort`) |
| GET    | `/categories/:id` | Get one                                  |
| POST   | `/categories`     | Create                                   |
| PATCH  | `/categories/:id` | Partial update                           |
| DELETE | `/categories/:id` | Delete (409 if it still has products)    |
| GET    | `/products`       | List with filters (see below)            |
| GET    | `/products/:id`   | Get one                                  |
| POST   | `/products`       | Create                                   |
| PATCH  | `/products/:id`   | Partial update                           |
| DELETE | `/products/:id`   | Soft delete                              |

Product list query example:

```
GET /api/v1/products?page=1&limit=10&search=phone&categoryId=<uuid>&isActive=true&minPrice=100&maxPrice=1000&sort=-price
```

### Response format

```jsonc
// success (list)
{
  "success": true,
  "data": [ { "id": "...", "name": "iPhone 16 128GB", "price": "799.99", ... } ],
  "meta": { "pagination": { "page": 1, "limit": 10, "totalItems": 9, "totalPages": 1, "hasNextPage": false, "hasPrevPage": false } }
}

// error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [ { "path": "price", "message": "Too small: expected number to be >0" } ],
    "requestId": "2f0c..."
  }
}
```

Error codes: `BAD_REQUEST`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
`PAYLOAD_TOO_LARGE`, `TOO_MANY_REQUESTS`, `INTERNAL_SERVER_ERROR`.

> `price` is returned as a **string** (`"799.99"`) because it is a `DECIMAL` in Postgres. JavaScript
> numbers can't represent all decimals exactly; convert with `Number()` only for display.

---

## Using it from React

1. Add your React dev URL to `CORS_ORIGINS` (Vite default `http://localhost:5173` is already there).
2. In the React project: `VITE_API_URL=http://localhost:4000/api/v1`
3. Optional but common: generate TypeScript types from the API docs:
   ```bash
   npx openapi-typescript http://localhost:4000/api-docs.json -o src/api/schema.d.ts
   ```
4. Every response has `success`, so one fetch wrapper can handle all calls:
   ```ts
   const res = await fetch(`${import.meta.env.VITE_API_URL}/products?page=1`);
   const body = await res.json();
   if (!body.success) throw new Error(body.error.message);
   return body; // { data, meta }
   ```
   Libraries commonly used for this in React: **TanStack Query** + `fetch`/**axios**.

---

## Adding a new module (e.g. `suppliers`)

1. Add the model to `prisma/schema.prisma` → `npm run db:migrate -- --name add_suppliers`
2. Create `src/api/v1/modules/suppliers/` with `supplier.schema.ts`, `.repository.ts`, `.service.ts`,
   `.controller.ts`, `.routes.ts`, `.docs.ts` (copy `categories` as a template)
3. Register the router and docs in `src/api/v1/index.ts`
4. Add tests in `tests/`

### Database change workflow

```bash
# 1. edit prisma/schema.prisma
npm run db:migrate -- --name describe_the_change   # creates prisma/migrations/<timestamp>_describe_the_change
# 2. commit the migration folder together with the code
# 3. other environments apply it with: npm run db:deploy:qa / db:deploy:prod (usually done by CI/CD)
```

Never edit a migration that has already been applied to QA/production; create a new one.

---

## API versioning

All routes live under `/api/v1`. For a breaking change (renamed field, different response shape),
create `src/api/v2/`, mount it at `/api/v2` in `app.ts`, and keep v1 running until all clients have
moved. Non-breaking changes (new optional field, new endpoint) can stay in v1.

---

## Git workflow

- Branches: `feature/<name>`, `fix/<name>`, `chore/<name>` → pull request into `main`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org) (enforced by commitlint):
  ```
  feat(products): add filter by price range
  fix(categories): return 409 when name exists
  chore: upgrade prisma
  ```
- `pre-commit` hook runs ESLint + Prettier on staged files.
- CI must pass before merging.

---

## Adding authentication later

Typical places to plug it in:

- `src/api/v1/modules/auth/` — register/login/refresh routes (same layering as other modules)
- `src/middlewares/authenticate.ts` — verify the JWT/session and set `req.user`
- `src/types/express.d.ts` — add `user?: AuthUser` to the Request type
- `src/config/env.ts` — add `JWT_SECRET`, `JWT_EXPIRES_IN`, ... to the env schema
- Route files — `router.post('/', authenticate, authorize('admin'), validate(...), controller.create)`
- `src/config/cors.ts` — set `credentials: true` if you use cookies
- `src/middlewares/rateLimiter.ts` — a stricter limiter for the login route

---

## Common next steps in real projects

- **Auth**: JWT access + refresh tokens, bcrypt/argon2 password hashing, role-based access control
- **Caching**: Redis (`ioredis`) for hot reads and shared rate-limit storage
- **Background jobs**: BullMQ (emails, reports, imports)
- **Monitoring**: Sentry (errors), OpenTelemetry (traces), Prometheus/Grafana (metrics)
- **Deployment**: push the Docker image to a registry, deploy to AWS ECS / Kubernetes / Render / Railway
- **API client generation** for the frontend from `/api-docs.json`
