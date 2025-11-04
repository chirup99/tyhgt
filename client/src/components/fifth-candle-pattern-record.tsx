import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Target, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface PatternTriggerRecord {
  id: string;
  timestamp: string;
  timeframe: number;
  symbol: string;
  uptrendPattern: {
    type: string;
    pointA: { price: number; time: string; candle: string };
    pointB: { price: number; time: string; candle: string };
    slope: number;
    extendedLevel: number;
    triggered: boolean;
    triggerStrength?: number;
  } | null;
  downtrendPattern: {
    type: string;
    pointA: { price: number; time: string; candle: string };
    pointB: { price: number; time: string; candle: string };
    slope: number;
    extendedLevel: number;
    triggered: boolean;
    triggerStrength?: number;
  } | null;
  fifthCandleHigh: number;
  fifthCandleLow: number;
  winningPattern: 'uptrend' | 'downtrend' | 'both' | 'none';
  triggerType: string;
  accuracy: number;
}

interface FifthCandlePatternRecordProps {
  symbol: string;
  date: string;
  patternAnalysis?: any;
  fifthCandleData?: any;
  currentTimeframe?: number;
}

export function FifthCandlePatternRecord({ 
  symbol, 
  date, 
  patternAnalysis, 
  fifthCandleData, 
  currentTimeframe 
}: FifthCandlePatternRecordProps) {
  const [triggerRecords, setTriggerRecords] = useState<PatternTriggerRecord[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Debug: Always show the component
  console.log('🎯 Record Component Rendered:', { symbol, date, currentTimeframe });

  // Monitor for 5th candle completion and pattern triggers
  useEffect(() => {
    if (patternAnalysis && fifthCandleData && currentTimeframe) {
      analyzePatternTriggers();
    }
  }, [patternAnalysis, fifthCandleData, currentTimeframe]);

  const analyzePatternTriggers = () => {
    if (!patternAnalysis?.pointABData || !fifthCandleData) return;

    const { uptrend, downtrend } = patternAnalysis.pointABData;
    
    // Check if patterns exist
    if (!uptrend && !downtrend) return;

    // Analyze 5th candle triggers
    const uptrendTriggered = uptrend && fifthCandleData.high > uptrend.pointB.price;
    const downtrendTriggered = downtrend && fifthCandleData.low < downtrend.pointB.price;

    let winningPattern: 'uptrend' | 'downtrend' | 'both' | 'none' = 'none';
    let triggerType = 'No trigger';

    if (uptrendTriggered && downtrendTriggered) {
      winningPattern = 'both';
      triggerType = 'Dual trigger - conflict';
    } else if (uptrendTriggered) {
      winningPattern = 'uptrend';
      triggerType = `5th Up${uptrend.patternLabel} (${currentTimeframe}min)`;
    } else if (downtrendTriggered) {
      winningPattern = 'downtrend';
      triggerType = `5th Down${downtrend.patternLabel} (${currentTimeframe}min)`;
    }

    // Calculate accuracy
    const calculateAccuracy = (pattern: any, actual: number, isUptrend: boolean) => {
      if (!pattern) return 0;
      const predicted = pattern.pointB.price;
      const difference = Math.abs(predicted - actual);
      const percentageError = (difference / predicted) * 100;
      return Math.max(0, 100 - percentageError);
    };

    const accuracy = winningPattern === 'uptrend' 
      ? calculateAccuracy(uptrend, fifthCandleData.high, true)
      : winningPattern === 'downtrend'
      ? calculateAccuracy(downtrend, fifthCandleData.low, false)
      : winningPattern === 'both'
      ? Math.max(
          calculateAccuracy(uptrend, fifthCandleData.high, true),
          calculateAccuracy(downtrend, fifthCandleData.low, false)
        )
      : 0;

    const newRecord: PatternTriggerRecord = {
      id: `${symbol}_${currentTimeframe}_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN'),
      timeframe: currentTimeframe || 0,
      symbol,
      uptrendPattern: uptrend ? {
        type: uptrend.patternLabel,
        pointA: uptrend.pointA,
        pointB: uptrend.pointB,
        slope: uptrend.slope,
        extendedLevel: uptrend.pointB.price,
        triggered: uptrendTriggered,
        triggerStrength: uptrendTriggered ? Math.abs(fifthCandleData.high - uptrend.pointB.price) : 0
      } : null,
      downtrendPattern: downtrend ? {
        type: downtrend.patternLabel,
        pointA: downtrend.pointA,
        pointB: downtrend.pointB,
        slope: downtrend.slope,
        extendedLevel: downtrend.pointB.price,
        triggered: downtrendTriggered,
        triggerStrength: downtrendTriggered ? Math.abs(fifthCandleData.low - downtrend.pointB.price) : 0
      } : null,
      fifthCandleHigh: fifthCandleData.high,
      fifthCandleLow: fifthCandleData.low,
      winningPattern,
      triggerType,
      accuracy: Math.round(accuracy * 10) / 10
    };

    setTriggerRecords(prev => [newRecord, ...prev.slice(0, 19)]); // Keep last 20 records
  };

  const clearRecords = () => {
    setTriggerRecords([]);
  };

  const getTriggerBadgeColor = (winningPattern: string) => {
    switch (winningPattern) {
      case 'uptrend': return 'bg-green-100 text-green-800 border-green-300';
      case 'downtrend': return 'bg-red-100 text-red-800 border-red-300';
      case 'both': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTriggerIcon = (winningPattern: string) => {
    switch (winningPattern) {
      case 'uptrend': return <TrendingUp className="w-3 h-3" />;
      case 'downtrend': return <TrendingDown className="w-3 h-3" />;
      case 'both': return <Target className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  return (
    <Card className="h-full mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-500" />
            5th Candle Pattern Records (Debug: Always Show)
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {triggerRecords.length} Records
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearRecords}
              className="text-xs h-7"
            >
              Clear
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Real-time 5th candle trigger validation using Point A/B Analysis (4 Candle Rule)
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] p-4">
          {triggerRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">5th Candle Pattern Record - Ready</p>
              <p className="text-xs mt-1">Symbol: {symbol} | Date: {date} | Timeframe: {currentTimeframe || 'Not set'}min</p>
              <p className="text-xs mt-1">Pattern analysis and 5th candle trigger detection will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {triggerRecords.map((record, index) => (
                <div key={record.id} className="border rounded-lg p-3 bg-card">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getTriggerBadgeColor(record.winningPattern)}`}>
                        {getTriggerIcon(record.winningPattern)}
                        {record.triggerType}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {record.timeframe}min
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={record.accuracy > 80 ? "default" : record.accuracy > 60 ? "secondary" : "destructive"} className="text-xs">
                        {record.accuracy.toFixed(1)}% Acc
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {record.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Pattern Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Uptrend Pattern */}
                    {record.uptrendPattern && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="font-medium">Up-{record.uptrendPattern.type}</span>
                          {record.uptrendPattern.triggered && (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                        <div className="text-muted-foreground pl-5">
                          <div>A: {record.uptrendPattern.pointA.price} ({record.uptrendPattern.pointA.candle})</div>
                          <div>B: {record.uptrendPattern.pointB.price} ({record.uptrendPattern.pointB.candle})</div>
                          <div>Slope: {record.uptrendPattern.slope.toFixed(2)}</div>
                          {record.uptrendPattern.triggered && (
                            <div className="text-green-600 font-medium">
                              Triggered: {record.fifthCandleHigh} (+{record.uptrendPattern.triggerStrength?.toFixed(1)})
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Downtrend Pattern */}
                    {record.downtrendPattern && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-3 h-3 text-red-500" />
                          <span className="font-medium">Down-{record.downtrendPattern.type}</span>
                          {record.downtrendPattern.triggered && (
                            <CheckCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        <div className="text-muted-foreground pl-5">
                          <div>A: {record.downtrendPattern.pointA.price} ({record.downtrendPattern.pointA.candle})</div>
                          <div>B: {record.downtrendPattern.pointB.price} ({record.downtrendPattern.pointB.candle})</div>
                          <div>Slope: {record.downtrendPattern.slope.toFixed(2)}</div>
                          {record.downtrendPattern.triggered && (
                            <div className="text-red-600 font-medium">
                              Triggered: {record.fifthCandleLow} ({record.downtrendPattern.triggerStrength?.toFixed(1)})
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 5th Candle Summary */}
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>5th Candle: H:{record.fifthCandleHigh} L:{record.fifthCandleLow}</span>
                    <span>Result: {record.winningPattern === 'none' ? 'No trigger' : `${record.winningPattern} won`}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}