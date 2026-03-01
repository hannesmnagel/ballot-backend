# Ballot v1

Mobile-first polling web app with advanced voting systems:

- Ranked Choice Voting (RCV)
- Condorcet (Schulze)
- STAR voting

## Features

- Creator accounts with email/password and passkey support
- Passkey login requires no password (email + passkey credential)
- No account needed for voters
- Unlisted link-based polls
- Required voter-name option
- Result privacy controls:
  - Aggregate only (default)
  - Optional voter-name list
  - Optional voter-to-ballot mapping
- Cookie-based duplicate vote prevention per poll
- Max voter limit enforcement
- Poll open/close controls and settings editing

## Monorepo layout

- `apps/web` Next.js app (UI + API)
- `packages/shared` zod schemas and shared types
- `packages/voting-engine` pure vote computation algorithms + tests
- `prisma` schema/migrations
- `infra/docker` container runtime docs

## Local setup

1. Install dependencies:
   - `npm install`
2. Copy env:
   - `cp .env.example .env`
3. Generate Prisma client:
   - `npm run prisma:generate`
4. Run migrations:
   - `npm run prisma:dev`
5. Start app:
   - `npm run dev`

## API routes

Auth:

- `POST /api/auth/signup/email`
- `POST /api/auth/login/email`
- `POST /api/auth/logout`
- `POST /api/auth/passkey/register/options`
- `POST /api/auth/passkey/register/verify`
- `POST /api/auth/passkey/login/options`
- `POST /api/auth/passkey/login/verify`
- `POST /api/auth/password/forgot`
- `POST /api/auth/password/reset`
- `POST /api/auth/email/verify`

Poll management:

- `POST /api/polls`
- `GET /api/polls/mine`
- `GET /api/polls/:pollId/manage`
- `PATCH /api/polls/:pollId`
- `POST /api/polls/:pollId/open`
- `POST /api/polls/:pollId/close`

Public:

- `GET /api/public/polls/:publicId`
- `POST /api/public/polls/:publicId/vote`
- `GET /api/public/polls/:publicId/results`

## Docker compose

1. `cp .env.example .env`
2. `docker compose up --build`

App runs on `http://localhost:3000`.
