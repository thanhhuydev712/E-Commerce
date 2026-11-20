# syntax=docker/dockerfile:1
FROM node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df AS base
WORKDIR /app/api
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

FROM base AS dependencies
COPY package.json package-lock.json ./
# Hook đồng bộ tài nguyên AI không thuộc build ứng dụng; vẫn chạy script của dependency.
RUN npm pkg delete scripts.postinstall && npm ci

FROM dependencies AS build
COPY tsconfig.json tsconfig.build.json nest-cli.json prisma.config.ts prisma.docker.config.ts ./
COPY scripts ./scripts
COPY prisma ./prisma
COPY src ./src
# URL giả chỉ để đọc Prisma config/generate; không kết nối database khi build.
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build npm run prisma:generate
RUN npm run build
RUN node scripts/prepare-docker-migrations.cjs

FROM build AS production-dependencies
RUN npm prune --omit=dev

FROM base AS runtime
ENV NODE_ENV=production PORT=3001 MEDIA_ROOT=/app/api/.local-media
COPY --from=build --chown=node:node /app/api/package.json ./package.json
COPY --from=production-dependencies --chown=node:node /app/api/node_modules ./node_modules
COPY --from=build --chown=node:node /app/api/dist ./dist
COPY --from=build --chown=node:node /app/api/generated/prisma-v2 ./generated/prisma-v2
COPY --from=build --chown=node:node /app/api/scripts/run-built.cjs /app/api/scripts/build-path.cjs ./scripts/
RUN mkdir -p /app/api/.local-media && chown node:node /app/api/.local-media
USER node
EXPOSE 3001
CMD ["node", "scripts/run-built.cjs", "api"]

# Job migration/seed local riêng; không chạy mỗi lần API khởi động.
FROM runtime AS tools
COPY --from=build --chown=node:node /app/api/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=node:node /app/api/prisma.docker.config.ts ./prisma.docker.config.ts
COPY --from=build --chown=node:node /app/api/prisma ./prisma
COPY --chown=node:node scripts/migrate-docker.cjs ./scripts/migrate-docker.cjs
COPY --chown=node:node scripts/setup-db-roles.cjs ./scripts/setup-db-roles.cjs
COPY --chown=node:node scripts/setup-interactive-demo.cjs ./scripts/setup-interactive-demo.cjs
COPY --chown=node:node scripts/create-demo-account.cjs ./scripts/create-demo-account.cjs
CMD ["node", "scripts/migrate-docker.cjs"]
