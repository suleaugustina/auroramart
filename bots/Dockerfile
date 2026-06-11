# ── Stage 1: Build ─────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Since Railway builds from the repo root by default, we explicitly copy from the bots/ directory
COPY bots/package*.json ./
RUN npm install

# Copy the bots source code
COPY bots/src ./src
COPY bots/tsconfig.json ./
RUN npm run build

# ── Stage 2: Run ────────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY bots/package*.json ./
RUN npm install --omit=dev

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Start the bot simulator
CMD ["node", "dist/runner.js"]
