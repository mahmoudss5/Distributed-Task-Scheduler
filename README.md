# TaskFlow — Distributed Task Scheduler

A production-ready distributed task scheduling platform built with **NestJS**, **React**, **Kafka**, **MySQL**, and **Redis**. TaskFlow allows you to submit, schedule, and monitor background jobs across multiple worker nodes in real-time.

---

## ✨ Features

- 📋 **Job Submission** — Submit background jobs via REST API or the web UI with JSON payloads
- 🔁 **Scheduler** — Cron-based poller that publishes `PENDING` jobs to Kafka every 20 seconds
- ⚡ **Worker Nodes** — Kafka consumers that pick up and execute jobs, with heartbeat monitoring
- 📊 **Real-time Dashboard** — Live overview of system stats, worker nodes, queue depth, and recent jobs via WebSocket
- 🛡️ **Role-Based Audit Logging** — Track critical system events (scheduler pauses, dead workers) using a dedicated audit log and RBAC decorators (`admin` / `user`)
- 🛑 **Graceful Shutdown & Backpressure** — Workers wait for active jobs to complete on termination. The Scheduler monitors Kafka consumer lag and pauses job pushing when queue depth exceeds safety thresholds
- 🕒 **Advanced Scheduling & Retries** — Support for delayed execution (`runAt`), auto-calculated priority queues (HIGH/MEDIUM/LOW), and automatic exponential backoff on failure
- 🎨 **Dark / Light Theme** — Toggle between dark and light mode, persisted to `localStorage`
- 🐳 **Fully Dockerized** — All services orchestrated with a single `docker-compose up`

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
│   │   ├── jobs/              # Job entity, service, controller
│   │   ├── worker/            # Worker entity, service, consumer
│   │   ├── scheduler/         # Cron scheduler service
│   │   ├── kafka/             # Kafka module
│   │   ├── redis/             # Redis module
│   │   └── app.module.ts      # Root module
│   ├── Dockerfile
│   └── .env
│
├── frontend/                  # React + Vite + TypeScript
│   ├── src/
│   │   ├── context/           # ThemeContext (dark/light)
│   │   ├── shared/            # Axios, WebSocket hook, types, shared components
│   │   └── features/
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

### 3. Run with Docker (Recommended)

```bash
docker compose up --build
```

This starts all 6 services in order:
1. `mysql` → waits until healthy
2. `redis` → waits until healthy
3. `zookeeper` → waits until healthy
4. `kafka` → waits until Zookeeper is ready
5. `backend` → waits until MySQL, Redis, and Kafka are healthy
6. `frontend` → starts after backend

| Service  | URL                                           |
|----------|-----------------------------------------------|
| Frontend | http://localhost                              |
| Backend  | http://localhost:3000                         |
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

---

## 📡 API Endpoints

| Method | Endpoint       | Description                  |
|--------|----------------|------------------------------|
| `POST` | `/jobs`        | Submit a new job             |
| `GET`  | `/jobs/recent` | Get the most recent jobs     |
| `GET`  | `/workers`     | List all worker nodes        |
| `GET`  | `/stats`       | Get system-wide stats        |

### Example: Submit a Job

```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Email",
    "priority": "HIGH",
    "schedule": "now",
    "data": {
      "to": "user@example.com",
      "subject": "Hello World"
    }
  }'
```

---

## 🔄 Job Lifecycle

```
Submit via API
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
WorkerService consumes the message
      │
      ├─ Success → status: COMPLETED
      └─ Failure → status: FAILED (retryCount++)
```

---

## 🛠️ Tech Stack

| Layer       | Technology                                  |
|-------------|---------------------------------------------|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v3 |
| **State**    | TanStack Query v5 + React Router v6         |
| **Backend**  | NestJS 12, TypeScript                        |
| **Database** | MySQL 8.0 via TypeORM                        |
| **Broker**   | Apache Kafka (via KafkaJS)                   |
| **Cache**    | Redis 6.2                                    |
| **Realtime** | WebSockets (NestJS Gateway)                  |
| **Icons**    | lucide-react                                 |
| **Infra**    | Docker, Docker Compose, Nginx                |

---

## 📝 License

This project is licensed under the **UNLICENSED** license.
