# Uptime Monitor

**Full-stack URL uptime monitoring and alerting system** built with FastAPI, Celery, React, and PostgreSQL.

- **Monitor** HTTP endpoints at custom intervals (1m, 5m, 15m, 30m, 1h)
- **Track** uptime percentages, average response times, and check logs
- **Alert** via email when a monitored URL goes **DOWN** or recovers **(UP)**
- **Authenticate** using Supabase (JWT) – modern, secure, and scalable
- **Visualize** history with real‑time charts and detailed stats

This project demonstrates production‑grade architecture patterns, async processing, containerization, CI/CD, and comprehensive testing.

---

## Screenshots

> ![Dashboard](/docs/screenshots/dashboard.png)

> ![Monitor Details](/docs/screenshots/monitor-detail.png)

> ![CI/CD Pipeline](/docs/screenshots/ci-cd.png)

---

## Architecture & Techniques

This project is structured as a **distributed, event‑driven backend** with a **modern React SPA**. Key design decisions and patterns:

- **Async & Sync Separation** – FastAPI uses async SQLAlchemy; Celery workers use synchronous SQLAlchemy with dedicated engine. This avoids blocking the event loop while keeping task code simple.
- **Celery for Background Jobs** – A periodic scheduler (`dispatch_checks`) runs every 60 s, finds due monitors, and enqueues individual `ping_url` tasks. Workers execute HTTP checks and handle alert state changes concurrently.
- **Race Condition Prevention** – The scheduler marks a monitor as _dispatched_ (by enqueuing the task) but does **not** update `next_check_at`. The worker updates `next_check_at` **after** the ping completes, eliminating the classic “double‑dispatch” race.
- **Alert State Machine** – `AlertService` tracks `UP → DOWN` and `DOWN → UP` transitions. Emails are sent only on state changes, avoiding alert storms.
- **Service Layer** – Business logic is extracted into pure services (`MonitorService`, `PingService`, `AlertService`), making endpoints thin and testable.
- **Rate Limiting** – All API endpoints are protected with SlowAPI backed by Redis. Custom key function respects `X-Forwarded-For` headers for proxies.
- **Supabase JWT Auth** – Tokens are validated against Supabase without blocking the async loop (using `asyncio.to_thread`). Users are automatically synced to the local DB.
- **Database Migrations** – Alembic handles schema evolution; models import everything so autogenerate works.
- **Frontend State** – Zustand stores for auth (`persist` middleware with hydration) and UI filters. React Query for server state, mutations, and cache invalidation.
- **Full Test Coverage** – Backend: pytest with 100% coverage enforced by vitest config (unit, integration). Frontend: Vitest for components, hooks, stores; Playwright for E2E. CI/CD pipeline runs all suites and deploys coverage/HTML reports to GitHub Pages.
- **Dockerised Services** – `docker-compose.yml` orchestrates PostgreSQL, Redis, Mailpit (email capture), API, worker, and beat – ready for local development.

---

## Tech Stack

| Layer            | Technologies                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------- |
| **Frontend**     | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, Zustand, TanStack React Query |
| **Backend**      | Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2 (async+synchron)                          |
| **Task Queue**   | Celery 5, Redis (broker & backend)                                                        |
| **Database**     | PostgreSQL 16                                                                             |
| **Auth**         | Supabase Auth (JWT validation, admin operations)                                          |
| **Email**        | SMTP (Mailpit for dev)                                                                    |
| **Infra/DevOps** | Docker, Docker Compose, GitHub Actions CI/CD, GitHub Pages                                |
| **Testing**      | pytest, pytest-asyncio, Vitest, Playwright, coverage thresholds                           |

---

## Getting Started (Local Setup)

### Prerequisites

- **Docker** and **Docker Compose** (for backend services)
- **Node.js** ≥ 20 (for frontend)
- **npm** (comes with Node)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/uptime-monitor.git
cd uptime-monitor
```

### 2. Backend Setup (Docker)

Create the backend environment file from the example:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in your Supabase credentials (you can leave SMTP defaults for local dev – Mailpit will capture emails):

```ini
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/uptime
SYNC_DATABASE_URL=postgresql+psycopg2://postgres:postgres@db:5432/uptime
REDIS_URL=redis://redis:6379/0
SMTP_HOST=mailpit
SMTP_PORT=1025
FROM_EMAIL=alerts@uptime-monitor.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

Start all backend services with Docker Compose:

```bash
docker-compose up -d
```

This launches PostgreSQL, Redis, Mailpit, FastAPI (with hot‑reload), Celery worker, and Celery beat.

Run database migrations:

```bash
docker-compose run api alembic upgrade head
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` with your Supabase URL and anon key:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

The frontend runs at **http://localhost:5173**. Backend API is at **http://localhost:8000**. Mailpit web UI is at **http://localhost:8025** (captured emails).

---

## Running the Application Locally

### Docker / Backend

```bash
# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f

# Run Alembic migrations
docker-compose run api alembic upgrade head

# Create a new migration automatically
docker-compose run api alembic revision --autogenerate -m "description"

# Stop and remove containers
docker-compose down

# Rebuild images (after Dockerfile changes)
docker-compose build
```

### Frontend

```bash
cd frontend

# Install deps
npm install

# Start dev server (default port 5173)
npm run dev

# Run unit tests with coverage
npx vitest run --coverage

# Run Playwright E2E tests (requires backend running)
npx playwright test

# Build for production
npm run build
```

### Backend (Without Docker, optional)

If you prefer to run the backend directly (requires Python 3.11 + PostgreSQL/Redis running):

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head

# Terminal 1 – API
uvicorn app.main:app --reload

# Terminal 2 – Worker
celery -A celery_worker worker -l info

# Terminal 3 – Beat
celery -A celery_beat beat -l info
```

---

## Code Highlights

### 1. Race‑Condition‑Safe Task Dispatch

The scheduler dispatches ping tasks without updating `next_check_at` itself:

```python
# app/tasks/scheduler.py (simplified)
monitors = service.get_due_monitors_sync(db, now)
for monitor in monitors:
    ping_url.delay(str(monitor.id), str(monitor.url))
    # next_check_at is NOT updated here – that would risk double dispatch
```

The worker updates `next_check_at` **after** the ping completes:

```python
# app/tasks/ping.py
monitor = db.get(Monitor, monitor_id)
if monitor:
    now = datetime.now(timezone.utc)
    monitor_service.update_next_check_sync(monitor, now)
    db.commit()
```

**Why it matters**: If the scheduler updated `next_check_at` before enqueuing, a slow worker might finish _after_ the next scheduler tick, causing a second dispatch while the first is still running. By deferring the update to the worker, we guarantee **exactly‑once** execution semantics.

### 2. Async‑Safe Supabase Token Verification

JWT verification uses `asyncio.to_thread` to avoid blocking FastAPI’s event loop:

```python
async def verify_token(token: str) -> dict:
    supabase = get_supabase_admin()
    response = await asyncio.to_thread(supabase.auth.get_user, token)
    ...
```

**Why it matters**: The Supabase SDK is synchronous (makes network calls). Wrapping it in `asyncio.to_thread` lets the event loop serve other requests while waiting, keeping the API responsive under load.

---

## License

This project is licensed under the MIT License – see the [LICENSE](#license) section below.

# LICENSE

```
MIT License

Copyright (c) 2026 Dimitris Markou

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
