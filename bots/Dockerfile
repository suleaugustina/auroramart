FROM node:18-alpine

WORKDIR /app

# Copy and install ALL dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Compile TypeScript to JavaScript (outputs to ./dist per tsconfig.json)
RUN npx tsc

# Start the compiled bot simulator
CMD ["node", "dist/runner.js"]
