FROM node:22-alpine AS builder
WORKDIR /app

# Copy root configurations
COPY package*.json turbo.json ./
# Copy workspaces packages and web app
COPY packages/ packages/
COPY apps/web/ apps/web/

# Install dependencies and build
RUN npm ci
RUN npm run build -- --filter=@codesync/web

# Stage 2: Serve using Nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist/ /usr/share/nginx/html/
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
