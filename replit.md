# Overview

This is a full-stack trading platform built with React, Express, and PostgreSQL. The application provides real-time market data analysis, AI-powered trading insights, and a social feed for traders. The core feature is the "BATTU API" - a sophisticated 4-candle rule methodology for pattern recognition and trading signal generation.

The system analyzes intraday market data using recursive pattern detection across multiple timeframes (5min, 10min, 20min, 40min, 80min), identifying Point A/B extremes, calculating slopes, and validating breakout patterns with timing rules.

**NEW**: Advanced AI Agent with Web Search (like Replit Agent) - Uses DuckDuckGo and Google News to fetch real-time data and answer ANY financial question with intelligent analysis.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React with TypeScript  
**Build Tool**: Vite  
**UI Library**: Radix UI components with Tailwind CSS  
**State Management**: TanStack Query (React Query) for server state  
**Routing**: Wouter for client-side routing  
**Styling**: Tailwind CSS with custom design tokens, fully responsive design patterns  

**Key Design Decisions**:
- Component-based architecture with shadcn/ui patterns
- Mobile-first responsive design with breakpoint-based layouts
- Bottom navigation for mobile, sidebar for desktop
- Real-time data updates using React Query's polling capabilities

## Backend Architecture

**Runtime**: Node.js with TypeScript  
**Framework**: Express.js  
**API Pattern**: RESTful endpoints with JSON responses  
**Development Server**: tsx for TypeScript execution  

**Core Services**:
- **BATTU Analysis Engine**: Implements 4-candle rule methodology with recursive C2 block drilling
- **Market Data Service**: Fetches real-time and historical data from Fyers API
- **Pattern Recognition**: Identifies uptrend/downtrend patterns using Point A/B analysis
- **Slope Calculator**: Precision calculations using 1-minute timestamp data
- **Trade Validation**: Applies 50% and 34% timing rules for genuine breakout detection

**Key Design Decisions**:
- Separation of concerns with dedicated service modules
- Stateless API design for horizontal scalability
- Error handling with detailed logging for market data failures
- Caching strategies for expensive pattern calculations

## Data Storage

**Database**: PostgreSQL (via Neon serverless)  
**ORM**: Drizzle ORM with TypeScript schema definitions  
**Schema Location**: `shared/schema.ts`  
**Migration Strategy**: `drizzle-kit push` for schema synchronization  

**Key Design Decisions**:
- Shared schema between client and server for type safety
- Serverless PostgreSQL for automatic scaling
- Schema-driven development with strong typing throughout the stack

**Data Models**:
- User accounts and authentication state
- Trading signals and pattern analysis results
- Historical market data cache
- Social feed posts and interactions
- User trading journal data (separate from shared demo data)

## Authentication & Authorization

**Strategy**: Session-based authentication (implementation details in schema)  
**User Management**: Account creation, profile management, verification system  

## External Dependencies

### Market Data Providers

**Global Market Indices (World Map)**:
- **Data Source**: Web search-based market data (like Replit Agent) with smart caching
- **Indices Tracked**: S&P 500 (USA), S&P/TSX (CANADA), Nifty 50 (INDIA), Nikkei 225 (TOKYO), Hang Seng (HONG KONG)
- **Smart Caching & Closing Prices**: 
  - **Real-time fetching** when market is OPEN (NYSE: 9:30 AM - 4:00 PM EST, Mon-Fri)
  - **Last closing prices** when market is CLOSED (weekends/after hours)
  - **15-minute refresh** during trading hours, **60-minute refresh** during off-hours
- **Service Location**: `server/market-indices-service.ts`
  - Attempts Yahoo Finance API and DuckDuckGo web search for real market data
  - Stores last closing prices for when market is closed
  - Falls back to realistic market data if web sources unavailable
- **Frontend Hook**: `client/src/hooks/useMarketData.ts` - Provides market data to world map component
- **Market Status**: Automatically detects NYSE trading hours and adjusts refresh frequency accordingly

**Indian Market Data**:
- **Fyers API v3**: Primary source for real-time and historical Indian market data (NSE/BSE)
- **Endpoints Used**: 
  - Historical candle data (1-minute, 5-minute, 10-minute timeframes)
  - Real-time quotes for NIFTY50, BANKNIFTY, and equities
- **Authentication**: Access token-based API authentication
- **Rate Limiting**: Handled at application level with request throttling

### Cloud Services
- **Google Cloud Firestore**: Document storage for unstructured data
- **Google Cloud Storage**: File and asset storage (trading charts, user uploads)
- **Google Generative AI**: AI-powered market analysis and insights generation

### File Upload & Management
- **Uppy**: File upload library with AWS S3 integration
- **AWS S3**: Storage backend for uploaded files and generated reports

### UI Component Libraries
- **Radix UI**: Accessible, unstyled component primitives
- **shadcn/ui**: Pre-built component patterns
- **Framer Motion**: Animation library for smooth transitions
- **Lucide React**: Icon library

### Development Tools
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Fast bundling for production builds
- **Drizzle Kit**: Database migration and schema management
- **Replit Integration**: Development environment plugins and runtime error overlay

