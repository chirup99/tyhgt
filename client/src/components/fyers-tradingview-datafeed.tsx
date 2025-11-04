import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity, BarChart3, RefreshCw } from 'lucide-react';

// Fyers symbols for chart data
const FYERS_SYMBOLS = [
  { 
    value: 'NSE:NIFTY50-INDEX', 
    label: 'NIFTY 50',
    display: 'NIFTY 50'
  },
  { 
    value: 'NSE:RELIANCE-EQ', 
    label: 'RELIANCE',
    display: 'Reliance Industries'
  },
  { 
    value: 'NSE:INFY-EQ', 
    label: 'INFOSYS',
    display: 'Infosys Limited'
  },
  { 
    value: 'NSE:TCS-EQ', 
    label: 'TCS',
    display: 'Tata Consultancy Services'
  },
  { 
    value: 'NSE:HDFCBANK-EQ', 
    label: 'HDFC BANK',
    display: 'HDFC Bank Limited'
  },
  { 
    value: 'NSE:ICICIBANK-EQ', 
    label: 'ICICI BANK',
    display: 'ICICI Bank Limited'
  },
  { 
    value: 'NSE:SBIN-EQ', 
    label: 'SBI',
    display: 'State Bank of India'
  },
];

const TIMEFRAMES = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '30', label: '30m' },
  { value: '60', label: '1h' },
  { value: '240', label: '4h' },
  { value: '1D', label: '1D' },
];

interface FyersTradingViewDatafeedProps {
  height?: number;
  defaultSymbol?: string;
  interval?: string;
}

