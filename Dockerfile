# Optimized Dockerfile for Cloud Run - Minimal dependencies
FROM node:22-slim

WORKDIR /usr/src/app

# Copy package files explicitly
COPY package.json ./
COPY package-lock.json ./

# Install ALL dependencies (including devDependencies) for build
RUN npm install

# Copy source code EXCLUDING .env file (use .dockerignore)
# Copy only necessary directories for build
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# 🔒 SECURITY: .env file is NOT copied - it contains secrets
# Backend credentials will be passed at RUNTIME via Cloud Run --set-env-vars

# ==========================================
# FRONTEND BUILD-TIME VARIABLES (Required)
# ==========================================
# Vite embeds these at build time - they MUST be ENV variables during npm run build
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

# Set ONLY frontend variables as ENV (needed for Vite build)
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

# ==========================================
# BACKEND RUNTIME VARIABLES (Secure)
# ==========================================
# Backend credentials are NOT embedded in the image
# They MUST be passed at runtime via Cloud Run deployment:
#   --set-env-vars "FIREBASE_PROJECT_ID=...,FIREBASE_CLIENT_EMAIL=...,FIREBASE_PRIVATE_KEY=...,etc"
# Or using Google Cloud Secret Manager (recommended for production)

# Build frontend and backend using the build script
RUN npm run build

# Keep dependencies (Cloud Run needs them at runtime)
# DON'T prune - external packages are needed

# ==========================================
# 🔒 SECURITY NOTES
# ==========================================
# ✅ Frontend Firebase config is embedded in the client bundle (required for Vite)
# ✅ Backend credentials are NOT in the image - they're passed at runtime
# ✅ No .env file is copied to the image
# ✅ No secrets are embedded in Docker layers
#
# Backend credentials MUST be provided at deployment time via:
# 1. Cloud Run --set-env-vars (for testing)
# 2. Google Cloud Secret Manager --set-secrets (for production - recommended)
#
# Required runtime environment variables:
# - FIREBASE_PROJECT_ID
# - FIREBASE_CLIENT_EMAIL
# - FIREBASE_PRIVATE_KEY (single-line with \n escapes)
# - GEMINI_API_KEY
# - FYERS_APP_ID
# - FYERS_SECRET_KEY
# - FYERS_ACCESS_TOKEN

# Expose port (Cloud Run will set PORT env var, but 8080 is default)
EXPOSE 8080

# Environment
ENV NODE_ENV=production

# Healthcheck for Cloud Run using ES modules syntax
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node --input-type=module -e "import('http').then(http => http.default.get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}))"

# Start server - PORT env var will be set by Cloud Run
CMD ["node", "dist/index.js"]
