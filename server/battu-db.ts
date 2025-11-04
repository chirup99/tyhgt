import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as battuSchema from "@shared/battu-schema";

neonConfig.webSocketConstructor = ws;

// Private Battu API Database Connection
// This uses a separate database connection from the main application
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a dedicated pool for Battu API operations
export const battuPool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Use different connection settings for isolation
  max: 5, // Limit connections for privacy
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const battuDb = drizzle({ 
  client: battuPool, 
  schema: battuSchema,
  // Enable query logging only in development for security
  logger: process.env.NODE_ENV === 'development' ? true : false
});

// Battu API Security Headers
export const BATTU_API_HEADERS = {
  'X-Battu-API': 'private',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
} as const;

// Generate secure API key for Battu API access
export function generateBattuApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'btu_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Validate Battu API key format
export function isValidBattuApiKey(key: string): boolean {
  return /^btu_[A-Za-z0-9]{32}$/.test(key);
}