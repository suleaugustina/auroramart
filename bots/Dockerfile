# ── Stage 1: Build ─────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Install ALL dependencies (including @types/node for TypeScript)
COPY package*.json ./
RUN npm install

# Copy source and compile TypeScript using local tsc (not npx)
COPY . .
RUN npm run build

# ── Stage 2: Run ────────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Start the bot simulator
CMD ["node", "dist/runner.js"]
