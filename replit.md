# Overview

This project is a full-stack trading platform offering real-time market data analysis, AI-powered trading insights, and a social feed. Its core functionality revolves around the "BATTU API," which employs a 4-candle rule methodology for pattern recognition and trading signal generation by analyzing intraday market data across multiple timeframes. The platform also integrates an advanced AI agent with web search capabilities for financial queries and a unified sharing system for trading journal reports, allowing users to preview and share their performance metrics in a consistent, view-only modal.

**Business Vision & Ambition:** To empower traders with sophisticated analytical tools, AI-driven insights, and a collaborative community environment, enhancing decision-making and trading strategies.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

## November 26, 2025 - Replit Environment Migration

Successfully migrated PERALA trading application to Replit environment with the following fixes:

1. **Vite HMR WebSocket Configuration** (`vite.config.ts`):
   - Conditionally configured for Replit environment using REPL_SLUG and REPL_OWNER env vars
   - Uses `wss://` protocol with port 443 for Replit deployment
   - Falls back to default Vite HMR for local development
   - Host format: `${REPL_SLUG}-${REPL_OWNER}.replit.dev`

2. **Historical Data Endpoint** (`server/routes.ts`):
   - Fixed 503 error for unauthenticated requests to `/api/historical-data`
   - Returns empty candles array with source "none" when user not authenticated
   - Maintains proper error handling for authenticated requests

3. **Environment Notes**:
   - Server runs on port 5000 (Express + Vite)
   - "Access token not available" warnings are expected for unauthenticated users
   - Fyers API authentication required for real-time market data access

# System Architecture

## Frontend Architecture

**Framework**: React with TypeScript, Vite  
**UI/UX**: Radix UI components with Tailwind CSS for a mobile-first, responsive design using shadcn/ui patterns. Features include bottom navigation for mobile and sidebar for desktop.  
**State Management**: TanStack Query (React Query) for server state and real-time data updates.  
**Routing**: Wouter for client-side routing.  

## Backend Architecture

**Runtime**: Node.js with Express.js (TypeScript)  
**API Pattern**: RESTful endpoints.  
**Core Services**:
- **BATTU Analysis Engine**: Implements the 4-candle rule with recursive C2 block drilling for multi-timeframe pattern detection.
- **Market Data Service**: Fetches real-time and historical data.
- **Pattern Recognition**: Identifies uptrend/downtrend using Point A/B analysis.
- **Slope Calculator**: Provides precise slope calculations.
- **Trade Validation**: Applies timing rules for breakout detection.  
**System Design**: Stateless API, separation of concerns, comprehensive error handling, and caching strategies for performance.

## Data Storage

**Database**: PostgreSQL (Neon serverless)  
**ORM**: Drizzle ORM with TypeScript schema definitions (`shared/schema.ts`).  
**Data Models**: User accounts, trading signals, cached market data, social feed posts, and user trading journal data.  

## Authentication & Authorization

**Strategy**: Session-based authentication.  
**User Management**: Account creation, profile management, and verification.  

## Key Architectural Patterns

- **BATTU 4-Candle Rule Methodology**: Involves data collection, block formation, Point A/B detection, pattern classification, slope calculation, timing validation, and recursive analysis (80min down to 5min).
- **Demo Mode**: Allows users to switch between shared demo data (Google Cloud Storage) and personal trading data (Firebase Firestore), with access controls for saving and deleting formats based on authentication status.
- **Audio MiniCast**: Enables users to create audio-based content from feed posts by selecting up to 5 posts, which are then displayed as swipeable cards with play controls in the feed.

# External Dependencies

-   **Market Data Providers**:
    -   **Global Market Indices**: Web search-based data (DuckDuckGo, Google News) for S&P 500, S&P/TSX, Nifty 50, Nikkei 225, Hang Seng, with smart caching and refresh based on market hours.
    -   **Indian Market Data**: Fyers API v3 for real-time and historical NSE/BSE data.
-   **Cloud Services**:
    -   **Google Cloud Firestore**: Document storage.
    -   **Google Cloud Storage**: File and asset storage.
    -   **Google Generative AI**: AI-powered market analysis.
    -   **AWS S3**: Storage backend for uploaded files (via Uppy).
-   **UI Component Libraries**: Radix UI, shadcn/ui, Framer Motion, Lucide React.
-   **Development Tools**: TypeScript, ESBuild, Drizzle Kit.