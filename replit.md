# Overview

This project is a full-stack trading platform offering real-time market data analysis, AI-powered trading insights, and a social feed. Its core functionality revolves around the "BATTU API," which employs a 4-candle rule methodology for pattern recognition and trading signal generation by analyzing intraday market data across multiple timeframes. The platform also integrates an advanced AI agent with web search capabilities for financial queries and a unified sharing system for trading journal reports, allowing users to preview and share their performance metrics in a consistent, view-only modal.

**Business Vision & Ambition:** To empower traders with sophisticated analytical tools, AI-driven insights, and a collaborative community environment, enhancing decision-making and trading strategies.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

## November 26, 2025 - Angel One SmartAPI Integration

Added Angel One SmartAPI as a free alternative to Fyers API:

**Backend:**
- Created `server/angel-one-api.ts` with complete API wrapper:
  - TOTP-based authentication (no daily token refresh needed)
  - Session management with JWT tokens
  - Profile, LTP, quotes, candle data, holdings, positions, and order book methods
  - Singleton pattern with proper exports

**Frontend:**
- Created `client/src/components/auth-button-angelone.tsx` for Angel One connection
- Updated Market Dashboard in `home.tsx` with tabs to switch between:
  - Fyers (Paid) - requires daily token refresh
  - Angel One (Free) - uses automatic TOTP authentication

**API Routes Added:**
- `POST /api/angelone/connect` - Connect with credentials
- `GET /api/angelone/status` - Get connection status
- `GET /api/angelone/profile` - Get user profile
- `POST /api/angelone/disconnect` - Logout
- `GET /api/angelone/ltp/:exchange/:symbol/:token` - Get last traded price
- `GET /api/angelone/historical` - Get historical candle data
- `GET /api/angelone/holdings` - Get holdings
- `GET /api/angelone/positions` - Get positions

**Note:** Angel One credentials (Client Code, PIN, API Key, TOTP Secret) are stored only in memory during the session.

## November 26, 2025 - NSE OHLC Data Tab UI

Added new NSE OHLC Data display tab with:
- Stock search bar with 20 popular NSE stocks (Reliance, TCS, HDFC Bank, etc.)
- Professional OHLC data window showing Open, High, Low, Close prices
- Additional stats: Volume, Value, 52W High/Low
- Auto-fetch data when stock is selected
- Refresh button and connection status badge

**Known Limitation**: NSE website uses Akamai bot protection that blocks cloud server IPs. Direct data fetching returns 403 errors from Replit/cloud environments but works from local/residential networks. For production, Fyers API remains the recommended solution.

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