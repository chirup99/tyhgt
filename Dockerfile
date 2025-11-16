# Optimized Dockerfile for Cloud Run - Minimal dependencies
FROM node:22-slim

WORKDIR /usr/src/app

# Copy package files explicitly
COPY package.json ./
COPY package-lock.json ./

# Install ALL dependencies (including devDependencies) for build
RUN npm install

# Copy ALL source code (server, shared, client) including .env file
COPY . .

# NOTE: The .env file IS copied and will be read by dotenv
# Make sure .env has single-line format for FIREBASE_PRIVATE_KEY (use \n for newlines)
# Example: FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----

# Accept Firebase config as build arguments
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

# Set as environment variables for build
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

# Build frontend and backend using the build script
RUN npm run build

# Keep dependencies (Cloud Run needs them at runtime)
# DON'T prune - external packages are needed

# ==========================================
# Runtime environment variables
# ==========================================
# The .env file IS included in the Docker image (copied on line 14)
# The backend reads it using dotenv (server/index.ts line 2)
#
# Required variables that MUST be in .env file:
# ✅ DATABASE_URL
# ✅ FIREBASE_PROJECT_ID
# ✅ FIREBASE_CLIENT_EMAIL  
# ✅ FIREBASE_PRIVATE_KEY (MUST be single-line with \n escapes)
# ✅ GEMINI_API_KEY
# ✅ FYERS_APP_ID
# ✅ FYERS_SECRET_KEY
# ✅ FYERS_ACCESS_TOKEN
#
# IMPORTANT: .env format requirements:
# - FIREBASE_PRIVATE_KEY must be single-line: -----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----
# - Do NOT use multi-line format (it will break dotenv parsing)
#
# Alternative: You can also set these in Cloud Run Console instead of using .env

# Expose port (Cloud Run will set PORT env var, but 8080 is default)
EXPOSE 8080

# Environment
ENV NODE_ENV=production

# Healthcheck for Cloud Run using ES modules syntax
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node --input-type=module -e "import('http').then(http => http.default.get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}))"

# Start server - PORT env var will be set by Cloud Run
CMD ["node", "dist/index.js"]
