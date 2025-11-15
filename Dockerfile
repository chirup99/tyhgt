# Use official Node.js 22 slim image
FROM node:22-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (both production and dev for building backend)
RUN npm install

# Copy only server code and necessary files for backend build
COPY server ./server
COPY shared ./shared
COPY tsconfig.json ./

# Build only the backend (not frontend - skip Vite build)
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Remove dev dependencies after build
RUN npm prune --production

# Expose port (Cloud Run uses PORT env var)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Start the app (using built version)
CMD ["node", "dist/index.js"]
