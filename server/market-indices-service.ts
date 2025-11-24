import axios from 'axios';

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

// Twelve Data symbols for global indices
const TWELVE_DATA_SYMBOLS = {
  'USA': 'GSPC',          // S&P 500
  'CANADA': 'GSPTSE',     // S&P/TSX Composite Index
  'INDIA': 'NSEI',        // Nifty 50
  'TOKYO': 'N225',        // Nikkei 225
  'HONG KONG': 'HSI',     // Hang Seng Index
};

// Store last closing prices for when market is closed
let lastClosingPrices: Record<string, MarketIndex> = {};

/**
 * Fetches real market data from Twelve Data API
 */
export async function getMarketIndices(): Promise<Record<string, MarketIndex>> {
  try {
    console.log('🌍 Fetching market data from Twelve Data API...');
    
    const apiKey = process.env.TWELVE_DATA_API_KEY;
    if (!apiKey) {
      throw new Error('TWELVE_DATA_API_KEY is not configured');
    }

    const results: Record<string, MarketIndex> = {};
    
    // Fetch data for each market in parallel
    const fetchPromises = Object.entries(TWELVE_DATA_SYMBOLS).map(([regionName, symbol]) =>
      fetchTwelveDataQuote(regionName, symbol, apiKey)
    );

    const fetchedData = await Promise.allSettled(fetchPromises);
    
    fetchedData.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        results[result.value.regionName] = result.value;
      }
    });

    if (Object.keys(results).length > 0) {
      lastClosingPrices = results;
      console.log(`✅ Fetched ${Object.keys(results).length} indices from Twelve Data`);
      return results;
    }

    // Fallback to realistic data if API fails
    console.log('📦 Using realistic market data (API fallback)');
    const fallbackData = getRealisticMarketData();
    lastClosingPrices = fallbackData;
    return fallbackData;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Error fetching market data:', errorMsg);
    
    // Return last known prices or fallback
    if (Object.keys(lastClosingPrices).length > 0) {
      console.log('📊 Returning last known prices');
      return lastClosingPrices;
    }
    
    return getFallbackData();
  }
}

/**
 * Fetches a quote from Twelve Data API
 */
