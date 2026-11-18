# syntax=docker/dockerfile:1
FROM node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df AS base
WORKDIR /app/front

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_DIST_DIR=.next-docker NEXT_OUTPUT=standalone API_INTERNAL_URL=http://api:3001
COPY next.config.ts tsconfig.json postcss.config.mjs ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000 API_INTERNAL_URL=http://api:3001
COPY --from=build --chown=node:node /app/front/.next-docker/standalone ./
COPY --from=build --chown=node:node /app/front/.next-docker/static ./.next-docker/static
COPY --from=build --chown=node:node /app/front/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
