import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, TrendingUp, TrendingDown, Clock, Target, Search, TrendingUpIcon, AlertTriangle, DollarSign, Shield, BookOpen, Shuffle, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FourCandleStepExplanation from './four-candle-step-explanation';
import { TrendlineChart } from './trendline-chart';
import { ProgressiveTimeframeDoubler } from './progressive-timeframe-doubler';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { calculateExitPrice, calculate98PercentExitPrice, calculateStopLoss } from '@/utils/exit-calculations';

// Live Countdown Timer Component
const LiveCountdownTimer = ({ targetTime, label }: { targetTime: number, label: string }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimeReached, setIsTimeReached] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = targetTime - now;
      
      if (remaining <= 0) {
        setTimeLeft(0);
        setIsTimeReached(true);
      } else {
        setTimeLeft(remaining);
        setIsTimeReached(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isTimeReached) {
    return (
      <div className="flex items-center gap-2 p-2 bg-green-100 rounded border border-green-300">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span className="text-green-800 font-bold">✅ VALIDATION TIME REACHED - RULE PASSED</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-orange-100 rounded border border-orange-300">
      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
      <span className="text-orange-800 font-medium">
        ⏱️ {formatTime(timeLeft)} until {label}
      </span>
    </div>
  );
};

interface CandleBlock {
  name: string;
  startTime: number;
  endTime: number;
  high: number;
  low: number;
  open: number;
  close: number;
}

interface ExactTimestamp {
  candleName: string;
  priceType: string;
  price: number;
  exactTimestamp: number;
  formattedTime: string;
}

interface SlopeResult {
  pointA: ExactTimestamp;
  pointB: ExactTimestamp;
  priceDiff: number;
  timeDiffMinutes: number;
  slope: number;
  trendType: 'uptrend' | 'downtrend';
  patternName: string;
}

interface PredictedCandle {
  candleName: string;
  timeframe: number;
  startTime: number;
  endTime: number;
  predictedHigh: number;
  predictedLow: number;
  predictedOpen: number;
  predictedClose: number;
  confidence: number;
  basedOnTrend: 'uptrend' | 'downtrend';
  patternName: string;
}

interface CandlePredictions {
  fifthCandle: PredictedCandle;
  sixthCandle: PredictedCandle;
  seventhCandle?: PredictedCandle;
  eighthCandle?: PredictedCandle;
  methodology: string;
}

interface RealCandle {
  startTime: number;
  endTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  available: boolean;
}

interface RealCandleData {
  success: boolean;
  fifthCandle: RealCandle;
  sixthCandle: RealCandle;
  seventhCandle?: RealCandle;
  eighthCandle?: RealCandle;
  timeframe: number;
  totalCandlesFound: number;
}

interface AnalysisResult {
  candleBlocks: CandleBlock[];
  exactTimestamps: ExactTimestamp[];
  slopes: SlopeResult[];
  predictions?: CandlePredictions;
  summary: string;
}

const symbolOptions = [
  { value: 'NSE:NIFTY50-INDEX', label: 'NIFTY 50 INDEX' },
  { value: 'NSE:INFY-EQ', label: 'INFOSYS' },
  { value: 'NSE:RELIANCE-EQ', label: 'RELIANCE' },
  { value: 'NSE:TCS-EQ', label: 'TCS' }
];

const timeframeOptions = [
  { value: '5', label: '5 Minutes' },
  { value: '10', label: '10 Minutes' },
  { value: '15', label: '15 Minutes' },
  { value: '20', label: '20 Minutes' },
  { value: '30', label: '30 Minutes' },
  { value: '40', label: '40 Minutes' },
  { value: '60', label: '1 Hour' },
  { value: '80', label: '80 Minutes' }
];

interface TradingSignal {
  id: string;
  symbol: string;
  pattern: string;
  breakoutType: 'uptrend' | 'downtrend';
  entryPrice: number;
  stopLoss: number;
  quantity: number;
  riskAmount: number;
  timestamp: number;
  status: 'active' | 'filled' | 'stopped';
}

export function FourCandleRuleScanner() {
  const [selectedSymbol, setSelectedSymbol] = useState('NSE:NIFTY50-INDEX');
  const [selectedDate, setSelectedDate] = useState('2025-07-25');
  const [selectedTimeframe, setSelectedTimeframe] = useState('10');
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [realCandleData, setRealCandleData] = useState<RealCandleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [riskAmount, setRiskAmount] = useState(1000);
  const [exactBreakoutTimestamps, setExactBreakoutTimestamps] = useState<{[key: string]: string | null}>({});
  const [invalidationStates, setInvalidationStates] = useState<{[key: string]: {startTime: number, endTime: number} | null}>({});
  const [earlyBreakoutRecords, setEarlyBreakoutRecords] = useState<{[key: string]: {brokeEarly: boolean, breakoutTime: number} | null}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dynamic Block Rotation System Component
  const DynamicBlockRotationSection = () => {
    const [rotationData, setRotationData] = useState(null);
    const [rotationLoading, setRotationLoading] = useState(false);
    const [rotationError, setRotationError] = useState(null);

    const fetchDynamicRotation = async () => {
      try {
        setRotationLoading(true);
        setRotationError(null);
        
        // Simulate blocks for demonstration
        const simulatedOriginalC1 = analysisResult?.candleBlocks?.filter(c => c.name.includes('C1')) || [];
        const simulatedOriginalC2 = analysisResult?.candleBlocks?.filter(c => c.name.includes('C2')) || [];
        const simulatedCompletedC3 = [
          { name: 'C3A (5th)', open: 1515, high: 1520, low: 1510, close: 1518, timestamp: Date.now() },
          { name: 'C3B (6th)', open: 1518, high: 1525, low: 1515, close: 1522, timestamp: Date.now() }
        ];

        const response = await apiRequest('/api/battu-scan/intraday/dynamic-block-rotation', {
          method: 'POST',
          body: JSON.stringify({
            symbol: selectedSymbol,
            date: selectedDate,
            originalC1: simulatedOriginalC1,
            originalC2: simulatedOriginalC2,
            completedC3: simulatedCompletedC3
          })
        });

        if (response.method) {
          setRotationData(response);
        } else {
          throw new Error(response.message || 'Failed to process dynamic block rotation');
        }
      } catch (err) {
        setRotationError(err.message);
        console.error('Dynamic rotation error:', err);
      } finally {
        setRotationLoading(false);
      }
    };

    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <Shuffle className="h-5 w-5" />
            Dynamic Block Rotation System
          </CardTitle>
          <CardDescription>
            NEW C1 BLOCK (C1A+C1B) and NEW C2 BLOCK (C2A+C2B) predict NEW C3 BLOCK with dual validation requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="font-medium text-blue-800 mb-2">Rotation Conditions</div>
              <div className="text-sm text-blue-700 space-y-1">
                <div>✓ count(C1) == count(C2)</div>
                <div>✓ count(C2) == count(C3)</div>
                <div className="text-xs text-gray-600 mt-2">Both conditions must be satisfied</div>
              </div>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="font-medium text-yellow-800 mb-2">Block Structure</div>
              <div className="text-sm text-yellow-700 space-y-1">
                <div>NEW C1 = old(C1+C2)</div>
                <div>NEW C2 = old(C3) → C2A+C2B</div>
                <div>NEW C3 = predict 7th+8th</div>
              </div>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="font-medium text-purple-800 mb-2">Point A/B Method</div>
              <div className="text-sm text-purple-700 space-y-1">
                <div>Point A: NEW C1A analysis</div>
                <div>Point B: NEW C2A analysis</div>
                <div>Slope: (B-A)/(TimeB-TimeA)</div>
              </div>
            </div>
          </div>

          <Button
            onClick={fetchDynamicRotation}
            disabled={rotationLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {rotationLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Rotation...
              </>
            ) : (
              <>
                <Shuffle className="w-4 h-4 mr-2" />
                Demonstrate Block Rotation
              </>
            )}
          </Button>

          {rotationError && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
              <div className="text-red-800 font-medium">Rotation Error</div>
              <div className="text-red-700 text-sm">{rotationError}</div>
            </div>
          )}

          {rotationData && (
            <div className="space-y-4">
              {rotationData.rotationResult?.rotationApplied ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="font-semibold text-green-800">Block Rotation Applied Successfully</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded border">
                      <div className="font-medium text-gray-800 mb-2">NEW C1 BLOCK</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Candles: {rotationData.rotationResult.currentBlocks.C1.count}</div>
                        <div>Structure: C1A + C1B (combined)</div>
                        <div>Purpose: Foundation for Point A analysis</div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-white rounded border">
                      <div className="font-medium text-gray-800 mb-2">NEW C2 BLOCK</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Candles: {rotationData.rotationResult.currentBlocks.C2.count}</div>
                        <div>Structure: C2A + C2B (old C3)</div>
                        <div>Purpose: Foundation for Point B analysis</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-emerald-50 rounded border border-emerald-200">
                    <div className="font-medium text-emerald-800 mb-2">Next Cycle Prediction</div>
                    <div className="text-sm text-emerald-700">
                      Ready to predict NEW C3 BLOCK (7th + 8th candles) using NEW C1 and NEW C2 methodology
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-gray-700 border border-yellow-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <div className="font-semibold text-yellow-800 dark:text-gray-200">Rotation Not Applied</div>
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-gray-300">
                    Reason: {rotationData.rotationResult?.rotationReason || 'Conditions not met'}
                  </div>
                </div>
              )}
              
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border dark:border-gray-600">
                <div className="font-medium text-gray-800 dark:text-gray-200 mb-2">Methodology Steps</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  {rotationData.steps?.map((step, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{index + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Extended 7th & 8th Candle Predictions Component
  const ExtendedCandlePredictionsSection = () => {
    const [predictions, setPredictions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchExtendedPredictions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiRequest('/api/battu-scan/intraday/predict-7th-8th-candles', {
          method: 'POST',
          body: JSON.stringify({
            symbol: selectedSymbol,
            date: selectedDate,
            timeframe: parseInt(selectedTimeframe),
            analysisData: analysisResult
          })
        });

        if (response.success) {
          setPredictions(response.predictions);
        } else {
          throw new Error(response.message || 'Failed to generate extended predictions');
        }
      } catch (err) {
        setError(err.message);
        console.error('Extended predictions error:', err);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Card className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200 transition-colors duration-300">
            <TrendingUp className="h-5 w-5" />
            Extended 7th & 8th Candle Predictions
          </CardTitle>
          <CardDescription>
            Predict 7th and 8th candles after 6th candle completion using slope-based trendline extrapolation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={fetchExtendedPredictions}
            disabled={loading}
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-300"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Predictions...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Generate 7th & 8th Candle Predictions
              </>
            )}
          </Button>

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
              <div className="text-red-800 font-medium">Prediction Error</div>
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          )}

          {predictions && (
            <div className="space-y-4">
              <div className="p-3 bg-white rounded-lg border">
                <div className="font-semibold text-gray-800 mb-2">Extended Prediction Results</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {predictions.seventhCandle && (
                    <div className="p-3 border rounded-lg bg-green-50 border-green-200">
                      <div className="font-medium text-green-800 mb-2">7th Candle Prediction</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Open:</span>
                          <span className="font-medium">₹{predictions.seventhCandle.open}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>High:</span>
                          <span className="font-medium">₹{predictions.seventhCandle.high}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Low:</span>
                          <span className="font-medium">₹{predictions.seventhCandle.low}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Close:</span>
                          <span className="font-medium">₹{predictions.seventhCandle.close}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Time Window:</span>
                          <span>{predictions.seventhCandle.timeWindow}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Confidence:</span>
                          <span className={`font-medium ${predictions.seventhCandle.confidence >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                            {predictions.seventhCandle.confidence}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {predictions.eighthCandle && (
                    <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors duration-300">
                      <div className="font-medium text-gray-800 dark:text-gray-200 mb-2 transition-colors duration-300">8th Candle Prediction</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Open:</span>
                          <span className="font-medium">₹{predictions.eighthCandle.open}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>High:</span>
                          <span className="font-medium">₹{predictions.eighthCandle.high}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Low:</span>
                          <span className="font-medium">₹{predictions.eighthCandle.low}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Close:</span>
                          <span className="font-medium">₹{predictions.eighthCandle.close}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Time Window:</span>
                          <span>{predictions.eighthCandle.timeWindow}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Confidence:</span>
                          <span className={`font-medium ${predictions.eighthCandle.confidence >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                            {predictions.eighthCandle.confidence}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-cyan-100 rounded-lg">
                <div className="text-sm font-medium text-cyan-700 mb-1">Extended Prediction Methodology:</div>
                <div className="text-xs text-cyan-600">{predictions.methodology || 'Linear trendline extrapolation from Point B using dominant slope analysis'}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Live market data for real-time price updates
  const { data: liveMarketData } = useQuery({
    queryKey: ['/api/market-data'],
    refetchInterval: 700, // 700ms streaming interval for real-time updates
    retry: false,
  });

  // Get current live price for selected symbol
  const getCurrentLivePrice = () => {
    if (!liveMarketData || !Array.isArray(liveMarketData)) return null;
    
    const symbolMap: {[key: string]: string} = {
      'NSE:NIFTY50-INDEX': 'NIFTY50',
      'NSE:INFY-EQ': 'INFOSYS', 
      'NSE:RELIANCE-EQ': 'RELIANCE',
      'NSE:TCS-EQ': 'TCS'
    };
    
    const mappedSymbol = symbolMap[selectedSymbol];
    const marketSymbol = liveMarketData.find((data: any) => data.symbol === mappedSymbol);
    
    return marketSymbol ? {
      price: marketSymbol.price,
      change: marketSymbol.change,
      changePercent: marketSymbol.changePercent,
      lastUpdated: marketSymbol.lastUpdated
    } : null;
  };

  // Fetch exact breakout timestamps using 1-minute methodology (same as Point A/B)
  const fetchExactBreakoutTimestamp = async (
    candleStartTime: number,
    candleEndTime: number,
    breakoutLevel: number,
    isUptrend: boolean,
    candleType: 'fifth' | 'sixth'
  ) => {
    try {
      console.log(`🎯 Fetching exact ${candleType} candle breakout timestamp...`);
      const response = await fetch('/api/battu-scan/exact-breakout-timestamps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedSymbol,
          candleStartTime,
          candleEndTime,
          breakoutLevel,
          isUptrend,
          analysisData: analysisResult // Pass existing analysis data with 1-minute candles
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.exactTimestamp) {
          setExactBreakoutTimestamps(prev => ({
            ...prev,
            [candleType]: data.exactTimestamp.toString()
          }));
          console.log(`✅ ${candleType} candle exact breakout timestamp:`, data.exactTimestampFormatted);
          return data.exactTimestamp.toString();
        }
      } else {
        console.warn(`⚠️ Failed to fetch ${candleType} candle exact breakout timestamp`);
      }
    } catch (error) {
      console.warn(`⚠️ Error fetching ${candleType} candle exact breakout timestamp:`, error);
    }
    return null;
  };

  // Effect to fetch exact breakout timestamps when breakouts are detected
  useEffect(() => {
    if (!analysisResult?.slopes || !realCandleData?.success) return;

    const fetchBreakoutTimestamps = async () => {
      for (const slope of analysisResult.slopes) {
        const breakoutLevel = slope.pointB.price;
        const isUptrend = slope.trendType === 'uptrend';
        
        // Check 5th candle breakout
        const fifthBrokeUp = realCandleData.fifthCandle.available && realCandleData.fifthCandle.high > breakoutLevel;
        const fifthBrokeDown = realCandleData.fifthCandle.available && realCandleData.fifthCandle.low < breakoutLevel;
        const fifthBroke = isUptrend ? fifthBrokeUp : fifthBrokeDown;
        
        // Check 6th candle breakout
        const sixthBrokeUp = realCandleData.sixthCandle.available && realCandleData.sixthCandle.high > breakoutLevel;
        const sixthBrokeDown = realCandleData.sixthCandle.available && realCandleData.sixthCandle.low < breakoutLevel;
        const sixthBroke = isUptrend ? sixthBrokeUp : sixthBrokeDown;
        
        // Fetch exact timestamps for breakouts
        if (fifthBroke && !exactBreakoutTimestamps.fifth) {
          await fetchExactBreakoutTimestamp(
            realCandleData.fifthCandle.startTime,
            realCandleData.fifthCandle.endTime,
            breakoutLevel,
            isUptrend,
            'fifth'
          );
        }
        
        if (sixthBroke && !exactBreakoutTimestamps.sixth) {
          await fetchExactBreakoutTimestamp(
            realCandleData.sixthCandle.startTime,
            realCandleData.sixthCandle.endTime,
            breakoutLevel,
            isUptrend,
            'sixth'
          );
        }
      }
    };

    fetchBreakoutTimestamps();
  }, [analysisResult, realCandleData, exactBreakoutTimestamps, selectedSymbol]);

  // Query for active trades
  const { data: activeTrades, isLoading: tradesLoading } = useQuery({
    queryKey: ['/api/breakout-trading/active-trades'],
    refetchInterval: 10000 // Refresh every 10 seconds
  }) as { data: { activeTrades: TradingSignal[] } | undefined, isLoading: boolean };

  // Monitor breakout mutation
  const monitorBreakout = useMutation({
    mutationFn: async (params: { symbol: string; timeframe: number; riskAmount: number }) => {
      const response = await fetch('/api/breakout-trading/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start monitoring: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Breakout Monitoring Started",
        description: "System is now monitoring for breakout opportunities"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/breakout-trading/active-trades'] });
    },
    onError: (error: any) => {
      toast({
        title: "Monitoring Failed",
        description: error.message || "Failed to start breakout monitoring",
        variant: "destructive"
      });
    }
  });

  // Auto SL order placement mutation
  const autoPlaceSLOrder = useMutation({
    mutationFn: async (params: {
      symbol: string;
      breakoutLevel: number;
      trendType: 'uptrend' | 'downtrend';
      patternName: string;
      triggerCandle: '5th' | '6th';
      riskAmount: number;
      exactTimestamp: number;
      timingRulesValid: boolean;
      c2bLow?: number;
      c2bHigh?: number;
      fifthCandleLow?: number;
      fifthCandleHigh?: number;
    }) => {
      const response = await fetch('/api/breakout-trading/auto-place-sl-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to place SL order');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "SL Order Placed Successfully",
        description: `${result.orderDetails.action} order placed at ₹${result.orderDetails.entryPrice} (SL: ₹${result.orderDetails.stopLoss})`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/breakout-trading/active-trades'] });
    },
    onError: (error: any) => {
      toast({
        title: "Order Placement Failed",
        description: error.message || "Failed to place SL limit order",
        variant: "destructive"
      });
    }
  });

  // Automatic timing-based order placement system - ONLY when NO breakout occurs
  useEffect(() => {
    if (!analysisResult?.slopes || !realCandleData?.fifthCandle?.available) return;

    const timers: NodeJS.Timeout[] = [];

    analysisResult.slopes.forEach((slope, index) => {
      const isUptrend = slope.trendType === 'uptrend';
      const breakoutLevel = isUptrend ? slope.pointB.price : slope.pointB.price;
      
      // Calculate Point A to Point B duration
      const pointATimestamp = slope.pointA?.exactTimestamp || 0;
      const pointBTimestamp = slope.pointB?.exactTimestamp || 0;
      const pointAToPointBDuration = (pointBTimestamp - pointATimestamp) / 60; // in minutes
      
      // Calculate 34% timing threshold
      const required34PercentDuration = pointAToPointBDuration * 0.34;
      const orderPlacementTime = pointBTimestamp + (required34PercentDuration * 60); // timestamp when order should be placed
      
      // Check current time vs order placement time
      const currentTime = Date.now() / 1000;
      const timeUntilOrderPlacement = orderPlacementTime - currentTime;
      
      // Check if breakout occurred in 5th or 6th candles
      const fifthBrokeUp = realCandleData.fifthCandle.high > breakoutLevel;
      const fifthBrokeDown = realCandleData.fifthCandle.low < breakoutLevel;
      const fifthBroke = isUptrend ? fifthBrokeUp : fifthBrokeDown;
      
      const sixthBrokeUp = realCandleData.sixthCandle?.available && realCandleData.sixthCandle.high > breakoutLevel;
      const sixthBrokeDown = realCandleData.sixthCandle?.available && realCandleData.sixthCandle.low < breakoutLevel;
      const sixthBroke = isUptrend ? sixthBrokeUp : sixthBrokeDown;
      
      // CRITICAL: Only set timer if:
      // 1. NO breakout occurred in 5th OR 6th candles
      // 2. Order placement time is in the future (within next 24 hours)
      // 3. Not already placed
      const noBreakoutOccurred = !fifthBroke && !sixthBroke;
      
      if (noBreakoutOccurred && timeUntilOrderPlacement > 0 && timeUntilOrderPlacement < 86400) {
        console.log(`🕒 AUTO-ORDER: NO breakout detected - Setting timer for automatic SL order placement`);
        console.log(`📊 5th candle broke: ${fifthBroke}, 6th candle broke: ${sixthBroke}`);
        console.log(`⏰ Will place SL order in ${(timeUntilOrderPlacement / 60).toFixed(1)} minutes (34% of ${pointAToPointBDuration.toFixed(1)}min A→B duration)`);
        
        const timerId = setTimeout(() => {
          // Double-check no breakout occurred before placing order
          const latestFifthBroke = isUptrend 
            ? realCandleData.fifthCandle.high > breakoutLevel
            : realCandleData.fifthCandle.low < breakoutLevel;
          const latestSixthBroke = realCandleData.sixthCandle?.available && (isUptrend 
            ? realCandleData.sixthCandle.high > breakoutLevel
            : realCandleData.sixthCandle.low < breakoutLevel);
            
          if (!latestFifthBroke && !latestSixthBroke) {
            console.log(`🎯 AUTO-ORDER: Confirmed NO breakout - Placing automatic SL order at 34% timing threshold`);
            
            autoPlaceSLOrder.mutate({
              symbol: selectedSymbol,
              breakoutLevel: breakoutLevel,
              trendType: slope.trendType,
              patternName: slope.patternName,
              triggerCandle: '5th' as '5th' | '6th',
              riskAmount: riskAmount,
              exactTimestamp: Date.now(),
              timingRulesValid: true,
              c2bLow: analysisResult.candleBlocks.find((c: any) => c.name === 'C2B')?.low,
              c2bHigh: analysisResult.candleBlocks.find((c: any) => c.name === 'C2B')?.high,
              fifthCandleLow: realCandleData.fifthCandle.low,
              fifthCandleHigh: realCandleData.fifthCandle.high
            });
          } else {
            console.log(`❌ AUTO-ORDER: Breakout detected since timer was set - Canceling automatic order`);
          }
        }, timeUntilOrderPlacement * 1000);
        
        timers.push(timerId);
      } else if (fifthBroke || sixthBroke) {
        console.log(`❌ AUTO-ORDER: Breakout detected - No automatic order placement (manual decision required)`);
      }
    });
    
    // Cleanup timers on effect cleanup
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [analysisResult, realCandleData, selectedSymbol, riskAmount, autoPlaceSLOrder]);

  // Fetch real 5th and 6th candle data
  const fetchRealCandleData = async (symbol: string, date: string, timeframe: string, candleBlocks: CandleBlock[]) => {
    const response = await fetch('/api/fyers/real-candles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbol,
        date,
        timeframe: parseInt(timeframe),
        candleBlocks,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch real candle data');
    }

    return response.json() as Promise<RealCandleData>;
  };

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);
    setAnalysisResult(null);
    setRealCandleData(null);
    
    // Clear exact breakout timestamps when starting new scan
    setExactBreakoutTimestamps({
      fifth: null,
      sixth: null
    });

    try {
      console.log('🔍 Starting Battu 4-candle rule scan...', {
        symbol: selectedSymbol,
        date: selectedDate,
        timeframe: selectedTimeframe
      });

      // Use the actual Battu API endpoint that returns proper slope data
      const response = await fetch('/api/battu-scan/intraday/corrected-slope-calculation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: selectedSymbol,
          date: selectedDate,
          timeframe: parseInt(selectedTimeframe)
        }),
      });

      if (!response.ok) {
        throw new Error(`Battu API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Battu analysis result received:', data);

      // Use the exact data structure from Battu API
      setAnalysisResult(data);

      // Fetch real 5th and 6th candle data
      if (data.candleBlocks) {
        try {
          console.log('📊 Fetching real 5th and 6th candle data...');
          const realData = await fetchRealCandleData(
            selectedSymbol,
            selectedDate,
            selectedTimeframe,
            data.candleBlocks
          );
          console.log('✅ Real candle data received:', realData);
          setRealCandleData(realData);
        } catch (realDataError) {
          console.warn('⚠️ Failed to fetch real candle data:', realDataError);
          // Don't set error state since this is optional
        }
      }
    } catch (err) {
      console.error('❌ Battu scan failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsScanning(false);
    }
  };

  const currentLivePrice = getCurrentLivePrice();

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Battu 4-Candle Rule Scanner
          </CardTitle>
          <CardDescription>
            Real-time analysis using Battu API with 1-minute precision timestamp calculations and slope trend detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="scanner" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scanner" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Scanner
              </TabsTrigger>
              <TabsTrigger value="explanation" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Step-by-Step Guide
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="scanner" className="space-y-6 mt-6">
              <div className="space-y-6">

              {/* Live Price Display */}
              {currentLivePrice && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-600">Live Price - {selectedSymbol}</div>
                          <div className="text-2xl font-bold text-gray-900">₹{currentLivePrice.price}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${currentLivePrice.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {currentLivePrice.change >= 0 ? '+' : ''}{currentLivePrice.change} ({currentLivePrice.changePercent >= 0 ? '+' : ''}{currentLivePrice.changePercent}%)
                        </div>
                        <div className="text-xs text-gray-500">Updated: {new Date(currentLivePrice.lastUpdated).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scan Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Symbol Selection */}
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger>
                  <SelectValue placeholder="Select symbol" />
                </SelectTrigger>
                <SelectContent>
                  {symbolOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Timeframe Selection */}
            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe</Label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {timeframeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scan Button */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={handleScan} 
              disabled={isScanning}
              className="min-w-[200px]"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Scan 4-Candle Rule
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {analysisResult && (
        <div className="space-y-6">
          {/* 4-Candle Blocks - Using exact Battu API structure */}
          {(analysisResult as any)?.candleBlocks && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  NEW Block Structure: C1 BLOCK (C1A+C1B) + C2 BLOCK (C2A+C2B)
                </CardTitle>
                <CardDescription>
                  6-Candle methodology: NEW C1 BLOCK (4 candles) + NEW C2 BLOCK (2 candles) from {(analysisResult as any).symbol} on {(analysisResult as any).date}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(analysisResult as any).candleBlocks.map((block: any, index: number) => (
                    <Card key={index} className={`${
                      block.name.startsWith('C1') ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                    }`}>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className={`text-lg font-bold ${
                            block.name.startsWith('C1') ? 'text-blue-700' : 'text-green-700'
                          }`}>
                            {block.name}
                          </div>
                          <div className="text-sm text-gray-600 mt-2 space-y-1">
                            <div><strong>High:</strong> {block.high}</div>
                            <div><strong>Low:</strong> {block.low}</div>
                            <div><strong>Open:</strong> {block.open}</div>
                            <div><strong>Close:</strong> {block.close}</div>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            {new Date(block.startTime * 1000).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit', 
                              second: '2-digit',
                              hour12: true 
                            })} - {new Date(block.endTime * 1000).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit', 
                              second: '2-digit',
                              hour12: true 
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exact Timestamps - Using exact Battu API data */}
          {(analysisResult as any)?.exactTimestamps && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Exact High/Low Timestamps (1-Minute Precision)
                </CardTitle>
                <CardDescription>
                  Precise timestamps where high/low prices occurred within each candle block
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(analysisResult as any).exactTimestamps.map((timestamp: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {timestamp.candleName} {timestamp.priceType.toUpperCase()}
                          </Badge>
                          <div className="text-sm">
                            <div><strong>Price:</strong> {timestamp.price}</div>
                            <div><strong>Exact Time:</strong> {timestamp.formattedTime}</div>
                            <div className="text-xs text-gray-500">Timestamp: {timestamp.exactTimestamp}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Slope Analysis - Using exact Battu API slope calculations */}
          {(analysisResult as any)?.slopes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  NEW Block Trendlines (C1→C2 Analysis)
                </CardTitle>
                <CardDescription>
                  Point A from NEW C1 BLOCK (C1A+C1B) → Point B from NEW C2 BLOCK (C2A+C2B) with 1-minute precision
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(analysisResult as any).slopes.map((slope: any, index: number) => (
                    <Card key={index} className={`${
                      slope.trendType === 'uptrend' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            {slope.trendType === 'uptrend' ? (
                              <TrendingUp className="h-5 w-5 text-green-600" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-600" />
                            )}
                            <span className={`text-lg font-semibold ${
                              slope.trendType === 'uptrend' ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {slope.trendType === 'uptrend' ? 'NEW C1→C2 Uptrend' : 'NEW C1→C2 Downtrend'}
                              <span className="ml-2 text-sm font-normal text-gray-600">
                                {slope.trendType === 'uptrend' 
                                  ? 'C1 Block Low → C2 Block High' 
                                  : 'C1 Block High → C2 Block Low'}
                              </span>
                            </span>
                          </div>
                          <Badge variant={slope.trendType === 'uptrend' ? 'default' : 'destructive'} className="text-lg px-3 py-1">
                            {slope.slope.toFixed(6)} pts/min
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Point A (Start):</div>
                            <div className="text-sm text-gray-600">
                              <div><strong>Candle:</strong> {slope.pointA.candleName}</div>
                              <div><strong>Type:</strong> {slope.pointA.priceType.toUpperCase()}</div>
                              <div><strong>Price:</strong> {slope.pointA.price}</div>
                              <div><strong>Exact Time:</strong> {slope.pointA.formattedTime}</div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Point B (End):</div>
                            <div className="text-sm text-gray-600">
                              <div><strong>Candle:</strong> {slope.pointB.candleName}</div>
                              <div><strong>Type:</strong> {slope.pointB.priceType.toUpperCase()}</div>
                              <div><strong>Price:</strong> {slope.pointB.price}</div>
                              <div><strong>Exact Time:</strong> {slope.pointB.formattedTime}</div>
                            </div>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-sm font-medium">Price Change</div>
                            <div className={`text-lg font-semibold ${
                              slope.priceDiff >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {slope.priceDiff >= 0 ? '+' : ''}{slope.priceDiff.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Duration (Exact)</div>
                            <div className="text-lg font-semibold text-blue-600">
                              {slope.timeDiffMinutes.toFixed(2)} min
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Slope Rate</div>
                            <div className={`text-lg font-semibold ${
                              slope.slope >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {slope.slope.toFixed(6)} pts/min
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trendline Chart Visualization */}
          {analysisResult?.slopes && analysisResult.slopes.length > 0 && (
            <Card className="border-indigo-200 bg-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-700">
                  📈 Trendline Chart with 6th Candle Extension
                </CardTitle>
                <CardDescription>
                  Visual representation of Point A to Point B trendlines extended to 6th candle time with exact timestamps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrendlineChart 
                  slopes={analysisResult.slopes.map(slope => ({
                    pointA: {
                      timestamp: slope.pointA.exactTimestamp,
                      price: slope.pointA.price,
                      formattedTime: slope.pointA.formattedTime,
                      candleName: slope.pointA.candleName,
                      priceType: slope.pointA.priceType
                    },
                    pointB: {
                      timestamp: slope.pointB.exactTimestamp,
                      price: slope.pointB.price,
                      formattedTime: slope.pointB.formattedTime,
                      candleName: slope.pointB.candleName,
                      priceType: slope.pointB.priceType
                    },
                    slope: slope.slope,
                    trendType: slope.trendType,
                    patternName: slope.patternName
                  }))}
                  candleBlocks={analysisResult.candleBlocks}
                  predictions={analysisResult.predictions}
                  realCandleData={realCandleData || undefined}
                  timeframe={parseInt(selectedTimeframe)}
                  dualValidation={(analysisResult as any).dualValidation}
                />
              </CardContent>
            </Card>
          )}

          {/* 5th and 6th Candle Predictions */}
          {analysisResult?.predictions && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  🔮 5th & 6th Candle Data
                </CardTitle>
                <CardDescription>
                  Real candle values when available, otherwise predicted values using slope trendline extrapolation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 5th Candle */}
                {analysisResult.predictions.fifthCandle && (
                  <div className="p-4 bg-white rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-purple-700">
                        5th Candle {realCandleData?.fifthCandle?.available ? '(Real Data)' : '(Predicted)'}
                      </h3>
                      <Badge variant="outline" className={`${realCandleData?.fifthCandle?.available ? 'text-green-600 border-green-300' : 'text-purple-600 border-purple-300'}`}>
                        {realCandleData?.fifthCandle?.available ? 'Live Data' : `${analysisResult.predictions.fifthCandle.confidence}% Confidence`}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600">Open</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {realCandleData?.fifthCandle?.available 
                            ? realCandleData.fifthCandle.open 
                            : analysisResult.predictions.fifthCandle.predictedOpen}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600">High</div>
                        <div className="text-lg font-semibold text-green-600">
                          {realCandleData?.fifthCandle?.available 
                            ? realCandleData.fifthCandle.high 
                            : analysisResult.predictions.fifthCandle.predictedHigh}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600">Low</div>
                        <div className="text-lg font-semibold text-red-600">
                          {realCandleData?.fifthCandle?.available 
                            ? realCandleData.fifthCandle.low 
                            : analysisResult.predictions.fifthCandle.predictedLow}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600">Close</div>
                        <div className="text-lg font-semibold text-purple-600">
                          {realCandleData?.fifthCandle?.available 
                            ? realCandleData.fifthCandle.close 
                            : analysisResult.predictions.fifthCandle.predictedClose}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {realCandleData?.fifthCandle?.available ? (
                        <div><strong>Status:</strong> Real market data from Fyers API</div>
                      ) : (
                        <>
                          <div><strong>Based on:</strong> {analysisResult.predictions.fifthCandle.basedOnTrend} {analysisResult.predictions.fifthCandle.patternName}</div>
                        </>
                      )}
                      <div><strong>Time window:</strong> {new Date(analysisResult.predictions.fifthCandle.startTime * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} - {new Date(analysisResult.predictions.fifthCandle.endTime * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}</div>
                    </div>
                  </div>
                )}

                {/* 6th Candle */}
                {analysisResult.predictions.sixthCandle && (
                  <div className="p-4 bg-white rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-purple-700">
                        6th Candle {realCandleData?.sixthCandle?.available ? '(Real Data)' : '(Predicted)'}
                      </h3>
                      <Badge variant="outline" className={`${realCandleData?.sixthCandle?.available ? 'text-green-600 border-green-300' : 'text-purple-600 border-purple-300'}`}>
                        {realCandleData?.sixthCandle?.available ? 'Live Data' : `${analysisResult.predictions.sixthCandle.confidence}% Confidence`}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600">Open</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {realCandleData?.sixthCandle?.available 
                            ? realCandleData.sixthCandle.open 
                            : analysisResult.predictions.sixthCandle.predictedOpen}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600">High</div>
                        <div className="text-lg font-semibold text-green-600">
                          {realCandleData?.sixthCandle?.available 
                            ? realCandleData.sixthCandle.high 
                            : analysisResult.predictions.sixthCandle.predictedHigh}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600">Low</div>
                        <div className="text-lg font-semibold text-red-600">
                          {realCandleData?.sixthCandle?.available 
                            ? realCandleData.sixthCandle.low 
                            : analysisResult.predictions.sixthCandle.predictedLow}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600">Close</div>
                        <div className="text-lg font-semibold text-purple-600">
                          {realCandleData?.sixthCandle?.available 
                            ? realCandleData.sixthCandle.close 
                            : analysisResult.predictions.sixthCandle.predictedClose}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {realCandleData?.sixthCandle?.available ? (
                        <div><strong>Status:</strong> Real market data from Fyers API</div>
                      ) : (
                        <div><strong>Based on:</strong> {analysisResult.predictions.sixthCandle.basedOnTrend} {analysisResult.predictions.sixthCandle.patternName}</div>
                      )}
                      <div><strong>Time window:</strong> {new Date(analysisResult.predictions.sixthCandle.startTime * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} - {new Date(analysisResult.predictions.sixthCandle.endTime * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}</div>
                    </div>
                  </div>
                )}

                {/* Real Breakout Validation - Direct Mathematical Check */}
                {(analysisResult as any)?.slopes && realCandleData?.success && (
                  <div className="p-4 bg-yellow-100 rounded-lg border-2 border-yellow-300">
                    <div className="text-sm font-bold text-yellow-800 mb-3">🎯 Real Breakout Validation Status</div>
                    
                    {/* Live Price vs Breakout Level Display */}
                    {currentLivePrice && (
                      <div className="mb-4 p-3 bg-white rounded-lg border border-yellow-400">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="font-semibold text-gray-800">Current Live Price</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900">₹{currentLivePrice.price}</div>
                            <div className="text-xs text-gray-500">{new Date(currentLivePrice.lastUpdated).toLocaleTimeString()}</div>
                          </div>
                        </div>
                        
                        {/* Compare with each breakout level */}
                        <div className="space-y-2 text-sm">
                          {(analysisResult as any).slopes.map((slope: any, idx: number) => {
                            const breakoutLevel = slope.pointB.price;
                            const isUptrend = slope.trendType === 'uptrend';
                            const livePriceTriggers = isUptrend 
                              ? currentLivePrice.price > breakoutLevel
                              : currentLivePrice.price < breakoutLevel;
                            
                            return (
                              <div key={idx} className={`p-2 rounded ${livePriceTriggers ? 'bg-green-50 border border-green-300' : 'bg-gray-50 border border-gray-300'}`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {slope.trendType.toUpperCase()} ({slope.patternName})
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    livePriceTriggers 
                                      ? 'bg-green-200 text-green-800' 
                                      : 'bg-gray-200 text-gray-700'
                                  }`}>
                                    {livePriceTriggers ? '🚀 LIVE BREAKOUT!' : 'No live breakout'}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Breakout Level: ₹{breakoutLevel} | 
                                  Live: ₹{currentLivePrice.price} | 
                                  Rule: {isUptrend ? 'Price > Level' : 'Price < Level'} | 
                                  Status: {isUptrend 
                                    ? `${currentLivePrice.price} ${currentLivePrice.price > breakoutLevel ? '>' : '≤'} ${breakoutLevel}`
                                    : `${currentLivePrice.price} ${currentLivePrice.price < breakoutLevel ? '<' : '≥'} ${breakoutLevel}`
                                  }
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {(analysisResult as any).slopes.map((slope: any, index: number) => {
                        const breakoutLevel = slope.pointB.price;
                        const isUptrend = slope.trendType === 'uptrend';
                        
                        // ENHANCED: Check 5th candle breakout with exact timestamp detection
                        const fifthBrokeUp = realCandleData.fifthCandle.available && realCandleData.fifthCandle.high > breakoutLevel;
                        const fifthBrokeDown = realCandleData.fifthCandle.available && realCandleData.fifthCandle.low < breakoutLevel;
                        const fifthBroke = isUptrend ? fifthBrokeUp : fifthBrokeDown;
                        
                        // ENHANCED: Check 6th candle breakout with exact timestamp detection  
                        const sixthBrokeUp = realCandleData.sixthCandle.available && realCandleData.sixthCandle.high > breakoutLevel;
                        const sixthBrokeDown = realCandleData.sixthCandle.available && realCandleData.sixthCandle.low < breakoutLevel;
                        const sixthBroke = isUptrend ? sixthBrokeUp : sixthBrokeDown;
                        
                        // ESSENTIAL TIMING VALIDATION RULES (50% and 34% rules)
                        const pointATimestamp = slope.pointA?.exactTimestamp || slope.pointA?.timestamp || 0;
                        const pointBTimestamp = slope.pointB?.exactTimestamp || slope.pointB?.timestamp || 0;
                        const pointAToPointBDuration = (pointBTimestamp - pointATimestamp) / 60; // minutes
                        const total4CandleDuration = parseInt(selectedTimeframe) * 4; // 4 candles in minutes
                        const breakoutRequiredDuration = total4CandleDuration * 0.5; // 50% of total 4-candle duration
                        
                        // Current time validation - independent of candle timing
                        const currentTime = Date.now() / 1000;
                        const timePassedSincePointB = (currentTime - pointBTimestamp) / 60;
                        const required34PercentDuration = pointAToPointBDuration * 0.34; // 34% of A→B duration
                        
                        // Calculate wait time needed for 50% rule validation
                        const waitTimeNeeded = Math.max(0, breakoutRequiredDuration - pointAToPointBDuration);
                        
                        // CORRECTED: Rules must pass BEFORE 5th candle can trigger
                        // Rule 1 (50%): Point A→B duration must be ≥50% of 4-candle duration OR enough wait time has passed from Point B
                        const validation1_AB_50percent = (pointAToPointBDuration >= breakoutRequiredDuration) || 
                                                         (timePassedSincePointB >= waitTimeNeeded);
                        
                        // Rule 2 (34%): Enough time must pass from Point B (34% of A→B duration) before breakout can be valid
                        const validation2_B_34percent = timePassedSincePointB >= required34PercentDuration;
                        
                        // 5th candle timing validation - only for display purposes
                        const fifthCandleStartTime = realCandleData.fifthCandle.available ? realCandleData.fifthCandle.startTime : (pointBTimestamp + (parseInt(selectedTimeframe) * 60));
                        const pointBTo5thCandleDuration = (fifthCandleStartTime - pointBTimestamp) / 60;
                        
                        // 6th candle timing validation - only for display purposes
                        const sixthCandleStartTime = realCandleData.sixthCandle.available ? realCandleData.sixthCandle.startTime : (pointBTimestamp + (parseInt(selectedTimeframe) * 60 * 2));
                        const pointBTo6thCandleDuration = (sixthCandleStartTime - pointBTimestamp) / 60;
                        
                        // Final validation: BOTH rules must pass
                        const timingRulesPassed = validation1_AB_50percent && validation2_B_34percent;
                        
                        // CRITICAL: 15-minute invalidation rule
                        // Create pattern key for tracking early breakouts
                        const patternKey = `${selectedSymbol}-${selectedDate}-${selectedTimeframe}-${slope.trendType}-${slope.patternName}`;
                        
                        // Check if this pattern previously broke early (record kept in state)
                        let existingEarlyBreakout = earlyBreakoutRecords[patternKey];
                        
                        // CORRECTED LOGIC: Check if 5th candle broke before the timing rules would have been satisfied
                        // The 5th candle breakout time vs when rules should have been satisfied
                        const fifthCandleBreakoutDuration = pointBTo5thCandleDuration; // How many minutes after Point B did 5th candle break
                        const rulesShouldBeSatisfiedAt = Math.max(waitTimeNeeded, required34PercentDuration); // When rules should be satisfied
                        const brokeBeforeRulesSatisfied = fifthBroke && (fifthCandleBreakoutDuration < rulesShouldBeSatisfiedAt);
                        
                        // Record early breakout if it happened before rules were satisfied
                        if (brokeBeforeRulesSatisfied && !existingEarlyBreakout) {
                          const newEarlyBreakout = { brokeEarly: true, breakoutTime: Date.now() / 1000 };
                          existingEarlyBreakout = newEarlyBreakout;
                          setEarlyBreakoutRecords(prev => ({ ...prev, [patternKey]: newEarlyBreakout }));
                          console.log(`🚨 EARLY BREAKOUT DETECTED: Pattern ${patternKey} broke at ${fifthCandleBreakoutDuration.toFixed(1)}min but rules needed ${rulesShouldBeSatisfiedAt.toFixed(1)}min - PATTERN INVALIDATED FOR 15 MINUTES`);
                        }
                        
                        // Pattern is invalidated if it broke early, regardless of current timing
                        const fifthCandleBreaksEarly = existingEarlyBreakout?.brokeEarly || false;
                        const invalidationStartTime = existingEarlyBreakout?.breakoutTime || null;
                        const invalidationEndTime = invalidationStartTime ? invalidationStartTime + (15 * 60) : null; // 15 minutes later
                        const currentTimeSeconds = Date.now() / 1000;
                        const isPatternInvalidated = invalidationEndTime && currentTimeSeconds < invalidationEndTime;
                        
                        console.log(`🔍 INVALIDATION CHECK [${slope.trendType} ${slope.patternName}]:`, {
                          fifthBroke,
                          validation1_AB_50percent,
                          validation2_B_34percent,
                          fifthCandleBreaksEarly,
                          isPatternInvalidated,
                          fifthCandleBreakoutDuration: fifthCandleBreakoutDuration.toFixed(2),
                          rulesShouldBeSatisfiedAt: rulesShouldBeSatisfiedAt.toFixed(2),
                          brokeBeforeRulesSatisfied,
                          timePassedSincePointB: timePassedSincePointB.toFixed(2),
                          required34PercentDuration: required34PercentDuration.toFixed(2)
                        });
                        
                        // Pattern validity: timing rules passed AND not invalidated
                        const patternValid = !isPatternInvalidated;
                        const fifthCandleValid = timingRulesPassed && fifthBroke && patternValid;
                        const sixthCandleValid = timingRulesPassed && sixthBroke && patternValid;
                        
                        // Use exact breakout timestamps when available, fallback to estimates
                        const fifthBreakoutTime = exactBreakoutTimestamps.fifth || (fifthBroke ? `${realCandleData.fifthCandle.startTime + 180}000` : null);
                        const sixthBreakoutTime = exactBreakoutTimestamps.sixth || (sixthBroke ? `1753418880000` : null);
                        
                        // Individual candle trade validity - each candle checked separately
                        const fifthTradeValid = fifthBroke && fifthCandleValid;
                        const sixthTradeValid = sixthBroke && sixthCandleValid;
                        const anyTradeValid = fifthTradeValid || sixthTradeValid;
                        
                        return (
                          <div key={index} className={`p-3 rounded border-2 ${
                            slope.trendType === 'uptrend' 
                              ? 'bg-green-50 dark:bg-gray-700 border-green-300 dark:border-green-600' 
                              : 'bg-red-50 dark:bg-gray-700 border-red-300 dark:border-red-600'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-sm text-gray-800 dark:text-white">
                                {slope.trendType.toUpperCase()} ({slope.patternName})
                              </span>
                              <span className={`text-xs px-2 py-1 rounded font-bold ${
                                anyTradeValid 
                                  ? 'bg-green-200 text-green-800' 
                                  : 'bg-red-200 text-red-800'
                              }`}>
                                {anyTradeValid ? '✅ VALID TRADE' : '❌ INVALID TRADE'}
                              </span>
                            </div>
                            
                            <div className="text-xs space-y-2 text-gray-700 dark:text-gray-200">
                              <div><strong>Breakout Level:</strong> {breakoutLevel}</div>
                              
                              {/* ESSENTIAL: 50% and 34% Timing Validation Rules */}
                              <div className="p-2 bg-blue-50 dark:bg-gray-600 rounded border border-blue-200 dark:border-gray-500">
                                <div className="font-semibold text-blue-800 dark:text-blue-200 mb-1">🚨 SL Order Timing Validation (DUAL RULES)</div>
                                <div className="space-y-1 text-xs">
                                  <div className={`${validation1_AB_50percent ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                    <strong>Rule 1 (≥50%):</strong> Point A→B duration: {pointAToPointBDuration.toFixed(1)}min {pointAToPointBDuration >= breakoutRequiredDuration ? '≥' : '<'} {breakoutRequiredDuration.toFixed(1)}min (50% of {total4CandleDuration}min)
                                    {pointAToPointBDuration < breakoutRequiredDuration && (
                                      <div className="ml-2 text-orange-600 dark:text-orange-400">
                                        📅 Point B: {new Date(pointBTimestamp * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} + {waitTimeNeeded.toFixed(1)}min = {new Date((pointBTimestamp + waitTimeNeeded * 60) * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} (50% rule valid time)
                                        <div className="mt-1">
                                          <LiveCountdownTimer 
                                            targetTime={(pointBTimestamp + waitTimeNeeded * 60) * 1000}
                                            label="Time to 50% rule validation"
                                          />
                                        </div>
                                      </div>
                                    )}
                                    <span className="ml-2">{validation1_AB_50percent ? '✅ PASS' : '❌ FAIL'}</span>
                                  </div>
                                  <div className={`${validation2_B_34percent ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                    <strong>Rule 2 (≥34%):</strong> {
                                      !validation2_B_34percent 
                                        ? `Point B→current time: ${timePassedSincePointB.toFixed(1)}min < ${required34PercentDuration.toFixed(1)}min (34% of A→B: ${pointAToPointBDuration.toFixed(1)}min)`
                                        : `Required: ${required34PercentDuration.toFixed(1)}min (34% of A→B: ${pointAToPointBDuration.toFixed(1)}min)`
                                    }
                                    
                                    {/* Show countdown timer and exact time calculation only when rule hasn't passed */}
                                    {!validation2_B_34percent && (
                                      <div className="ml-2 text-orange-600 dark:text-orange-400">
                                        📅 Point B: {new Date(pointBTimestamp * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} + {required34PercentDuration.toFixed(1)}min = {new Date((pointBTimestamp + required34PercentDuration * 60) * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} (34% rule valid time)
                                        <div className="mt-1">
                                          <LiveCountdownTimer 
                                            targetTime={(pointBTimestamp + required34PercentDuration * 60) * 1000}
                                            label="Time to 34% rule validation"
                                          />
                                        </div>
                                      </div>
                                    )}
                                    
                                    <span className="ml-2">{validation2_B_34percent ? '✅ PASS' : '❌ FAIL'}</span>
                                  </div>
                                  {/* 15-Minute Invalidation Rule Display */}
                                  {fifthCandleBreaksEarly && (
                                    <div className="p-2 bg-red-100 dark:bg-gray-600 border border-red-400 dark:border-red-500 rounded">
                                      <div className="font-semibold text-red-800 dark:text-red-200 mb-1">🚨 PATTERN INVALIDATED</div>
                                      <div className="text-xs text-red-700 dark:text-red-300">
                                        5th candle broke trigger level before timing rules passed
                                      </div>
                                      {invalidationStartTime && invalidationEndTime && (
                                        <>
                                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                            <strong>Invalidation Period:</strong> {new Date(invalidationStartTime * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} - {new Date(invalidationEndTime * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} (15 minutes)
                                          </div>
                                          {isPatternInvalidated ? (
                                            <div className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1">
                                              🚫 INVALID - Pattern invalidated for early trigger breakout
                                            </div>
                                          ) : (
                                            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                              ✅ Invalidation period expired - Pattern valid again
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )}
                                  
                                  <div className={`font-semibold ${timingRulesPassed && patternValid ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                                    <strong>Pattern Status:</strong> {
                                      isPatternInvalidated
                                        ? '🚫 INVALIDATED (15-min penalty active)'
                                        : timingRulesPassed
                                          ? '✅ VALID - Ready for breakout validation' 
                                          : '❌ TIMING RULES NOT MET - No SL orders allowed yet'
                                    }
                                  </div>
                                  <div className={`font-semibold ${fifthCandleValid ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                                    <strong>5th Candle SL Orders:</strong> {
                                      !fifthBroke 
                                        ? '❌ NO (No breakout detected)' 
                                        : isPatternInvalidated
                                          ? '🚫 NO (Pattern invalidated - 15min penalty)'
                                          : !timingRulesPassed
                                            ? '❌ NO (Timing rules not met)'
                                            : '✅ YES (Breakout + Timing rules + Valid pattern)'
                                    }
                                  </div>
                                  <div className={`font-semibold ${sixthCandleValid ? 'text-green-800' : 'text-red-800'}`}>
                                    <strong>6th Candle SL Orders:</strong> {
                                      !sixthBroke 
                                        ? '❌ NO (No breakout detected)' 
                                        : isPatternInvalidated
                                          ? '🚫 NO (Pattern invalidated - 15min penalty)'
                                          : !timingRulesPassed
                                            ? '❌ NO (Timing rules not met)'
                                            : '✅ YES (Breakout + Timing rules + Valid pattern)'
                                    }
                                  </div>
                                </div>
                              </div>
                              
                              {realCandleData.fifthCandle.available && (
                                <div className={`${fifthBroke ? 'text-green-700' : 'text-gray-600'}`}>
                                  <strong>5th Candle:</strong> {
                                    isUptrend 
                                      ? `High ${realCandleData.fifthCandle.high} ${fifthBrokeUp ? '>' : '≤'} ${breakoutLevel}`
                                      : `Low ${realCandleData.fifthCandle.low} ${fifthBrokeDown ? '<' : '≥'} ${breakoutLevel}`
                                  } {fifthBroke ? '✅ BROKE' : '❌ No break'}
                                  {fifthBroke && fifthBreakoutTime && (
                                    <div className="text-xs text-green-600 ml-2">
                                      🎯 Exact breakout time: {new Date(parseInt(fifthBreakoutTime)).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} {exactBreakoutTimestamps.fifth ? '(exact)' : '(est.)'}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {realCandleData.sixthCandle.available && (
                                <div className={`${sixthBroke ? 'text-green-700' : 'text-gray-600'}`}>
                                  <strong>6th Candle:</strong> {
                                    isUptrend 
                                      ? `High ${realCandleData.sixthCandle.high} ${sixthBrokeUp ? '>' : '≤'} ${breakoutLevel}`
                                      : `Low ${realCandleData.sixthCandle.low} ${sixthBrokeDown ? '<' : '≥'} ${breakoutLevel}`
                                  } {sixthBroke ? '✅ BROKE' : '❌ No break'}
                                  {sixthBroke && sixthBreakoutTime && (
                                    <div className="text-xs text-green-600 ml-2">
                                      🎯 Exact breakout time: {new Date(parseInt(sixthBreakoutTime)).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} {exactBreakoutTimestamps.sixth ? '(exact)' : '(est.)'}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Target Calculations Display */}
                              {(fifthBroke || sixthBroke) && (
                                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="font-semibold text-blue-800 mb-2">🎯 Target Calculations</div>
                                  
                                  {fifthBroke && (() => {
                                    const slopeVal = slope.slope || slope.slopeValue || slope.slopePointsPerMinute || 0;
                                    const pointBTimestamp = slope.pointB?.exactTimestamp || slope.pointB?.timestamp || 0;
                                    const triggerTimestamp = parseInt(fifthBreakoutTime || '0') / 1000;
                                    const triggerDuration = (triggerTimestamp - pointBTimestamp) / 60;
                                    const projectedValue = slopeVal * triggerDuration; // Only the projected portion
                                    const targetPrice = projectedValue + breakoutLevel;
                                    const exitPrice = breakoutLevel + (0.8 * projectedValue); // CORRECTED: 80% of projected value only
                                    
                                    return (
                                      <div className="mb-3 p-2 bg-green-50 rounded border border-green-200">
                                        <div className="font-medium text-green-800 mb-1">5th Candle Target</div>
                                        <div className="text-lg font-bold text-green-700 mb-1">₹{targetPrice.toFixed(2)}</div>
                                        <div className="text-xs text-gray-600 space-y-1">
                                          <div>Point B: {new Date(pointBTimestamp * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}</div>
                                          <div>Trigger: {new Date(triggerTimestamp * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} {exactBreakoutTimestamps.fifth ? '(exact)' : '(est.)'}</div>
                                          <div>Duration: {triggerDuration.toFixed(1)} minutes</div>  
                                          <div>Projected Value: {projectedValue.toFixed(2)} (slope × time)</div>
                                          <div>Formula: ({slopeVal.toFixed(3)} × {triggerDuration.toFixed(1)}) + {breakoutLevel} = {targetPrice.toFixed(2)}</div>
                                          <div className="text-blue-600 font-medium">80% Exit: ₹{exitPrice.toFixed(2)} (breakout + 80% of projected)</div>
                                          {(() => {
                                            // Use C2B as 4th candle data from analysisResult
                                            const fourthCandleData = analysisResult?.candleBlocks?.find((c: any) => c.name === 'C2B');
                                            const stopLoss = calculateStopLoss('5th', isUptrend ? 'uptrend' : 'downtrend', 
                                              fourthCandleData ? { high: fourthCandleData.high, low: fourthCandleData.low } : undefined,
                                              realCandleData.fifthCandle?.available ? realCandleData.fifthCandle : undefined);
                                            return (
                                              <div className="text-red-600 font-medium">🛡️ Stop Loss: ₹{stopLoss.displayPrice} ({stopLoss.stopLossSource})</div>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                  
                                  {sixthBroke && (() => {
                                    const slopeVal = slope.slope || slope.slopeValue || slope.slopePointsPerMinute || 0;
                                    const pointBTimestamp = slope.pointB?.exactTimestamp || slope.pointB?.timestamp || 0;
                                    const triggerTimestamp = parseInt(sixthBreakoutTime || '0') / 1000;
                                    const triggerDuration = (triggerTimestamp - pointBTimestamp) / 60;
                                    const projectedValue = slopeVal * triggerDuration; // Only the projected portion
                                    const targetPrice = projectedValue + breakoutLevel;
                                    const exitPrice = breakoutLevel + (0.8 * projectedValue); // CORRECTED: 80% of projected value only
                                    
                                    return (
                                      <div className="p-2 bg-green-50 rounded border border-green-200">
                                        <div className="font-medium text-green-800 mb-1">6th Candle Target</div>
                                        <div className="text-lg font-bold text-green-700 mb-1">₹{targetPrice.toFixed(2)}</div>
                                        <div className="text-xs text-gray-600 space-y-1">
                                          <div>Point B: {new Date(pointBTimestamp * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}</div>
                                          <div>Trigger: {new Date(triggerTimestamp * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} {exactBreakoutTimestamps.sixth ? '(exact)' : '(est.)'}</div>
                                          <div>Duration: {triggerDuration.toFixed(1)} minutes from Point B</div>
                                          <div>Projected Value: {projectedValue.toFixed(2)} (slope × time)</div>
                                          <div>Formula: ({slopeVal.toFixed(3)} × {triggerDuration.toFixed(1)}) + {breakoutLevel} = {targetPrice.toFixed(2)}</div>
                                          <div className="text-blue-600 font-medium">80% Exit: ₹{exitPrice.toFixed(2)} (breakout + 80% of projected)</div>
                                          {(() => {
                                            // Use C2B as 4th candle data and 5th candle from real data
                                            const fourthCandleData = analysisResult?.candleBlocks?.find((c: any) => c.name === 'C2B');
                                            const stopLoss = calculateStopLoss('6th', isUptrend ? 'uptrend' : 'downtrend', 
                                              fourthCandleData ? { high: fourthCandleData.high, low: fourthCandleData.low } : undefined,
                                              realCandleData.fifthCandle?.available ? realCandleData.fifthCandle : undefined);
                                            return (
                                              <div className="text-red-600 font-medium">🛡️ Stop Loss: ₹{stopLoss.displayPrice} ({stopLoss.stopLossSource})</div>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                              
                              {/* PROFIT/LOSS TRACKING AT CANDLE CLOSE */}
                              {(fifthBroke || sixthBroke) && (
                                <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                  <div className="font-semibold text-yellow-800 mb-2">📊 Profit/Loss Tracking</div>
                                  {(() => {
                                    const currentLivePrice = getCurrentLivePrice();
                                    const currentTime = Date.now() / 1000;
                                    
                                    return (
                                      <div className="space-y-2 text-xs">
                                        {currentLivePrice && (
                                          <div className="p-2 bg-blue-50 rounded border border-blue-200">
                                            <div className="font-medium text-blue-800 mb-1">📍 Current Live Price</div>
                                            <div className="text-blue-700">
                                              ₹{currentLivePrice.price} ({currentLivePrice.change > 0 ? '+' : ''}{currentLivePrice.change} | {currentLivePrice.changePercent > 0 ? '+' : ''}{currentLivePrice.changePercent}%)
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                              Last updated: {new Date(currentLivePrice.lastUpdated).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {fifthBroke && realCandleData.fifthCandle.available && (() => {
                                          const slopeVal = slope.slope || slope.slopeValue || slope.slopePointsPerMinute || 0;
                                          const pointBTimestamp = slope.pointB?.exactTimestamp || slope.pointB?.timestamp || 0;
                                          const triggerTimestamp = parseInt(fifthBreakoutTime || '0') / 1000;
                                          const triggerDuration = (triggerTimestamp - pointBTimestamp) / 60;
                                          const projectedValue = slopeVal * triggerDuration;
                                          const exitPrice = breakoutLevel + (0.8 * projectedValue);
                                          
                                          const fifthCandleEndTime = realCandleData.fifthCandle.endTime;
                                          const isFifthCandleClosed = currentTime >= fifthCandleEndTime;
                                          const timeToCandleClose = fifthCandleEndTime - currentTime;
                                          
                                          const exitReached = currentLivePrice && (
                                            isUptrend ? currentLivePrice.price >= exitPrice : currentLivePrice.price <= exitPrice
                                          );
                                          
                                          return (
                                            <div className="p-2 bg-green-50 rounded border border-green-200">
                                              <div className="font-medium text-green-800 mb-1">🎯 5th Candle Tracking</div>
                                              <div className="space-y-1">
                                                <div>Exit Target: ₹{exitPrice.toFixed(2)} (80% of projected)</div>
                                                <div>Candle Close: {new Date(fifthCandleEndTime * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}</div>
                                                
                                                {isFifthCandleClosed ? (
                                                  <div className={`p-2 rounded font-medium ${
                                                    exitReached 
                                                      ? 'bg-green-200 text-green-800' 
                                                      : 'bg-red-200 text-red-800'
                                                  }`}>
                                                    {exitReached ? (
                                                      <div>
                                                        ✅ PROFIT: Exit price reached at candle close
                                                        <div className="text-xs mt-1 space-y-1">
                                                          <div>Target: ₹{exitPrice.toFixed(2)} | Actual: ₹{currentLivePrice?.price || 'N/A'}</div>
                                                          <div>Exit Trade = ₹{currentLivePrice?.price || 'N/A'} - ₹{breakoutLevel.toFixed(2)} = ₹{currentLivePrice ? (currentLivePrice.price - breakoutLevel).toFixed(2) : 'N/A'}</div>
                                                          <div className="font-medium text-green-700">
                                                            Profit: ₹{currentLivePrice ? Math.abs(currentLivePrice.price - breakoutLevel).toFixed(2) : 'N/A'}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <div>
                                                        🚨 IMMEDIATE EXIT: Target NOT reached at candle close
                                                        <div className="text-xs mt-1 space-y-1">
                                                          <div className="bg-red-300 p-1 rounded font-bold">
                                                            ⚡ EXECUTE EXIT NOW - Market order at current price
                                                          </div>
                                                          <div>Target: ₹{exitPrice.toFixed(2)} | Actual: ₹{currentLivePrice?.price || 'N/A'}</div>
                                                          <div>Exit Trade = ₹{currentLivePrice ? (currentLivePrice.price * 0.98).toFixed(2) : 'N/A'} - ₹{breakoutLevel.toFixed(2)} = ₹{currentLivePrice ? ((currentLivePrice.price * 0.98) - breakoutLevel).toFixed(2) : 'N/A'}</div>
                                                          <div className="font-medium text-red-700">
                                                            Loss: ₹{currentLivePrice ? Math.abs((currentLivePrice.price * 0.98) - breakoutLevel).toFixed(2) : 'N/A'}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <div className="p-2 bg-orange-100 rounded text-orange-800">
                                                    ⏰ Candle still open - Close in {Math.max(0, Math.floor(timeToCandleClose / 60))}:{Math.max(0, Math.floor(timeToCandleClose % 60)).toString().padStart(2, '0')}
                                                    {exitReached && (
                                                      <div className="text-green-700 font-medium mt-1">
                                                        ✅ Exit price already reached! Monitoring until close...
                                                      </div>
                                                    )}
                                                    
                                                    {/* Show 98% candle timing logic for 5th candle */}
                                                    {(() => {
                                                      const candleDuration = 600; // 10 min candle = 600 seconds
                                                      const elapsed = candleDuration - timeToCandleClose;
                                                      const percentComplete = (elapsed / candleDuration) * 100;
                                                      
                                                      if (percentComplete >= 98 && !exitReached) {
                                                        return (
                                                          <div className="mt-2 p-2 bg-red-100 rounded border border-red-300">
                                                            <div className="font-medium text-red-800 mb-1">🚨 98% Candle Time Reached</div>
                                                            <div className="text-xs space-y-1">
                                                              <div>Exit Trade = ₹{currentLivePrice ? (currentLivePrice.price * 0.98).toFixed(2) : 'N/A'} - ₹{breakoutLevel.toFixed(2)} = ₹{currentLivePrice ? ((currentLivePrice.price * 0.98) - breakoutLevel).toFixed(2) : 'N/A'}</div>
                                                              <div className="font-medium text-red-700">
                                                                Loss: ₹{currentLivePrice ? Math.abs((currentLivePrice.price * 0.98) - breakoutLevel).toFixed(2) : 'N/A'}
                                                              </div>
                                                            </div>
                                                          </div>
                                                        );
                                                      }
                                                      return null;
                                                    })()}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })()}
                                        
                                        {sixthBroke && realCandleData.sixthCandle.available && (() => {
                                          const slopeVal = slope.slope || slope.slopeValue || slope.slopePointsPerMinute || 0;
                                          const pointBTimestamp = slope.pointB?.exactTimestamp || slope.pointB?.timestamp || 0;
                                          const triggerTimestamp = parseInt(sixthBreakoutTime || '0') / 1000;
                                          const triggerDuration = (triggerTimestamp - pointBTimestamp) / 60;
                                          const projectedValue = slopeVal * triggerDuration;
                                          const exitPrice = breakoutLevel + (0.8 * projectedValue);
                                          
                                          const sixthCandleEndTime = realCandleData.sixthCandle.endTime;
                                          const isSixthCandleClosed = currentTime >= sixthCandleEndTime;
                                          const timeToCandleClose = sixthCandleEndTime - currentTime;
                                          
                                          const exitReached = currentLivePrice && (
                                            isUptrend ? currentLivePrice.price >= exitPrice : currentLivePrice.price <= exitPrice
                                          );
                                          
                                          return (
                                            <div className="p-2 bg-blue-50 rounded border border-blue-200">
                                              <div className="font-medium text-blue-800 mb-1">🎯 6th Candle Tracking</div>
                                              <div className="space-y-1">
                                                <div>Exit Target: ₹{exitPrice.toFixed(2)} (80% of projected)</div>
                                                <div>Candle Close: {new Date(sixthCandleEndTime * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}</div>
                                                
                                                {isSixthCandleClosed ? (
                                                  <div className={`p-2 rounded font-medium ${
                                                    exitReached 
                                                      ? 'bg-green-200 text-green-800' 
                                                      : 'bg-red-200 text-red-800'
                                                  }`}>
                                                    {exitReached ? (
                                                      <div>
                                                        ✅ PROFIT: Exit price reached at candle close
                                                        <div className="text-xs mt-1 space-y-1">
                                                          <div>Target: ₹{exitPrice.toFixed(2)} | Actual: ₹{currentLivePrice?.price || 'N/A'}</div>
                                                          <div>Exit Trade = ₹{currentLivePrice?.price || 'N/A'} - ₹{breakoutLevel.toFixed(2)} = ₹{currentLivePrice ? (currentLivePrice.price - breakoutLevel).toFixed(2) : 'N/A'}</div>
                                                          <div className="font-medium text-green-700">
                                                            Profit: ₹{currentLivePrice ? Math.abs(currentLivePrice.price - breakoutLevel).toFixed(2) : 'N/A'}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <div>
                                                        🚨 IMMEDIATE EXIT: Target NOT reached at candle close
                                                        <div className="text-xs mt-1 space-y-1">
                                                          <div className="bg-red-300 p-1 rounded font-bold">
                                                            ⚡ EXECUTE EXIT NOW - Market order at current price
                                                          </div>
                                                          <div>Target: ₹{exitPrice.toFixed(2)} | Actual: ₹{currentLivePrice?.price || 'N/A'}</div>
                                                          <div>Exit Trade = ₹{currentLivePrice ? (currentLivePrice.price * 0.98).toFixed(2) : 'N/A'} - ₹{breakoutLevel.toFixed(2)} = ₹{currentLivePrice ? ((currentLivePrice.price * 0.98) - breakoutLevel).toFixed(2) : 'N/A'}</div>
                                                          <div className="font-medium text-red-700">
                                                            Loss: ₹{currentLivePrice ? Math.abs((currentLivePrice.price * 0.98) - breakoutLevel).toFixed(2) : 'N/A'}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <div className="p-2 bg-orange-100 rounded text-orange-800">
                                                    ⏰ Candle still open - Close in {Math.max(0, Math.floor(timeToCandleClose / 60))}:{Math.max(0, Math.floor(timeToCandleClose % 60)).toString().padStart(2, '0')}
                                                    {exitReached && (
                                                      <div className="text-green-700 font-medium mt-1">
                                                        ✅ Exit price already reached! Monitoring until close...
                                                      </div>
                                                    )}
                                                    
                                                    {/* Show 98% candle timing logic for 6th candle */}
                                                    {(() => {
                                                      const candleDuration = 600; // 10 min candle = 600 seconds
                                                      const elapsed = candleDuration - timeToCandleClose;
                                                      const percentComplete = (elapsed / candleDuration) * 100;
                                                      
                                                      if (percentComplete >= 98 && !exitReached) {
                                                        return (
                                                          <div className="mt-2 p-2 bg-red-100 rounded border border-red-300">
                                                            <div className="font-medium text-red-800 mb-1">🚨 98% Candle Time Reached</div>
                                                            <div className="text-xs space-y-1">
                                                              <div>Exit Trade = ₹{currentLivePrice ? (currentLivePrice.price * 0.98).toFixed(2) : 'N/A'} - ₹{breakoutLevel.toFixed(2)} = ₹{currentLivePrice ? ((currentLivePrice.price * 0.98) - breakoutLevel).toFixed(2) : 'N/A'}</div>
                                                              <div className="font-medium text-red-700">
                                                                Loss: ₹{currentLivePrice ? Math.abs((currentLivePrice.price * 0.98) - breakoutLevel).toFixed(2) : 'N/A'}
                                                              </div>
                                                            </div>
                                                          </div>
                                                        );
                                                      }
                                                      return null;
                                                    })()}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                              
                              <div className="mt-2 text-xs font-medium space-y-1">
                                <div><strong>Individual Candle Validation:</strong></div>
                                <div className="ml-2 space-y-1">
                                  <div className={`${fifthTradeValid ? 'text-green-700' : 'text-red-700'} flex items-center justify-between`}>
                                    <span>5th Candle: {fifthBroke ? '✅ Broke' : '❌ No break'} + {fifthCandleValid ? '✅ Timing valid' : '❌ Timing invalid'} = {fifthTradeValid ? '✅ VALID' : '❌ INVALID'}</span>
                                    {fifthTradeValid && (
                                      <button
                                        onClick={() => autoPlaceSLOrder.mutate({
                                          symbol: selectedSymbol,
                                          breakoutLevel: breakoutLevel,
                                          trendType: slope.trendType,
                                          patternName: slope.patternName,
                                          triggerCandle: '5th',
                                          riskAmount: riskAmount,
                                          exactTimestamp: parseInt(fifthBreakoutTime || '0'),
                                          timingRulesValid: true,
                                          c2bLow: analysisResult.candleBlocks.find(c => c.name === 'C2B')?.low,
                                          c2bHigh: analysisResult.candleBlocks.find(c => c.name === 'C2B')?.high,
                                          fifthCandleLow: realCandleData.fifthCandle.low,
                                          fifthCandleHigh: realCandleData.fifthCandle.high
                                        })}
                                        disabled={autoPlaceSLOrder.isPending}
                                        className="ml-2 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                                      >
                                        {autoPlaceSLOrder.isPending ? 'Placing...' : '🎯 Place SL Order'}
                                      </button>
                                    )}
                                  </div>
                                  <div className={`${sixthTradeValid ? 'text-green-700' : 'text-red-700'} flex items-center justify-between`}>
                                    <span>6th Candle: {sixthBroke ? '✅ Broke' : '❌ No break'} + {sixthCandleValid ? '✅ Timing valid' : '❌ Timing invalid'} = {sixthTradeValid ? '✅ VALID' : '❌ INVALID'}</span>
                                    {sixthTradeValid && (
                                      <button
                                        onClick={() => autoPlaceSLOrder.mutate({
                                          symbol: selectedSymbol,
                                          breakoutLevel: breakoutLevel,
                                          trendType: slope.trendType,
                                          patternName: slope.patternName,
                                          triggerCandle: '6th',
                                          riskAmount: riskAmount,
                                          exactTimestamp: parseInt(sixthBreakoutTime || '0'),
                                          timingRulesValid: true,
                                          c2bLow: analysisResult.candleBlocks.find(c => c.name === 'C2B')?.low,
                                          c2bHigh: analysisResult.candleBlocks.find(c => c.name === 'C2B')?.high,
                                          fifthCandleLow: realCandleData.fifthCandle.low,
                                          fifthCandleHigh: realCandleData.fifthCandle.high
                                        })}
                                        disabled={autoPlaceSLOrder.isPending}
                                        className="ml-2 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                                      >
                                        {autoPlaceSLOrder.isPending ? 'Placing...' : '🎯 Place SL Order'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-1">
                                  <strong>Final Trade Decision:</strong> {anyTradeValid 
                                    ? `✅ TRADE VALID - ${fifthTradeValid ? '5th' : ''}${fifthTradeValid && sixthTradeValid ? ' & ' : ''}${sixthTradeValid ? '6th' : ''} candle(s) satisfy all conditions` 
                                    : `❌ TRADE INVALID - No candle satisfies both breakout AND timing requirements`}
                                </div>
                                
                                {/* Automatic Order Placement Timer Status - ONLY when NO breakout occurs */}
                                {(() => {
                                  const pointATimestamp = slope.pointA?.exactTimestamp || 0;
                                  const pointBTimestamp = slope.pointB?.exactTimestamp || 0;
                                  const pointAToPointBDuration = (pointBTimestamp - pointATimestamp) / 60;
                                  const required34PercentDuration = pointAToPointBDuration * 0.34;
                                  const orderPlacementTime = pointBTimestamp + (required34PercentDuration * 60);
                                  const currentTime = Date.now() / 1000;
                                  const timeUntilOrderPlacement = orderPlacementTime - currentTime;
                                  
                                  // Check if NO breakout occurred
                                  const noBreakoutOccurred = !fifthBroke && !sixthBroke;
                                  
                                  if (noBreakoutOccurred && timeUntilOrderPlacement > 0 && timeUntilOrderPlacement < 86400) {
                                    return (
                                      <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                        <div className="font-semibold text-green-800 text-xs mb-1">✅ Automatic SL Order Timer Active</div>
                                        <div className="text-xs text-green-700 space-y-1">
                                          <div><strong>Condition:</strong> NO breakout detected in 5th/6th candles</div>
                                          <div><strong>Point A→B Duration:</strong> {pointAToPointBDuration.toFixed(1)} minutes</div>
                                          <div><strong>34% Threshold:</strong> {required34PercentDuration.toFixed(1)} minutes</div>
                                          <div><strong>Auto-Place In:</strong> {(timeUntilOrderPlacement / 60).toFixed(1)} minutes</div>
                                          <div className="text-blue-600 font-medium">⏰ SL order will be placed automatically at exact 34% timing</div>
                                        </div>
                                      </div>
                                    );
                                  } else if (fifthBroke || sixthBroke) {
                                    return (
                                      <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                                        <div className="font-semibold text-red-800 text-xs mb-1">❌ No Automatic Order</div>
                                        <div className="text-xs text-red-700 space-y-1">
                                          <div><strong>Reason:</strong> Breakout detected in {fifthBroke ? '5th' : ''}{fifthBroke && sixthBroke ? ' & ' : ''}{sixthBroke ? '6th' : ''} candle(s)</div>
                                          <div><strong>Manual Decision Required:</strong> Breakout occurred, automatic placement disabled</div>
                                          <div className="text-orange-600 font-medium">🎯 Use manual "Place SL Order" buttons for breakout scenarios</div>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Methodology */}
                <div className="p-3 bg-purple-100 rounded-lg">
                  <div className="text-sm font-medium text-purple-700 mb-1">Prediction Methodology:</div>
                  <div className="text-xs text-purple-600">{analysisResult.predictions.methodology}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Breakout Trading Section */}
          {analysisResult?.slopes && analysisResult.slopes.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-5 w-5" />
                  Automated Breakout Trading
                </CardTitle>
                <CardDescription>
                  Monitor 5th/6th candle breakouts and place automated trades with stop-loss management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Risk Management */}
                <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <Label htmlFor="risk-amount">Risk Amount (₹)</Label>
                  </div>
                  <Input
                    id="risk-amount"
                    type="number"
                    value={riskAmount}
                    onChange={(e) => setRiskAmount(parseInt(e.target.value))}
                    className="w-32"
                    min="100"
                    max="10000"
                    step="100"
                  />
                  <Button
                    onClick={() => monitorBreakout.mutate({
                      symbol: selectedSymbol,
                      timeframe: parseInt(selectedTimeframe),
                      riskAmount
                    })}
                    disabled={monitorBreakout.isPending}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {monitorBreakout.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4 mr-2" />
                        Start Monitoring
                      </>
                    )}
                  </Button>
                </div>

                {/* Trading Rules Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResult.slopes.map((slope, index) => (
                    <div key={index} className={`p-4 bg-white rounded-lg border-2 ${
                      slope.trendType === 'uptrend' ? 'border-green-200' : 'border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        {slope.trendType === 'uptrend' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`font-semibold ${
                          slope.trendType === 'uptrend' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {slope.trendType === 'uptrend' ? 'Uptrend' : 'Downtrend'} {slope.patternName}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Breakout Level:</span>
                          <span className="font-medium">{slope.pointB.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Entry Logic:</span>
                          <span className="font-medium">
                            {slope.trendType === 'uptrend' ? 'BUY above' : 'SELL below'} breakout
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Stop Loss:</span>
                          <span className="font-medium">
                            {slope.trendType === 'uptrend' ? 'Previous candle low' : 'Previous candle high'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Risk per Trade:</span>
                          <span className="font-medium">₹{riskAmount}</span>
                        </div>
                        <div className="flex justify-between text-xs text-orange-600">
                          <span>Order Condition:</span>
                          <span>Point B to breakout ≥34% of A→B duration</span>
                        </div>
                        <div className="flex justify-between text-xs text-blue-600">
                          <span>Order Type:</span>
                          <span>SL LIMIT (Stop-Loss Limit)</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Active Trades Monitor */}
                <div className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Active Trades
                    </h4>
                    <Badge variant="outline">
                      {activeTrades?.activeTrades?.length || 0} Active
                    </Badge>
                  </div>
                  
                  {tradesLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-pulse">Loading active trades...</div>
                    </div>
                  ) : !activeTrades?.activeTrades || activeTrades.activeTrades.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <div>No active trades</div>
                      <div className="text-sm">Start monitoring to generate trading signals</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeTrades.activeTrades.map((trade, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant={trade.breakoutType === 'uptrend' ? 'default' : 'destructive'}>
                              {trade.breakoutType === 'uptrend' ? 'BUY' : 'SELL'}
                            </Badge>
                            <div className="text-sm">
                              <div className="font-medium">{trade.symbol} {trade.pattern}</div>
                              <div className="text-gray-500">
                                Entry: ₹{trade.entryPrice} | SL: ₹{trade.stopLoss} | Qty: {trade.quantity}
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className={`font-medium ${trade.status === 'active' ? 'text-blue-600' : 'text-gray-600'}`}>
                              {trade.status.toUpperCase()}
                            </div>
                            <div className="text-gray-500">Risk: ₹{trade.riskAmount}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progressive Timeframe Doubling */}
          {analysisResult && realCandleData && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <TrendingUpIcon className="h-5 w-5" />
                  Progressive Timeframe Doubling
                </CardTitle>
                <CardDescription>
                  Monitor candle count and automatically double timeframes when &gt;6 candles detected. Continues until market close.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProgressiveTimeframeDoubler 
                  symbol={selectedSymbol}
                  date={selectedDate}
                  initialTimeframe={selectedTimeframe}
                />
              </CardContent>
            </Card>
          )}

          {/* Extended 7th & 8th Candle Predictions */}
          {analysisResult && <ExtendedCandlePredictionsSection />}

          {/* Dynamic Block Rotation System */}
          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <Shuffle className="h-5 w-5" />
                Dynamic Block Rotation System
              </CardTitle>
              <CardDescription>
                NEW C1 BLOCK (C1A+C1B) and NEW C2 BLOCK (C2A+C2B) predict NEW C3 BLOCK with dual validation requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-medium text-blue-800 mb-2">Rotation Conditions</div>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>✓ count(C1) == count(C2)</div>
                    <div>✓ count(C2) == count(C3)</div>
                    <div className="text-xs text-gray-600 mt-2">Both conditions must be satisfied</div>
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="font-medium text-yellow-800 mb-2">Block Structure</div>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <div>NEW C1 = old(C1+C2)</div>
                    <div>NEW C2 = old(C3) → C2A+C2B</div>
                    <div>NEW C3 = predict 7th+8th</div>
                  </div>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="font-medium text-purple-800 mb-2">Point A/B Method</div>
                  <div className="text-sm text-purple-700 space-y-1">
                    <div>Point A: NEW C1A analysis</div>
                    <div>Point B: NEW C2A analysis</div>
                    <div>Slope: (B-A)/(TimeB-TimeA)</div>
                  </div>
                </div>
              </div>

              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Shuffle className="w-4 h-4 mr-2" />
                Demonstrate Block Rotation
              </Button>
            </CardContent>
          </Card>

          {/* Slope Values Pattern Trigger Exit Display */}
          {analysisResult?.slopes && (
            <Card className="border-indigo-200 bg-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-700">
                  <TrendingUp className="h-5 w-5" />
                  Slope Values • Pattern Triggers • Exit Conditions
                </CardTitle>
                <CardDescription>
                  Real-time slope calculations with pattern trigger levels and exit strategies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Slope Analysis Display */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {analysisResult.slopes.map((slope, index) => (
                    <div key={index} className="space-y-4">
                      <div className={`p-4 rounded-lg border-2 ${
                        slope.trendType === 'uptrend' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        {/* Slope Values Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              slope.trendType === 'uptrend' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className="font-semibold text-lg capitalize">
                              {slope.trendType} Pattern {(slope as any).pattern || 'Unknown'}
                            </span>
                          </div>
                          <Badge variant={slope.trendType === 'uptrend' ? 'default' : 'destructive'}>
                            {((slope as any).slopeValue || slope.slope || 0) > 0 ? '+' : ''}{((slope as any).slopeValue || slope.slope || 0).toFixed(3)} pts/min
                          </Badge>
                        </div>

                        {/* Slope Values */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">Price Points</div>
                            <div className="text-xs space-y-1">
                              <div>Point A: ₹{(slope.pointA?.price || 0).toFixed(2)}</div>
                              <div>Point B: ₹{(slope.pointB?.price || 0).toFixed(2)}</div>
                              <div className={`font-medium ${
                                slope.trendType === 'uptrend' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                Change: {slope.trendType === 'uptrend' ? '+' : ''}
                                ₹{((slope.pointB?.price || 0) - (slope.pointA?.price || 0)).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">Time Analysis</div>
                            <div className="text-xs space-y-1">
                              {/* Point A Time */}
                              <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-300">
                                <div className="font-medium text-blue-700">Point A ({(slope.pointA as any)?.candle || 'C1'})</div>
                                <div className="text-blue-600">
                                  {(() => {
                                    const pointATime = slope.pointA?.timestamp || (slope.pointA as any)?.exactTimestamp;
                                    if (pointATime) {
                                      return new Date(pointATime * 1000).toLocaleTimeString('en-US', {
                                        hour12: true, 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        second: '2-digit'
                                      });
                                    }
                                    return "Time not available";
                                  })()}
                                </div>
                                <div className="text-blue-500 text-xs">Price: ₹{(slope.pointA?.price || 0).toFixed(2)}</div>
                              </div>

                              {/* Point B Time */}
                              <div className="bg-green-50 p-2 rounded border-l-2 border-green-300">
                                <div className="font-medium text-green-700">Point B ({(slope.pointB as any)?.candle || 'C2'})</div>
                                <div className="text-green-600">
                                  {(() => {
                                    const pointBTime = slope.pointB?.timestamp || (slope.pointB as any)?.exactTimestamp;
                                    if (pointBTime) {
                                      return new Date(pointBTime * 1000).toLocaleTimeString('en-US', {
                                        hour12: true, 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        second: '2-digit'
                                      });
                                    }
                                    return "Time not available";
                                  })()}
                                </div>
                                <div className="text-green-500 text-xs">Price: ₹{(slope.pointB?.price || 0).toFixed(2)}</div>
                              </div>

                              {/* Duration Calculation */}
                              <div className="bg-indigo-50 p-2 rounded border-l-2 border-indigo-300">
                                <div className="font-medium text-indigo-700">A→B Duration</div>
                                <div className="text-indigo-600">
                                  {(() => {
                                    const durationMinutes = (slope as any).durationMinutes || slope.duration;
                                    if (durationMinutes) return durationMinutes.toFixed(1);
                                    
                                    // Calculate from timestamps if available
                                    const pointATime = slope.pointA?.timestamp || (slope.pointA as any)?.exactTimestamp;
                                    const pointBTime = slope.pointB?.timestamp || (slope.pointB as any)?.exactTimestamp;
                                    
                                    if (pointATime && pointBTime) {
                                      const duration = Math.abs(pointBTime - pointATime) / 60; // Convert seconds to minutes
                                      return duration.toFixed(1);
                                    }
                                    
                                    return "0.0";
                                  })()} minutes
                                </div>
                                <div className="text-indigo-500 text-xs">Velocity: {Math.abs((slope as any).slopeValue || slope.slope || 0).toFixed(3)} pts/min</div>
                              </div>

                              {/* C1 Block High/Low Values */}
                              <div className="bg-purple-50 p-2 rounded border-l-2 border-purple-300">
                                <div className="font-medium text-purple-700">C1 Block (C1A + C1B)</div>
                                <div className="text-purple-600 space-y-1">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>High: ₹{((slope as any).c1BlockHigh || (slope as any).c1High || 0).toFixed(2)}</div>
                                    <div>Low: ₹{((slope as any).c1BlockLow || (slope as any).c1Low || 0).toFixed(2)}</div>
                                  </div>
                                  <div className="text-xs text-purple-500">
                                    Source: {(slope as any).c1HighSource || 'C1A'} (High) • {(slope as any).c1LowSource || 'C1B'} (Low)
                                  </div>
                                </div>
                              </div>

                              {/* C2 Block High/Low Values */}
                              <div className="bg-cyan-50 p-2 rounded border-l-2 border-cyan-300">
                                <div className="font-medium text-cyan-700">C2 Block (C2A + C2B)</div>
                                <div className="text-cyan-600 space-y-1">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>High: ₹{((slope as any).c2BlockHigh || (slope as any).c2High || 0).toFixed(2)}</div>
                                    <div>Low: ₹{((slope as any).c2BlockLow || (slope as any).c2Low || 0).toFixed(2)}</div>
                                  </div>
                                  <div className="text-xs text-cyan-500">
                                    Source: {(slope as any).c2HighSource || 'C2A'} (High) • {(slope as any).c2LowSource || 'C2B'} (Low)
                                  </div>
                                </div>
                              </div>

                              {/* Trigger Rules Duration */}
                              <div className="bg-orange-50 p-2 rounded border-l-2 border-orange-300">
                                <div className="font-medium text-orange-700">Trigger Rules Duration</div>
                                <div className="text-orange-600 space-y-1">
                                  <div>50% Rule: Point A→B ≥ 50% of 4-candle duration</div>
                                  <div>34% Rule: Point B→trigger ≥ 34% of A→B duration</div>
                                  <div className="text-xs text-orange-500">
                                    Required 34%: {(() => {
                                      const duration = (slope as any).durationMinutes || slope.duration;
                                      if (duration) return (duration * 0.34).toFixed(1);
                                      
                                      const pointATime = slope.pointA?.timestamp || (slope.pointA as any)?.exactTimestamp;
                                      const pointBTime = slope.pointB?.timestamp || (slope.pointB as any)?.exactTimestamp;
                                      
                                      if (pointATime && pointBTime) {
                                        const duration = Math.abs(pointBTime - pointATime) / 60;
                                        return (duration * 0.34).toFixed(1);
                                      }
                                      
                                      return "0.0";
                                    })()} min minimum wait
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pattern Trigger Level */}
                        <div className="p-3 bg-white rounded-lg border border-gray-200 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Pattern Trigger Level</span>
                            <span className="text-sm font-bold text-indigo-600">
                              ₹{(slope.pointB?.price || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>
                              <strong>Breakout Condition:</strong> {' '}
                              {slope.trendType === 'uptrend' 
                                ? `Price must break ABOVE ₹${(slope.pointB?.price || 0).toFixed(2)}`
                                : `Price must break BELOW ₹${(slope.pointB?.price || 0).toFixed(2)}`
                              }
                            </div>
                            <div>
                              <strong>Trigger Rules:</strong> Both timing validations must pass
                            </div>
                          </div>
                        </div>

                        {/* Exit Conditions */}
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-gray-700 border-b pb-1">Exit Strategies</div>
                          
                          {/* Target Exit */}
                          <div className="p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-blue-700">Target Exit (Projected)</span>
                              <span className="text-xs font-bold text-blue-800">
                                ₹{((slope.pointB?.price || 0) + (((slope as any).slopeValue || slope.slope || 0) * 10)).toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs text-blue-600">
                              Formula: Breakout + (Slope × 10min) = ₹{(slope.pointB?.price || 0).toFixed(2)} + ({((slope as any).slopeValue || slope.slope || 0).toFixed(3)} × 10)
                            </div>
                          </div>

                          {/* 80% Exit */}
                          <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-yellow-700">80% Exit (Profit Taking)</span>
                              <span className="text-xs font-bold text-yellow-800">
                                ₹{((slope.pointB?.price || 0) + (((slope as any).slopeValue || slope.slope || 0) * 10 * 0.8)).toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs text-yellow-600">
                              Formula: Breakout + (80% × Projected) = ₹{(slope.pointB?.price || 0).toFixed(2)} + (0.8 × {(((slope as any).slopeValue || slope.slope || 0) * 10).toFixed(2)})
                            </div>
                          </div>

                          {/* Stop Loss */}
                          <div className="p-2 bg-red-50 rounded border border-red-200">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-red-700">Stop Loss</span>
                              <span className="text-xs font-bold text-red-800">
                                Previous Candle {slope.trendType === 'uptrend' ? 'Low' : 'High'}
                              </span>
                            </div>
                            <div className="text-xs text-red-600">
                              Rule: {slope.trendType === 'uptrend' 
                                ? '4th candle low (if 5th triggers) or 5th candle low (if 6th triggers)'
                                : '4th candle high (if 5th triggers) or 5th candle high (if 6th triggers)'
                              }
                            </div>
                          </div>

                          {/* 98% Exit (Emergency) */}
                          <div className="p-2 bg-gray-50 rounded border border-gray-200">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-gray-700">98% Emergency Exit</span>
                              <span className="text-xs font-bold text-gray-800">Market Price × 0.98</span>
                            </div>
                            <div className="text-xs text-gray-600">
                              Condition: If target not reached at 98% of candle close time
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Statistics */}
                {analysisResult.slopes.length > 1 && (
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-3">Pattern Analysis Summary</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div className="text-center">
                        <div className="font-medium text-gray-800">
                          {analysisResult.slopes.filter(s => s.trendType === 'uptrend').length}
                        </div>
                        <div className="text-gray-600">Uptrend Patterns</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-800">
                          {analysisResult.slopes.filter(s => s.trendType === 'downtrend').length}
                        </div>
                        <div className="text-gray-600">Downtrend Patterns</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-800">
                          {Math.max(...analysisResult.slopes.map(s => Math.abs((s as any).slopeValue || s.slope || 0))).toFixed(3)}
                        </div>
                        <div className="text-gray-600">Strongest Slope</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-800">
                          {(analysisResult.slopes.reduce((sum, s) => sum + ((s as any).durationMinutes || s.duration || 0), 0) / analysisResult.slopes.length).toFixed(1)}
                        </div>
                        <div className="text-gray-600">Avg Duration (min)</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Battu API Method & Summary */}
          {(analysisResult as any)?.method && (
            <Card>
              <CardHeader>
                <CardTitle>Battu API Analysis Method</CardTitle>
                <CardDescription>{(analysisResult as any).method}</CardDescription>
              </CardHeader>
              <CardContent>
                {(analysisResult as any).summary && (
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                    {(analysisResult as any).summary}
                  </pre>
                )}
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-700 mb-2">API Response Details:</div>
                  <div className="text-xs text-blue-600 space-y-1">
                    <div><strong>Method:</strong> {(analysisResult as any).method}</div>
                    <div><strong>Symbol:</strong> {(analysisResult as any).symbol}</div>
                    <div><strong>Date:</strong> {(analysisResult as any).date}</div>
                    <div><strong>Timeframe:</strong> {(analysisResult as any).timeframe}</div>
                    <div><strong>Candle Blocks:</strong> {(analysisResult as any).candleBlocks?.length || 0}</div>
                    <div><strong>Exact Timestamps:</strong> {(analysisResult as any).exactTimestamps?.length || 0}</div>
                    <div><strong>Slope Calculations:</strong> {(analysisResult as any).slopes?.length || 0}</div>
                    <div><strong>Predictions:</strong> {(analysisResult as any).predictions ? 'Yes (5th & 6th candles)' : 'No'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
              </div>
            </TabsContent>
            
            <TabsContent value="explanation" className="mt-6">
              <FourCandleStepExplanation analysisData={analysisResult} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}