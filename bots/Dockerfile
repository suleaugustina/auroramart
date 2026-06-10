FROM node:18-alpine

WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source files
COPY . .

# Start the bot simulator in daemon mode
CMD ["npx", "ts-node", "src/runner.ts"]
