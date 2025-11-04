import { useState, useEffect } from "react";

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isUp: boolean;
  timestamp: number;
}

export interface MarketsByRegion {
  USA: MarketData;
  CANADA: MarketData;
  INDIA: MarketData;
  TOKYO: MarketData;
  "HONG KONG": MarketData;
  ASIA: MarketData;
}

// Mock function to simulate fetching market data
// Replace this with real API calls to your market data provider
const fetchMarketData = async (): Promise<MarketsByRegion> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Mock data - replace with actual API calls
  // You can use Alpha Vantage, Yahoo Finance API, or other financial data providers
  const mockData: MarketsByRegion = {
    USA: {
      symbol: "^GSPC",
      name: "S&P 500",
      price: 4783.45 + (Math.random() * 100 - 50),
      change: Math.random() * 40 - 20,
      changePercent: Math.random() * 2 - 1,
      isUp: Math.random() > 0.5,
      timestamp: Date.now(),
    },
    CANADA: {
      symbol: "^GSPTSE",
      name: "TSX Composite",
      price: 21500 + (Math.random() * 100 - 50),
      change: Math.random() * 40 - 20,
      changePercent: Math.random() * 2 - 1,
      isUp: Math.random() > 0.5,
      timestamp: Date.now(),
    },
    INDIA: {
      symbol: "^NSEI",
      name: "NIFTY 50",
      price: 21500 + (Math.random() * 100 - 50),
      change: Math.random() * 100 - 50,
      changePercent: Math.random() * 2 - 1,
      isUp: Math.random() > 0.5,
      timestamp: Date.now(),
    },
    TOKYO: {
      symbol: "^N225",
      name: "Nikkei 225",
      price: 33500 + (Math.random() * 100 - 50),
      change: Math.random() * 200 - 100,
      changePercent: Math.random() * 2 - 1,
      isUp: Math.random() > 0.5,
      timestamp: Date.now(),
    },
    "HONG KONG": {
      symbol: "^HSI",
      name: "Hang Seng",
      price: 17000 + (Math.random() * 100 - 50),
      change: Math.random() * 150 - 75,
      changePercent: Math.random() * 2 - 1,
      isUp: Math.random() > 0.5,
      timestamp: Date.now(),
    },
    ASIA: {
      symbol: "^STI",
      name: "Straits Times",
      price: 3200 + (Math.random() * 50 - 25),
      change: Math.random() * 30 - 15,
      changePercent: Math.random() * 2 - 1,
      isUp: Math.random() > 0.5,
      timestamp: Date.now(),
    },
  };

  // Calculate isUp based on change
  Object.keys(mockData).forEach((key) => {
    const market = mockData[key as keyof MarketsByRegion];
    market.isUp = market.change > 0;
  });

  return mockData;
};

// Example of how to integrate with a real API:
/*
const fetchRealMarketData = async (): Promise<MarketsByRegion> => {
  // Using Alpha Vantage API (requires API key)
  const apiKey = 'YOUR_API_KEY';
  
  const symbols = {
    USA: 'SPY', // S&P 500 ETF
    CANADA: 'EWC', // iShares MSCI Canada ETF
    INDIA: 'INDA', // iShares MSCI India ETF
    TOKYO: 'EWJ', // iShares MSCI Japan ETF
    'HONG KONG': 'EWH', // iShares MSCI Hong Kong ETF
    ASIA: 'AAXJ' // iShares MSCI All Country Asia ex Japan ETF
  };

  const responses = await Promise.all(
    Object.entries(symbols).map(async ([region, symbol]) => {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
      );
      const data = await response.json();
      const quote = data['Global Quote'];
      
      return {
        region,
        data: {
          symbol: quote['01. symbol'],
          name: region,
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
          isUp: parseFloat(quote['09. change']) > 0,
          timestamp: Date.now()
        }
      };
    })
  );

  return responses.reduce((acc, { region, data }) => {
    acc[region as keyof MarketsByRegion] = data;
    return acc;
  }, {} as MarketsByRegion);
};
*/

export const useMarketData = (refreshInterval: number = 60000) => {
  const [marketData, setMarketData] = useState<MarketsByRegion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const data = await fetchMarketData();
      setMarketData(data);
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch market data"
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up polling for real-time updates
    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { marketData, loading, error, refresh: fetchData };
};
