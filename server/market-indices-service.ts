import yahooFinance from 'yahoo-finance2';

export interface MarketIndex {
  symbol: string;
  regionName: string;
  price: number;
  change: number;
  changePercent: number;
  isUp: boolean;
  marketTime: string;
  isMarketOpen: boolean;
}

// Market index symbols for different regions
const MARKET_SYMBOLS = {
  'USA': '^GSPC',          // S&P 500
  'CANADA': '^GSPTSE',     // S&P/TSX Composite Index
  'INDIA': '^NSEI',        // Nifty 50
  'TOKYO': '^N225',        // Nikkei 225
  'HONG KONG': '^HSI',     // Hang Seng Index
};

/**
 * Fetches real-time market index data from Yahoo Finance
 * If market is closed, returns last available data
 */
export async function getMarketIndices(): Promise<Record<string, MarketIndex>> {
  const results: Record<string, MarketIndex> = {};
  
  try {
    // Fetch quotes for all indices in parallel
    const promises = Object.entries(MARKET_SYMBOLS).map(async ([regionName, symbol]) => {
      try {
        console.log(`📊 Fetching market data for ${regionName} (${symbol})...`);
        
        // Get quote data from Yahoo Finance
        const quote: any = await yahooFinance.quote(symbol);
        
        if (!quote) {
          console.warn(`⚠️ No data returned for ${regionName} (${symbol})`);
          return null;
        }

        const regularMarketPrice = quote.regularMarketPrice || 0;
        const previousClose = quote.regularMarketPreviousClose || regularMarketPrice;
        const change = regularMarketPrice - previousClose;
        const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;
        
        const marketIndex: MarketIndex = {
          symbol,
          regionName,
          price: regularMarketPrice,
          change: change,
          changePercent: changePercent,
          isUp: change >= 0,
          marketTime: quote.regularMarketTime?.toISOString() || new Date().toISOString(),
          isMarketOpen: quote.marketState === 'REGULAR' || false,
        };

        console.log(`✅ ${regionName}: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}% (${marketIndex.isMarketOpen ? 'OPEN' : 'CLOSED'})`);
        
        return { regionName, data: marketIndex };
      } catch (error) {
        console.error(`❌ Error fetching data for ${regionName} (${symbol}):`, error);
        return null;
      }
    });

    const settledResults = await Promise.allSettled(promises);
    
    // Process results
    settledResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        const { regionName, data } = result.value;
        results[regionName] = data;
      }
    });

    // If we have no results, return fallback data
    if (Object.keys(results).length === 0) {
      console.warn('⚠️ No market data retrieved, returning fallback data');
      return getFallbackData();
    }

    return results;
  } catch (error) {
    console.error('❌ Error fetching market indices:', error);
    return getFallbackData();
  }
}

/**
 * Returns fallback data when API fails
 */
function getFallbackData(): Record<string, MarketIndex> {
  return {
    'USA': {
      symbol: '^GSPC',
      regionName: 'USA',
      price: 0,
      change: 0,
      changePercent: 0,
      isUp: false,
      marketTime: new Date().toISOString(),
      isMarketOpen: false,
    },
    'CANADA': {
      symbol: '^GSPTSE',
      regionName: 'CANADA',
      price: 0,
      change: 0,
      changePercent: 0,
      isUp: false,
      marketTime: new Date().toISOString(),
      isMarketOpen: false,
    },
    'INDIA': {
      symbol: '^NSEI',
      regionName: 'INDIA',
      price: 0,
      change: 0,
      changePercent: 0,
      isUp: false,
      marketTime: new Date().toISOString(),
      isMarketOpen: false,
    },
    'TOKYO': {
      symbol: '^N225',
      regionName: 'TOKYO',
      price: 0,
      change: 0,
      changePercent: 0,
      isUp: false,
      marketTime: new Date().toISOString(),
      isMarketOpen: false,
    },
    'HONG KONG': {
      symbol: '^HSI',
      regionName: 'HONG KONG',
      price: 0,
      change: 0,
      changePercent: 0,
      isUp: false,
      marketTime: new Date().toISOString(),
      isMarketOpen: false,
    },
  };
}

// Cache for market data (15 minute cache)
let cachedData: Record<string, MarketIndex> | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Gets market indices with caching (15 minute cache)
 */
export async function getCachedMarketIndices(): Promise<Record<string, MarketIndex>> {
  const now = Date.now();
  
  // Return cached data if it's still fresh
  if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('📦 Returning cached market data');
    return cachedData;
  }
  
  // Fetch fresh data
  console.log('🔄 Fetching fresh market data...');
  cachedData = await getMarketIndices();
  lastFetchTime = now;
  
  return cachedData;
}
