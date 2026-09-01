# NFL Tipping Game — Project Spec

See the full build spec in the repository README and this document for reference during development.

## Overview

A web app where an admin manually creates user accounts, and each week users "tip" (pick) the winner of each NFL game before kickoff. Points are awarded for correct picks, and there's a season-long leaderboard.

## Tech Stack

- **Backend:** Node.js + TypeScript, Express, Prisma ORM
- **Database:** PostgreSQL
- **Frontend:** React + TypeScript + Vite, Tailwind CSS
- **Auth:** JWT in httpOnly cookie, bcrypt
- **Scheduler:** node-cron
- **Containerization:** Docker + docker-compose (db, api, web)

## Monorepo Structure

```
/nfl-tipping-game
  /apps
    /api      (Express + Prisma)
    /web      (React + Vite)
  /docker
    docker-compose.yml
    Dockerfile.api
    Dockerfile.web
  PROJECT_SPEC.md
```
