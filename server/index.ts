
import * as admin from 'firebase-admin';
import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { liveWebSocketStreamer } from "./live-websocket-streamer";

// --- Firebase Admin SDK Initialization ---
// This version has been corrected to work with Google Secret Manager.
// It directly uses the FIREBASE_PRIVATE_KEY from the environment, trusting that
// Secret Manager provides it in the correct format without extra escaping.

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  const credential = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // The private key is now passed directly from the secret.
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  };

  try {
    admin.initializeApp({
      credential: admin.credential.cert(credential),
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    });
    log('✅ Firebase Admin SDK initialized successfully via environment variables and Secret Manager.');
    log(`📋 Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
  } catch (error) {
    console.error('⚠️ Firebase Admin SDK initialization failed:', error);
  }

} else {
  log('⚠️ Firebase Admin credentials not found in environment variables. Attempting default initialization.');
  // Fallback for local development or other environments where GOOGLE_APPLICATION_CREDENTIALS might be set.
  // Also set projectId from GOOGLE_CLOUD_PROJECT (standard Cloud Run env var) or FIREBASE_PROJECT_ID
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
  
  try {
    admin.initializeApp({
      ...(projectId ? { projectId } : {})
    });
    log('✅ Firebase Admin SDK initialized with default application credentials.');
    if (projectId) {
      log(`📋 Project ID: ${projectId}`);
    }
  } catch(e) {
    log('⚠️ Could not initialize Firebase with default credentials.');
  }
}
// --- End of Firebase Initialization ---


const app = express();

// Health check endpoint - MUST come first for Cloud Run
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API status endpoint (not the root route)
app.get('/api/status', (_req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'Trading Platform API',
    version: '1.0.0'
  });
});

// Enhanced CORS and security headers for Cloud Run and Firebase compatibility
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Define trusted origins - explicitly list all allowed domains for security
  const allowedOrigins = [
    // Firebase Hosting domains for this specific project
    'https://fast-planet-470408-f1.web.app',
    'https://fast-planet-470408-f1.firebaseapp.com',
    // Production custom domains
    'https://perala.in',
    'https://www.perala.in',
    // Production Cloud Run deployments
    'https://perala-808950990883.us-central1.run.app',
    'https://perala-zup2rskmja-uc.a.run.app',
    // Cloud Run backend URL
    process.env.VITE_API_URL ? process.env.VITE_API_URL : null,
    // Cloud Run frontend URL (for deployments)
    process.env.FRONTEND_URL ? process.env.FRONTEND_URL : null,
    process.env.CLOUD_RUN_FRONTEND_URL ? process.env.CLOUD_RUN_FRONTEND_URL : null,
    // Replit development domain
    process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
  ].filter(Boolean);
  
  // Function to check if origin is trusted
  const isTrustedOrigin = (origin: string | undefined): boolean => {
    if (!origin) return false;
    
    // Check exact matches against allowlist
    if (allowedOrigins.includes(origin)) return true;
    
    // Production: Allow all Cloud Run URLs (*.run.app domains with multiple subdomains)
    if (origin.match(/^https:\/\/[a-zA-Z0-9\-\.]+\.run\.app$/)) {
      log(`✅ CORS allowed for Cloud Run domain: ${origin}`);
      return true;
    }
    
    // Development mode only: allow localhost and Replit domains
    if (process.env.NODE_ENV === 'development') {
      if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) return true;
      if (origin.match(/^https:\/\/.*\.replit\.dev$/)) return true;
      if (origin.match(/^https:\/\/.*\.repl\.co$/)) return true;
      return true; // Allow all origins in development mode for testing
    }
    
    return false;
  };
  
  // Set CORS headers for trusted origins only
  if (origin && isTrustedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
    log(`✅ CORS allowed for origin: ${origin}`);
  } else if (origin) {
    // Log rejected origins in production for debugging
    log(`❌ CORS rejected for untrusted origin: ${origin}`);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie, X-CSRF-Token, X-API-Key');
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-JSON-Response-Size');
  res.header('Access-Control-Max-Age', '86400');

  // Additional headers for security
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Handle preflight OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    log(`✅ Preflight OPTIONS request from ${origin || 'unknown'} - responding 204`);
    res.status(204).end();
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
  // Try to register routes, but don't crash if it fails
  let server;
  try {
    server = await registerRoutes(app);
    log('✅ Routes registered successfully');
  } catch (error) {
    console.error('⚠️ Error registering routes:', error);
    console.log('⚠️ Server will start with minimal routes only');
    // Create minimal HTTP server if route registration fails
    const http = await import('http');
    server = http.createServer(app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error('Error:', err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    try {
      await setupVite(app, server);
    } catch (error) {
      console.error('⚠️ Error setting up Vite:', error);
    }
  } else {
    try {
      serveStatic(app);
    } catch (error) {
      console.error('⚠️ Error serving static files:', error);
      console.log('⚠️ API-only mode activated');
    }
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Cloud Run provides PORT dynamically, default to 8080 for production, 5000 for development
  // this serves both the API and the client.
  const port = parseInt(process.env.PORT || (app.get("env") === "development" ? '5000' : '8080'), 10);

// Configure server options - simple config for Cloud Run compatibility
const listenOptions: any = {
  port,
  host: '0.0.0.0',
};

// Only add reusePort in development (not on Cloud Run)
if (process.env.NODE_ENV === 'development' && process.platform !== 'win32') {
  listenOptions.reusePort = true;
}

server.listen(listenOptions, () => {
    log(`serving on port ${port}`);
    log(`Server ready - environment: ${app.get("env")}`);
    
    // Start background tasks AFTER server is ready and health check passes
    // Delay startup to ensure Cloud Run health check succeeds first
    setTimeout(() => {
      // Start the live WebSocket price streaming system (non-blocking)
      // Only start if Fyers credentials are available
      if (process.env.FYERS_ACCESS_TOKEN && process.env.FYERS_APP_ID) {
        console.log('🚀 Initializing live WebSocket price streaming system...');
        liveWebSocketStreamer.startStreaming()
          .then(() => {
            console.log('✅ Live WebSocket price streaming system started successfully');
          })
          .catch((error) => {
            console.error('❌ Failed to start live WebSocket price streaming system:', error);
            console.log('⚠️  Server will continue running without live streaming');
          });
      } else {
        console.log('⚠️  Fyers credentials not found, skipping WebSocket streaming');
      }

      // Auto-post finance news every hour from Google News (non-blocking)
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
          console.log('⚠️  Server will continue running without auto news posting');
        }
      };

      // Post finance news after delay, then every hour (non-blocking)
      // Only start if Google Cloud/Firebase is configured
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
        setTimeout(() => {
          console.log('📰 Attempting to start hourly Google Finance news posting...');
          postHourlyFinanceNews();
          setInterval(postHourlyFinanceNews, 60 * 60 * 1000); // Every 1 hour
        }, 30000); // Wait 30 seconds for server to be fully ready
      } else {
        console.log('⚠️  Firebase credentials not found, skipping auto news posting');
      }
    }, 5000); // Delay background tasks by 5 seconds for Cloud Run health check
  });
})();
