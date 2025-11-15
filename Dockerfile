# Use official Node.js 22 slim image
FROM node:22-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Copy ALL source code (server, shared, client, config files)
COPY . .

# Build BOTH frontend and backend using npm run build
# This runs: vite build && esbuild server/index.ts
RUN npm run build

# Keep node_modules (external packages needed at runtime)
# Don't prune - Cloud Run needs them

# Expose port (Cloud Run will set PORT env var, default 8080)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Healthcheck for Cloud Run
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node --input-type=module -e "import('http').then(http => http.default.get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}))"

# Start the app (serves both API and frontend from dist/)
CMD ["node", "dist/index.js"]
