# TaskFlow — Distributed Task Platform

TaskFlow is a distributed background-job platform built with NestJS, React, Kafka, MySQL, and Redis. It provides authenticated job submission, scheduled execution, worker monitoring, failure tracking, and report generation through a web dashboard and REST API.

## Current status

The repository currently includes:

- A React 19 + Vite dashboard with protected routes for overview, job submission, job failures, and reports.
- JWT authentication with registration, login, OTP-based password recovery, role checks, request validation, and Redis-backed rate limiting.
- Two supported job types: `sendEmail` and `generateReport`.
- Immediate, delayed, and recurring jobs. Recurring jobs use cron expressions.
- Kafka-based job distribution with `job-ready` and `job-dlq` topics.
- Redis leader election so only one backend instance schedules jobs at a time.
- Worker heartbeats, worker status monitoring, concurrency backpressure, graceful shutdown, retries with exponential delay, and dead-letter publishing.
- Real-time dashboard updates over WebSockets.
- Paginated job-failure history and generated-report downloads.
- Admin-only user, audit-log, all-jobs, all-reports, and email operations.
- Docker Compose infrastructure for MySQL, Redis, ZooKeeper, Kafka, Kafka topic initialization, backend instances, and the Nginx frontend gateway.
- Swagger API documentation and a health endpoint that checks MySQL, Kafka, Redis, and worker availability.

## Architecture

```text
Browser
  │  HTTP / WebSocket
  ▼
Nginx + React frontend
  │
  ▼
NestJS backend instances
  ├── REST API, authentication, dashboard queries
  ├── Scheduler (Redis leader election)
  ├── Kafka producer / consumer
  └── WebSocket event gateway
       │
       ├── MySQL       jobs, users, workers, failures, reports, audit logs
       ├── Redis       OTPs, rate limits, locks, leases, heartbeats
       └── Kafka       job-ready and job-dlq topics
```

The scheduler checks pending jobs every 20 seconds and publishes eligible jobs to Kafka. It also increases waiting-job priority every 10 seconds and detects dead workers every 30 seconds. Workers consume jobs from the shared Kafka consumer group, process up to five jobs concurrently, and update the dashboard through WebSocket events.

## Features

### Dashboard

- Completed, running, pending, and failed job counts.
- Queue depth by priority (`HIGH`, `MEDIUM`, `LOW`).
- Current worker nodes, heartbeat status, and jobs processed.
- Recent jobs with automatic refresh after job and worker events.
- Dark/light theme persisted in the browser.

### Job processing

- Validated JSON payloads.
- Priority levels: `LOW`, `MEDIUM`, and `HIGH`.
- Delayed execution with `executeAt`.
- Recurring execution with `cron`.
- Automatic retries and exponential retry delays.
- Cancellation and deletion for the owning user.
- Durable failure records and Kafka dead-letter messages after permanent failure.

### Reports and failures

- Queue a report-generation job from the Reports page.
- Poll report status and download completed reports.
- Browse paginated failure records, including attempt number, worker, error, and DLQ status.

## Repository structure

```text
.
├── backend/
│   ├── src/
│   │   ├── auth/          # JWT login and guards
│   │   ├── users/         # Registration, password recovery, admin users
│   │   ├── jobs/          # Job entities, APIs, execution, failures
│   │   ├── worker/        # Kafka consumer and worker lifecycle
│   │   ├── scheduler/     # Leader election and job scheduling
│   │   ├── report/        # Report generation and downloads
│   │   ├── audit-log/     # Administrative event history
│   │   ├── email/         # Email execution and password-reset email
│   │   ├── health/        # Dependency health checks
│   │   ├── system/        # Dashboard stats and worker APIs
│   │   └── redis/         # Redis client and distributed primitives
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── features/auth/
│   │   ├── features/overview/
│   │   ├── features/submitJob/
│   │   ├── features/jobFailures/
│   │   └── features/reports/
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```

## Requirements

- Docker and Docker Compose for the full stack.
- Node.js 22+ for local development. The backend image uses Node 22 and the frontend build image uses Node 24.

## Configuration

Create the backend environment file before starting Compose:

```bash
cp backend/.env.example backend/.env
```

Update the secrets and service credentials in `backend/.env`. The important settings are:

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | JWT signing secret |
| `HEALTH_TOKEN` | Token required by `GET /health` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `REDIS_HOST`, `REDIS_PORT` | Redis connection |
| `KAFKA_BROKER`, `KAFKA_GROUP_ID`, `KAFKA_DLQ_TOPIC` | Kafka connection and consumer settings |
| `EMAIL_USER`, `EMAIL_APP_PASSWORD` | SMTP credentials for email jobs and password recovery |
| `REPORTS_DIR` | Directory where generated reports are stored |

Do not commit `backend/.env` or any real credentials.

## Run with Docker Compose

```bash
docker compose up --build
```

The default Compose command starts one backend container. To run four backend instances locally, scale the service explicitly:

```bash
docker compose up --build --scale backend=4
```

