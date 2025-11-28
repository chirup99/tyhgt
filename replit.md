# Overview

This project is a full-stack trading platform offering real-time market data analysis, AI-powered trading insights, and a social feed. Its core functionality revolves around the "BATTU API," which employs a 4-candle rule methodology for pattern recognition and trading signal generation by analyzing intraday market data across multiple timeframes. The platform also integrates an advanced AI agent with web search capabilities for financial queries and a unified sharing system for trading journal reports, allowing users to preview and share their performance metrics in a consistent, view-only modal.

**Business Vision & Ambition:** To empower traders with sophisticated analytical tools, AI-driven insights, and a collaborative community environment, enhancing decision-making and trading strategies.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

## November 28, 2025 - Removed All Hardcoded Interval Mappings

**CRITICAL FIX**: Eliminated hardcoded interval maps that were blocking custom timeframe aggregation:

**Problem Identified**: 
- Two hardcoded `intervalMap` objects in chart rendering code (lines 5281-5282, 5331-5332)
- Maps only contained: `{ '1': 60, '3': 180, '5': 300, '10': 600, '15': 900, '30': 1800, '60': 3600, '1D': 86400 }`
- Custom intervals (20, 40, 45, 80, 120, etc.) fell back to 60 seconds
- Candles weren't aligning to selected timeframe

**Solution Applied** (`client/src/pages/home.tsx`):
- **Removed hardcoded maps** from SSE connection setup and live stream update logic
- **Replaced with dynamic calculation**: `const timeframeMinutes = getJournalTimeframeMinutes(selectedJournalInterval); const intervalSeconds = timeframeMinutes * 60;`
- Now supports ANY custom timeframe without need for hardcoded entries
- Properly converts all formats: 1, 5, 20, 40, 45, 80, 120, 1D, 1W, 1M to correct seconds

**Result**:
- All preset + custom timeframes work with correct aggregation
- No more hardcoded complex aggregation blocking new intervals
- Console logs accurately show: "Loaded 50 1-minute candles" → "Aggregated to X-minute candles: Y bars"
- Candlesticks align perfectly to selected timeframe

## November 27, 2025 - Dynamic Instrument Search Across All Exchanges

Implemented comprehensive dynamic instrument search replacing hardcoded 18-stock dropdown with access to 10,000+ instruments from Angel One's master file:

**Backend API** (`server/routes.ts`):
- New endpoint: `/api/angelone/search-instruments` (line 7858)
- Fetches and caches Angel One's master JSON file (10,000+ instruments across NSE, BSE, MCX)
- Smart caching: 24-hour duration to minimize API calls
- Query parameters: `query` (search text), `exchange` (NSE/BSE/MCX filter), `limit` (max results)
- Returns complete instrument metadata: token, symbol, type, lot size, tick size, etc.

**Frontend Search UI** (`client/src/pages/home.tsx`):
- Replaced hardcoded dropdown with live search functionality
- Debounced search (300ms) to reduce API load while typing
- Color-coded exchange badges (NSE=blue, BSE=purple, MCX=orange)
- Instrument type labels (EQ, INDEX, FUTCOM, OPTIDX, OPTSTK, OPTFUT)
- Shows trading symbol below name if different
- Loading spinner during search

**Chart Integration**:
- Added `selectedInstrument` state to track user selections
- Chart loading uses selected instrument's token/exchange/symbol
- Live streaming updated to use selected instrument data
- Backward compatibility: Falls back to hardcoded `journalAngelOneTokens` when no selection
- Auto-refetch when new instrument selected

**Supported Instruments**:
- NSE/BSE stocks (equity, preference shares)
- Indices (NIFTY, BANKNIFTY, SENSEX, etc.)
- Futures (FUTIDX, FUTCOM, FUTSTK)
- Options (OPTIDX, OPTSTK, OPTFUT)
- MCX commodities (GOLD, SILVER, CRUDEOIL, etc.)

**Known Limitations**:
- `selectedInstrument` state not persisted across page reloads (reverts to NIFTY50)
- MCX commodity tokens need monthly updates as futures contracts expire
- Angel One authentication required for live data (403 errors expected until connected)

## November 27, 2025 - Tick-by-Tick Live Candle Animation at 700ms

Completed fully animated Trading Journal chart with live price movement:

**Frontend Animation Setup:**
- Removed manual "Fetch" button - chart auto-fetches on tab/symbol/interval change
- NO continuous polling - uses only SSE live streaming for smooth updates
- Tick-by-tick candlestick movement with 50ms animation delay
- Live price updates every 700ms from Angel One API via SSE

**Live OHLC Display & Animation:**
- Real-time OHLC values in header (Open, High, Low, Close)
- EMA 12 & EMA 26 update incrementally with each tick
- Volume histogram updates with color coding (green up, red down)
- Price line follows latest LTP with countdown timer
- All synchronized to IST timezone

**700ms SSE Streaming:**
- Backend polls Angel One API every 700ms via `server/angel-one-live-stream.ts`
- Sends live candle OHLC + volume + countdown to frontend
- Frontend updates chart smoothly with 50ms animation for visual effect
- No chart reload - only the current candle animates in real-time

**User Experience:**
- Chart loads once and stays alive with SSE updates
- Smooth candlestick growth/shrinkage with price movement
- EMA lines react instantly to price changes
- Countdown timer updates showing seconds until candle close
- Market status indicator (open/closed) with live pulse animation

## November 27, 2025 - Trading Journal TradingView Chart with Angel One API

Fixed and completed the Trading Journal TradingView-style candlestick chart:

**Chart Features:**
- Professional candlestick display (green #16a34a up, red #dc2626 down)
- Volume histogram with color coding
- EMA 12 (bright blue #0066ff) and EMA 26 (orange #ff6600) indicators
- Light theme with full dark mode support
- Responsive design for desktop and mobile

**Fixes Applied:**
1. **Connection Check**: Added Angel One connection status verification before fetching chart data (prevents 401 errors)
2. **Tab Name Fix**: Fixed activeTab condition from 'trading-journal' to 'journal' for proper chart rendering
3. **IST Timezone Handling**: Implemented proper IST (UTC+5:30) timestamp conversion for Angel One API data:
   - Handles string timestamps (e.g., "2025-11-27 09:15") by applying IST offset correction
   - Handles milliseconds (>10 billion) by converting to seconds
   - Handles seconds format directly
   - Accounts for browser timezone offset and applies IST (+5:30) for correct display
   - Converts to Unix seconds for lightweight-charts library compatibility

**Data Transformation:**
Uses exact same logic as Visual Chart window - converts Angel One OHLC data to lightweight-charts format with:
- Candlestick series: open, high, low, close, volume
- EMA calculations (12 & 26 periods) on close prices
- Proper time series alignment

**Symbols Supported:**
- NSE stocks (Reliance, TCS, HDFC Bank, Bajaj Auto, Infosys, etc.)
- 15-minute candles (extendable to other intervals)

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