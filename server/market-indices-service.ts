import axios from 'axios';
import * as cheerio from 'cheerio';

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

// Google Finance symbols for global indices - using ticker:exchange format
const GOOGLE_FINANCE_INDICES = {
  'USA': { ticker: 'GSPC', exchange: 'INDEXSP' },           // S&P 500
  'CANADA': { ticker: 'GSPTSE', exchange: 'INDEXSP' },      // TSX Composite
  'INDIA': { ticker: '0700113Y', exchange: 'NSEI' },        // Nifty 50
  'TOKYO': { ticker: '225', exchange: 'INDEXNIKKEI' },      // Nikkei 225
  'HONG KONG': { ticker: 'HSI', exchange: 'INDEXHKG' },     // Hang Seng
};

/**
 * Fetches real market data from Google Finance
 */
export async function getMarketIndices(): Promise<Record<string, MarketIndex>> {
  console.log('🌍 Fetching real-time market data from Google Finance...');
  
  const results: Record<string, MarketIndex> = {};
  
  // Fetch data for each market in parallel
  const fetchPromises = Object.entries(GOOGLE_FINANCE_INDICES).map(([regionName, config]) =>
    fetchGoogleFinanceData(regionName, config.ticker, config.exchange)
  );

  const fetchedData = await Promise.allSettled(fetchPromises);
  
  let successCount = 0;
  fetchedData.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      results[result.value.regionName] = result.value;
      successCount++;
    }
  });

  console.log(`📊 Successfully fetched ${successCount}/${Object.keys(GOOGLE_FINANCE_INDICES).length} indices`);
  
  if (successCount === 0) {
    throw new Error('Failed to fetch any market data from Google Finance');
  }

  return results;
}

/**
 * Scrapes Google Finance for market data
 */
async function fetchGoogleFinanceData(
  regionName: string,
  ticker: string,
  exchange: string
): Promise<MarketIndex | null> {
  try {
    const url = `https://www.google.com/finance/quote/${ticker}:${exchange}`;
    
    console.log(`📡 Fetching ${regionName}: ${ticker}:${exchange} from ${url}`);
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    const $ = cheerio.load(response.data);
    
    // Google Finance price structure - get the main price display
    let priceText = '';
    let changeText = '';
    let changePercentText = '';

    // Try to find price in various possible locations
    const priceElements = $('div[data-draggable-id] span, div[role="heading"] span, [data-currency] span');
    
    for (let i = 0; i < priceElements.length; i++) {
      const text = $(priceElements[i]).text().trim();
      const num = parseFloat(text);
      if (!isNaN(num) && num > 0 && text.length < 20) {
        priceText = text;
        break;
      }
    }

    // Look for change percentage
    const changeElements = $('div span');
    changeElements.each((i, elem) => {
      const text = $(elem).text().trim();
      if ((text.includes('%') || text.includes('+') || text.includes('-')) && text.length < 15) {
        if (!changeText && text.match(/[+-]?\d+\.?\d*%/)) {
          changeText = text;
        }
      }
    });

    // Parse the data
    const price = parseFloat(priceText.replace(/[^0-9.-]/g, ''));
    let changePercent = 0;
    
    if (changeText) {
      const match = changeText.match(/[+-]?\d+\.?\d*/);
      if (match) {
        changePercent = parseFloat(match[0]);
      }
    }

    if (!isNaN(price) && price > 0) {
      const change = (price * changePercent) / 100;
      
      console.log(`✅ ${regionName}: ${price.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);

      return {
        symbol: ticker,
        regionName,
        price,
        change,
        changePercent,
        isUp: changePercent >= 0,
        marketTime: new Date().toISOString(),
        isMarketOpen: true,
      };
    }

    console.warn(`⚠️ Could not extract valid price for ${regionName} (price: "${priceText}", change: "${changeText}")`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error fetching ${regionName}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Gets market indices - fetches fresh data every time
 */
export async function getCachedMarketIndices(): Promise<Record<string, MarketIndex>> {
  console.log('🌐 Fetching fresh market indices...');
  try {
    const data = await getMarketIndices();
    console.log(`✅ Market data retrieved successfully`);
    return data;
  } catch (error) {
    console.error('❌ Failed to fetch market indices:', error);
    throw error;
  }
}
