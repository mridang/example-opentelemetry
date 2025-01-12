# Stage 1: Build the application
FROM node:21 AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the application (this compiles the TypeScript to JS)
RUN npx nest build

# Stage 2: Production image
FROM node:21-slim

# Set environment variables
ENV NODE_ENV=development
ENV SENTRY_DSN=https://public@sentry.example.com/1

# Set working directory in the production image
WORKDIR /app

# Install production dependencies only (we're copying them from the builder stage)
COPY package*.json ./
RUN npm ci --only=production

# Copy the compiled build from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app will run on
EXPOSE 3000

# Start the application from dist/src/main.js
CMD ["node", "dist/src/main.js"]
