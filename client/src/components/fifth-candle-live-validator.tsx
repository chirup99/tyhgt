import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PlayCircle, Square, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface FifthCandleLiveData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isComplete: boolean;
  remainingTime: number;
  completionPercentage: number;
}

interface FifthCandleUpdateMessage {
  type: 'fifth_candle_live_update';
  timestamp: string;
  symbol: string;
  timeframe: number;
  currentPrice: number;
  marketTime: string;
  fifthCandle: FifthCandleLiveData;
}

export function FifthCandleLiveValidator() {
  const [isValidating, setIsValidating] = useState(false);
  const [fifthCandleData, setFifthCandleData] = useState<FifthCandleLiveData | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [marketTime, setMarketTime] = useState<string>('');
  const [symbol, setSymbol] = useState<string>('NSE:NIFTY50-INDEX');
  const [timeframe, setTimeframe] = useState<number>(5);
  const [error, setError] = useState<string>('');
  const [ws, setWs] = useState<WebSocket | null>(null);

  // WebSocket connection for live updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('🎯 5th Candle WebSocket connected for live validation');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'fifth_candle_live_update') {
          const updateMessage = message as FifthCandleUpdateMessage;
          setFifthCandleData(updateMessage.fifthCandle);
          setCurrentPrice(updateMessage.currentPrice);
          setMarketTime(updateMessage.marketTime);
          setSymbol(updateMessage.symbol);
          setTimeframe(updateMessage.timeframe);
        }
        
        if (message.type === 'fifth_candle_validation_started') {
          console.log(`🎯 5th candle validation started: ${message.symbol} (${message.timeframe}min)`);
        }
        
        if (message.type === 'fifth_candle_validation_stopped') {
          console.log('🛑 5th candle validation completed');
          setIsValidating(false);
          setFifthCandleData(null);
        }
        
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection failed');
    };

    socket.onclose = () => {
      console.log('🎯 5th Candle WebSocket disconnected');
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  const startFifthCandleValidation = async () => {
    try {
      setError('');
      
      // For demo, use current time as 5th candle start time
      const currentTime = Math.floor(Date.now() / 1000);
      
      const response = await fetch('/api/cycle3/start-fifth-candle-validation', {
        method: 'POST',
        body: JSON.stringify({
          symbol: 'NSE:NIFTY50-INDEX',
          timeframeMinutes: 5,
          fifthCandleStartTime: currentTime
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => res.json());

      if (response.success) {
        setIsValidating(true);
        console.log('🎯 5th candle live validation started:', response.validationStatus);
      } else {
        setError(response.error || 'Failed to start 5th candle validation');
      }
    } catch (error) {
      console.error('Error starting 5th candle validation:', error);
      setError('Failed to start 5th candle validation');
    }
  };

  const stopFifthCandleValidation = async () => {
    try {
      setError('');
      
      const response = await fetch('/api/cycle3/stop-fifth-candle-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => res.json());

      if (response.success) {
        setIsValidating(false);
        setFifthCandleData(null);
        console.log('🛑 5th candle validation stopped');
      } else {
        setError(response.error || 'Failed to stop 5th candle validation');
      }
    } catch (error) {
      console.error('Error stopping 5th candle validation:', error);
      setError('Failed to stop 5th candle validation');
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPrice = (price: number): string => {
    return `₹${price.toFixed(2)}`;
  };

  const getPriceChangeColor = (current: number, open: number): string => {
    if (current > open) return 'text-green-600';
    if (current < open) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPriceChangeIcon = (current: number, open: number) => {
    if (current > open) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < open) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          5th Candle Live Validator
        </CardTitle>
        <CardDescription>
          Real-time OHLC streaming for 5th candle validation at 700ms intervals
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isValidating ? (
            <Button onClick={startFifthCandleValidation} className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Start 5th Candle Validation
            </Button>
          ) : (
            <Button 
              onClick={stopFifthCandleValidation} 
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop Validation
            </Button>
          )}
          
          {isValidating && (
            <Badge variant="outline" className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              Live Streaming (700ms)
            </Badge>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="text-red-600 text-sm p-2 bg-red-50 rounded border border-red-200">
            {error}
          </div>
        )}

        {/* Market Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium">{symbol}</span>
          </div>
          <div className="text-sm text-gray-600">
            Market Time: {marketTime}
          </div>
        </div>

        {/* 5th Candle Live Data */}
        {isValidating && fifthCandleData ? (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">5th Candle Progress ({timeframe}min)</span>
                <span className="text-sm text-gray-600">
                  {formatTime(fifthCandleData.remainingTime)} remaining
                </span>
              </div>
              <Progress value={fifthCandleData.completionPercentage} className="h-2" />
              <div className="text-xs text-center text-gray-500">
                {fifthCandleData.completionPercentage.toFixed(1)}% complete
              </div>
            </div>

            {/* Live OHLC Data */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-xs text-gray-600 mb-1">OPEN</div>
                <div className="font-semibold">{formatPrice(fifthCandleData.open)}</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-xs text-gray-600 mb-1">HIGH</div>
                <div className="font-semibold text-green-600">
                  {formatPrice(fifthCandleData.high)}
                </div>
              </div>
              
              <div className="text-center p-3 bg-red-50 rounded">
                <div className="text-xs text-gray-600 mb-1">LOW</div>
                <div className="font-semibold text-red-600">
                  {formatPrice(fifthCandleData.low)}
                </div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded">
                <div className="text-xs text-gray-600 mb-1">CLOSE (LIVE)</div>
                <div className={`font-semibold flex items-center justify-center gap-1 ${getPriceChangeColor(fifthCandleData.close, fifthCandleData.open)}`}>
                  {getPriceChangeIcon(fifthCandleData.close, fifthCandleData.open)}
                  {formatPrice(fifthCandleData.close)}
                </div>
              </div>
            </div>

            {/* Price Change Summary */}
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm font-medium mb-2">5th Candle Analysis</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Range: </span>
                  <span className="font-medium">
                    {formatPrice(fifthCandleData.high - fifthCandleData.low)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Change: </span>
                  <span className={`font-medium ${getPriceChangeColor(fifthCandleData.close, fifthCandleData.open)}`}>
                    {formatPrice(Math.abs(fifthCandleData.close - fifthCandleData.open))}
                    ({((fifthCandleData.close - fifthCandleData.open) / fifthCandleData.open * 100).toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="text-center">
              <Badge 
                variant={fifthCandleData.isComplete ? "default" : "secondary"}
                className="px-3 py-1"
              >
                {fifthCandleData.isComplete ? "5th Candle Complete" : "5th Candle In Progress"}
              </Badge>
            </div>
          </div>
        ) : isValidating ? (
          <div className="text-center py-8 text-gray-500">
            Waiting for 5th candle data...
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            Start validation to begin live 5th candle monitoring
          </div>
        )}
      </CardContent>
    </Card>
  );
}