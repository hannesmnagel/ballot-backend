# Docker runtime

This project uses root-level `docker-compose.yml` and `Dockerfile`.

## Run

1. Copy `.env.example` to `.env` and set real values.
2. Run `docker compose up --build`.

The `web` service applies Prisma migrations and starts Next.js on port `3000`.