Compose creates and initializes the `job-ready` and `job-dlq` Kafka topics with four partitions. The backend containers share the `taskflow-workers` consumer group, while Redis coordinates scheduler leadership and distributed locks.

| Service | Address |
| --- | --- |
| Frontend | http://localhost |
| Backend through Nginx | http://localhost/api |
| Backend direct | http://localhost:3000 |
| MySQL | localhost:3307 |
| Redis | localhost:6379 |
| Kafka external listener | localhost:29092 |

The frontend proxies `/api/*` to the backend and `/ws` to the WebSocket gateway. Generated reports are stored in the backend container's `/app/reports` volume.

## Run locally without the frontend container

Start the infrastructure dependencies with Docker, or provide equivalent local services. Then create `backend/.env` and run the applications separately:

```bash
cd backend
npm install
npm run start:dev
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite frontend runs at http://localhost:5173 and defaults to the backend at `http://localhost:3000`. Optional frontend overrides are `VITE_API_URL` and `VITE_WS_URL`.

Useful checks:

```bash
cd backend && npm test
cd backend && npm run test:e2e
cd frontend && npm run build
cd frontend && npm run lint
```

## API overview

All protected endpoints require `Authorization: Bearer <JWT>`. User-facing job and report endpoints are scoped to the authenticated user. Admin-only endpoints additionally require the admin role.

### Authentication and users

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Public | Authenticate and return a JWT |
| `POST` | `/users` | Public | Register a user |
| `POST` | `/users/forgot-password` | Public | Send a password-reset OTP |
| `POST` | `/users/reset-password` | Public | Verify the OTP and set a new password |
| `GET` | `/users` | Admin | List users |

### Jobs

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/jobs/create` | Authenticated | Submit a job |
| `GET` | `/jobs/my` | Authenticated | List the current user's jobs |
| `GET` | `/jobs/by-id/:id` | Authenticated | Get one owned job |
| `GET` | `/jobs/pending` | Authenticated | List pending jobs |
| `GET` | `/jobs/completed` | Authenticated | List completed jobs |
| `GET` | `/jobs/failed` | Authenticated | List permanently failed jobs |
| `GET` | `/jobs/failures` | Authenticated | List detailed failure records |
| `GET` | `/jobs/failures/:jobId` | Authenticated | List failures for one job |
| `GET` | `/jobs/queue-counts` | Authenticated | Get queue counts by priority |
| `POST` | `/jobs/cancel/:id` | Authenticated | Cancel an owned job |
| `DELETE` | `/jobs/delete/:id` | Authenticated | Delete an owned job |
| `GET` | `/jobs/all` | Admin | List jobs across all users |

`POST /jobs/create` accepts `type`, `jobPayload`, and optional `priorityLevel`, `executeAt`, and `cron` fields. Supported types are `sendEmail` and `generateReport`.

Example:

```bash
curl -X POST http://localhost:3000/jobs/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "sendEmail",
    "priorityLevel": "HIGH",
    "jobPayload": {
      "to": "engineer@example.com",
      "subject": "TaskFlow job",
      "body": "The job completed successfully."
    }
  }'
```

### Reports, system, and operations

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/reports/generate` | Authenticated | Queue a report-generation job |
| `GET` | `/reports` | Authenticated | List the current user's reports |
| `GET` | `/reports/status/:jobId` | Authenticated | Check report job status |
| `GET` | `/reports/download/:id` | Authenticated | Download an owned report |
| `GET` | `/reports/all` | Admin | List all reports |
| `GET` | `/stats` | Authenticated | Get dashboard job counts |
| `GET` | `/workers` | Authenticated | Get worker status and throughput |
| `GET` | `/audit-logs` | Admin | List audit logs |
| `GET` | `/audit-logs/userLogs/:id` | Admin | List logs for a user |
| `POST` | `/email/send-email` | Admin | Send an email directly |
| `GET` | `/health` | Health token | Check MySQL, Kafka, Redis, and workers |

Swagger is available at `http://localhost:3000/api/docs` when running the backend directly.

## Job lifecycle

```text
Create job
  │
  ▼
MySQL: PENDING
  │  scheduler interval + runAt/executeAt check
  ▼
Kafka: job-ready
  │
  ▼
Worker claims and processes the job
  ├── success      → COMPLETED
  │                  recurring jobs create the next PENDING job
  ├── retryable    → PENDING with exponential delay
  └── permanent    → FAILED + job-failure record + job-dlq message
```

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query |
| Backend | NestJS 12, TypeScript, TypeORM, class-validator |
| Authentication | JWT, Passport, bcrypt |
| Database | MySQL 8 |
| Messaging | Apache Kafka, KafkaJS, ZooKeeper |
| Cache and coordination | Redis 6.2, ioredis |
| Reports | Puppeteer |
| Email | Nodemailer |
| Runtime and gateway | Docker, Docker Compose, Nginx |

## License

This project is currently licensed as **UNLICENSED**.
