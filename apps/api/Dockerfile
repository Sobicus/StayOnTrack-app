# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json package-lock.json turbo.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/api/package.json ./apps/api/

# Install all dependencies
RUN npm ci

# Copy source code
COPY packages/contracts/ ./packages/contracts/
COPY apps/api/ ./apps/api/

# Build the API
RUN cd apps/api && npm run build

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built output and production dependencies
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4800

CMD ["node", "dist/main"]
