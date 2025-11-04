import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createChart, ColorType, CandlestickData, Time } from 'lightweight-charts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface HistoricalDataResponse {
  symbol: string;
  resolution: string;
  range_from: string;
  range_to: string;
  candles: CandleData[];
}

const timeframes = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '30', label: '30m' },
  { value: '60', label: '1h' },
  { value: '1D', label: '1D' },
];

const symbols = [
  { value: 'NSE:NIFTY50-INDEX', label: 'NIFTY 50' },
  { value: 'NSE:INFY-EQ', label: 'INFOSYS' },
  { value: 'NSE:RELIANCE-EQ', label: 'RELIANCE' },
  { value: 'NSE:TCS-EQ', label: 'TCS' },
];

interface FyersTradingViewChartProps {
  height?: number;
  symbol?: string;
  timeframe?: string;
}

export function FyersTradingViewChart({ 
  height = 380, 
  symbol: initialSymbol = 'NSE:NIFTY50-INDEX',
  timeframe: initialTimeframe = '15'
}: FyersTradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);

  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [selectedTimeframe, setSelectedTimeframe] = useState(initialTimeframe);
  const [fromDate, setFromDate] = useState<Date | undefined>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // 7 days ago
  const [toDate, setToDate] = useState<Date | undefined>(new Date());

  // Fetch historical data from Fyers API
  const { data: historicalData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/historical-data', selectedSymbol, selectedTimeframe, fromDate, toDate],
    enabled: !!fromDate && !!toDate,
    refetchInterval: selectedTimeframe === '1' ? 60000 : undefined, // Refresh every minute for 1m timeframe
  });

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      rightPriceScale: {
        borderColor: '#cccccc',
      },
      timeScale: {
        borderColor: '#cccccc',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
    });

    const candlestickSeries = chart.addSeries('Candlestick', {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [height]);

  // Update chart data
  useEffect(() => {
    if (!candlestickSeriesRef.current || !historicalData || !Array.isArray((historicalData as HistoricalDataResponse).candles)) return;

    const response = historicalData as HistoricalDataResponse;
    const chartData: CandlestickData[] = response.candles.map((candle: CandleData) => ({
      time: (candle.timestamp / 1000) as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    candlestickSeriesRef.current.setData(chartData);

    // Fit content to show all data
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [historicalData]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="w-full h-full bg-white border border-gray-200 rounded-lg">
      {/* TradingView-style Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          {/* Symbol Selector */}
          <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {symbols.map((symbol) => (
                <SelectItem key={symbol.value} value={symbol.value}>
                  {symbol.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Timeframe Selector */}
          <div className="flex gap-1">
            {timeframes.map((timeframe) => (
              <Button
                key={timeframe.value}
                variant={selectedTimeframe === timeframe.value ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => handleTimeframeChange(timeframe.value)}
              >
                {timeframe.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-32 justify-start text-left font-normal",
                    !fromDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {fromDate ? format(fromDate, "MMM dd") : <span>From</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-32 justify-start text-left font-normal",
                    !toDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {toDate ? format(toDate, "MMM dd") : <span>To</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Refresh Button */}
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            ↻
          </Button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="text-sm text-gray-500">Loading chart data...</div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="text-sm text-red-500">Failed to load chart data</div>
          </div>
        )}

        <div ref={chartContainerRef} className="w-full" style={{ height: height }} />
      </div>

      {/* Footer with data info */}
      {historicalData && (
        <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
          <div className="flex justify-between items-center">
            <span>
              {(historicalData as HistoricalDataResponse).symbol} • {selectedTimeframe} • {(historicalData as HistoricalDataResponse).candles?.length || 0} candles
            </span>
            <span className="text-green-600 font-medium">
              Powered by Fyers API
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default FyersTradingViewChart;