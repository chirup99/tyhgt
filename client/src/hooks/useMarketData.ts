import { useState, useEffect } from "react";

export interface MarketDataResponse {
  [key: string]: {
    isUp: boolean;
    change: number;
  };
}

export function useMarketData(refreshInterval: number = 60000) {
  const [marketData, setMarketData] = useState<MarketDataResponse>({
    USA: { isUp: true, change: 1.2 },
    INDIA: { isUp: true, change: 0.8 },
    TOKYO: { isUp: false, change: -0.5 },
    "HONG KONG": { isUp: true, change: 0.3 },
    ASIA: { isUp: true, change: 0.6 },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate market data updates
    const interval = setInterval(() => {
      setMarketData({
        USA: { isUp: Math.random() > 0.5, change: Math.random() * 2 - 1 },
        INDIA: { isUp: Math.random() > 0.5, change: Math.random() * 2 - 1 },
        TOKYO: { isUp: Math.random() > 0.5, change: Math.random() * 2 - 1 },
        "HONG KONG": { isUp: Math.random() > 0.5, change: Math.random() * 2 - 1 },
        ASIA: { isUp: Math.random() > 0.5, change: Math.random() * 2 - 1 },
      });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { marketData, loading };
}
