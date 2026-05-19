FROM node:22-alpine AS base
RUN npm install -g pnpm@latest --ignore-scripts

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM base AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/drizzle ./drizzle
COPY package.json drizzle.config.ts ./
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
