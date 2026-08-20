# syntax=docker/dockerfile:1
# Base Debian, não Alpine: lightningcss (Tailwind 4) e argon2 distribuem
# binários prontos para glibc, e o lock gerado fora do Linux não traz as
# variantes musl.
ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
# O @reinas/ui é uma dependência Git: o npm precisa do git para cloná-la.
RUN apt-get update && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM deps AS builder
COPY . .
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