export function FyersTradingViewDatafeed({
  height = 400,
  defaultSymbol = 'NSE:NIFTY50-INDEX',
  interval = '15'
}: FyersTradingViewDatafeedProps) {
  const chartContainer = useRef<HTMLDivElement>(null);
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);
  const [selectedInterval, setSelectedInterval] = useState(interval);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Get current symbol info
  const currentSymbol = FYERS_SYMBOLS.find(s => s.value === selectedSymbol) || FYERS_SYMBOLS[0];

  // Fetch historical data from Fyers API using the same working endpoint as Trading Charts tab
  const { data: historicalData, isLoading, refetch, error } = useQuery({
    queryKey: ['historical-data', selectedSymbol, selectedInterval, lastUpdate.toISOString().split('T')[0]],
    queryFn: async () => {
      console.log(`📊 Fetching chart data for ${selectedSymbol} (${selectedInterval})`);
      
      const requestBody = {
        symbol: selectedSymbol,
        resolution: selectedInterval === '1D' ? 'D' : selectedInterval,
        range_from: lastUpdate.toISOString().split('T')[0],
        range_to: lastUpdate.toISOString().split('T')[0]
      };
      
      const response = await fetch('/api/historical-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch historical data: ${response.status}`);
      }

      return response.json();
    },
    refetchInterval: selectedInterval === '1' ? 60000 : 300000, // Refresh frequently for short timeframes
    retry: 2,
  });

  // Fetch live quotes from Fyers API with better error handling
  const { data: liveQuotes, error: liveQuotesError } = useQuery({
    queryKey: ['/api/market-data'], // Use the working market data endpoint instead
    refetchInterval: 10000, // Refresh every 10 seconds
    enabled: true,
    retry: 1,
  });

  // Type-safe access to live quotes data and find our symbol
  const liveData = liveQuotes?.find((item: any) => 
    item.symbol === selectedSymbol.split(':')[1]?.split('-')[0] || 
    item.code === selectedSymbol
  ) as any;

  // Custom TradingView-style chart using canvas
  useEffect(() => {
    if (!chartContainer.current || !historicalData?.candles) return;

    const canvas = chartContainer.current.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) {
      const newCanvas = document.createElement('canvas');
      newCanvas.width = chartContainer.current.clientWidth;
      newCanvas.height = height - 120;
      chartContainer.current.appendChild(newCanvas);
      drawChart(newCanvas, historicalData.candles);
    } else {
      canvas.width = chartContainer.current.clientWidth;
      canvas.height = height - 120;
      drawChart(canvas, historicalData.candles);
    }
  }, [historicalData, height]);

  const drawChart = (canvas: HTMLCanvasElement, candles: any[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !candles.length) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 60, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Find price range
    const prices = candles.flatMap(c => [c.open, c.high, c.low, c.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight * i / 5);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      // Price labels
      const price = maxPrice - (priceRange * i / 5);
      ctx.fillStyle = '#666';
      ctx.font = '11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(2), width - padding.right + 5, y + 4);
    }

    // Vertical grid lines
    const visibleCandles = Math.min(candles.length, 100); // Show last 100 candles
    const candleWidth = chartWidth / visibleCandles;
    
    for (let i = 0; i < visibleCandles; i += Math.ceil(visibleCandles / 8)) {
      const x = padding.left + (i * candleWidth);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }

    // Draw candlesticks
    const startIndex = Math.max(0, candles.length - visibleCandles);
    
    for (let i = startIndex; i < candles.length; i++) {
      const candle = candles[i];
      const x = padding.left + ((i - startIndex) * candleWidth);
      const centerX = x + candleWidth / 2;
      
      // Calculate Y positions
      const highY = padding.top + ((maxPrice - candle.high) / priceRange) * chartHeight;
      const lowY = padding.top + ((maxPrice - candle.low) / priceRange) * chartHeight;
      const openY = padding.top + ((maxPrice - candle.open) / priceRange) * chartHeight;
      const closeY = padding.top + ((maxPrice - candle.close) / priceRange) * chartHeight;
      
      const isGreen = candle.close >= candle.open;
      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      const bodyHeight = bodyBottom - bodyTop;
      
      // Draw wick
      ctx.strokeStyle = isGreen ? '#26a69a' : '#ef5350';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, highY);
      ctx.lineTo(centerX, lowY);
      ctx.stroke();
      
      // Draw body
      ctx.fillStyle = isGreen ? '#26a69a' : '#ef5350';
      ctx.fillRect(x + 1, bodyTop, candleWidth - 2, Math.max(1, bodyHeight));
      
      // Draw body border
      ctx.strokeStyle = isGreen ? '#26a69a' : '#ef5350';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, bodyTop, candleWidth - 2, Math.max(1, bodyHeight));
    }

    // Draw volume at bottom (simplified)
    if (candles.length > 0) {
      const maxVolume = Math.max(...candles.map(c => c.volume || 0));
      const volumeHeight = 30;
      const volumeY = height - padding.bottom;
      
      for (let i = startIndex; i < candles.length; i++) {
        const candle = candles[i];
        const x = padding.left + ((i - startIndex) * candleWidth);
        const volume = candle.volume || 0;
        const barHeight = (volume / maxVolume) * volumeHeight;
        
        ctx.fillStyle = candle.close >= candle.open ? '#26a69a' : '#ef5350';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(x + 1, volumeY - barHeight, candleWidth - 2, barHeight);
        ctx.globalAlpha = 1;
      }
    }

    // Draw title and info
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${currentSymbol.display}`, padding.left, 15);
    
    // Draw latest price and info
    if (candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      ctx.fillStyle = lastCandle.close >= lastCandle.open ? '#26a69a' : '#ef5350';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`₹${lastCandle.close.toFixed(2)}`, padding.left + 200, 15);
      
      // Show timeframe
      ctx.fillStyle = '#666';
      ctx.font = '10px Arial';
      ctx.fillText(`${selectedInterval} • ${candles.length} candles`, padding.left + 320, 15);
    } else {
      // Show no data message
      ctx.fillStyle = '#999';
      ctx.font = '12px Arial';
      ctx.fillText('No chart data available', padding.left + 200, 15);
    }
  };

  const handleRefresh = () => {
    setLastUpdate(new Date());
    refetch();
  };

  return (
    <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Fyers Chart Data</h3>
            </div>
            
            {liveData ? (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4 text-green-600" />
                  <span className="font-medium">₹{liveData.ltp?.toFixed(2) || 'N/A'}</span>
                </div>
                {liveData.change !== undefined && (
                  <div className={`flex items-center gap-1 ${liveData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className={`h-3 w-3 ${liveData.change < 0 ? 'rotate-180' : ''}`} />
                    <span className="text-xs font-medium">
                      {liveData.change >= 0 ? '+' : ''}{liveData.change.toFixed(2)} 
                      ({liveData.changePercent >= 0 ? '+' : ''}{liveData.changePercent?.toFixed(2)}%)
                    </span>
                  </div>
                )}
              </div>
            ) : liveQuotesError ? (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <Activity className="h-4 w-4" />
                <span>Live data temporarily unavailable</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Activity className="h-4 w-4 animate-pulse" />
                <span>Loading live data...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">Fyers API</Badge>
            <Badge variant="outline">Real-time</Badge>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          {/* Symbol Selector */}
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FYERS_SYMBOLS.map((symbol) => (
                <SelectItem key={symbol.value} value={symbol.value}>
                  {symbol.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Timeframe Buttons */}
          <div className="flex gap-1">
            {TIMEFRAMES.map((timeframe) => (
              <Button
                key={timeframe.value}
                variant={selectedInterval === timeframe.value ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setSelectedInterval(timeframe.value)}
              >
                {timeframe.label}
              </Button>
            ))}
          </div>

          {/* Refresh Button */}
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>{selectedInterval} • NSE • Asia/Kolkata</span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div className="text-sm text-gray-500">Loading Fyers data...</div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="text-sm text-red-500">Chart data temporarily unavailable</div>
              <div className="text-xs text-gray-500">Rate limited or connectivity issue</div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        )}

        <div 
          ref={chartContainer} 
          className="w-full bg-white"
          style={{ height: height - 120 }}
        />
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span>🚀 100% Fyers API Data</span>
            <span>• TradingView-style Interface</span>
            {historicalData?.candles && (
              <span>• {historicalData.candles.length} candles</span>
            )}
          </div>
          <span className="text-green-600">Real-time NSE Data</span>
        </div>
      </div>
    </div>
  );
}