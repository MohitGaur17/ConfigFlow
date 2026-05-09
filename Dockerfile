# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package.json package-lock.json ./
COPY server ./server
COPY shared ./shared

# Install dependencies
RUN npm ci

# Build server
RUN npm run build --workspace=server

# Generate Prisma client during build (requires dev deps available in builder)
RUN npm run prisma:generate --workspace=server

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
COPY server ./server
COPY shared ./shared

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/server/dist ./server/dist

# Copy generated Prisma client from builder stage into runtime image
COPY --from=builder /app/server/node_modules/@prisma ./server/node_modules/@prisma
COPY --from=builder /app/server/node_modules/.prisma ./server/node_modules/.prisma

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 4000) + '/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE ${PORT:-4000}

# Start application
CMD ["npm", "run", "start", "--workspace=server"]
