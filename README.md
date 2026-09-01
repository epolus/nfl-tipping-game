# NFL Tipping Game

A web app where an admin creates user accounts, and each week users pick NFL game winners before kickoff. Points are awarded for correct picks, with a season-long leaderboard.

## Quick Start

```bash
cp .env.example .env
docker compose -f docker/docker-compose.yml up --build
```

Then open **http://localhost:5173** and sign in with the credentials from `.env` (default: `admin@example.com` / `changeme123`).

## Architecture

```
/apps
  /api      Express + TypeScript + Prisma
  /web      React + Vite + Tailwind
/docker     Docker Compose + Dockerfiles
```

Three services run via Docker Compose:

| Service | Container name | Port | Description |
|---------|----------------|------|-------------|
| `db`    | `nfl-tipping-db` | — | PostgreSQL 16 |
| `api`   | `nfl-tipping-api` | — | REST API + NFL sync cron |
| `web`   | `nfl-tipping-web` | 5173 | React frontend (nginx) |

## Features

- **Auth** — JWT in httpOnly cookie, bcrypt password hashing, no public sign-up
- **Admin panel** — Create users, reset passwords, activate/deactivate, promote/demote admins
- **NFL sync** — ESPN scoreboard API (configurable via `NFL_DATA_PROVIDER`), cron every 30 min / 2 min on game days
- **Tipping** — Pick winners before kickoff; server-side lock enforcement
- **Leaderboard** — Season points with tie-break by most recent week

## Environment Variables

See `.env.example`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `ADMIN_EMAIL` | Initial admin email (seed) |
| `ADMIN_PASSWORD` | Initial admin password (seed) |
| `NFL_DATA_PROVIDER` | `espn` (default) or `sportsdataio` |

## Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start PostgreSQL (or use Docker for db only)
docker compose -f docker/docker-compose.yml up db -d

# API
cp .env.example .env
cd apps/api
npx prisma migrate dev
npx prisma db seed
npm run dev

# Web (separate terminal)
cd apps/web
npm run dev
```

## API Endpoints

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/me
GET    /api/games?week=&season=
GET    /api/tips/me?week=
POST   /api/tips
PUT    /api/tips/:id
GET    /api/leaderboard?season=
GET    /api/admin/users
POST   /api/admin/users
PATCH  /api/admin/users/:id
POST   /api/admin/sync-games
```

## License

Apache-2.0 license