async function fetchTwelveDataQuote(
  regionName: string,
  symbol: string,
  apiKey: string
): Promise<MarketIndex | null> {
  try {
    const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await axios.get(url, {
      timeout: 8000,
    }).finally(() => clearTimeout(timeoutId));

    if (response.data && response.data.price !== undefined) {
      const price = parseFloat(response.data.price);
      const previousClose = parseFloat(response.data.previous_close) || price;
      const change = price - previousClose;
      const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

      console.log(`✅ ${regionName} (${symbol}): ${price.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);

      return {
        symbol,
        regionName,
        price,
        change,
        changePercent,
        isUp: changePercent >= 0,
        marketTime: new Date().toISOString(),
        isMarketOpen: isMarketOpen(),
      };
    }

    console.warn(`⚠️ No price data for ${regionName}`);
    return null;
  } catch (error) {
    console.warn(`⚠️ Failed to fetch ${regionName} from Twelve Data: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Returns realistic market data (fallback when API fails)
 */
function getRealisticMarketData(): Record<string, MarketIndex> {
  const marketRates: Record<string, { price: number; changePercent: number }> = {
    'USA': { price: 5950, changePercent: 0.34 },
    'CANADA': { price: 24450, changePercent: 0.20 },
    'INDIA': { price: 23800, changePercent: 0.63 },
    'TOKYO': { price: 39200, changePercent: 0.26 },
    'HONG KONG': { price: 19500, changePercent: -0.52 },
  };

  const results: Record<string, MarketIndex> = {};
  
  Object.entries(marketRates).forEach(([regionName, { price, changePercent }]) => {
    const symbol = TWELVE_DATA_SYMBOLS[regionName as keyof typeof TWELVE_DATA_SYMBOLS];
    const change = (price * changePercent) / 100;
    
    results[regionName] = {
      symbol,
      regionName,
      price,
      change,
      changePercent,
      isUp: changePercent >= 0,
      marketTime: new Date().toISOString(),
      isMarketOpen: isMarketOpen(),
    };
  });

  return results;
}

/**
 * Fallback data
 */
function getFallbackData(): Record<string, MarketIndex> {
  return {
    'USA': {
      symbol: 'GSPC',
      regionName: 'USA',
      price: 5900,
      change: 0,
      changePercent: 0,
      isUp: true,
      marketTime: new Date().toISOString(),
      isMarketOpen: false,
    },
    'CANADA': {
      symbol: 'GSPTSE',
      regionName: 'CANADA',
      price: 24200,
      change: 0,
      changePercent: 0,
      isUp: true,
      marketTime: new Date().toISOString(),
      isMarketOpen: false,
    },
    'INDIA': {
      symbol: 'NSEI',
      regionName: 'INDIA',
      price: 23600,
      change: 0,
      changePercent: 0,
      isUp: true,
      marketTime: new Date().toISOString(),
      isMarketOpen: false,
    },
    'TOKYO': {
      symbol: 'N225',
      regionName: 'TOKYO',
      price: 39000,
      change: 0,
      changePercent: 0,
      isUp: true,
      marketTime: new Date().toISOString(),
      isMarketOpen: false,
    },
    'HONG KONG': {
      symbol: 'HSI',
      regionName: 'HONG KONG',
      price: 19400,
      change: 0,
      changePercent: 0,
      isUp: false,
      marketTime: new Date().toISOString(),
      isMarketOpen: false,
    },
  };
}

/**
 * Determines if market is currently open
 */
function isMarketOpen(): boolean {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();
  
  // Monday (1) to Friday (5)
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  
  // Market opens at 9:30 AM EST = 14:30 UTC
  // Market closes at 4:00 PM EST = 21:00 UTC
  const currentMinutes = hours * 60 + minutes;
  const openTime = 14 * 60 + 30;
  const closeTime = 21 * 60;
  
  return currentMinutes >= openTime && currentMinutes < closeTime;
}

/**
 * Gets cache duration based on market status
 */
function getCacheDuration(): number {
  return isMarketOpen() ? 5 * 60 * 1000 : 30 * 60 * 1000; // 5 min when open, 30 min when closed
}

// Cache management
let cachedData: Record<string, MarketIndex> | null = null;
let lastFetchTime: number = 0;

/**
 * Gets market indices with intelligent caching
 * - Fetches fresh data every 5 minutes when market is open
 * - Fetches fresh data every 30 minutes when market is closed
 */
export async function getCachedMarketIndices(): Promise<Record<string, MarketIndex>> {
  const now = Date.now();
  const cacheDuration = getCacheDuration();
  const marketStatus = isMarketOpen() ? '🟢 OPEN' : '🔴 CLOSED';
  
  // Check if cache is still valid
  const isCacheValid = cachedData && (now - lastFetchTime) < cacheDuration;
  
  if (isCacheValid) {
    const ageMinutes = Math.round((now - lastFetchTime) / 1000 / 60);
    const updateInterval = isMarketOpen() ? '5 min' : '30 min';
    console.log(`📦 Cached data (${ageMinutes}m old | Market: ${marketStatus} | Updates: every ${updateInterval})`);
    return cachedData!;
  }
  
  // Fetch fresh data
  const updateInterval = isMarketOpen() ? '5 minutes' : '30 minutes';
  console.log(`🌐 Refreshing market data from Twelve Data (Market: ${marketStatus} | Updates every ${updateInterval})...`);
  try {
    const freshData = await getMarketIndices();
    cachedData = freshData;
    lastFetchTime = now;
    console.log(`✅ Market data refreshed (next update in ${updateInterval})`);
    return freshData;
  } catch (error) {
    console.error('❌ Error refreshing market data:', error);
    return cachedData || getFallbackData();
  }
}
