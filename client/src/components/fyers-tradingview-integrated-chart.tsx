import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity, BarChart3 } from 'lucide-react';

declare global {
  interface Window {
    TradingView: any;
  }
}

// Fyers API symbols mapped to TradingView NSE symbols
const FYERS_TO_TRADINGVIEW_SYMBOLS = [
  { 
    fyersSymbol: 'NSE:NIFTY50-INDEX', 
    tradingViewSymbol: 'NSE:NIFTY', 
    label: 'NIFTY 50',
    description: 'NSE Nifty 50 Index'
  },
  { 
    fyersSymbol: 'NSE:RELIANCE-EQ', 
    tradingViewSymbol: 'NSE:RELIANCE', 
    label: 'RELIANCE',
    description: 'Reliance Industries Ltd'
  },
  { 
    fyersSymbol: 'NSE:INFY-EQ', 
    tradingViewSymbol: 'NSE:INFY', 
    label: 'INFOSYS',
    description: 'Infosys Limited'
  },
  { 
    fyersSymbol: 'NSE:TCS-EQ', 
    tradingViewSymbol: 'NSE:TCS', 
    label: 'TCS',
    description: 'Tata Consultancy Services'
  },
  { 
    fyersSymbol: 'NSE:HDFCBANK-EQ', 
    tradingViewSymbol: 'NSE:HDFCBANK', 
    label: 'HDFC BANK',
    description: 'HDFC Bank Limited'
  },
  { 
    fyersSymbol: 'NSE:ICICIBANK-EQ', 
    tradingViewSymbol: 'NSE:ICICIBANK', 
    label: 'ICICI BANK',
    description: 'ICICI Bank Limited'
  },
  { 
    fyersSymbol: 'NSE:SBIN-EQ', 
    tradingViewSymbol: 'NSE:SBIN', 
    label: 'SBI',
    description: 'State Bank of India'
  },
  { 
    fyersSymbol: 'NSE:LT-EQ', 
    tradingViewSymbol: 'NSE:LT', 
    label: 'L&T',
    description: 'Larsen & Toubro Limited'
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
  { value: '1W', label: '1W' },
];

interface FyersTradingViewIntegratedChartProps {
  height?: number;
  defaultSymbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
  showFyersData?: boolean;
}

export function FyersTradingViewIntegratedChart({
  height = 380,
  defaultSymbol = 'NSE:NIFTY50-INDEX',
  interval = '15',
  theme = 'light',
  showFyersData = true
}: FyersTradingViewIntegratedChartProps) {
  const container = useRef<HTMLDivElement>(null);
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);
  const [selectedInterval, setSelectedInterval] = useState(interval);
  const [isLoading, setIsLoading] = useState(true);

  // Get current symbol mapping
  const currentSymbolMapping = FYERS_TO_TRADINGVIEW_SYMBOLS.find(
    s => s.fyersSymbol === selectedSymbol
  ) || FYERS_TO_TRADINGVIEW_SYMBOLS[0];

  // Fetch Fyers API data for real-time info
  const { data: fyersData, isLoading: fyersLoading } = useQuery({
    queryKey: ['/api/live-quotes', selectedSymbol],
    enabled: showFyersData,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  useEffect(() => {
    if (!container.current) return;

    setIsLoading(true);
    
    // Clear previous widget
    container.current.innerHTML = '';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    const widgetConfig = {
      autosize: false,
      width: "100%",
      height: height - 120, // Account for controls and data display
      symbol: currentSymbolMapping.tradingViewSymbol,
      interval: selectedInterval,
      timezone: "Asia/Kolkata",
      theme: theme,
      style: "1",
      locale: "en",
      toolbar_bg: theme === 'light' ? "#f1f3f6" : "#2962FF",
      enable_publishing: false,
      allow_symbol_change: false, // We handle this with our controls
      studies: [
        "Volume@tv-basicstudies",
        "MASimple@tv-basicstudies"
      ],
      show_popup_button: true,
      popup_width: "1000",
      popup_height: "650",
      no_referral_id: false,
      withdateranges: true,
      hide_side_toolbar: false,
      details: true,
      hotlist: true,
      calendar: true,
      hide_legend: false,
      save_image: true,
      container_id: "fyers_tradingview_integrated_widget"
    };

    script.innerHTML = JSON.stringify(widgetConfig);

    script.onload = () => {
      setIsLoading(false);
    };

    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [selectedSymbol, selectedInterval, height, theme, currentSymbolMapping.tradingViewSymbol]);

  const handleSymbolChange = (fyersSymbol: string) => {
    setSelectedSymbol(fyersSymbol);
  };

  return (
    <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header with Symbol Info and Fyers Data */}
      <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">{currentSymbolMapping.label}</h3>
              <Badge variant="outline" className="text-xs">
                {currentSymbolMapping.tradingViewSymbol}
              </Badge>
            </div>
            
            {showFyersData && fyersData && !fyersLoading && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4 text-green-600" />
                  <span className="font-medium">₹{fyersData.ltp?.toFixed(2) || 'N/A'}</span>
                </div>
                {fyersData.change && (
                  <div className={`flex items-center gap-1 ${fyersData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className={`h-3 w-3 ${fyersData.change < 0 ? 'rotate-180' : ''}`} />
                    <span className="text-xs font-medium">
                      {fyersData.change >= 0 ? '+' : ''}{fyersData.change.toFixed(2)} 
                      ({fyersData.change_percentage >= 0 ? '+' : ''}{fyersData.change_percentage?.toFixed(2)}%)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Live Data
            </Badge>
            <Badge variant="outline" className="text-xs">
              TradingView Pro
            </Badge>
          </div>
        </div>
        
        <div className="text-xs text-gray-600">{currentSymbolMapping.description}</div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          {/* Symbol Selector */}
          <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FYERS_TO_TRADINGVIEW_SYMBOLS.map((symbol) => (
                <SelectItem key={symbol.fyersSymbol} value={symbol.fyersSymbol}>
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
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">
            {selectedInterval} • Asia/Kolkata
          </span>
        </div>
      </div>

      {/* TradingView Chart Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div className="text-sm text-gray-500">Loading TradingView chart...</div>
            </div>
          </div>
        )}
        
        <div 
          ref={container} 
          className="tradingview-widget-container w-full"
          style={{ height: height - 120 }}
        />
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span>🚀 Powered by Fyers API + TradingView</span>
            {showFyersData && (
              <span className="text-green-600">• Real-time NSE Data</span>
            )}
          </div>
          <a 
            href={`https://www.tradingview.com/symbols/${currentSymbolMapping.tradingViewSymbol.replace(':', '-')}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View Full Chart →
          </a>
        </div>
      </div>
    </div>
  );
}