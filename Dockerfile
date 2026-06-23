# Build stage
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Prisma needs OpenSSL available at build time to detect the correct engine.
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy workspace files
COPY package.json package-lock.json ./
COPY server ./server
COPY shared ./shared
COPY tsconfig.base.json ./

# Install dependencies
RUN npm ci

# Build server
RUN npm run build --workspace=shared
RUN npm run build --workspace=server

# Generate Prisma client during build (requires dev deps available in builder)
RUN npm run prisma:generate --workspace=server

# Runtime stage
FROM node:20-bookworm-slim

WORKDIR /app

# Prisma runtime also needs OpenSSL present in the final image.
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install production dependencies only
COPY package.json package-lock.json ./
COPY server ./server
COPY shared ./shared

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist

# Copy generated Prisma client from builder stage into runtime image
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 4000) + '/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE ${PORT:-4000}

# Start application
CMD ["npm", "run", "start", "--workspace=server"]
