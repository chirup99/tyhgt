
import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { liveWebSocketStreamer } from "./live-websocket-streamer";

const app = express();

// Enhanced CORS and security headers for desktop browser compatibility
app.use((req, res, next) => {
  // Determine allowed origins based on environment
  const allowedOrigins = [
    'https://fast-planet-470408-f1.web.app',
    'https://fast-planet-470408-f1.firebaseapp.com',
    process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
  ].filter(Boolean);

  const origin = req.headers.origin;
  
  // Set CORS headers
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    // Allow all origins in development
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Additional headers for security
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

// Increase body size limits for image uploads (base64 encoded images can be large)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Cloud Run provides PORT dynamically, default to 8080 for production, 5000 for development
  // this serves both the API and the client.
  const port = parseInt(process.env.PORT || (app.get("env") === "development" ? '5000' : '8080'), 10);

// Configure server options based on platform
// reusePort is not supported on Windows
const listenOptions: any = {
  port,
  // Windows sometimes has issues with 0.0.0.0, use localhost instead
  host: process.platform === 'win32' ? '127.0.0.1' : '0.0.0.0',
};

// Only add reusePort on non-Windows platforms (Linux, macOS)
if (process.platform !== 'win32') {
  listenOptions.reusePort = true;
}

server.listen(listenOptions, () => {
    log(`serving on port ${port}`);

    // Start the live WebSocket price streaming system
    console.log('🚀 Initializing live WebSocket price streaming system...');
    liveWebSocketStreamer.startStreaming().then(() => {
      console.log('✅ Live WebSocket price streaming system started successfully');
    }).catch((error) => {
      console.error('❌ Failed to start live WebSocket price streaming system:', error);
    });

    // Auto-post finance news every hour from Google News
    const postHourlyFinanceNews = async () => {
      try {
        console.log('📰 Auto-posting hourly finance news from Google News...');
        const response = await fetch(`http://localhost:${port}/api/auto-post-daily-news`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        console.log(`📰 Hourly finance news result: ${result.postsCreated} posts created`);
      } catch (error) {
        console.error('📰 Hourly finance news error:', error);
      }
    };

    // Post finance news immediately on startup, then every hour
    // Check if Google Cloud is properly configured before starting
    setTimeout(() => {
      console.log('📰 Attempting to start hourly Google Finance news posting...');
      postHourlyFinanceNews();
      // Only set interval if the first call succeeds
      setInterval(postHourlyFinanceNews, 60 * 60 * 1000); // Every 1 hour (3600000ms)
    }, 10000); // Wait 10 seconds for server to be ready
  });
})();
