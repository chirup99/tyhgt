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

// Yahoo Finance symbols for global indices
const YAHOO_FINANCE_SYMBOLS: Record<string, string> = {
  'USA': '^GSPC',           // S&P 500
  'CANADA': '^GSPTSE',      // TSX Composite
  'INDIA': '^NSEI',         // Nifty 50
  'TOKYO': '^N225',         // Nikkei 225
  'HONG KONG': '^HSI',      // Hang Seng
};

/**
 * Fetches real market data from Yahoo Finance API
 */
export async function getMarketIndices(): Promise<Record<string, MarketIndex>> {
  try {
    console.log('🌍 Fetching market data from Yahoo Finance API...');
    
    const results: Record<string, MarketIndex> = {};
    
    // Fetch data for each market in parallel
    const fetchPromises = Object.entries(YAHOO_FINANCE_SYMBOLS).map(([regionName, symbol]) =>
      fetchYahooFinanceQuote(regionName, symbol)
    );

    const fetchedData = await Promise.allSettled(fetchPromises);
    
    let successCount = 0;
    fetchedData.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        results[result.value.regionName] = result.value;
        successCount++;
      }
    });

    if (successCount > 0) {
      console.log(`✅ Fetched ${successCount}/${Object.keys(YAHOO_FINANCE_SYMBOLS).length} indices from Yahoo Finance`);
      return results;
    }

    throw new Error('Failed to fetch any market data from Yahoo Finance');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Error fetching market data:', errorMsg);
    throw error;
  }
}

/**
 * Fetches a quote from Yahoo Finance API
 */
async function fetchYahooFinanceQuote(
  regionName: string,
  symbol: string
): Promise<MarketIndex | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price`;
    
    console.log(`📡 Fetching ${regionName} from Yahoo Finance: ${symbol}`);
    
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.data?.quoteSummary?.result?.[0]?.price) {
      const priceData = response.data.quoteSummary.result[0].price;
      
      const price = priceData.regularMarketPrice?.raw || 0;
      const change = priceData.regularMarketChange?.raw || 0;
      const changePercent = (priceData.regularMarketChangePercent?.raw || 0) * 100;

      if (price > 0) {
        console.log(`✅ ${regionName} (${symbol}): ${price.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);

        return {
          symbol,
          regionName,
          price,
          change,
          changePercent,
          isUp: changePercent >= 0,
          marketTime: new Date().toISOString(),
          isMarketOpen: true,
        };
      }
    }

    console.warn(`⚠️ No price data for ${regionName} from Yahoo Finance`);
    return null;
  } catch (error) {
    console.warn(`⚠️ Failed to fetch ${regionName}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Gets market indices with NO caching - always fresh data
 */
export async function getCachedMarketIndices(): Promise<Record<string, MarketIndex>> {
  console.log('🌐 Fetching fresh market data (no cache)...');
  try {
    const freshData = await getMarketIndices();
    console.log(`✅ Market data fetched successfully`);
    return freshData;
  } catch (error) {
    console.error('❌ Error fetching market data:', error);
    throw error;
  }
}
