import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  Clock, 
  Zap, 
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  RefreshCw,
  Calendar,
  DollarSign,
  Timer,
  LineChart
} from 'lucide-react';

interface ValidTrade {
  symbol: string;
  date: string;
  timeframe: string;
  pattern: string;
  pointA: {
    price: number;
    timestamp: string;
    candle: string;
  };
  pointB: {
    price: number;
    timestamp: string;
    candle: string;
  };
  slope: {
    value: number;
    direction: 'uptrend' | 'downtrend';
    duration: number;
  };
  timingRules: {
    rule50Percent: {
      required: number;
      actual: number;
      valid: boolean;
    };
    rule34Percent: {
      required: number;
      actual: number;
      valid: boolean;
    };
  };
  triggerPoint: {
    price: number;
    timestamp: string;
    candle: string;
  };
  exitPoint: {
    price: number;
    timestamp: string;
    method: string;
  };
  tRule: {
    applied: boolean;
    c3Block: any[];
    prediction: any;
  };
  mini4Rule: {
    applied: boolean;
    c2Block: any[];
    c3aPrediction: any;
  };
  profitLoss: number;
  confidence: number;
}

interface CompleteBattuScannerProps {}

export default function CompleteBattuScanner({}: CompleteBattuScannerProps) {
  const [selectedSymbol, setSelectedSymbol] = useState('NSE:NIFTY50-INDEX');
  const [selectedDate, setSelectedDate] = useState('2025-07-28');
  const [selectedTimeframe, setSelectedTimeframe] = useState('10');
  const [isScanning, setIsScanning] = useState(false);
  const [validTrades, setValidTrades] = useState<ValidTrade[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  // Complete Battu Scanner Mutation
  const completeScanMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest({
        url: '/api/battu-scan/complete-scanner',
        method: 'POST',
        body: {
          symbol: selectedSymbol,
          date: selectedDate,
          timeframe: selectedTimeframe,
          includeTimingRules: true,
          includeTRule: true,
          includeMini4Rule: true,
          marketOpenToClose: true
        }
      });
      return response;
    },
    onSuccess: (data) => {
      setValidTrades(data.validTrades || []);
      setIsScanning(false);
      setScanProgress(100);
      setCurrentStep('Scan completed');
    },
    onError: (error) => {
      console.error('Complete scan failed:', error);
      setIsScanning(false);
      setCurrentStep('Scan failed');
    }
  });

  // Simplified complete analysis using direct complete scanner endpoint
  const runCompleteAnalysis = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setCurrentStep('Running complete Battu scanner...');
    setValidTrades([]);

    try {
      // Use the complete scanner directly
      await completeScanMutation.mutateAsync();
      setScanProgress(100);
      setCurrentStep('Analysis completed successfully');
      
    } catch (error) {
      console.error('Analysis failed:', error);
      setCurrentStep('Analysis failed - Check API endpoints');
    } finally {
      setIsScanning(false);
    }
  };

  // Compile valid trades from all analysis steps
  const compileValidTrades = (analysisResults: any): ValidTrade[] => {
    const { slopeData, pointABData, tRuleData, mini4Data, breakoutData } = analysisResults;
    const validTrades: ValidTrade[] = [];

    if (slopeData?.slopes) {
      slopeData.slopes.forEach((slope: any, index: number) => {
        // Calculate timing rules
        const pointABDuration = slope.exactTimings?.duration || 0;
        const fourCandleDuration = slopeData.fourCandleDuration || 0;
        
        const rule50Required = fourCandleDuration * 0.5;
        const rule34Required = pointABDuration * 0.34;
        
        // Check if timing rules are satisfied
        const rule50Valid = pointABDuration >= rule50Required;
        const rule34Valid = slope.triggerDuration >= rule34Required;
        
        // Only include if both timing rules are valid
        if (rule50Valid && rule34Valid) {
          const trade: ValidTrade = {
            symbol: selectedSymbol,
            date: selectedDate,
            timeframe: selectedTimeframe,
            pattern: slope.pattern || `Pattern ${index + 1}`,
            pointA: {
              price: slope.exactTimings?.startPrice || 0,
              timestamp: slope.exactTimings?.startTiming || '',
              candle: slope.exactTimings?.startCandle || ''
            },
            pointB: {
              price: slope.exactTimings?.endPrice || 0,
              timestamp: slope.exactTimings?.endTiming || '',
              candle: slope.exactTimings?.endCandle || ''
            },
            slope: {
              value: slope.slope || 0,
              direction: slope.slope > 0 ? 'uptrend' : 'downtrend',
              duration: pointABDuration
            },
            timingRules: {
              rule50Percent: {
                required: rule50Required,
                actual: pointABDuration,
                valid: rule50Valid
              },
              rule34Percent: {
                required: rule34Required,
                actual: slope.triggerDuration || 0,
                valid: rule34Valid
              }
            },
            triggerPoint: {
              price: slope.breakoutLevel || 0,
              timestamp: slope.triggerTimestamp || '',
              candle: slope.triggerCandle || ''
            },
            exitPoint: {
              price: slope.targetPrice || 0,
              timestamp: slope.exitTimestamp || '',
              method: slope.exitMethod || 'Target reached'
            },
            tRule: {
              applied: !!tRuleData?.prediction,
              c3Block: tRuleData?.c3Block || [],
              prediction: tRuleData?.prediction || null
            },
            mini4Rule: {
              applied: !!mini4Data?.c3aPrediction,
              c2Block: mini4Data?.c2Block || [],
              c3aPrediction: mini4Data?.c3aPrediction || null
            },
            profitLoss: calculateProfitLoss(slope),
            confidence: calculateConfidence(slope, rule50Valid, rule34Valid)
          };
          
          validTrades.push(trade);
        }
      });
    }

    return validTrades;
  };

  const calculateProfitLoss = (slope: any): number => {
    const entry = slope.breakoutLevel || 0;
    const exit = slope.targetPrice || slope.breakoutLevel || 0;
    return exit - entry;
  };

  const calculateConfidence = (slope: any, rule50Valid: boolean, rule34Valid: boolean): number => {
    let confidence = 60; // Base confidence
    
    if (rule50Valid) confidence += 15;
    if (rule34Valid) confidence += 15;
    if (Math.abs(slope.slope) > 1) confidence += 10; // Strong slope
    
    return Math.min(confidence, 95);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Complete Battu Scanner - Market Open to Close
          </CardTitle>
          <CardDescription>
            Comprehensive analysis showing valid trades with Point A/B, slopes, timing rules, T-Rule, and Mini 4-candle predictions
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Symbol</Label>
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NSE:NIFTY50-INDEX">NIFTY 50</SelectItem>
                  <SelectItem value="NSE:INFY-EQ">INFOSYS</SelectItem>
                  <SelectItem value="NSE:RELIANCE-EQ">RELIANCE</SelectItem>
                  <SelectItem value="NSE:TCS-EQ">TCS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Timeframe</Label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Minutes</SelectItem>
                  <SelectItem value="10">10 Minutes</SelectItem>
                  <SelectItem value="15">15 Minutes</SelectItem>
                  <SelectItem value="20">20 Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Action</Label>
              <Button 
                onClick={runCompleteAnalysis} 
                disabled={isScanning}
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Complete Scan
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {isScanning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{currentStep}</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Valid Trades Results */}
      {validTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Valid Trades Found: {validTrades.length}
            </CardTitle>
            <CardDescription>
              All trades meet 50% and 34% timing rules with Point A/B analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {validTrades.map((trade, index) => (
                <Card key={index} className="border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="points">Point A/B</TabsTrigger>
                        <TabsTrigger value="timing">Timing Rules</TabsTrigger>
                        <TabsTrigger value="advanced">T-Rule & Mini 4</TabsTrigger>
                        <TabsTrigger value="execution">Execution</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {trade.slope.direction === 'uptrend' ? '+' : ''}{trade.slope.value.toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">Slope (pts/min)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {trade.confidence}%
                            </div>
                            <div className="text-sm text-muted-foreground">Confidence</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {trade.slope.duration.toFixed(1)}min
                            </div>
                            <div className="text-sm text-muted-foreground">Pattern Duration</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {trade.profitLoss >= 0 ? '+' : ''}{trade.profitLoss.toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">Profit/Loss</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={trade.slope.direction === 'uptrend' ? 'default' : 'destructive'}>
                            {trade.slope.direction === 'uptrend' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {trade.pattern}
                          </Badge>
                          <Badge variant="outline">{trade.symbol}</Badge>
                          <Badge variant="outline">{trade.date}</Badge>
                          <Badge variant="outline">{trade.timeframe}min</Badge>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="points" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <h4 className="font-semibold">Point A (Start)</h4>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div>Price: <span className="font-mono">{trade.pointA.price.toFixed(2)}</span></div>
                                <div>Time: <span className="font-mono">{trade.pointA.timestamp}</span></div>
                                <div>Candle: <span className="font-mono">{trade.pointA.candle}</span></div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <h4 className="font-semibold">Point B (End)</h4>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div>Price: <span className="font-mono">{trade.pointB.price.toFixed(2)}</span></div>
                                <div>Time: <span className="font-mono">{trade.pointB.timestamp}</span></div>
                                <div>Candle: <span className="font-mono">{trade.pointB.candle}</span></div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="timing" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <h4 className="font-semibold">50% Rule</h4>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div>Required: <span className="font-mono">{trade.timingRules.rule50Percent.required.toFixed(1)}min</span></div>
                                <div>Actual: <span className="font-mono">{trade.timingRules.rule50Percent.actual.toFixed(1)}min</span></div>
                                <div>Status: <Badge variant={trade.timingRules.rule50Percent.valid ? 'default' : 'destructive'}>
                                  {trade.timingRules.rule50Percent.valid ? 'VALID' : 'INVALID'}
                                </Badge></div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <h4 className="font-semibold">34% Rule</h4>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div>Required: <span className="font-mono">{trade.timingRules.rule34Percent.required.toFixed(1)}min</span></div>
                                <div>Actual: <span className="font-mono">{trade.timingRules.rule34Percent.actual.toFixed(1)}min</span></div>
                                <div>Status: <Badge variant={trade.timingRules.rule34Percent.valid ? 'default' : 'destructive'}>
                                  {trade.timingRules.rule34Percent.valid ? 'VALID' : 'INVALID'}
                                </Badge></div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="advanced" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <LineChart className="h-4 w-4 text-purple-600" />
                                <h4 className="font-semibold">T-Rule Analysis</h4>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div>Applied: <Badge variant={trade.tRule.applied ? 'default' : 'outline'}>
                                  {trade.tRule.applied ? 'YES' : 'NO'}
                                </Badge></div>
                                {trade.tRule.applied && (
                                  <>
                                    <div>C3 Block Size: <span className="font-mono">{trade.tRule.c3Block.length} candles</span></div>
                                    <div>6th Candle Predicted: <Badge variant="default">YES</Badge></div>
                                  </>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <BarChart3 className="h-4 w-4 text-orange-600" />
                                <h4 className="font-semibold">Mini 4-Rule</h4>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div>Applied: <Badge variant={trade.mini4Rule.applied ? 'default' : 'outline'}>
                                  {trade.mini4Rule.applied ? 'YES' : 'NO'}
                                </Badge></div>
                                {trade.mini4Rule.applied && (
                                  <>
                                    <div>C2 Block Size: <span className="font-mono">{trade.mini4Rule.c2Block.length} candles</span></div>
                                    <div>C3a Predicted: <Badge variant="default">YES</Badge></div>
                                  </>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="execution" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="h-4 w-4 text-green-600" />
                                <h4 className="font-semibold">Entry Point</h4>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div>Trigger Price: <span className="font-mono">{trade.triggerPoint.price.toFixed(2)}</span></div>
                                <div>Trigger Time: <span className="font-mono">{trade.triggerPoint.timestamp}</span></div>
                                <div>Trigger Candle: <span className="font-mono">{trade.triggerPoint.candle}</span></div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="h-4 w-4 text-blue-600" />
                                <h4 className="font-semibold">Exit Point</h4>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div>Exit Price: <span className="font-mono">{trade.exitPoint.price.toFixed(2)}</span></div>
                                <div>Exit Time: <span className="font-mono">{trade.exitPoint.timestamp}</span></div>
                                <div>Exit Method: <span className="font-mono">{trade.exitPoint.method}</span></div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No trades found */}
      {!isScanning && validTrades.length === 0 && currentStep && (
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Valid Trades Found</h3>
            <p className="text-muted-foreground mb-4">
              No trades satisfied both 50% and 34% timing rules for the selected parameters.
            </p>
            <Button onClick={runCompleteAnalysis} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Different Parameters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}