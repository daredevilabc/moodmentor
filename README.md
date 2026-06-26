# MoodMentor

AI-powered personalized wisdom generator. Select your mood and a philosophical framework, and get tailored wisdom drawn from current events, history, and philosophy.

## Features

- **Mood-based wisdom** — Choose from 6 moods (Sad, Anxious, Lazy, Angry, Stressed, Confident)
- **Philosophical frameworks** — Stoicism, Buddhism, Samurai Code, Discipline, Modern Success, Growth Mindset
- **Context-aware generation** — Combines your input with real news, historical events, and inspirational stories
- **Google Gemini AI** — Powered by Gemini 2.5 Flash for rich, meaningful responses
- **API key authentication** (optional) — Secure your API endpoints
- **Rate limiting** — Built-in rate limiting with slowapi
- **History & feedback** — PostgreSQL-backed storage for wisdom history and user feedback

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 (async) |
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Database | PostgreSQL 16 (production), SQLite (development) |
| AI | Google Gemini 2.5 Flash |
| Server | Gunicorn + Uvicorn workers (production) |
| Container | Docker, Docker Compose |
| Proxy | Nginx |
| Error Tracking | Sentry (optional) |
| CI/CD | GitHub Actions |

## Prerequisites

- Python 3.12+
- Node.js 20+
- Docker & Docker Compose (for containerized deployment)
- Google Gemini API key ([get one here](https://makersuite.google.com/app/apikey))

## Installation

### Local Development

```bash
# Clone the repository
git clone <repo-url>
cd moodmentor

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your GEMINI_API_KEY

# Run locally (SQLite)
uvicorn main:app --reload --port 9000

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

The frontend dev server runs on `http://localhost:5173` and proxies `/api` to `http://localhost:9000`.

## Environment Variables

Copy `backend/.env.example` to `backend/.env` (or project root `.env` for Docker).

### Required

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `NEWS_API_KEY` | — | NewsAPI.org key (fallback content used if unset) |
| `API_KEY` | — | Enables X-API-Key authentication |
| `DATABASE_URL` | `sqlite+aiosqlite:///./moodmentor.db` | Database connection string |
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `LOG_FORMAT` | `text` | Output format: `text` or `json` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed origins |
| `SENTRY_DSN` | — | Sentry DSN for error tracking |
| `SENTRY_ENVIRONMENT` | `production` | Sentry environment name |
| `DISABLE_RATE_LIMIT` | `false` | Set to `true` to disable rate limiting |
| `GUNICORN_WORKERS` | `4` | Number of Gunicorn worker processes |
| `BACKEND_HOST` | `0.0.0.0` | Bind address |
| `BACKEND_PORT` | `9000` | Bind port |

## Running Tests

```bash
cd backend
pytest -v
```

All tests use mocks for external services and run offline without API keys.

## Docker Deployment

### Development / Staging

```bash
# Start all services
docker-compose up --build

# Services:
#   - PostgreSQL on :5432 (internal)
#   - Backend API on :9000
#   - Frontend (Nginx) on :80

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Production

```bash
# With HTTP (no TLS)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build

# With HTTPS (see HTTPS section below for certificate setup)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

The production override:
- Uses Gunicorn + Uvicorn workers for the backend
- Enables JSON logging
- Configures log rotation
- Passes `SENTRY_DSN` to both backend and frontend builds
- Supports HTTPS via volume-mounted certificates

## CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs on every push and pull request to `main`:

1. **Backend**: Installs Python dependencies (cached), runs all tests
2. **Frontend**: Installs Node dependencies (cached), builds production bundle
3. **Smoke test**: Verifies the backend application imports and initializes correctly

The workflow fails if any step fails.

## Production Deployment

### Gunicorn

The production server uses Gunicorn with Uvicorn workers, configured in `backend/gunicorn.conf.py`:

| Variable | Default | Description |
|----------|---------|-------------|
| `GUNICORN_WORKERS` | `4` | Number of workers |
| `GUNICORN_TIMEOUT` | `120` | Worker timeout (seconds) |
| `GUNICORN_KEEPALIVE` | `5` | Keepalive timeout (seconds) |
| `GUNICORN_MAX_REQUESTS` | `1000` | Max requests before worker restart |
| `GUNICORN_MAX_REQUESTS_JITTER` | `50` | Jitter for max requests |

### HTTPS Setup

#### Option 1: Let's Encrypt (recommended)

1. Set your domain in `frontend/nginx.https.conf` (replace `your-domain.com`)
2. Run certbot to obtain certificates:
   ```bash
   docker run -it --rm -p 80:80 -v ./certs:/etc/letsencrypt certbot/certbot certonly --standalone -d your-domain.com
   ```
3. Deploy with the production config:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
   ```

#### Option 2: Self-signed certificates (testing)

```bash
mkdir -p certs/live/your-domain.com
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/live/your-domain.com/privkey.pem \
  -out certs/live/your-domain.com/fullchain.pem \
  -subj "/CN=your-domain.com"
```

#### Option 3: Reverse proxy with existing TLS termination

If you already have a reverse proxy (Nginx, Caddy, Traefik, Cloudflare), just use the HTTP configuration and point your proxy to `http://localhost:80`.

## Sentry Configuration

### Backend

Set `SENTRY_DSN` in your `.env` file:

```bash
SENTRY_DSN=https://your_dsn@sentry.io/your_project
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=1.0
```

Sentry is fully optional. If `SENTRY_DSN` is not set, no Sentry initialization occurs.

### Frontend

Set the following build-time environment variables when building the frontend:

```bash
VITE_SENTRY_DSN=https://your_dsn@sentry.io/your_project
VITE_SENTRY_ENVIRONMENT=production
```

For Docker builds, pass these as build args or set them in the Compose environment:

```yaml
services:
  frontend:
    build:
      args:
        VITE_SENTRY_DSN: ${SENTRY_DSN}
```

## API Endpoints

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/` | No | 100/min | Root health check |
| GET | `/health` | No | 100/min | Detailed dependency health |
| GET | `/api/moods` | Yes | 100/min | List available moods |
| GET | `/api/philosophies` | Yes | 100/min | List available philosophies |
| POST | `/api/generate-wisdom` | Yes | 20/min | Generate wisdom |

## Troubleshooting

**Backend fails to start**: Ensure `GEMINI_API_KEY` is set in `.env`.

**PostgreSQL connection refused**: The backend waits for PostgreSQL to be healthy. Check `docker-compose logs postgres`.

**Frontend shows blank page**: Check browser console for errors. Ensure the backend is running and reachable.

**CORS errors**: Update `CORS_ALLOWED_ORIGINS` to include your frontend URL.

**Tests fail**: Ensure `DISABLE_RATE_LIMIT=true` is set (tests set this automatically).

**Sentry not capturing errors**: Verify `SENTRY_DSN` is correctly set and the DSN is valid.

## Project Structure

```
.
├── .github/workflows/ci.yml    # CI/CD pipeline
├── docker-compose.yml           # Docker Compose (dev)
├── docker-compose.prod.yml      # Docker Compose overrides (prod)
├── backend/
│   ├── main.py                  # FastAPI application
│   ├── Dockerfile               # Multi-stage Docker build
│   ├── gunicorn.conf.py         # Production server config
│   ├── requirements.txt         # Python dependencies
│   ├── services/                # Business logic services
│   └── tests/                   # Pytest test suite
└── frontend/
    ├── src/                     # React application
    ├── Dockerfile               # Multi-stage Docker build
    ├── nginx.conf               # Nginx config (HTTP)
    ├── nginx.https.conf         # Nginx config (HTTPS)
    └── package.json             # Node dependencies
```
