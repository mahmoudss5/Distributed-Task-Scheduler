# TaskFlow — Distributed Task Scheduler

A production-ready distributed task scheduling platform built with **NestJS**, **React**, **Kafka**, **MySQL**, and **Redis**. TaskFlow allows you to submit, schedule, and monitor background jobs across multiple worker nodes in real-time.

---

## ✨ Features

- 🔐 **Authentication & Security** — JWT-based authentication, robust role-based access control (Admin/User), and fully protected API endpoints via Guards. Multi-tenancy support ensures users can only interact with their own jobs.
- 🔑 **Password Recovery** — Secure OTP-based password reset flow utilizing Nodemailer and Redis for short-lived token storage.
- 📋 **Job Submission & Validation** — Submit background jobs via REST API or the web UI. All incoming payloads are strictly validated using `class-validator` and `class-transformer`.
- 🔁 **Scheduler** — Cron-based poller that publishes `PENDING` jobs to Kafka every 20 seconds.
- ⚡ **Worker Nodes** — Kafka consumers that pick up and execute jobs, featuring heartbeat monitoring and simulated heavy task execution.
- 📊 **Real-time Dashboard** — Live overview of system stats, worker nodes, queue depth, and recent jobs.
- 🛡️ **Role-Based Audit Logging** — Track critical system events (scheduler pauses, dead workers) using a dedicated audit log.
- 🛑 **Graceful Shutdown & Backpressure** — Workers wait for active jobs to complete on termination. Workers also feature built-in Kafka backpressure, gracefully pausing consumption when overloaded instead of dropping messages.
- 🕒 **Advanced Scheduling & Retries** — Support for delayed execution (`runAt`), **cron-based recurring jobs** (`cron-parser`), auto-calculated priority queues (HIGH/MEDIUM/LOW), and automatic exponential backoff on failure.
- 🎨 **Dark / Light Theme** — Toggle between dark and light mode, persisted to `localStorage`.
- 🐳 **Fully Dockerized** — All services orchestrated with a single `docker-compose up`.

---

## 🏗️ Architecture

```
┌─────────────┐     REST/WS     ┌──────────────────────┐
│   Frontend  │ ◄─────────────► │   Backend (NestJS)   │
│  React+Vite │                 │                      │
└─────────────┘                 │  SchedulerService    │
                                │  (polls every 20s)   │
                                └───────┬──────────────┘
                                        │ Publishes to Kafka
                                ┌───────▼──────────────┐
                                │   Kafka (job-ready)  │
                                └───────┬──────────────┘
                                        │ Consumed by
                                ┌───────▼──────────────┐
                                │   WorkerService      │
                                │  (Kafka Consumer)    │
                                └──────────────────────┘
                                        │
                     ┌──────────────────┼──────────────┐
                     ▼                  ▼              ▼
                  MySQL              Redis          Kafka
               (Job Store)       (Cache/Sessions)  (Broker)
```

---

## 🗂️ Project Structure

```
.
├── backend/                   # NestJS API & Workers
│   ├── src/
│   │   ├── auth/              # JWT Auth, Guards, and Decorators
│   │   ├── users/             # User entity, password hashing, user management
│   │   ├── email/             # Nodemailer and OTP logic
│   │   ├── jobs/              # Job entity, DTOs, service, controller
│   │   ├── worker/            # Worker entity, service, consumer (backpressure enabled)
│   │   ├── scheduler/         # Cron scheduler service
│   │   ├── kafka/             # Kafka module
│   │   ├── redis/             # Redis module
│   │   └── app.module.ts      # Root module
│   ├── Dockerfile
│   └── .env
│
├── frontend/                  # React + Vite + TypeScript
│   ├── src/
│   │   ├── context/           # ThemeContext, AuthContext
│   │   ├── shared/            # Axios Interceptors, Protected Routes
│   │   └── features/
│   │       ├── auth/          # Login, Register, Forgot Password
│   │       ├── overview/      # System overview dashboard
│   │       └── submitJob/     # Job submission form
│   ├── Dockerfile
│   └── nginx.conf
│
└── docker-compose.yml         # Full infrastructure orchestration
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/)
- [Node.js v24+](https://nodejs.org/) (for local development only)

### 1. Clone the repository

```bash
git clone https://github.com/mahmoudss5/Distributed-Task-Scheduler.git
cd Distributed-Task-Scheduler
```

### 2. Configure environment variables

Copy the example env and fill in your values:

```bash
cp backend/.env.example backend/.env
```

| Variable              | Description                    | Default              |
|-----------------------|--------------------------------|----------------------|
| `MYSQL_ROOT_PASSWORD` | MySQL root password            | —                    |
| `MYSQL_DATABASE`      | Database name                  | `distributed-Task-Db` |
| `MYSQL_USER`          | Database user                  | `myuser`             |
| `MYSQL_PASSWORD`      | Database password              | —                    |
| `DB_HOST`             | DB host (set to `localhost` for dev) | `localhost`    |
| `DB_PORT`             | DB port                        | `3307`               |
| `JWT_SECRET`          | Secret key for signing JWTs    | `super-secret`       |

### 3. Run with Docker (Recommended)

```bash
docker compose up --build
```

This starts the infrastructure, Kafka topic initializer, four backend/worker replicas, and the Nginx frontend gateway:
1. `mysql` → waits until healthy
2. `redis` → waits until healthy
3. `zookeeper` → waits until healthy
4. `kafka` → waits until Zookeeper is ready
5. `kafka-init` → creates `job-ready` and `job-dlq` with four partitions
6. `backend` → runs four replicas in the same Kafka consumer group
7. `frontend` → Nginx serves the React app and load-balances HTTP/WebSocket traffic to the backend replicas

| Service  | URL                                           |
|----------|-----------------------------------------------|
| Frontend | http://localhost                              |
| Backend/API | available through Nginx at `http://localhost/api`     |
| MySQL    | `localhost:3307`                              |
| Redis    | `localhost:6379`                              |
| Kafka    | `localhost:29092` (external dev access)       |

