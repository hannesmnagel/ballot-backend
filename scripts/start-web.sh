#!/usr/bin/env sh
set -e

npm run prisma:generate
npm run prisma:migrate
npm run start -w @ballot/web
