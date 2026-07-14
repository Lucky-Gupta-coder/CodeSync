FROM node:22-alpine AS builder
WORKDIR /app

# Copy root configurations
COPY package*.json turbo.json ./
# Copy workspaces packages and api app
COPY packages/ packages/
COPY apps/api/ apps/api/

# Install dependencies and compile
RUN npm ci
RUN npm run build -- --filter=@codesync/api

# Stage 2: Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/api/dist/ ./apps/api/dist/
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

EXPOSE 5000
CMD ["node", "apps/api/dist/index.js"]
