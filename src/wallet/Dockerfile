ARG BUILDER_IMAGE="node:lts-alpine"
ARG RUNNER_IMAGE="node:lts-slim"

# Stage 1: Build
FROM ${BUILDER_IMAGE} AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Run
FROM ${RUNNER_IMAGE} AS runner

WORKDIR /app

# only production-dependencies
COPY package*.json ./
RUN npm install --omit=dev

# app's binaries
COPY --from=builder /app/dist ./dist
# database migrations
COPY --from=builder /app/db ./db
# usefull scripts
COPY --from=builder /app/scripts ./scripts

# for running scripts/migration.ts
COPY tsconfig*.json ./

# entrypoint
COPY start.sh ./start.sh
RUN chmod +x start.sh
CMD ["./start.sh"]
