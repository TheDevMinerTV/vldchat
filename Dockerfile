FROM node:20 AS builder
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM ghcr.io/thedevminertv/gostatic:1.3.0
CMD ['-cache', '2h', '-spa', '-compress-level', '2']

COPY --from=builder /app/dist /static
