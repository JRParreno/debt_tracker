# Debt Tracker

Personal debt tracker with auto-generated monthly payment rows, income-based pay strategy, and a responsive dark-mode UI.

**Stack:** Next.js + shadcn/ui · FastAPI · PostgreSQL

## Features

- Add recurring debts once (BNPL, utilities, loans, credit cards, etc.)
- Monthly tracker rows auto-generate — no manual entry each month
- Mark debts paid / pending / overdue with filters
- Income settings (monthly salary or semi-monthly cutoffs)
- Pay strategy view: income vs debts per cutoff
- Monthly history summary
- Responsive mobile, tablet, and desktop layouts
- Dark mode by default (optional light mode toggle)

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)
- Node.js 20+
- Python 3.11+

## Quick start

**One-time setup** (installs deps, starts Postgres, runs migrations):

```bash
npm install          # root — installs concurrently for dev script
npm run setup
```

**Run everything** (Postgres + API + frontend, **LAN enabled** on Windows):

```bash
npm run dev
```

On Windows PowerShell, `.\scripts\dev.ps1` enables **LAN mode** so you can open the app from your phone/tablet on the same Wi‑Fi. The terminal prints URLs like `http://192.168.x.x:3000`.

- This PC: http://localhost:3000  
- API docs: http://localhost:8000/docs  
- Phone/tablet: use the LAN URL printed when the dev server starts

If your phone cannot connect, allow **ports 3000 and 8000** through Windows Firewall.

**Localhost only** (no LAN):

```bash
# PowerShell
$env:DEV_LAN = ""; npm run dev

# cmd / bash
DEV_LAN= npm run dev
```

### All npm scripts

| Script | Description |
|--------|-------------|
| `npm run setup` | Copy env files, start Postgres, install deps, migrate |
| `npm run dev` | Start Postgres, migrate, run API + frontend (LAN if via `dev.ps1`) |
| `npm run db:up` | Start PostgreSQL container |
| `npm run db:down` | Stop PostgreSQL container |
| `npm run db:reset` | Reset database volume and restart Postgres |
| `npm run backend:dev` | FastAPI only (port 8000) |
| `npm run frontend:dev` | Next.js only (port 3000) |
| `npm run backend:migrate` | Run Alembic migrations |
| `npm run frontend:build` | Production build of frontend |

### Manual setup (step by step)

#### 1. Start PostgreSQL

```bash
docker compose up -d
```

#### 2. Backend

```bash
cd backend
cp .env.example .env
python -m pip install -r requirements.txt
python -m alembic upgrade head
python -m uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

#### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App: http://localhost:3000

## Project structure

```
debt_tracker/
├── package.json      # root scripts (npm run setup / dev)
├── scripts/          # setup.mjs, dev.mjs, setup.ps1, dev.ps1
├── backend/          # FastAPI + SQLAlchemy + Alembic
├── frontend/         # Next.js + shadcn/ui
└── docker-compose.yml
```

## Usage

1. **Set income** — tap Income, enter monthly salary or per-cutoff amounts
2. **Add debts** — name, type, amount, due day (optional end date for BNPL)
3. **Each month** — open the month; rows appear automatically
4. **Mark paid** — toggle the switch when you've paid a bill
5. **Plan payments** — use the Pay strategy card to see if each cutoff covers your debts

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/debts` | List debt templates |
| POST | `/debts` | Create debt |
| GET | `/occurrences?year=&month=` | Monthly occurrences |
| PATCH | `/occurrences/{id}` | Mark paid |
| GET/PATCH | `/income` | Income settings |
| GET | `/summary/current` | Current month totals |
| GET | `/summary/monthly` | 12-month history |
| GET | `/summary/strategy` | Pay strategy per cutoff |

## Environment variables

**Backend** (`backend/.env`):

```
DATABASE_URL=postgresql://debt_tracker:debt_tracker@localhost:5433/debt_tracker
```

**Frontend** (`frontend/.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
