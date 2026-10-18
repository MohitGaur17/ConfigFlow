# Build stage
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Prisma needs OpenSSL available at build time to detect the correct engine.
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy workspace files
COPY package.json package-lock.json ./
COPY server ./server
COPY shared ./shared
COPY client/package.json ./client/package.json
COPY tsconfig.base.json ./

# Install dependencies
RUN npm ci

# Build server
RUN npm run build --workspace=shared
RUN npm run build --workspace=server

# Generate Prisma client during build (requires dev deps available in builder)
RUN npm run prisma:generate --workspace=server

# One-shot target used by Docker Compose to synchronize the checked-in Prisma schema.
FROM builder AS db-init
CMD ["npm", "run", "prisma:push", "--workspace=server"]

# Runtime stage
FROM node:20-bookworm-slim

WORKDIR /app

# Prisma runtime also needs OpenSSL present in the final image.
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install production dependencies only
COPY package.json package-lock.json ./
COPY server ./server
COPY shared ./shared
COPY client/package.json ./client/package.json

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist

# Copy generated Prisma client from builder stage into runtime image
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Readiness check: the API and Prisma schema must both be available.
HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "const req=require('http').get('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/ready',r=>{r.resume();r.on('end',()=>process.exit(r.statusCode===200?0:1))});req.setTimeout(3000,()=>req.destroy());req.on('error',()=>process.exit(1))"

# Expose port
EXPOSE ${PORT:-4000}

# Start application
CMD ["npm", "run", "start", "--workspace=server"]