### 4. Run Locally (Development)

**Backend:**
```bash
cd backend
npm install
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Frontend available at **http://localhost:5173**

### Worker scaling

Workers are Kafka consumers, so Kafka distributes jobs across the four backend replicas using the shared consumer group. Nginx balances the HTTP API and WebSocket connections; it does not balance Kafka messages.

For regular Docker Compose, scale the backend explicitly:

```bash
docker compose up --build --scale backend=4
```

For Docker Swarm, the existing `deploy.replicas: 4` setting is used by:

```bash
docker stack deploy -c docker-compose.yml taskflow
```

---

## 📡 API Endpoints

All endpoints (except Authentication endpoints) require a `Bearer <token>` in the `Authorization` header.

| Method | Endpoint                    | Description                                  |
|--------|-----------------------------|----------------------------------------------|
| `POST` | `/auth/login`               | Authenticate and receive JWT                 |
| `POST` | `/auth/register`            | Register a new user account                  |
| `POST` | `/users/forgot-password`    | Send an OTP to user's email                  |
| `POST` | `/users/reset-password`     | Verify OTP and set a new password            |
| `POST` | `/jobs-controller/create`   | Submit a new job (supports `cron` field)     |
| `GET`  | `/jobs-controller/all`      | Get all pending jobs for the current user    |
| `GET`  | `/jobs-controller/completedCount` | Get completed jobs count for the user |

### Example: Submit a Job

```bash
curl -X POST http://localhost:3000/jobs-controller/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "Data Processing",
    "priorityLevel": "HIGH",
    "cron": "*/5 * * * *",
    "jobPayload": {
      "datasetId": "12345"
    }
  }'
```

---

## 🔄 Job Lifecycle

```
Submit via API (Validated & Tied to User ID)
      │
      ▼
Job saved to MySQL (status: PENDING)
      │
      ▼  (every 20 seconds)
SchedulerService polls PENDING jobs
      │
      ▼
Publishes to Kafka topic: job-ready
(status updated to: PROCESSING)
      │
      ▼
WorkerService consumes the message (with Backpressure)
      │
      ├─ Success → status: COMPLETED
      │          └─ If 'cron' is set → spawn NEW job (status: PENDING)
      │
      └─ Failure → status: FAILED (retryCount++)
                 └─ If retryable, runAt = exponential backoff delay
```

---

## 🛠️ Tech Stack

| Layer       | Technology                                  |
|-------------|---------------------------------------------|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v3 |
| **State**    | Context API, React Router v6                |
| **Backend**  | NestJS 12, TypeScript, class-validator      |
| **Auth**     | JWT, Passport, bcrypt                       |
| **Database** | MySQL 8.0 via TypeORM                        |
| **Broker**   | Apache Kafka (via KafkaJS)                   |
| **Cache**    | Redis 6.2                                    |
| **Icons**    | lucide-react                                 |
| **Infra**    | Docker, Docker Compose, Nginx                |

---

## 📝 License

This project is licensed under the **UNLICENSED** license.