## Key Architectural Patterns

### BATTU 4-Candle Rule Methodology
The core trading algorithm follows a precise pattern:

1. **Data Collection**: Fetch 4 consecutive candles at selected timeframe
2. **Block Formation**: Group into C1 (candles 1-2) and C2 (candles 3-4) blocks
3. **Point A/B Detection**: Scan 1-minute data within blocks to find exact price extremes
4. **Pattern Classification**: Identify uptrend (1-3, 1-4, 2-3, 2-4) or downtrend patterns
5. **Slope Calculation**: `(Point B Price - Point A Price) / Duration in Minutes`
6. **Timing Validation**: Apply 50% and 34% rules to eliminate fake breakouts
7. **Recursive Analysis**: Drill down into C2 block at smaller timeframes for precision

### Recursive C2 Block Drilling
Multi-timeframe fractal analysis:
- 80min → 40min → 20min → 10min → 5min
- Each level analyzes the C2 block of the previous level
- Identifies internal patterns within larger patterns
- Stops at 5-minute base resolution

### Real-Time Market Progression
- Continuous backtesting from market open (9:15 AM) to close (3:30 PM IST)
- Progressive candle formation with live breakout detection
- WebSocket-ready architecture (polling currently implemented)

### Demo Mode Feature
The trading journal includes a toggle switch that allows users to switch between demo data and personal trading data:

**Demo Mode (ON)**:
- Displays shared demo data that is the same for all users
- Uses Google Cloud Storage for data persistence
- Ideal for learning and exploring the platform without affecting personal records
- Saved in localStorage as `tradingJournalDemoMode = "true"`

**Personal Mode (OFF)**:
- Displays user-specific trading data stored per user in Firebase Firestore
- Each user has their own separate trading journal entries
- Data is stored in Firebase with `userId` as the document identifier
- Saved in localStorage as `tradingJournalDemoMode = "false"`

**Implementation Details**:
- Toggle switch located in the trade book header next to the Save button
- Preference persisted in browser localStorage
- Switching modes clears the current data view and reloads appropriate data
- User identification: Auto-generated userId stored in localStorage (`tradingJournalUserId`)
- Firebase collection: `userTradingJournal` with documents per user/date combination
- API Endpoints: 
  - `POST /api/user-journal` - Save user-specific trading data
  - `GET /api/user-journal/:userId/:date` - Load user-specific trading data
  - `DELETE /api/user-journal/:userId/:date` - Delete user-specific trading data

## Audio MiniCast Feature

The platform includes an innovative **Audio MiniCast** feature for creating audio-based content from feed posts:

### How It Works:
1. **Toggle Audio Mode**: Click the Radio icon (🔘) in the post creation panel header
2. **Select Posts**: Tap any post in the feed to add it to your minicast (up to 5 posts maximum)
3. **Card Animation**: Selected posts animate with a purple highlight and card swipe effect
4. **Create Minicast**: Write your thoughts and click "Publish Audio" to create your audio post
5. **Feed Display**: Audio minicasts appear in the feed as swipeable cards with play controls

### Components:
- `AudioModeContext`: Global state management for audio mode across components
- `AudioMinicastCard`: Swipeable card component for displaying audio posts in the feed
- `PostCreationPanel`: Integrated audio mode with simplified UI
- Database fields: `isAudioPost`, `selectedPostIds`, `audioUrl`

### User Experience:
- **Visual Feedback**: Purple accents and bouncing Radio icon indicate selection
- **Swiping Interface**: Navigate through cards with next/previous buttons
- **Progress Dots**: Visual indicator showing current card position
- **Engagement**: Like, comment, and share functionality preserved

## API Structure

**Base Route**: `/api`  

**Key Endpoints**:
- `/battu-scan/intraday/*` - BATTU analysis endpoints
  - `fetch-one-minute-data` - Raw 1-minute candles
  - `corrected-slope-calculation` - Precision slope analysis
  - `four-candle-analysis` - Pattern recognition
  - `recursive-c2-drilling` - Multi-timeframe analysis
- `/market-data/*` - Real-time quotes and historical data
- `/trades/*` - Trade execution and history
- `/feed/*` - Social trading feed operations
- `/social-posts` - Create, read, update social posts (including audio minicasts)
- `/advanced-query` - **NEW! Advanced AI Agent with Web Search**
  - Processes ANY question using DuckDuckGo/Google News search
  - Combines web data with stock analysis, market trends, and journal insights
  - Works like Replit Agent for financial questions

**Response Pattern**: Consistent JSON structure with metadata, data payload, and error handling

## Deployment Considerations

**Environment Variables**:
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `FYERS_APP_ID` - Fyers API credentials
- `FYERS_ACCESS_TOKEN` - API authentication token
- `NODE_ENV` - Runtime environment flag

**Build Process**:
1. Frontend: Vite builds to `dist/public`
2. Backend: ESBuild bundles to `dist/index.js`
3. Static assets served from build output

**Production Readiness**:
- Error boundaries for graceful failure handling
- Request validation and sanitization
- Rate limiting for API protection
- Database connection pooling via Neon
- Responsive design tested across devices