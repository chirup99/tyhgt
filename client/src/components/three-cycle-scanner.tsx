import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Play, Pause, RotateCcw, Calendar, Activity, TrendingUp, TrendingDown, BarChart3, Settings, Wifi, WifiOff, Square } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { FifthCandlePatternRecord } from './fifth-candle-pattern-record';
// Deep pattern analysis removed

// Utility function to generate session ID
const generateSessionId = () => `scanner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface ScannerState {
  sessionId: string;
  symbol: string;
  date: string;
  currentTimeframe: number;
  currentCycle: number;
  status: string;
  candlesCollected: number;
  candlesNeeded: number;
  startTime: string;
  timeline: any[];
  cycle2Status?: {
    targetPrice?: number;
    stopLoss?: number;
    entryPrice?: number;
    exitReason?: string;
    fifthCandleData?: CandleData | null;
    sixthCandleData?: CandleData | null;
    isBreakoutDetected?: boolean;
    tradeDirection?: 'BUY' | 'SELL';
    patternType?: string;
  };
  simulationResults?: {
    totalTrades: number;
    profitLoss: number;
    winRate: number;
    avgProfit: number;
    avgLoss: number;
  };
}

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  index: number;
}

interface DateRangeProgress {
  dates: string[];
  totalDates: number;
  originalTotalDates: number; // Track original predefined range
  currentIndex: number;
  completedDates: number;
  currentDateCompleted: boolean; // Track if current date finished 80min analysis
}



export default function ThreeCycleScanner() {
  const [selectedExchange, setSelectedExchange] = useState<'NSE' | 'MCX' | 'CRYPTO'>('NSE');
  const [selectedSymbol, setSelectedSymbol] = useState('NSE:NIFTY50-INDEX');
  const [selectedDate, setSelectedDate] = useState('2025-07-28');
  const [startDate, setStartDate] = useState('2025-07-28');
  const [endDate, setEndDate] = useState('2025-07-28');
  const [isDateRangeMode, setIsDateRangeMode] = useState(false);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [dateRangeProgress, setDateRangeProgress] = useState<DateRangeProgress | null>(null);
  const [scannerState, setScannerState] = useState<ScannerState | null>(null);
  
  // CRITICAL FIX: Force WebSocket connection on component initialization
  console.log('🚨 COMPONENT INITIALIZING: Forcing immediate WebSocket connection for live P&L');
  
  // Try connecting immediately when component initializes
  useEffect(() => {
    console.log('🔥 IMMEDIATE CONNECTION: Attempting WebSocket connection right now');
    const forceConnect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('🔌 FORCE CONNECTING to WebSocket:', wsUrl);
      
      if (livePLSocketRef.current?.readyState === WebSocket.OPEN) {
        console.log('✅ WebSocket already connected, skipping');
        return;
      }
      
      const ws = new WebSocket(wsUrl);
      livePLSocketRef.current = ws;
      
      ws.onopen = () => {
        console.log('✅ FORCE CONNECTED: Live P&L WebSocket successfully connected');
        setIsLivePLConnected(true);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('💰 LIVE P&L RECEIVED:', data);
          
          // ENHANCED LOGGING: Show detailed trade data when received
          if (data.trades && data.trades.active) {
            console.log(`📊 ACTIVE TRADES RECEIVED: ${data.trades.active.length} trades`);
            data.trades.active.forEach((trade: any, i: number) => {
              console.log(`   Trade ${i + 1}: Entry ${trade.entryPrice}, Current ${trade.currentPrice}, P&L ${trade.unrealizedPL}`);
            });
          }
          
          if (data.type === 'cycle3_live_update') {
            console.log('🔄 UPDATING LIVE P&L STATE with trades:', data.trades?.active?.length || 0);
            setLivePLData({
              currentPrice: data.currentPrice,
              marketTime: data.marketTime,
              trades: data.trades
            });
          }
        } catch (error) {
          console.error('Error parsing live P&L:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('❌ FORCE DISCONNECTED: Live P&L WebSocket closed');
        setIsLivePLConnected(false);
      };
      
      ws.onerror = (error) => {
        console.error('❌ FORCE ERROR: WebSocket error:', error);
        setIsLivePLConnected(false);
      };
    };
    
    // Connect immediately
    forceConnect();
    
    // Try again after 2 seconds if failed
    const retryTimeout = setTimeout(() => {
      if (!isLivePLConnected) {
        console.log('🔄 RETRY: Attempting WebSocket connection again');
        forceConnect();
      }
    }, 2000);
    
    // ADDITIONAL: Keep trying every 5 seconds until connected
    const persistentRetry = setInterval(() => {
      if (!isLivePLConnected && scannerState) {
        console.log('🔁 PERSISTENT RETRY: WebSocket still disconnected, retrying...');
        forceConnect();
      }
    }, 5000);
    
    return () => {
      clearTimeout(retryTimeout);
      clearInterval(persistentRetry);
    };
  }, []);
  
  // Track active pattern analysis to prevent duplicates
  const [activePatternAnalysis, setActivePatternAnalysis] = useState<{[key: string]: boolean}>({});
  // NEW: Recursive Point A/B Analysis State (80min → 5min fractal drilling)
  const [recursiveAnalysis, setRecursiveAnalysis] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<CandleData[]>([]);
  const [currentTimeframeData, setCurrentTimeframeData] = useState<CandleData[]>([]);
  const [cycle3OneMinuteData, setCycle3OneMinuteData] = useState<CandleData[]>([]); // 1-minute data for Cycle 3
  const [patternAnalysis, setPatternAnalysis] = useState<any>(null);
  // REMOVED: internalPatterns state variable completely removed
  const [allPatternRecords, setAllPatternRecords] = useState<any[]>([]);
  const [fifthCandleData, setFifthCandleData] = useState<CandleData | null>(null);
  const [sixthCandleData, setSixthCandleData] = useState<CandleData | null>(null);
  const [simulationTrades, setSimulationTrades] = useState<any[]>([]);
  const [isWaitingForSixthCandle, setIsWaitingForSixthCandle] = useState(false);
  const [autoProgressCountdown, setAutoProgressCountdown] = useState<number | null>(null);
  const [autoProgressionTimer, setAutoProgressionTimer] = useState<NodeJS.Timeout | null>(null);
  const [progressionCountdown, setProgressionCountdown] = useState<number | null>(null);
  const [isWaitingForPositionClosure, setIsWaitingForPositionClosure] = useState(false);
  const [cycle1PointABData, setCycle1PointABData] = useState<any>(null);
  
  // Fetch Point A/B data specifically
  const fetchPointABData = async () => {
    if (!scannerState?.currentTimeframe || !currentTimeframeData || currentTimeframeData.length < 4) {
      console.log('🚫 SKIPPING Point A/B fetch: Insufficient data', {
        timeframe: scannerState?.currentTimeframe,
        candleCount: currentTimeframeData?.length
      });
      return;
    }
    
    try {
      console.log('🔍 FETCHING Point A/B data for pattern analysis...');
      const response = await fetch('/api/battu/3-cycle-scanner/cycle1-pointab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedSymbol,
          date: getCurrentScanDate(),
          timeframe: scannerState.currentTimeframe,
          firstFourCandles: currentTimeframeData.slice(0, 4)
        })
      });
      
      const data = await response.json();
      console.log('📊 Point A/B Response:', data);
      
      if (data.success && data.pointABData) {
        console.log('✅ Setting Point A/B data:', data.pointABData);
        setCycle1PointABData(data.pointABData);
        setPatternAnalysis(data);
        
        // Process recursive analysis results for 80min timeframes ONLY
        if (data.recursiveAnalysis && scannerState?.currentTimeframe === 80) {
          console.log('🔄 RECURSIVE ANALYSIS: Fractal Point A/B analysis available', data.recursiveAnalysis);
          console.log(`📈 Authentic Uptrend Patterns: [${data.recursiveAnalysis.uptrendList.join(', ')}]`);
          console.log(`📉 Authentic Downtrend Patterns: [${data.recursiveAnalysis.downtrendList.join(', ')}]`);
          console.log('✅ SETTING RECURSIVE ANALYSIS STATE FOR 80MIN TIMEFRAME');
          setRecursiveAnalysis(data.recursiveAnalysis);
        } else if (scannerState?.currentTimeframe !== 80) {
          console.log(`🔄 RECURSIVE ANALYSIS: Skipped for ${scannerState?.currentTimeframe}min (80min required)`);
          setRecursiveAnalysis(null);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching Point A/B data:', error);
    }
  };
  const [isAutoFetchActive, setIsAutoFetchActive] = useState(false);
  const [autoFetchInterval, setAutoFetchInterval] = useState<NodeJS.Timeout | null>(null);
  const [streamingOHLC, setStreamingOHLC] = useState<{
    c1a: CandleData | null;
    c1b: CandleData | null;
    c2a: CandleData | null;
    c2b: CandleData | null;
    fifth: CandleData | null;
    sixth: CandleData | null;
  }>({ c1a: null, c1b: null, c2a: null, c2b: null, fifth: null, sixth: null });
  const [streamingInterval, setStreamingInterval] = useState<NodeJS.Timeout | null>(null);
  const [liveMonitorTimeframe, setLiveMonitorTimeframe] = useState<number>(5); // Track live monitor starting timeframe
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string>('');
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [completedTimeframes, setCompletedTimeframes] = useState<Set<number>>(new Set()); // Track completed timeframes
  
  // Live Tracking Data States
  const [dataAvailability, setDataAvailability] = useState<{
    availableCandles: number;
    requiredUntilClose: number;
    percentageComplete: number;
    estimatedMarketClose: string;
    isLiveDataNeeded: boolean;
    currentTimeframe: number;
  } | null>(null);
  const [liveDataProgress, setLiveDataProgress] = useState<{
    isActive: boolean;
    currentCandle: number;
    totalCandles: number;
    progressPercent: number;
    estimatedCompletion: string;
    fetchingSpeed: number; // candles per minute
  } | null>(null);
  const [incompleteCandleStatus, setIncompleteCandleStatus] = useState<{
    isActive: boolean;
    candlePosition: string; // e.g., "5th", "6th"
    timeframeMinutes: number;
    startTime: number;
    endTime: number;
    currentOHLC: { open: number; high: number; low: number; close: number; volume: number };
    completionPercent: number;
    remainingSeconds: number;
  } | null>(null);

  // Live P&L WebSocket state
  const [isLivePLConnected, setIsLivePLConnected] = useState(false);
  const [livePLData, setLivePLData] = useState<{
    currentPrice: number;
    marketTime: string;
    trades: {
      active: any[];
      totalUnrealizedPL: number;
      activeCount: number;
    };
  } | null>(null);
  const livePLSocketRef = useRef<WebSocket | null>(null);
  

  
  const queryClient = useQueryClient();

  // DISABLED: Enhanced Streaming OHLC Auto-Update Function (700ms)
  // This was interfering with timeframe progression
  const startStreamingOHLC = () => {
    console.log('🏛️ HISTORICAL MODE: OHLC streaming DISABLED for clean timeframe progression');
    return; // DISABLED to prevent interference with timeframe transitions
    
    /*
    if (streamingInterval) return;
    
    console.log('🚀 STREAMING OHLC: Starting 700ms auto-updates for live candle positions');
    console.log(`   Timeframe: ${scannerState?.currentTimeframe || 5}min`);
    console.log(`   Available candles: ${currentTimeframeData.length}`);
    
    // Also start auto-fetch for continuous data updates
    if (!isAutoFetchActive) {
      console.log('📡 AUTO-STARTING: Live data fetch with streaming OHLC');
      setIsAutoFetchActive(true);
    }
    
    const interval = setInterval(() => {
      try {
        // Use existing currentTimeframeData instead of making new API calls
        if (currentTimeframeData.length > 0) {
          // Map candle positions based on 4-candle rule and current timeframe
          const c1a = currentTimeframeData[0]; // C1 (1st candle)
          const c1b = currentTimeframeData[1]; // C1B (2nd candle) 
          const c2a = currentTimeframeData[2]; // C2A (3rd candle)
          const c2b = currentTimeframeData[3]; // C2B (4th candle)
          const fifth = currentTimeframeData[4]; // 5th candle
          const sixth = currentTimeframeData[5]; // 6th candle
          
          setStreamingOHLC({
            c1a: c1a || null,
            c1b: c1b || null,
            c2a: c2a || null,
            c2b: c2b || null,
            fifth: fifth || null,
            sixth: sixth || null
          });
          
          console.log(`📊 OHLC UPDATE: C1A=${c1a?.close.toFixed(2) || 'N/A'}, C2B=${c2b?.close.toFixed(2) || 'N/A'}, 5th=${fifth?.close.toFixed(2) || 'N/A'}, 6th=${sixth?.close.toFixed(2) || 'N/A'}`);
        }
      } catch (error) {
        console.error('❌ Streaming OHLC error:', error);
      }
    }, 700);
    
    setStreamingInterval(interval);
    */
  };
  
  const stopStreamingOHLC = () => {
    if (streamingInterval) {
      clearInterval(streamingInterval);
      setStreamingInterval(null);
      setStreamingOHLC({ c1a: null, c1b: null, c2a: null, c2b: null, fifth: null, sixth: null });
      console.log('🛑 Stopped streaming OHLC updates');
    }
  };

  // Force WebSocket connection even in historical mode when scanner is active
  useEffect(() => {
    if (scannerState && !isLivePLConnected) {
      console.log('🔧 FORCE LIVE P&L: Scanner active, forcing WebSocket connection regardless of historical mode');
      
      const connectLivePL = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        if (livePLSocketRef.current?.readyState === WebSocket.OPEN) {
          console.log('✅ WebSocket already connected');
          return;
        }
        
        console.log('🔌 CONNECTING to Live P&L WebSocket:', wsUrl);
        const ws = new WebSocket(wsUrl);
        livePLSocketRef.current = ws;
        
        ws.onopen = () => {
          console.log('✅ LIVE P&L CONNECTED: WebSocket established successfully');
          setIsLivePLConnected(true);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📊 LIVE P&L DATA RECEIVED:', data);
            
            if (data.type === 'cycle3_live_update') {
              console.log('🔄 UPDATING LIVE P&L STATE with:', data.trades?.active?.length || 0, 'trades');
              setLivePLData({
                currentPrice: data.currentPrice,
                marketTime: data.marketTime,
                trades: data.trades
              });
            }
          } catch (error) {
            console.error('❌ Error parsing live P&L data:', error);
          }
        };
        
        ws.onclose = () => {
          console.log('❌ Live P&L WebSocket disconnected');
          setIsLivePLConnected(false);
          setLivePLData(null);
        };
        
        ws.onerror = (error) => {
          console.error('❌ Live P&L WebSocket error:', error);
          setIsLivePLConnected(false);
        };
      };
      
      // Connect immediately
      connectLivePL();
      
      // Retry every 3 seconds if not connected
      const retryInterval = setInterval(() => {
        if (!isLivePLConnected && scannerState) {
          console.log('🔄 RETRY: Attempting Live P&L connection...');
          connectLivePL();
        }
      }, 3000);
      
      return () => {
        clearInterval(retryInterval);
      };
    }
  }, [scannerState, isLivePLConnected]);
  
  // Calculate data availability vs market close requirements
  const calculateDataAvailability = (currentData: CandleData[], currentTimeframe: number) => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const currentTime = hours * 60 + minutes;
    
    // Get market close time based on exchange
    let marketClose: number;
    switch (selectedExchange) {
      case 'NSE':
        marketClose = 15 * 60 + 30; // 3:30 PM
        break;
      case 'MCX':
        marketClose = 23 * 60 + 30; // 11:30 PM
        break;
      case 'CRYPTO':
        marketClose = 24 * 60; // 24/7
        break;
      default:
        marketClose = 15 * 60 + 30;
    }
    
    const minutesUntilClose = marketClose - currentTime;
    const candlesUntilClose = Math.ceil(minutesUntilClose / currentTimeframe);
    const availableCandles = currentData.length;
    const progressPercent = minutesUntilClose > 0 ? (availableCandles / (availableCandles + candlesUntilClose)) * 100 : 100;
    
    const closeTime = new Date(istTime);
    closeTime.setHours(Math.floor(marketClose / 60), marketClose % 60, 0, 0);
    
    const availability = {
      availableCandles,
      requiredUntilClose: candlesUntilClose,
      percentageComplete: Math.min(progressPercent, 100),
      estimatedMarketClose: closeTime.toLocaleTimeString('en-US', {
        hour12: true,
        timeZone: 'Asia/Kolkata'
      }),
      isLiveDataNeeded: minutesUntilClose > 0 && candlesUntilClose > 0,
      currentTimeframe
    };
    
    setDataAvailability(availability);
    
    console.log('📊 DATA AVAILABILITY CALCULATED:');
    console.log(`   Available: ${availableCandles} candles`);
    console.log(`   Required until close: ${candlesUntilClose} candles`);
    console.log(`   Progress: ${progressPercent.toFixed(1)}%`);
    console.log(`   Market closes: ${availability.estimatedMarketClose}`);
    console.log(`   Live data needed: ${availability.isLiveDataNeeded ? 'YES' : 'NO'}`);
    
    return availability;
  };
  
  // Start live data progress tracking
  const startLiveDataProgress = (totalNeeded: number, currentTimeframe: number) => {
    const progress = {
      isActive: true,
      currentCandle: 0,
      totalCandles: totalNeeded,
      progressPercent: 0,
      estimatedCompletion: 'Calculating...',
      fetchingSpeed: 0.857 // ~700ms per update = 85.7 updates per minute
    };
    
    setLiveDataProgress(progress);
    
    console.log('🚀 STARTING LIVE DATA PROGRESS TRACKING:');
    console.log(`   Target: ${totalNeeded} additional candles`);
    console.log(`   Timeframe: ${currentTimeframe}min`);
    console.log(`   Fetching speed: ${progress.fetchingSpeed} updates/min`);
  };
  
  // Update live data progress
  const updateLiveDataProgress = (currentCandles: number) => {
    if (!liveDataProgress) return;
    
    const progressPercent = (currentCandles / liveDataProgress.totalCandles) * 100;
    const remainingCandles = liveDataProgress.totalCandles - currentCandles;
    const estimatedMinutes = remainingCandles / liveDataProgress.fetchingSpeed;
    
    const completionTime = new Date();
    completionTime.setMinutes(completionTime.getMinutes() + estimatedMinutes);
    
    setLiveDataProgress(prev => prev ? {
      ...prev,
      currentCandle: currentCandles,
      progressPercent: Math.min(progressPercent, 100),
      estimatedCompletion: completionTime.toLocaleTimeString('en-US', {
        hour12: true,
        timeZone: 'Asia/Kolkata'
      })
    } : null);
  };
  
  // Start incomplete candle tracking
  const startIncompleteCandleTracking = (candlePosition: string, timeframeMinutes: number, startTimestamp: number) => {
    const endTimestamp = startTimestamp + (timeframeMinutes * 60);
    
    setIncompleteCandleStatus({
      isActive: true,
      candlePosition,
      timeframeMinutes,
      startTime: startTimestamp,
      endTime: endTimestamp,
      currentOHLC: { open: 0, high: 0, low: 0, close: 0, volume: 0 },
      completionPercent: 0,
      remainingSeconds: timeframeMinutes * 60
    });
    
    console.log(`🕯️ STARTING INCOMPLETE CANDLE TRACKING:`);
    console.log(`   Position: ${candlePosition}`);
    console.log(`   Timeframe: ${timeframeMinutes}min`);
    console.log(`   Start: ${new Date(startTimestamp * 1000).toLocaleTimeString()}`);
    console.log(`   End: ${new Date(endTimestamp * 1000).toLocaleTimeString()}`);
  };
  
  // Update incomplete candle with live OHLC
  const updateIncompleteCandleOHLC = (currentPrice: number) => {
    if (!incompleteCandleStatus || !incompleteCandleStatus.isActive) return;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const elapsed = currentTime - incompleteCandleStatus.startTime;
    const duration = incompleteCandleStatus.timeframeMinutes * 60;
    const completionPercent = Math.min((elapsed / duration) * 100, 100);
    const remainingSeconds = Math.max(0, duration - elapsed);
    
    setIncompleteCandleStatus(prev => {
      if (!prev) return null;
      
      const updatedOHLC = { ...prev.currentOHLC };
      
      // Initialize open price on first update
      if (updatedOHLC.open === 0) {
        updatedOHLC.open = currentPrice;
      }
      
      // Update high/low/close
      updatedOHLC.high = Math.max(updatedOHLC.high || currentPrice, currentPrice);
      updatedOHLC.low = updatedOHLC.low === 0 ? currentPrice : Math.min(updatedOHLC.low, currentPrice);
      updatedOHLC.close = currentPrice;
      
      return {
        ...prev,
        currentOHLC: updatedOHLC,
        completionPercent,
        remainingSeconds
      };
    });
  };
  
  // Check if market is open based on selected exchange
  const checkMarketStatus = (): boolean => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const currentTime = hours * 60 + minutes;
    
    // Determine market hours based on selected exchange
    let marketOpen, marketClose, isWeekdayOnly = true;
    
    switch (selectedExchange) {
      case 'NSE':
        marketOpen = 9 * 60 + 15; // 9:15 AM
        marketClose = 15 * 60 + 30; // 3:30 PM
        break;
      case 'MCX':
        marketOpen = 9 * 60 + 0; // 9:00 AM
        marketClose = 23 * 60 + 30; // 11:30 PM
        break;
      case 'CRYPTO':
        marketOpen = 0; // 24/7
        marketClose = 24 * 60; // 24/7
        isWeekdayOnly = false; // Crypto trades all week
        break;
      default:
        marketOpen = 9 * 60 + 15;
        marketClose = 15 * 60 + 30;
    }
    
    const isWeekday = istTime.getDay() >= 1 && istTime.getDay() <= 5;
    const isDuringMarketHours = currentTime >= marketOpen && currentTime <= marketClose;
    
    return (isWeekdayOnly ? isWeekday : true) && isDuringMarketHours;
  };

  // Get symbols based on selected exchange
  const getSymbolsByExchange = (exchange: 'NSE' | 'MCX' | 'CRYPTO') => {
    switch (exchange) {
      case 'NSE':
        return [
          { value: 'NSE:NIFTY50-INDEX', label: 'NIFTY 50' },
          { value: 'NSE:BANKNIFTY-INDEX', label: 'Bank NIFTY' },
          { value: 'NSE:INFY-EQ', label: 'Infosys' },
          { value: 'NSE:RELIANCE-EQ', label: 'Reliance' },
          { value: 'NSE:TCS-EQ', label: 'TCS' },
        ];
      case 'MCX':
        return [
          { value: 'MCX:GOLDPETAL-EQ', label: 'Gold Futures' },
          { value: 'MCX:CRUDEOIL-EQ', label: 'Crude Oil Futures' },
          { value: 'MCX:SILVER-EQ', label: 'Silver Futures' },
          { value: 'MCX:NATURALGAS-EQ', label: 'Natural Gas Futures' }
        ];
      case 'CRYPTO':
        return [
          { value: 'CRYPTO:BTC-USD', label: 'Bitcoin (BTC)' },
          { value: 'CRYPTO:ETH-USD', label: 'Ethereum (ETH)' },
          { value: 'CRYPTO:BNB-USD', label: 'Binance Coin (BNB)' },
          { value: 'CRYPTO:ADA-USD', label: 'Cardano (ADA)' }
        ];
      default:
        return [];
    }
  };

  // Handle exchange change and update symbol
  const handleExchangeChange = (exchange: 'NSE' | 'MCX' | 'CRYPTO') => {
    setSelectedExchange(exchange);
    const symbolsForExchange = getSymbolsByExchange(exchange);
    if (symbolsForExchange.length > 0) {
      setSelectedSymbol(symbolsForExchange[0].value);
    }
  };

  // Fetch live price data (lightweight - does not trigger scanner cycles)
  const fetchLivePrice = async () => {
    try {
      // CRITICAL FIX: Pass date parameter for proper historical data fetching
      const dateParam = selectedDate ? `?date=${selectedDate}` : '';
      const response = await fetch(`/api/live-price/${selectedSymbol}${dateParam}`);
      const data = await response.json();
      
      if (data.success && data.price) {
        const previousPrice = livePrice;
        setLivePrice(data.price);
        setLastPriceUpdate(new Date().toLocaleTimeString('en-IN', { 
          timeZone: 'Asia/Kolkata', 
          hour12: true 
        }));
        
        // Calculate price change percentage
        if (previousPrice && previousPrice !== 0) {
          const changePercent = ((data.price - previousPrice) / previousPrice) * 100;
          setPriceChangePercent(changePercent);
        }
        
        // Only log every 10th update to reduce console spam
        if (Math.random() < 0.1) {
          console.log(`💰 Live price update: ${selectedSymbol} @ ₹${data.price}`);
        }
      }
    } catch (error) {
      // Only log errors occasionally to reduce console spam
      if (Math.random() < 0.1) {
        console.error('Failed to fetch live price:', error);
      }
    }
  };

  // FIXED LIVE MONITOR: Prevent scanner restart during timeframe transitions
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isAutoFetchActive && !isRequestInProgress) { // CRITICAL FIX: Don't fetch during transitions
      console.log('📡 700MS AUTO-FETCH: Starting continuous live data fetching');
      interval = setInterval(async () => {
        // CRITICAL FIX: Only fetch live price for current date, never for historical dates
        const currentDate = new Date().toISOString().split('T')[0];
        const isAnalyzingCurrentDate = selectedDate === currentDate;
        
        // ENHANCED: Enable live data fetching during scanner operation
        // This ensures continuous data updates even when scanner is active
        if (scannerState) {
          console.log(`📡 LIVE DATA FETCH: 700ms auto-update during scanner operation`);
          console.log(`   Current data: ${historicalData.length} candles`);
          console.log(`   Fetching fresh live data to extend beyond 65 candles...`);
        }
        
        // LIVE P&L FIX: Always fetch live price for P&L calculations when scanner is active
        console.log(`💰 LIVE P&L MODE: Fetching live price for P&L calculations (scanner active)`);
        fetchLivePrice();
        
        // ENHANCED: Force fetch fresh live data every 700ms with live tracking data support
        try {
            console.log(`🚀 700MS FETCH: Getting fresh live data (current: ${historicalData.length} candles)`);
            
            // Fetch fresh live data without date restriction for current date
            const currentDate = new Date().toISOString().split('T')[0];
            const isCurrentDate = selectedDate === currentDate;
            const fetchUrl = isCurrentDate 
              ? `/api/live-price/${selectedSymbol}` // No date param for current date to get latest data
              : `/api/live-price/${selectedSymbol}?date=${selectedDate}`;
            
            const response = await fetch(fetchUrl);
            
            // CYCLE 3 FIX: Handle API failures gracefully and continue with existing data
            let priceData;
            try {
              priceData = await response.json();
            } catch (parseError) {
              console.log('⚠️ CYCLE 3 RESILIENCE: API returning HTML instead of JSON - using existing data');
              
              // Continue Cycle 3 validation with existing data
              if (scannerState && historicalData.length > 0) {
                console.log('🔄 CYCLE 3 ACTIVE: Using existing 242 candles for real-time validation');
                
                // Update cycle3OneMinuteData with current historical data for Cycle 3 validation
                setCycle3OneMinuteData(historicalData);
                
                // Continue with Cycle 3 real-time validation using existing data
                console.log('📊 CYCLE 3 VALIDATION: Processing with available data while API recovers');
                console.log(`   Available: ${historicalData.length} 1-minute candles`);
                console.log(`   Cycle 3 Status: ACTIVE (using cached data)`);
                
                // Trigger pattern analysis if not already running
                if (currentTimeframeData.length >= 4 && !patternAnalysis) {
                  console.log('🚀 CYCLE 3 TRIGGER: Activating pattern analysis with available data');
                  const currentTimeframe = scannerState.currentTimeframe || 5;
                  const firstFourCandles = currentTimeframeData.slice(0, 4);
                  fetchCycle1PointAB(firstFourCandles, currentTimeframe);
                  analyzePattern(currentTimeframeData, 5);
                }
              }
              return; // Skip further processing when API fails
            }
            
            if (priceData.success && priceData.historicalData?.length > 0) {
              const newDataCount = priceData.historicalData.length;
              const previousCount = historicalData.length;
              
              console.log(`📊 DATA UPDATE: ${previousCount} → ${newDataCount} candles (${newDataCount > previousCount ? '+' + (newDataCount - previousCount) : 'no change'})`);
              
              // LIVE TRACKING DATA: Calculate data availability and update progress
              if (scannerState) {
                const currentTimeframe = scannerState.currentTimeframe || 5;
                const availability = calculateDataAvailability(priceData.historicalData, currentTimeframe);
                
                // Update live data progress if we have new candles
                if (newDataCount > previousCount && liveDataProgress?.isActive) {
                  updateLiveDataProgress(newDataCount - previousCount);
                }
                
                // Update incomplete candle with current price if active
                if (priceData.price && incompleteCandleStatus?.isActive) {
                  updateIncompleteCandleOHLC(priceData.price);
                  console.log(`🕯️ INCOMPLETE CANDLE UPDATE: ${incompleteCandleStatus.candlePosition} candle OHLC updated with live price ${priceData.price}`);
                }
                
                // Complete incomplete candles when timeframe duration is reached
                if (incompleteCandleStatus?.isActive && incompleteCandleStatus.remainingSeconds <= 0) {
                  const completedOHLC = incompleteCandleStatus.currentOHLC;
                  console.log(`✅ CANDLE COMPLETION: ${incompleteCandleStatus.candlePosition} candle completed via live data blending`);
                  console.log(`   Final OHLC: O:${completedOHLC.open.toFixed(2)} H:${completedOHLC.high.toFixed(2)} L:${completedOHLC.low.toFixed(2)} C:${completedOHLC.close.toFixed(2)}`);
                  
                  // Add completed candle to historical data for seamless blending
                  const candleTimestamp = incompleteCandleStatus.startTime;
                  const completedCandle = {
                    timestamp: candleTimestamp,
                    open: completedOHLC.open,
                    high: completedOHLC.high,
                    low: completedOHLC.low,
                    close: completedOHLC.close,
                    volume: completedOHLC.volume,
                    index: historicalData.length
                  };
                  
                  // Seamlessly blend completed live candle into historical data
                  setHistoricalData(prev => [...prev, completedCandle]);
                  console.log(`✨ SEAMLESS BLENDING: Live candle added to historical data (${historicalData.length + 1} total candles)`);
                  
                  // Stop incomplete candle tracking
                  setIncompleteCandleStatus(null);
                }
                
                // If we need more live data and haven't started progress tracking, start it
                if (availability.isLiveDataNeeded && !liveDataProgress?.isActive) {
                  startLiveDataProgress(availability.requiredUntilClose, currentTimeframe);
                  console.log(`🚀 LIVE DATA NEEDED: Starting progress tracking for ${availability.requiredUntilClose} more candles`);
                }
                
                // Complete live data progress tracking when sufficient data is reached
                if (liveDataProgress?.isActive && !availability.isLiveDataNeeded) {
                  console.log(`✅ LIVE DATA COMPLETE: Sufficient data reached, stopping progress tracking`);
                  setLiveDataProgress(null);
                }
                
                // Seamless progression: When data is sufficient, allow timeframe progression
                if (!availability.isLiveDataNeeded && scannerState) {
                  console.log(`✨ SEAMLESS PROGRESSION: Data sufficient for ${currentTimeframe}min timeframe, ready for pattern analysis`);
                  // The existing pattern analysis will continue automatically
                }
              }
              
              // CRITICAL FIX: Proper date detection and data source separation
              const analysisDate = selectedDate; // Date being analyzed by scanner
              
              // OVERRIDE: Force today's date to behave as historical when doing Historical Analysis
              // This ensures 2025-08-06 works the same as 2025-07-28 for historical analysis
              const isUsingHistoricalAnalysisMode = scannerState !== null; // If Historical Analysis button was clicked
              const isAnalyzingCurrentDate = (analysisDate === currentDate) && !isUsingHistoricalAnalysisMode;
              
              console.log('📅 DATE SYNCHRONIZATION CHECK:');
              console.log(`   Current Live Date: ${currentDate}`);
              console.log(`   Analysis Date: ${analysisDate}`);
              console.log(`   Historical Mode Active: ${isUsingHistoricalAnalysisMode ? 'YES' : 'NO'}`);
              console.log(`   Treating as Current Date: ${isAnalyzingCurrentDate ? 'YES' : 'NO (forced historical)'}`);
              console.log(`   🎯 FIX: Today's date ${analysisDate} forced to behave like historical date (2025-07-28)`);
              
              // Always update historical data with latest candles
              setHistoricalData(priceData.historicalData);
              
              // CYCLE 3 ENHANCEMENT: Update cycle3OneMinuteData for real-time validation
              setCycle3OneMinuteData(priceData.historicalData);
              console.log(`🔄 CYCLE 3 DATA UPDATED: ${priceData.historicalData.length} 1-minute candles available for validation`);
              
              // Update streaming OHLC if active
              if (streamingInterval && currentTimeframeData.length > 0) {
                console.log(`📊 STREAMING UPDATE: Refreshing OHLC with ${newDataCount} candles`);
                // Trigger OHLC update by re-resampling current timeframe
                const currentTimeframe = scannerState?.currentTimeframe || 5;
                resampleToTimeframe(priceData.historicalData, currentTimeframe);
              }
              
              // CRITICAL: Auto-trigger pattern analysis if scanner is active but no analysis running
              if (scannerState && !currentTimeframeData.length && priceData.historicalData.length >= 30) {
                const currentTimeframe = scannerState?.currentTimeframe || 5;
                console.log(`🚀 AUTO-TRIGGER: Scanner active with ${priceData.historicalData.length} candles - starting pattern analysis`);
                resampleToTimeframe(priceData.historicalData, currentTimeframe);
              }
              
              // Additional trigger: If we have resampled data but no pattern analysis
              if (scannerState && currentTimeframeData.length >= 4 && !patternAnalysis) {
                console.log(`🔥 PATTERN TRIGGER: Scanner active with ${currentTimeframeData.length} timeframe candles - starting pattern analysis`);
                const firstFourCandles = currentTimeframeData.slice(0, 4);
                const currentTimeframe = scannerState?.currentTimeframe || 5;
                fetchCycle1PointAB(firstFourCandles, currentTimeframe);
                analyzePattern(currentTimeframeData, 5);
              }
              
              // SEQUENTIAL PROCESSING LOGIC: Historical first, then live monitor
              const hasActiveCycle2 = scannerState?.cycle2Status?.sixthCandleData;
              const hasStartButtonScanner = scannerState !== null;
              const availableDataCount = priceData.historicalData?.length || 0;
              const hasHistoricalData = availableDataCount > 0;
              
              if (hasStartButtonScanner && !isAnalyzingCurrentDate) {
                // PHASE 1: HISTORICAL DATE (NON-LIVE MARKET) - Complete isolation
                console.log('🏛️ PHASE 1: HISTORICAL NON-LIVE MARKET - Complete data isolation');
                console.log(`   Historical Date: ${analysisDate} (past date - market closed)`);
                console.log('   Data Source: ONLY complete historical data');
                console.log('   Live Monitor: DISABLED (historical mode)');
                console.log('   Process: Complete all historical analysis first');
                
              } else if (hasStartButtonScanner && isAnalyzingCurrentDate) {
                // CURRENT DATE SEQUENTIAL PROCESSING
                
                if (hasHistoricalData && !hasActiveCycle2) {
                  // PHASE 1: Historical data available - DISABLE live monitor completely
                  console.log('📊 PHASE 1: HISTORICAL DATA PROCESSING - Live monitor DISABLED');
                  console.log(`   Available Historical Data: ${availableDataCount} candles`);
                  console.log('   Live Monitor: COMPLETELY DISABLED');
                  console.log('   Process: Fetch and analyze ALL historical data till last candle');
                  console.log('   Next Phase: Switch to live monitor after historical completion');
                  
                  // Disable live monitoring during historical processing
                  // Process historical data completely
                  
                } else if (hasActiveCycle2) {
                  // PHASE 2: Historical completed - SWITCH to live monitor
                  console.log('🚀 PHASE 2: HISTORICAL COMPLETE - SWITCHING to live monitor');
                  console.log('   Historical Processing: COMPLETED');
                  console.log('   Live Monitor: ENABLED (700ms intervals)');
                  console.log('   Data Source: Live Fyers API for remaining candles');
                  console.log('   Process: Use live data for Cycle 3 validation');
                  
                  // Enable live monitoring for remaining analysis
                  // This will be activated when scannerState becomes null (scanner completed)
                  console.log('📡 Starting Live Monitor - historical patterns complete');
                  console.log('🚀 Live Monitor activated (700ms interval)');
                  
                  // Continue live monitoring for timeframe progression
                  
                } else {
                  console.log('⏳ PHASE 1: Waiting for historical data processing to begin');
                }
                
              } else if (isAnalyzingCurrentDate && !hasStartButtonScanner) {
                // Live monitor mode - only for current date when no scanner active
                console.log('📡 LIVE MONITOR MODE: Current date with no active scanner');
                console.log(`   Data Source: Live current market data at ${liveMonitorTimeframe}min timeframe`);
                console.log(`   Continuation: Starting from ${liveMonitorTimeframe}min (next level progression)`);
                await resampleToTimeframe(priceData.historicalData, liveMonitorTimeframe);
              } else {
                console.log('⏳ STANDBY: Waiting for scanner activation or date selection');
              }
            }
          } catch (error) {
            console.error('Error in 700ms fetch:', error);
            
            // LIVE TRACKING DATA: Handle API failures gracefully
            if (scannerState) {
              console.log(`🚫 API FAILURE HANDLING: Scanner active, continuing with available data`);
              console.log(`   Available data: ${historicalData.length} candles`);
              console.log(`   Action: Continue pattern analysis with current data, keep trying for more`);
              
              // Update progress to show we're still trying despite errors
              if (liveDataProgress?.isActive) {
                console.log(`🔄 RESILIENT FETCH: API failed, but continuing live data progress tracking`);
              }
              
              // Calculate availability with current data and show user we're still working
              const currentTimeframe = scannerState.currentTimeframe || 5;
              const availability = calculateDataAvailability(historicalData, currentTimeframe);
              
              // Show user that we have partial data and are trying to get more
              console.log(`📏 DATA RESILIENCE STATUS:`);
              console.log(`   ✅ Available: ${availability.availableCandles} candles`);
              console.log(`   🔄 Needed: ${availability.requiredUntilClose} more candles`);
              console.log(`   ⏳ Status: Retrying API calls while using available data`);
              
              // Don't let errors stop the scanner - keep processing with what we have
              console.log(`🚫 PREVENT SCANNER STOP: Using available data while continuing to fetch live data`);
            }
          }
      }, 700);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
        console.log('🛑 Stopped smart live monitor');
      }
      
      // Cleanup auto-fetch interval
      if (autoFetchInterval) {
        clearInterval(autoFetchInterval);
        setAutoFetchInterval(null);
        setIsAutoFetchActive(false);
        console.log('🛑 Stopped auto-fetch on unmount');
      }
    };
  }, [isAutoFetchActive, isMarketOpen, selectedSymbol, isRequestInProgress, scannerState?.currentTimeframe, cycle1PointABData, historicalData.length]);

  // CRITICAL FIX: Convert existing pattern records to simulation trades for current date
  useEffect(() => {
    const currentDate = new Date().toISOString().split('T')[0];
    
    // OVERRIDE: Force today's date to behave as historical when doing Historical Analysis
    // This ensures 2025-08-06 works the same as 2025-07-28 for historical analysis
    const isUsingHistoricalAnalysisMode = scannerState !== null; // If Historical Analysis button was clicked
    const isAnalyzingCurrentDate = (selectedDate === currentDate) && !isUsingHistoricalAnalysisMode;
    
    // CRITICAL BUG FIX: Only convert when NO scanner is active to prevent double counting
    // Scanner active means trades are being generated in real-time, so don't convert historical patterns
    const hasActiveScanner = scannerState !== null;
    
    console.log('🔍 PATTERN CONVERSION CHECK:', {
      currentDate,
      selectedDate,
      isUsingHistoricalAnalysisMode,
      isAnalyzingCurrentDate,
      allPatternRecordsLength: allPatternRecords.length,
      simulationTradesLength: simulationTrades.length,
      hasActiveScanner,
      shouldConvert: isAnalyzingCurrentDate && allPatternRecords.length > 0 && simulationTrades.length === 0 && !hasActiveScanner
    });
    
    // Only convert for current date when pattern records exist, simulation trades are empty, AND no scanner is active
    if (isAnalyzingCurrentDate && allPatternRecords.length > 0 && simulationTrades.length === 0 && !hasActiveScanner) {
      console.log('🔄 CURRENT DATE FIX: Converting existing pattern records to simulation trades');
      console.log(`   Found ${allPatternRecords.length} pattern records to convert`);
      console.log('   Sample record:', allPatternRecords[0]);
      
      const convertedTrades = allPatternRecords.map(record => ({
        id: record.id || `trade-${Date.now()}-${Math.random()}`,
        symbol: record.symbol,
        date: record.date,
        timeframe: record.timeframe,
        pattern: record.patternType,
        direction: record.patternType?.includes('1-3') || record.patternType?.includes('2-3') ? 'BUY' : 'SELL',
        entryPrice: record.entryPrice,
        exitPrice: record.exitPrice,
        profitLoss: record.profitLoss,
        exitReason: record.exitReason || 'Historical Pattern Complete',
        timestamp: record.sixthCandleTimestamp || record.createdAt,
        breakoutTime: record.sixthCandleTimestamp ? new Date(record.sixthCandleTimestamp * 1000).toLocaleTimeString('en-US', { hour12: true, timeZone: 'Asia/Kolkata' }) : 'Historical',
        isBreakoutDetected: true // Historical patterns are already detected
      }));
      
      setSimulationTrades(convertedTrades);
      console.log(`✅ CURRENT DATE FIX: Converted ${convertedTrades.length} historical patterns to simulation trades`);
      console.log('   Sample converted trade:', convertedTrades[0]);
      console.log('   These historical patterns will now display in Simulation Results Summary');
    } else if (hasActiveScanner && isAnalyzingCurrentDate) {
      console.log('🚫 DOUBLE COUNTING PREVENTION: Blocked pattern conversion while scanner is active');
      console.log('   This prevents duplicate trades in simulation results');
    }
  }, [selectedDate, allPatternRecords.length, simulationTrades.length, scannerState]);

  // Check market status every minute
  useEffect(() => {
    const checkStatus = () => {
      const marketStatus = checkMarketStatus();
      setIsMarketOpen(marketStatus);
      
      if (!marketStatus && isAutoFetchActive) {
        console.log('🔴 Market closed - stopping auto-fetch');
        setIsAutoFetchActive(false);
      }
    };
    
    // Initial check
    checkStatus();
    
    // Check every minute
    const statusInterval = setInterval(checkStatus, 60000);
    
    return () => clearInterval(statusInterval);
  }, [isAutoFetchActive]);

  // Live P&L WebSocket Connection Functions
  const connectLivePLWebSocket = () => {
    if (livePLSocketRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('🔌 Connecting to WebSocket for live P&L streaming:', wsUrl);
    
    livePLSocketRef.current = new WebSocket(wsUrl);
    
    livePLSocketRef.current.onopen = () => {
      console.log('✅ Live P&L WebSocket connected');
      setIsLivePLConnected(true);
    };
    
    livePLSocketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'cycle3_live_update') {
          console.log(`💰 Live P&L Update: Price ₹${data.currentPrice} | ${data.trades.activeCount} active trades | Total P&L: ₹${data.trades.totalUnrealizedPL.toFixed(2)}`);
          setLivePLData({
            currentPrice: data.currentPrice,
            marketTime: data.marketTime,
            trades: data.trades
          });
        }
      } catch (error) {
        console.error('Error parsing live P&L WebSocket message:', error);
      }
    };
    
    livePLSocketRef.current.onclose = () => {
      console.log('❌ Live P&L WebSocket disconnected');
      setIsLivePLConnected(false);
    };
    
    livePLSocketRef.current.onerror = (error) => {
      console.error('Live P&L WebSocket error:', error);
      setIsLivePLConnected(false);
    };
  };

  const disconnectLivePLWebSocket = () => {
    if (livePLSocketRef.current) {
      livePLSocketRef.current.close();
      livePLSocketRef.current = null;
    }
    setIsLivePLConnected(false);
    setLivePLData(null);
  };

  // Auto-connect WebSocket when scanner is active (improved logic with debugging)
  useEffect(() => {
    console.log(`🔍 WEBSOCKET CHECK: scannerState=${!!scannerState}, isLivePLConnected=${isLivePLConnected}`);
    
    // Always connect when scanner is active to show live price updates
    if (scannerState && !isLivePLConnected) {
      console.log('🚀 Auto-connecting live P&L WebSocket (scanner active)');
      connectLivePLWebSocket();
    } else if (scannerState && isLivePLConnected) {
      console.log('✅ Live P&L WebSocket already connected, skipping connection');
    } else if (!scannerState) {
      console.log('❌ Scanner not active, WebSocket connection skipped');
    }
    
    return () => {
      if (livePLSocketRef.current) {
        livePLSocketRef.current.close();
      }
    };
  }, [scannerState, isLivePLConnected]);
  
  // FORCE CONNECTION: Additional immediate connection attempt when scanner becomes active
  useEffect(() => {
    if (scannerState) {
      console.log('🎯 FORCE CONNECT: Scanner active, forcing WebSocket connection attempt');
      setTimeout(() => {
        if (!isLivePLConnected) {
          console.log('🔥 EMERGENCY CONNECT: WebSocket still not connected after scanner started');
          connectLivePLWebSocket();
        }
      }, 1000); // Try again after 1 second
    }
  }, [scannerState]);
  
  // IMMEDIATE DEBUG: Log current state every 2 seconds to debug the issue
  useEffect(() => {
    const debugInterval = setInterval(() => {
      console.log(`🔍 LIVE P&L DEBUG STATUS:`);
      console.log(`   Scanner Active: ${!!scannerState}`);
      console.log(`   WebSocket Connected: ${isLivePLConnected}`);
      console.log(`   WebSocket State: ${livePLSocketRef.current?.readyState || 'NULL'}`);
      console.log(`   Live P&L Data: ${livePLData ? 'Available' : 'NULL'}`);
      console.log(`   Current Price: ${livePLData?.currentPrice || 'N/A'}`);
    }, 2000);
    
    return () => clearInterval(debugInterval);
  }, [scannerState, isLivePLConnected, livePLData]);

  // Manual 6th candle progression handler
  const handleProgressToSixthCandle = async () => {
    if (!scannerState || !fifthCandleData || isWaitingForSixthCandle || sixthCandleData) return;

    console.log('🚀 MANUAL PROGRESSION: User triggered 6th candle progression');
    
    // Set waiting state immediately
    setIsWaitingForSixthCandle(true);
    
    // Clear any existing timer
    if (autoProgressionTimer) {
      clearTimeout(autoProgressionTimer);
      setAutoProgressionTimer(null);
      setProgressionCountdown(null);
    }

    const currentTimeframe = scannerState.currentTimeframe || 5;
    const symbol = scannerState.symbol || 'NSE:NIFTY50-INDEX';
    const fifthCandleEndTime = new Date(fifthCandleData.timestamp * 1000).getTime() + (currentTimeframe * 60 * 1000);

    try {
      const response = await fetch('/api/candle-progression/trigger-sixth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol,
          timeframe: currentTimeframe,
          startTime: Math.floor(fifthCandleEndTime / 1000)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ MANUAL PROGRESSION: Successfully triggered 6th candle progression', data);
        
        // Update UI state to show progression is complete
        setTimeout(() => {
          setIsWaitingForSixthCandle(false);
          // The 6th candle data will be fetched by other effects
        }, 1000);
      } else {
        console.error('❌ MANUAL PROGRESSION: Failed to trigger 6th candle', data);
        setIsWaitingForSixthCandle(false);
      }
    } catch (error) {
      console.error('❌ MANUAL PROGRESSION: Network error', error);
      setIsWaitingForSixthCandle(false);
    }
  };

  // Auto-progression based on candle duration completion
  useEffect(() => {
    // Clear any existing timer when conditions change
    if (autoProgressionTimer) {
      clearTimeout(autoProgressionTimer);
      setAutoProgressionTimer(null);
    }

    // Only monitor if scanner is active and 5th candle exists but 6th candle is not yet triggered
    if (!scannerState || !fifthCandleData || isWaitingForSixthCandle || sixthCandleData) return;

    const checkCandleDurationCompletion = () => {
      const now = new Date();
      const currentTimeframe = scannerState.currentTimeframe || 5;
      
      // Calculate 5th candle end time using the actual timestamp from candle data
      const fifthCandleStartTime = new Date(fifthCandleData.timestamp * 1000);
      const fifthCandleEndTime = new Date(fifthCandleStartTime.getTime() + (currentTimeframe * 60 * 1000));
      
      console.log(`🕐 AUTO-PROGRESSION CANDLE DURATION CHECK:
        Current Time: ${now.toLocaleTimeString('en-US', { hour12: true, timeZone: 'Asia/Kolkata' })}
        5th Candle Start: ${fifthCandleStartTime.toLocaleTimeString('en-US', { hour12: true, timeZone: 'Asia/Kolkata' })}
        5th Candle End: ${fifthCandleEndTime.toLocaleTimeString('en-US', { hour12: true, timeZone: 'Asia/Kolkata' })}
        Duration: ${currentTimeframe} minutes
        Time Remaining: ${Math.max(0, Math.ceil((fifthCandleEndTime.getTime() - now.getTime()) / 1000))} seconds`);
      
      // If 5th candle duration is completed, automatically trigger 6th candle progression
      if (now >= fifthCandleEndTime) {
        console.log('✅ AUTO-PROGRESSION: 5th candle duration completed, automatically triggering 6th candle progression');
        
        // Use the existing progression API to automatically move to 6th candle
        const symbol = scannerState.symbol || 'NSE:NIFTY50-INDEX';
        fetch('/api/candle-progression/trigger-sixth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: symbol,
            timeframe: currentTimeframe,
            startTime: Math.floor(fifthCandleEndTime.getTime() / 1000)
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log('🚀 AUTO-PROGRESSION API: Successfully triggered 6th candle progression', data);
            handleProgressToSixthCandle();
          } else {
            console.error('❌ AUTO-PROGRESSION API: Failed to trigger 6th candle', data);
          }
        })
        .catch(error => {
          console.error('❌ AUTO-PROGRESSION API: Network error', error);
        });
        
        return;
      }
      
      // Calculate remaining time and set timer for automatic progression
      const timeRemaining = fifthCandleEndTime.getTime() - now.getTime();
      if (timeRemaining > 0) {
        console.log(`⏰ AUTO-PROGRESSION: Setting timer for ${Math.ceil(timeRemaining / 1000)} seconds until 5th candle completion`);
        
        // Set countdown display
        setProgressionCountdown(Math.ceil(timeRemaining / 1000));
        
        // Update countdown every second
        const countdownInterval = setInterval(() => {
          const remainingNow = fifthCandleEndTime.getTime() - new Date().getTime();
          if (remainingNow > 0) {
            setProgressionCountdown(Math.ceil(remainingNow / 1000));
          } else {
            setProgressionCountdown(null);
            clearInterval(countdownInterval);
          }
        }, 1000);
        
        const timer = setTimeout(() => {
          console.log('🚀 AUTO-PROGRESSION: Timer triggered - 5th candle duration completed, moving to 6th candle');
          setProgressionCountdown(null);
          clearInterval(countdownInterval);
          
          // Use the existing progression API to automatically move to 6th candle
          const symbol = scannerState.symbol || 'NSE:NIFTY50-INDEX';
          fetch('/api/candle-progression/trigger-sixth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              symbol: symbol,
              timeframe: currentTimeframe,
              startTime: Math.floor(fifthCandleEndTime.getTime() / 1000)
            })
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              console.log('🚀 AUTO-PROGRESSION API: Successfully triggered 6th candle progression via timer', data);
              handleProgressToSixthCandle();
            } else {
              console.error('❌ AUTO-PROGRESSION API: Failed to trigger 6th candle via timer', data);
            }
          })
          .catch(error => {
            console.error('❌ AUTO-PROGRESSION API: Network error in timer', error);
          });
          
        }, timeRemaining);
        setAutoProgressionTimer(timer);
        
        // Clear any existing countdown interval to prevent conflicts
        // Note: countdownInterval is properly managed in its own scope
      }
    };

    // Start monitoring candle duration
    checkCandleDurationCompletion();

    return () => {
      if (autoProgressionTimer) {
        clearTimeout(autoProgressionTimer);
        setAutoProgressionTimer(null);
        setProgressionCountdown(null);
      }
    };
  }, [scannerState, fifthCandleData, isWaitingForSixthCandle, sixthCandleData, autoProgressionTimer]);

  // FORCE IMMEDIATE CONNECTION: Try connecting as soon as component mounts
  useEffect(() => {
    console.log('🚨 FORCE IMMEDIATE CONNECTION: Component mounted, attempting WebSocket connection');
    
    // Try connecting immediately
    setTimeout(() => {
      console.log('🔥 EMERGENCY CONNECTION ATTEMPT');
      connectLivePLWebSocket();
    }, 500);
    
    // Try again after 3 seconds if not connected
    setTimeout(() => {
      if (!isLivePLConnected) {
        console.log('🔥 SECOND EMERGENCY CONNECTION ATTEMPT - WebSocket still not connected');
        connectLivePLWebSocket();
      }
    }, 3000);
    
  }, []); // Empty dependency array - only run once on mount

  // Generate date range for scanning
  const generateDateRange = (start: string, end: string): string[] => {
    const dates: string[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    for (let dt = new Date(startDate); dt <= endDate; dt.setDate(dt.getDate() + 1)) {
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dt.getDay() !== 0 && dt.getDay() !== 6) {
        dates.push(dt.toISOString().split('T')[0]);
      }
    }
    return dates;
  };

  // Get current scanning date
  const getCurrentScanDate = (): string => {
    if (isDateRangeMode && dateRangeProgress) {
      return dateRangeProgress.dates[currentDateIndex] || selectedDate;
    }
    return selectedDate;
  };

  // Candle Progression Manager API calls
  const startProgressionMonitoring = useMutation({
    mutationFn: async ({ symbol, timeframe }: { symbol: string; timeframe: number }) => {
      const response = await fetch('/api/candle-progression/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, timeframe })
      });
      return response.json();
    },
    onSuccess: () => {
      console.log('🔄 CANDLE PROGRESSION: Monitoring started for automatic 4th -> 5th -> 6th candle transitions');
    },
    onError: (error) => {
      console.error('❌ CANDLE PROGRESSION: Failed to start monitoring:', error);
    }
  });

  const stopProgressionMonitoring = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/candle-progression/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: () => {
      console.log('🛑 CANDLE PROGRESSION: Monitoring stopped');
    },
    onError: (error) => {
      console.error('❌ CANDLE PROGRESSION: Failed to stop monitoring:', error);
    }
  });

  // Stop scanner function
  const handleStopScanner = () => {
    console.log('🛑 STOPPING SCANNER: Initiating complete scanner shutdown...');
    
    // Stop candle progression monitoring first
    stopProgressionMonitoring.mutate();
    
    // Clear all scanner states
    setScannerState(null);
    setHistoricalData([]);
    setCurrentTimeframeData([]);
    setPatternAnalysis(null);
    setFifthCandleData(null);
    setSixthCandleData(null);
    setIsWaitingForSixthCandle(false);
    setAutoProgressCountdown(null);
    setIsWaitingForPositionClosure(false);
    
    // Stop auto-fetch and streaming
    setIsAutoFetchActive(false);
    stopStreamingOHLC();
    
    // Clear intervals
    if (autoFetchInterval) {
      clearInterval(autoFetchInterval);
      setAutoFetchInterval(null);
    }
    
    // Reset live price tracking
    setLivePrice(null);
    setLastPriceUpdate('');
    setPriceChangePercent(0);
    
    // Reset date range mode if active
    setIsDateRangeMode(false);
    setDateRangeProgress(null);
    setCurrentDateIndex(0);
    
    console.log('✅ SCANNER STOPPED: All processes halted and states cleared');
  };

  // Start scanner mutation
  const startScannerMutation = useMutation({
    mutationFn: async ({ symbol, date }: { symbol: string; date: string }) => {
      const response = await fetch('/api/battu/3-cycle-scanner/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, date })
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Scanner started:', data);
      setScannerState(data.scannerState);
      
      // CRITICAL FIX: Start candle progression monitoring for automatic 4th -> 5th -> 6th candle transitions
      startProgressionMonitoring.mutate({
        symbol: selectedSymbol,
        timeframe: data.scannerState?.currentTimeframe || 5
      });
      
      // Reset completed timeframes for new scanner session
      setCompletedTimeframes(new Set());
      console.log('🔄 SCANNER RESTART: Reset completed timeframes tracking for new session');
      
      // Use already available historical data instead of refetching
      console.log(`🔍 SCANNER STARTUP: Checking data availability (${historicalData.length} candles available)`);
      
      if (historicalData.length >= 30) {
        console.log(`🚀 Using existing historical data (${historicalData.length} candles) to start pattern analysis immediately`);
        // Start with current scanner timeframe (or 5min if none set)
        const startingTimeframe = scannerState?.currentTimeframe || 5;
        resampleToTimeframe(historicalData, startingTimeframe);
      } else {
        console.log('📡 No historical data available, attempting to fetch...');
        // Try to fetch, but also check if data becomes available after a short delay
        fetchHistoricalData();
        
        // Fallback: Check again after 3 seconds in case live monitor provides data
        setTimeout(() => {
          if (historicalData.length >= 30 && scannerState) {
            console.log(`🔄 FALLBACK TRIGGER: Found historical data (${historicalData.length} candles) after delay`);
            const currentTimeframe = scannerState?.currentTimeframe || 5;
            resampleToTimeframe(historicalData, currentTimeframe);
          }
        }, 3000);
      }
    },
    onError: (error) => {
      console.error('Failed to start scanner:', error);
    }
  });





  // Fetch historical data from Fyers API
  const fetchHistoricalData = async () => {
    // Prevent multiple concurrent requests
    if (isRequestInProgress) {
      console.log('🚫 Request already in progress, skipping...');
      return;
    }

    try {
      setIsRequestInProgress(true);
      const currentDate = getCurrentScanDate(); // Use current scan date for date range mode
      const response = await fetch(`/api/battu/3-cycle-scanner/data/${selectedSymbol}?date=${currentDate}&timeframe=1`);
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log(`Fetched ${data.data.length} 1-minute candles from Fyers API for ${currentDate}`);
        setHistoricalData(data.data);
        
        // Initially resample to current scanner timeframe (or 5min if none set)
        const currentTimeframe = scannerState?.currentTimeframe || 5;
        await resampleToTimeframe(data.data, currentTimeframe);
      }
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
    } finally {
      setIsRequestInProgress(false);
    }
  };

  // Extract 1-minute data for Cycle 3 validation (critical function)
  const extractOneMinuteForCycle3 = (timeframeData: CandleData[], targetTimeframe: number) => {
    if (!historicalData.length || !timeframeData.length) return [];
    
    console.log(`🔍 CYCLE 3: Extracting 1-minute data for validation from ${timeframeData.length} timeframe candles`);
    
    const oneMinuteCandles: CandleData[] = [];
    
    // For each timeframe candle, extract the corresponding 1-minute candles
    timeframeData.slice(0, 6).forEach((timeframeCandle, candleIndex) => {
      const startTime = timeframeCandle.timestamp;
      const endTime = startTime + (targetTimeframe * 60); // Add timeframe duration in seconds
      
      // Find all 1-minute candles within this timeframe window
      const minuteCandles = historicalData.filter(oneMinCandle => 
        oneMinCandle.timestamp >= startTime && oneMinCandle.timestamp < endTime
      );
      
      console.log(`   📊 Candle ${candleIndex + 1}: Found ${minuteCandles.length} 1-minute candles (${new Date(startTime * 1000).toLocaleTimeString()} - ${new Date(endTime * 1000).toLocaleTimeString()})`);
      
      oneMinuteCandles.push(...minuteCandles);
    });
    
    console.log(`✅ CYCLE 3: Extracted ${oneMinuteCandles.length} total 1-minute candles for validation`);
    return oneMinuteCandles;
  };

  // Resample data to different timeframes
  const resampleToTimeframe = async (data: CandleData[], targetTimeframe: number) => {
    try {
      const response = await fetch('/api/battu/3-cycle-scanner/resample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, targetTimeframe })
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log(`Resampled to ${targetTimeframe}-minute timeframe: ${result.data.length} candles`);
        setCurrentTimeframeData(result.data);
        
        // CRITICAL: Extract 1-minute data for Cycle 3 validation
        const cycle3Data = extractOneMinuteForCycle3(result.data, targetTimeframe);
        setCycle3OneMinuteData(cycle3Data);
        
        // Update scanner state
        if (scannerState) {
          setScannerState({
            ...scannerState,
            currentTimeframe: targetTimeframe,
            candlesCollected: Math.min(result.data.length, 4)
          });
        }

        // Trigger Cycle 1 Point A/B extraction and Cycle 2 analysis if we have 4 complete candles
        if (result.data.length >= 4) {
          // Fetch Cycle 1 Point A/B data using 4 Candle Rule methodology
          await fetchCycle1PointAB(result.data.slice(0, 4), targetTimeframe);
          
          // Proceed with Cycle 2 analysis
          await analyzePattern(result.data, targetTimeframe);
        }
      }
    } catch (error) {
      console.error('Failed to resample data:', error);
    }
  };

  // REMOVED: C2 Block Internal Patterns completely removed

  // Fetch Cycle 1 Point A/B data using 4 Candle Rule methodology
  const fetchCycle1PointAB = async (firstFourCandles: CandleData[], timeframe: number) => {
    try {
      console.log('🔍 CYCLE 1: Fetching Point A/B using 4 Candle Rule methodology...');
      const response = await fetch('/api/battu/3-cycle-scanner/cycle1-pointab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbol: selectedSymbol,
          date: getCurrentScanDate(), // Use the correct analysis date (2025-07-28)
          timeframe: timeframe,
          firstFourCandles: firstFourCandles,
          historicalData: historicalData // Pass available historical data to avoid API calls
        })
      });
      const result = await response.json();
      
      if (result.success && result.pointABData) {
        console.log('✅ CYCLE 1: Point A/B extracted successfully:', result.pointABData);
        setCycle1PointABData(result.pointABData);
        
        // NEW: Process recursive analysis results (80min → 5min fractal drilling)
        if (result.recursiveAnalysis) {
          console.log('🔄 RECURSIVE ANALYSIS: Fractal Point A/B analysis available', result.recursiveAnalysis);
          console.log(`📈 Uptrend Patterns: [${result.recursiveAnalysis.uptrendList.join(', ')}]`);
          console.log(`📉 Downtrend Patterns: [${result.recursiveAnalysis.downtrendList.join(', ')}]`);
          setRecursiveAnalysis(result.recursiveAnalysis);
        } else {
          console.log('🔄 RECURSIVE ANALYSIS: No fractal analysis available (80min timeframe required)');
          setRecursiveAnalysis(null);
        }
      } else {
        console.error('❌ CYCLE 1: Failed to extract Point A/B:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch Cycle 1 Point A/B:', error);
    }
  };

  // Analyze pattern for Cycle 2 with comprehensive simulation tracking - USING CYCLE 1 DATA SOURCE
  const analyzePattern = async (data: CandleData[], timeframe: number) => {
    try {
      // DEDUPLICATION: Prevent multiple pattern analysis calls for same timeframe/date/symbol
      const analysisKey = `${selectedSymbol}-${selectedDate}-${timeframe}`;
      
      if (activePatternAnalysis[analysisKey]) {
        console.log(`🚫 PATTERN ANALYSIS SKIP: Already running for ${timeframe}min timeframe on ${selectedDate}`);
        return;
      }
      
      // Mark as active
      setActivePatternAnalysis(prev => ({ ...prev, [analysisKey]: true }));
      
      console.log('🔍 Cycle 2: Starting pattern analysis using Cycle 1 data source...');
      
      // CRITICAL FIX: Clear processed patterns and breakouts for new analysis session
      setProcessedPatterns(new Set());
      setProcessedBreakouts(new Set());
      console.log(`🧹 CLEARED processed patterns and breakouts for fresh ${timeframe}min analysis`);
      const response = await fetch('/api/battu/3-cycle-scanner/cycle1-pointab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbol: selectedSymbol,
          date: getCurrentScanDate(),
          timeframe: timeframe,
          firstFourCandles: data.slice(0, 4)
        })
      });
      const result = await response.json();
      
      if (result.success && result.pointABData) {
        console.log('✅ Cycle 2: Pattern analysis complete using Cycle 1 data source:', result.pointABData);
        
        // NEW: Process recursive analysis results in pattern analysis
        if (result.recursiveAnalysis && timeframe === 80) {
          console.log('🔄 PATTERN ANALYSIS: Recursive fractal analysis available', result.recursiveAnalysis);
          console.log('📈 Setting authentic uptrend patterns:', result.recursiveAnalysis.uptrendList);
          console.log('📉 Setting authentic downtrend patterns:', result.recursiveAnalysis.downtrendList);
          setRecursiveAnalysis(result.recursiveAnalysis);
        }
        
        // Calculate proper duration and slope using exact timestamps
        const calculatePatternDurationAndSlope = (pointA: any, pointB: any) => {
          // Duration in minutes from timestamp difference
          const durationMinutes = (pointB.timestamp - pointA.timestamp) / 60;
          
          // Slope calculation: price change per minute
          const priceChange = pointB.price - pointA.price;
          const slope = priceChange / durationMinutes;
          
          // Timing analysis for 34% rule
          const timing34Percent = durationMinutes * 0.34;
          
          console.log(`📊 SLOPE & TIMING ANALYSIS:`);
          console.log(`   Point A: ${pointA.exactTime} @ ${pointA.price}`);
          console.log(`   Point B: ${pointB.exactTime} @ ${pointB.price}`);
          console.log(`   Duration: ${durationMinutes.toFixed(1)} minutes`);
          console.log(`   Price Change: ${priceChange.toFixed(2)} points`);
          console.log(`   Slope: ${slope.toFixed(4)} points/minute`);
          console.log(`   34% Rule Timing: ${timing34Percent.toFixed(1)} minutes`);
          
          return {
            durationMinutes,
            slope,
            priceChange,
            timing34Percent
          };
        };

        // Convert Cycle 1 point AB data to pattern analysis format with proper slope calculations
        const uptrendAnalysis = calculatePatternDurationAndSlope(
          result.pointABData.uptrend.pointA, 
          result.pointABData.uptrend.pointB
        );
        
        const downtrendAnalysis = calculatePatternDurationAndSlope(
          result.pointABData.downtrend.pointA, 
          result.pointABData.downtrend.pointB
        );
        
        // Calculate proper stop loss based on candle trigger logic
        // Note: Stop loss will be calculated dynamically based on which candle triggers (5th or 6th)
        // For now, we'll use the 4th candle (C2B) as the default stop loss reference
        const fourthCandle = data.length >= 4 ? data[3] : null; // C2B candle
        
        const convertedPatterns = [
          {
            type: "UPTREND",
            pointA: result.pointABData.uptrend.pointA,
            pointB: result.pointABData.uptrend.pointB,
            breakoutLevel: result.pointABData.uptrend.pointB.price,
            stopLoss: fourthCandle ? fourthCandle.low : result.pointABData.uptrend.pointA.price, // 4th candle low for uptrend
            slope: uptrendAnalysis.slope,
            duration: uptrendAnalysis.durationMinutes,
            priceChange: uptrendAnalysis.priceChange,
            timing34Percent: uptrendAnalysis.timing34Percent
          },
          {
            type: "DOWNTREND", 
            pointA: result.pointABData.downtrend.pointA,
            pointB: result.pointABData.downtrend.pointB,
            breakoutLevel: result.pointABData.downtrend.pointB.price,
            stopLoss: fourthCandle ? fourthCandle.high : result.pointABData.downtrend.pointA.price, // 4th candle high for downtrend
            slope: downtrendAnalysis.slope,
            duration: downtrendAnalysis.durationMinutes,
            priceChange: downtrendAnalysis.priceChange,
            timing34Percent: downtrendAnalysis.timing34Percent
          }
        ];

        const patternAnalysis = {
          timeframe: timeframe,
          patterns: convertedPatterns,
          metadata: { source: 'cycle1_data_source', timeframe }
        };
        
        setPatternAnalysis(patternAnalysis);

        // REMOVED: C2 Block Internal Pattern Analysis completely removed

        // ENHANCED STEP 2: Advanced Internal Pattern Analysis (Integrated in Point A/B Analysis)
        console.log('🚀 [ADVANCED-PATTERN] Using integrated recursive timeframe breakdown from Point A/B Analysis...');
        console.log(`🔍 [DATA-DEBUG] Checking Point A/B Analysis response:`, {
          hasResult: !!result,
          hasAdvancedAnalysis: !!result?.advancedAnalysis,
          hasOneMinuteData: !!result?.oneMinuteData,
          oneMinuteDataLength: result?.oneMinuteData?.length || 0,
          resultKeys: result ? Object.keys(result) : []
        });
        
        // Advanced analysis removed - ready for new implementation
        
        // Market-aware candle tracking - handle scenarios where 6th candle cannot form
        const fifthCandle = data.length >= 5 ? data[4] : null;
        const sixthCandle = data.length >= 6 ? data[5] : null;
        
        // CRITICAL FIX: Check if 6th candle is from the past vs current time
        const currentTime = new Date();
        const marketCloseTime = new Date();
        marketCloseTime.setHours(15, 30, 0, 0); // 3:30 PM market close
        
        // Check 6th candle timestamp specifically for timeframe completion validation
        const sixthCandleTime = sixthCandle ? new Date(sixthCandle.timestamp * 1000) : null;
        const lastCandleTime = data.length > 0 ? new Date(data[data.length - 1].timestamp * 1000) : new Date();
        
        // If 6th candle exists, use its timestamp; otherwise use last available candle
        const relevantCandleTime = sixthCandleTime || lastCandleTime;
        const timeDifferenceMinutes = (currentTime.getTime() - relevantCandleTime.getTime()) / (1000 * 60);
        
        // Past data detection: If 6th candle is older than 2x timeframe duration, it's definitely past data
        const isUsingPastData = timeDifferenceMinutes > (timeframe * 2);
        const isNearMarketClose = currentTime >= marketCloseTime;
        const canFormSixthCandle = data.length >= 6 || (!isNearMarketClose && data.length >= 5);
        
        console.log('📊 TIMESTAMP SYNCHRONIZATION CHECK:');
        console.log(`   Current Time: ${currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}`);
        console.log(`   6th Candle Time: ${sixthCandleTime ? sixthCandleTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : 'N/A'}`);
        console.log(`   Last Live Candle: ${lastCandleTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}`);
        console.log(`   Time Difference: ${timeDifferenceMinutes.toFixed(1)} minutes`);
        console.log(`   Past Data Threshold: ${timeframe * 2}min (2x timeframe)`);
        console.log(`   Using Past Data: ${isUsingPastData ? '🚨 YES - IMMEDIATE TIMEFRAME SWITCH NEEDED' : '✅ NO - Current data'}`);
        console.log(`   Timeframe: ${timeframe}min`);
        console.log('📊 CANDLE TRACKING:');
        console.log(`   Total Candles Available: ${data.length}/6`);
        console.log(`   5th Candle: ${fifthCandle ? '✅ Available' : '❌ Missing'}`);
        console.log(`   6th Candle: ${sixthCandle ? '✅ Available' : '❌ Missing'}`);
        
        if (fifthCandle) {
          console.log(`🎯 5TH CANDLE DETECTED for ${timeframe}min timeframe:`);
          console.log(`   Start: ${new Date(fifthCandle.timestamp * 1000).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}`);
          console.log(`   OHLC: O:${fifthCandle.open} H:${fifthCandle.high} L:${fifthCandle.low} C:${fifthCandle.close}`);
          console.log(`   Available for ENTRY/EXIT analysis!`);
        }
        
        if (fifthCandle) {
          console.log('📊 5th Candle Details:', {
            timestamp: fifthCandle.timestamp,
            time: new Date(fifthCandle.timestamp * 1000).toLocaleString(),
            open: fifthCandle.open,
            high: fifthCandle.high,
            low: fifthCandle.low,
            close: fifthCandle.close
          });
          setFifthCandleData(fifthCandle);
          
          // If we can't form a 6th candle, complete analysis with 5th candle
          if (!sixthCandle && (!canFormSixthCandle || isNearMarketClose)) {
            console.log('⚠️ MARKET CLOSURE: 6th candle cannot form, completing analysis with 5th candle');
            setScannerState(prev => prev ? {
              ...prev,
              cycle2Status: {
                ...prev.cycle2Status,
                fifthCandleData: fifthCandle,
                sixthCandleData: null, // Explicitly null for market closure
                isMarketClosed: true,
                completedWith5thCandle: true
              }
            } : null);
            console.log('✅ 5th candle completion stored (market closure scenario)');
          }
        }
        
        if (sixthCandle) {
          console.log('📊 6th Candle Details:', {
            timestamp: sixthCandle.timestamp,
            time: new Date(sixthCandle.timestamp * 1000).toLocaleString(),
            open: sixthCandle.open,
            high: sixthCandle.high,
            low: sixthCandle.low,
            close: sixthCandle.close
          });
          setSixthCandleData(sixthCandle);
          
          // CRITICAL FIX: Proper historical vs current date handling
          const currentDate = new Date().toISOString().split('T')[0];
          const analysisDate = selectedDate;
          
          // OVERRIDE: Force today's date to behave as historical when doing Historical Analysis
          const isUsingHistoricalAnalysisMode = scannerState !== null; // If Historical Analysis button was clicked
          const isAnalyzingCurrentDate = (analysisDate === currentDate) && !isUsingHistoricalAnalysisMode;
          
          if (isUsingPastData && !isAnalyzingCurrentDate) {
            // Pure historical date - complete all patterns using historical data only
            console.log('📊 PURE HISTORICAL DATE: Completing all patterns with historical data');
            console.log(`   Analysis Date: ${analysisDate} (historical)`);
            console.log(`   6th Candle Time: ${sixthCandleTime} (historical)`);
            console.log(`   Strategy: Complete all timeframes sequentially with historical data`);
            
            setScannerState(prev => prev ? {
              ...prev,
              cycle2Status: {
                ...prev.cycle2Status,
                sixthCandleData: sixthCandle,
                fifthCandleData: fifthCandle,
                isPastData: true,
                isHistoricalDate: true
              }
            } : null);
          } else if (isUsingPastData && isAnalyzingCurrentDate) {
            // Current date with completed historical patterns - determine where to use live data
            console.log('🔄 CURRENT DATE - HISTORICAL PATTERNS COMPLETE: Switching to live validation');
            console.log(`   Analysis Date: ${analysisDate} (current date)`);
            console.log(`   Completed Historical Time: ${sixthCandleTime}`);
            console.log(`   Current Live Time: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
            console.log(`   Strategy: Use live data for Cycle 3 validation on remaining timeframes`);
            
            setScannerState(prev => prev ? {
              ...prev,
              cycle2Status: {
                ...prev.cycle2Status,
                sixthCandleData: sixthCandle,
                fifthCandleData: fifthCandle,
                isPastData: true,
                shouldSwitchToLiveMonitor: true, // Switch to live monitor for cycle 3
                isCurrentDateWithLiveTransition: true
              }
            } : null);
          } else {
            // Normal current date processing
            console.log('✅ CURRENT DATE - NORMAL PROCESSING: Using appropriate data source');
          }
          
          // Update scanner state with 6th candle data for normal completion
          setScannerState(prev => prev ? {
            ...prev,
            cycle2Status: {
              ...prev.cycle2Status,
              sixthCandleData: sixthCandle,
              fifthCandleData: fifthCandle,
              isMarketClosed: false,
              completedWith5thCandle: false
            }
          } : null);
          
          console.log('✅ 6th candle data stored (normal completion)');
        }
        
        // Process each pattern for simulation tracking
        // ENHANCED FIX: Use ALL available historical data first, then switch to live streaming
        if (patternAnalysis.patterns && patternAnalysis.patterns.length > 0) {
          const currentDate = new Date().toISOString().split('T')[0];
          const analysisDate = selectedDate;
          const isAnalyzingCurrentDate = analysisDate === currentDate;
          const availableHistoricalCandles = historicalData.length;
          const maxPossibleCandles = 6 * timeframe; // 6 timeframe candles worth of 1-min data
          const hasMoreHistoricalData = availableHistoricalCandles > maxPossibleCandles;
          
          console.log(`📊 DATA AVAILABILITY CHECK: ${timeframe}min timeframe`);
          console.log(`   Available Historical: ${availableHistoricalCandles} 1-min candles`);
          console.log(`   Required for 6 candles: ${maxPossibleCandles} 1-min candles`);
          console.log(`   Has More Data: ${hasMoreHistoricalData ? '✅ YES - Continue with historical' : '❌ NO - Switch to live'}`);
          
          if (hasMoreHistoricalData && isAnalyzingCurrentDate) {
            console.log(`📈 USING HISTORICAL DATA: ${timeframe}min timeframe analysis enabled`);
            console.log(`   Historical Data: ${availableHistoricalCandles} candles available`);
            console.log(`   Status: Continue using available historical data - TRADES ENABLED`);
            
            // Calculate and display data availability
            const availability = calculateDataAvailability(historicalData, timeframe);
            
            // Enable streaming OHLC for real-time visualization
            if (!streamingInterval) {
              console.log(`🚀 STARTING STREAMING OHLC: Real-time display for C1A,C1B,C2A,C2B,5th,6th`);
              startStreamingOHLC();
            }
            
            // Process patterns with historical data
            for (const pattern of patternAnalysis.patterns) {
              console.log(`   Active Pattern: ${pattern.type} - Entry: ${pattern.breakoutLevel}, SL: ${pattern.stopLoss} [HISTORICAL DATA]`);
              await processPatternForSimulation(pattern, data, timeframe, fifthCandle, sixthCandle);
            }
          } else if (!hasMoreHistoricalData && isAnalyzingCurrentDate) {
            console.log(`🚀 SEAMLESS LIVE DATA BLENDING: ${timeframe}min timeframe`);
            console.log(`   Historical Used: ${availableHistoricalCandles} candles`);
            console.log(`   ✨ ACTIVATING LIVE TRACKING DATA SYSTEM`);
            
            // ENHANCED: Seamless live + historical data blending
            const availability = calculateDataAvailability(historicalData, timeframe);
            
            // Start live data progress tracking if needed
            if (availability.isLiveDataNeeded && !liveDataProgress?.isActive) {
              startLiveDataProgress(availability.requiredUntilClose, timeframe);
              console.log(`📏 LIVE DATA PROGRESS: Started tracking for ${availability.requiredUntilClose} more candles`);
            }
            
            // Start incomplete candle tracking for current candle
            const currentTime = Math.floor(Date.now() / 1000);
            const candlePosition = data.length <= 4 ? '5th' : '6th';
            const candleStartTime = currentTime - (currentTime % (timeframe * 60));
            
            if (!incompleteCandleStatus?.isActive || incompleteCandleStatus?.timeframeMinutes !== timeframe) {
              if (incompleteCandleStatus?.isActive && incompleteCandleStatus?.timeframeMinutes !== timeframe) {
                console.log(`🔄 TIMEFRAME CHANGE: Updating incomplete candle from ${incompleteCandleStatus.timeframeMinutes}min to ${timeframe}min`);
              }
              startIncompleteCandleTracking(candlePosition, timeframe, candleStartTime);
              console.log(`🕯️ INCOMPLETE CANDLE: Started tracking ${candlePosition} candle (${timeframe}min)`);
            }
            
            // Prevent scanner from stopping - continue with available data
            console.log(`🚫 PREVENT SCANNER STOP: Processing patterns with available data while fetching live data`);
            setIsAutoFetchActive(true);
            
            // Enable streaming OHLC for live updates
            if (!streamingInterval) {
              console.log(`🚀 STARTING LIVE STREAMING OHLC: 700ms updates for all candle positions`);
              startStreamingOHLC();
            }
            
            // Process patterns with seamless live+historical data capability
            for (const pattern of patternAnalysis.patterns) {
              console.log(`   ✨ Seamless Pattern: ${pattern.type} - Entry: ${pattern.breakoutLevel}, SL: ${pattern.stopLoss} [LIVE+HISTORICAL]`);
              await processPatternForSimulation(pattern, data, timeframe, fifthCandle, sixthCandle);
            }
          } else if (timeframe === 5) {
            console.log(`📊 5MIN TIMEFRAME: Analysis only - No trade execution`);
            console.log(`   Found ${patternAnalysis.patterns.length} patterns for analysis purposes`);
            
            // Log patterns but don't execute trades
            for (const pattern of patternAnalysis.patterns) {
              console.log(`   Pattern: ${pattern.type} - Entry: ${pattern.breakoutLevel}, SL: ${pattern.stopLoss}`);
            }
          } else {
            console.log(`💼 ${timeframe}MIN TIMEFRAME: Analysis + Trade Execution Enabled`);
            for (const pattern of patternAnalysis.patterns) {
              await processPatternForSimulation(pattern, data, timeframe, fifthCandle, sixthCandle);
            }
          }
        }
        

        
        // Flexible completion logic - handle both 6th candle and market closure scenarios
        if (!sixthCandle && fifthCandle && canFormSixthCandle && !isNearMarketClose) {
          setIsWaitingForSixthCandle(true);
          console.log('⏳ Waiting for 6th candle completion before timeframe transition...');
        } else if (sixthCandle) {
          setIsWaitingForSixthCandle(false);
          console.log('✅ 6th candle completed - ready for timeframe transition');
          console.log('🚀 AUTO-PROGRESSION will trigger shortly...');
        } else if (fifthCandle && (!canFormSixthCandle || isNearMarketClose)) {
          setIsWaitingForSixthCandle(false);
          console.log('✅ 5th candle completed (market closure) - ready for timeframe transition');
          console.log('🚀 AUTO-PROGRESSION will trigger shortly (completing with 5th candle)...');
        }
        
        // ALWAYS record patterns even if there are processing errors above
        // Record patterns to master list with timeframe info (WITH DEDUPLICATION)
        if (patternAnalysis.patterns && patternAnalysis.patterns.length > 0) {
          const patternsWithTimeframe = patternAnalysis.patterns.map((pattern: any) => {
            // Calculate exact breakout time for pattern records
            let exactBreakoutTime = null;
            if (pattern.entryCandle?.timestamp && timeframe) {
              const entryTime = new Date(pattern.entryCandle.timestamp * 1000);
              const fifthCandleStart = new Date(entryTime.getTime() + (timeframe * 4 * 60 * 1000));
              exactBreakoutTime = fifthCandleStart.toLocaleTimeString('en-US', {
                hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata'
              });
            }
            
            return {
              ...pattern,
              timeframe: timeframe,
              timestamp: new Date().toISOString(),
              symbol: selectedSymbol,
              date: selectedDate,
              fifthCandleData: fifthCandle,
              sixthCandleData: sixthCandle,
              tradeExecutionEnabled: timeframe > 5,
              isCompletedTimeframe: false,
              exactBreakoutTime: exactBreakoutTime, // Store calculated breakout time
              entryCandle: pattern.entryCandle // Ensure entry candle is available for calculations
            };
          });
          
          setAllPatternRecords(prev => {
            // DEDUPLICATION: Check if patterns already exist for this timeframe/date/symbol
            const existingPatterns = prev.filter(existing => 
              existing.timeframe === timeframe && 
              existing.date === selectedDate && 
              existing.symbol === selectedSymbol
            );
            
            if (existingPatterns.length > 0) {
              console.log(`🚫 DUPLICATE PREVENTION: Patterns already exist for ${timeframe}min timeframe on ${selectedDate} - skipping recording`);
              console.log(`   Existing patterns: ${existingPatterns.length}, Attempted to add: ${patternsWithTimeframe.length}`);
              return prev; // Don't add duplicates
            }
            
            const newRecords = [...prev, ...patternsWithTimeframe];
            console.log(`📝 PATTERN STORAGE DEBUG: Adding ${patternsWithTimeframe.length} patterns to existing ${prev.length}, total will be ${newRecords.length}`);
            return newRecords;
          });
          
          console.log(`📝 Recorded ${patternsWithTimeframe.length} patterns for ${timeframe}min timeframe`);
        }
      }
    } catch (error) {
      console.error('Failed to analyze pattern:', error);
      
      // Clear active analysis flag on error
      const analysisKey = `${selectedSymbol}-${selectedDate}-${timeframe}`;
      setActivePatternAnalysis(prev => {
        const newState = { ...prev };
        delete newState[analysisKey];
        return newState;
      });
      
      // Even if analysis fails, try to store patterns if they exist (WITH DEDUPLICATION)
      if (patternAnalysis?.patterns && patternAnalysis.patterns.length > 0) {
        const patternsWithTimeframe = patternAnalysis.patterns.map((pattern: any) => ({
          ...pattern,
          timeframe: timeframe,
          timestamp: new Date().toISOString(),
          symbol: selectedSymbol,
          date: selectedDate,
          fifthCandleData: scannerState?.cycle2Status?.fifthCandleData || null,
          sixthCandleData: scannerState?.cycle2Status?.sixthCandleData || null,
          tradeExecutionEnabled: timeframe > 5,
          isCompletedTimeframe: false,
          hasProcessingError: true
        }));
        
        setAllPatternRecords(prev => {
          // DEDUPLICATION: Check if patterns already exist for this timeframe/date/symbol
          const existingPatterns = prev.filter(existing => 
            existing.timeframe === timeframe && 
            existing.date === selectedDate && 
            existing.symbol === selectedSymbol
          );
          
          if (existingPatterns.length > 0) {
            console.log(`🚫 DUPLICATE PREVENTION (ERROR RECOVERY): Patterns already exist for ${timeframe}min timeframe on ${selectedDate} - skipping recording`);
            console.log(`   Existing patterns: ${existingPatterns.length}, Attempted to add: ${patternsWithTimeframe.length}`);
            return prev; // Don't add duplicates
          }
          
          const newRecords = [...prev, ...patternsWithTimeframe];
          console.log(`📝 PATTERN STORAGE DEBUG (ERROR RECOVERY): Adding ${patternsWithTimeframe.length} patterns to existing ${prev.length}, total will be ${newRecords.length}`);
          return newRecords;
        });
        
        console.log(`📝 ERROR RECOVERY: Recorded ${patternsWithTimeframe.length} patterns for ${timeframe}min timeframe despite processing error`);
      }
    }
    
    // Clear active analysis flag when complete
    const analysisKey = `${selectedSymbol}-${selectedDate}-${timeframe}`;
    setActivePatternAnalysis(prev => {
      const newState = { ...prev };
      delete newState[analysisKey];
      return newState;
    });
  };

  // Track processed patterns to prevent duplicates within same analysis session
  const [processedPatterns, setProcessedPatterns] = useState<Set<string>>(new Set());
  
  // Track processed breakouts to prevent duplicate trade execution
  const [processedBreakouts, setProcessedBreakouts] = useState<Set<string>>(new Set());

  // Process pattern for simulation with comprehensive tracking
  const processPatternForSimulation = async (
    pattern: any, 
    data: CandleData[], 
    timeframe: number,
    fifthCandle: CandleData | null,
    sixthCandle: CandleData | null
  ) => {
    try {
      // CRITICAL FIX: Prevent duplicate pattern processing in same analysis session
      const patternKey = `${pattern.type}-${timeframe}-${pattern.breakoutLevel}-${pattern.stopLoss}`;
      
      if (processedPatterns.has(patternKey)) {
        console.log(`🚫 PATTERN ALREADY PROCESSED: Skipping ${pattern.type} (${timeframe}min) - Key: ${patternKey}`);
        return;
      }
      
      // Mark pattern as processed
      setProcessedPatterns(prev => new Set(prev).add(patternKey));
      console.log(`🎯 PROCESSING NEW PATTERN: ${pattern.type} (${timeframe}min) - Key: ${patternKey}`);
      
      const isUptrend = pattern.type === 'UPTREND';
      const breakoutLevel = pattern.breakoutLevel;
      
      // Calculate proper stop loss based on trigger candle logic
      let stopLoss = pattern.stopLoss; // Default fallback
      let triggerCandle = '5th'; // Default assumption
      
      // Determine which candle triggered and set appropriate stop loss
      if (sixthCandle) {
        // 6th candle trigger: Use 5th candle high/low as stop loss
        triggerCandle = '6th';
        if (fifthCandle) {
          stopLoss = isUptrend ? fifthCandle.low : fifthCandle.high;
          console.log(`🎯 6th Candle Trigger: Using 5th candle ${isUptrend ? 'low' : 'high'} as stop loss: ${stopLoss}`);
        }
      } else if (fifthCandle) {
        // 5th candle trigger: Use 4th candle high/low as stop loss
        triggerCandle = '5th';
        const fourthCandle = data.length >= 4 ? data[3] : null; // C2B candle
        if (fourthCandle) {
          stopLoss = isUptrend ? fourthCandle.low : fourthCandle.high;
          console.log(`🎯 5th Candle Trigger: Using 4th candle ${isUptrend ? 'low' : 'high'} as stop loss: ${stopLoss}`);
        }
      }
      
      const targetPrice = calculateTargetPrice(pattern, breakoutLevel, stopLoss, isUptrend);
      
      console.log(`📊 Processing ${pattern.type} pattern for simulation:`);
      console.log(`   Trigger: ${triggerCandle} candle`);
      console.log(`   Entry: ${breakoutLevel}, SL: ${stopLoss}, Target: ${targetPrice}`);
      
      // Check breakout across available candles (including when only 4 candles exist)
      let entryCandle = null;
      let entryPrice = null;
      let breakoutDetected = false;
      let breakoutCandlePosition = null;
      
      // For large timeframes with limited data, check all available candles beyond C2B (4th candle)
      const availableCandles = [];
      if (data.length > 4) availableCandles.push({ candle: data[4], position: '5th' });
      if (data.length > 5) availableCandles.push({ candle: data[5], position: '6th' });
      
      // Also include fifthCandle and sixthCandle if provided separately
      if (fifthCandle && !availableCandles.find(c => c.candle.timestamp === fifthCandle.timestamp)) {
        availableCandles.push({ candle: fifthCandle, position: '5th' });
      }
      if (sixthCandle && !availableCandles.find(c => c.candle.timestamp === sixthCandle.timestamp)) {
        availableCandles.push({ candle: sixthCandle, position: '6th' });
      }
      
      // Check for breakout in available candles
      for (const { candle, position } of availableCandles) {
        if (!breakoutDetected) {
          const hasBreakout = checkBreakout(candle, breakoutLevel, isUptrend);
          if (hasBreakout) {
            entryCandle = candle;
            entryPrice = breakoutLevel;
            breakoutDetected = true;
            breakoutCandlePosition = position;
            console.log(`🚀 ${position} Candle Breakout Detected: ${isUptrend ? 'BUY' : 'SELL'} @ ${entryPrice}`);
            console.log(`   Breakout in ${position} candle: H:${candle.high} L:${candle.low} (Level: ${breakoutLevel})`);
            break;
          }
        }
      }
      
      // If no 5th/6th candle available but we have 4 candles, check if pattern should trigger at market close
      if (!breakoutDetected && data.length === 4 && timeframe >= 40) {
        console.log(`⚠️ Market close detected for ${timeframe}min - only 4 candles available. Checking market close breakout...`);
        
        // Use the last available candle (4th candle) for market close evaluation
        const lastCandle = data[3]; // C2B (4th candle)
        const hasMarketCloseBreakout = checkBreakout(lastCandle, breakoutLevel, isUptrend);
        
        if (hasMarketCloseBreakout) {
          entryCandle = lastCandle;
          entryPrice = breakoutLevel;
          breakoutDetected = true;
          breakoutCandlePosition = '4th (market close)';
          console.log(`🚀 Market Close Breakout Detected in 4th Candle: ${isUptrend ? 'BUY' : 'SELL'} @ ${entryPrice}`);
          console.log(`   Last candle breakout: H:${lastCandle.high} L:${lastCandle.low} (Level: ${breakoutLevel})`);
        }
      }
      
      // Simulate trade execution and exit - show results even at market close
      if (breakoutDetected && entryCandle && entryPrice) {
        // CRITICAL FIX: Prevent duplicate breakout execution
        const breakoutKey = `${pattern.type}-${timeframe}-${entryPrice}-${breakoutCandlePosition}-${entryCandle.timestamp}`;
        
        if (processedBreakouts.has(breakoutKey)) {
          console.log(`🚫 BREAKOUT ALREADY PROCESSED: Skipping duplicate breakout execution`);
          console.log(`   Pattern: ${pattern.type} (${timeframe}min) | Entry: ${entryPrice} | Position: ${breakoutCandlePosition}`);
          return;
        }
        
        // Mark breakout as processed
        setProcessedBreakouts(prev => new Set(prev).add(breakoutKey));
        console.log(`🎯 EXECUTING NEW BREAKOUT: ${pattern.type} (${timeframe}min) | Entry: ${entryPrice} | Position: ${breakoutCandlePosition}`);
        console.log(`🔄 Simulating trade execution for ${breakoutCandlePosition} candle breakout...`);
        
        const tradeResult = simulateTradeExecution(
          pattern, 
          entryCandle, 
          entryPrice, 
          targetPrice, 
          stopLoss, 
          sixthCandle, 
          isUptrend,
          timeframe,
          breakoutCandlePosition || '5th',
          cycle3OneMinuteData
        );
        
        // DUPLICATE PREVENTION: Check if similar trade already exists
        setSimulationTrades(prev => {
          const isDuplicate = prev.some(existingTrade => 
            existingTrade.pattern === tradeResult.pattern &&
            existingTrade.timeframe === tradeResult.timeframe &&
            existingTrade.direction === tradeResult.direction &&
            Math.abs(existingTrade.entryPrice - tradeResult.entryPrice) < 0.01 &&
            existingTrade.targetPrice === tradeResult.targetPrice &&
            existingTrade.stopLoss === tradeResult.stopLoss
          );
          
          if (isDuplicate) {
            console.log(`🚫 DUPLICATE TRADE PREVENTION: Trade already exists for ${tradeResult.pattern} ${tradeResult.direction} (${tradeResult.timeframe}min)`);
            return prev;
          }
          
          console.log(`✅ ADDING NEW TRADE: ${tradeResult.pattern} ${tradeResult.direction} (${tradeResult.timeframe}min) - Entry: ${tradeResult.entryPrice}`);
          return [...prev, tradeResult];
        });
        
        // Update scanner state with cycle 2 status - include market close information
        setScannerState(prev => prev ? {
          ...prev,
          cycle2Status: {
            targetPrice,
            stopLoss,
            entryPrice,
            exitReason: tradeResult.exitReason,
            fifthCandleData: fifthCandle,
            sixthCandleData: sixthCandle,
            isBreakoutDetected: breakoutDetected,
            tradeDirection: isUptrend ? 'BUY' : 'SELL',
            patternType: pattern.type,
            breakoutCandlePosition: breakoutCandlePosition,
            isMarketCloseScenario: data.length === 4 && timeframe >= 40
          }
        } : null);
        
        console.log(`✅ Trade simulation complete - ${tradeResult.exitReason}`);
        console.log(`   Entry: ${entryPrice} | Exit: ${tradeResult.exitPrice} | P&L: ${tradeResult.profitLoss.toFixed(2)}`);
      } else {
        console.log(`❌ No breakout detected in available candles for ${timeframe}min timeframe`);
        
        // Still update state to show no breakout scenario
        setScannerState(prev => prev ? {
          ...prev,
          cycle2Status: {
            targetPrice,
            stopLoss,
            entryPrice: undefined,
            exitReason: 'No breakout detected',
            fifthCandleData: fifthCandle,
            sixthCandleData: sixthCandle,
            isBreakoutDetected: false,
            tradeDirection: undefined,
            patternType: pattern.type,
            breakoutCandlePosition: undefined,
            isMarketCloseScenario: data.length === 4 && timeframe >= 40
          }
        } : null);
      }
      
    } catch (error) {
      console.error('Error processing pattern for simulation:', error);
    }
  };

  // Calculate target price using authentic slope projections from BATTU API methodology
  const calculateTargetPrice = (pattern: any, breakoutLevel: number, stopLoss: number, isUptrend: boolean): number => {
    // Use slope projection targets from pattern analysis
    if (pattern.target5thPrice && !isNaN(pattern.target5thPrice)) {
      console.log(`📊 Using authentic slope projection: ${pattern.target5thPrice}`);
      return pattern.target5thPrice;
    }
    
    // Fallback to slope calculation if available
    if (pattern.slope && pattern.timeframe) {
      const projectionMinutes = 5; // 5th candle projection
      const slopeProjection = Math.abs(pattern.slope) * projectionMinutes;
      const targetPrice = isUptrend ? 
        breakoutLevel + slopeProjection : 
        breakoutLevel - slopeProjection;
      console.log(`📊 Using slope calculation: ${pattern.slope} * ${projectionMinutes}min = ${targetPrice}`);
      return targetPrice;
    }
    
    // Final fallback to basic risk-reward (should rarely be used)
    const riskAmount = Math.abs(breakoutLevel - stopLoss);
    const rewardRatio = 2;
    const rewardAmount = riskAmount * rewardRatio;
    console.log(`📊 Fallback to 1:2 risk-reward: ${rewardAmount}`);
    
    return isUptrend ? breakoutLevel + rewardAmount : breakoutLevel - rewardAmount;
  };

  // Check if breakout occurred in a candle
  const checkBreakout = (candle: CandleData, breakoutLevel: number, isUptrend: boolean): boolean => {
    if (isUptrend) {
      return candle.high > breakoutLevel;
    } else {
      return candle.low < breakoutLevel;
    }
  };

  // Simulate trade execution with BATTU API 6 Exit Scenarios
  const simulateTradeExecution = (
    pattern: any,
    entryCandle: CandleData,
    entryPrice: number,
    targetPrice: number,
    stopLoss: number,
    sixthCandle: CandleData | null,
    isUptrend: boolean,
    timeframe: number,
    breakoutCandlePosition: string,
    cycle3OneMinuteData: CandleData[]
  ) => {
    const quantity = 100; // Fixed quantity for simulation
    let exitPrice = null;
    let exitReason = '';
    let profitLoss = 0;
    
    // BATTU API 6 Exit Scenarios Implementation
    const evaluate6ExitScenarios = (currentPrice: number, currentTime: number, candlePhase: string) => {
      const unrealizedPL = isUptrend ? 
        (currentPrice - entryPrice) * quantity : 
        (entryPrice - currentPrice) * quantity;
      
      // Scenario A: Fast Trending (±20+ points)
      const fastTrendingThreshold = 20 * quantity;
      if (Math.abs(unrealizedPL) >= fastTrendingThreshold) {
        return { exit: true, price: currentPrice, reason: `Scenario A: Fast Trending (${unrealizedPL > 0 ? '+' : ''}${unrealizedPL})` };
      }
      
      // Scenario B: 80% Target Achievement
      const targetPL = Math.abs(targetPrice - entryPrice) * quantity;
      const eightyPercentTarget = targetPL * 0.8;
      if (unrealizedPL >= eightyPercentTarget) {
        return { exit: true, price: currentPrice, reason: `Scenario B: 80% Target Achievement (${unrealizedPL}/${targetPL})` };
      }
      
      // Scenario C: Market Close Protection (95% candle duration)
      const candleStartTime = entryCandle.timestamp;
      const candleDurationSeconds = timeframe * 60;
      const elapsedTime = currentTime - candleStartTime;
      const completionPercentage = (elapsedTime / candleDurationSeconds) * 100;
      
      if (completionPercentage >= 95) {
        return { exit: true, price: currentPrice, reason: `Scenario C: Market Close Protection (${completionPercentage.toFixed(1)}% duration)` };
      }
      
      // Scenario D: Stop Loss
      const stopLossAmount = Math.abs(stopLoss - entryPrice) * quantity;
      if (unrealizedPL <= -stopLossAmount) {
        return { exit: true, price: stopLoss, reason: `Scenario D: Stop Loss (${unrealizedPL})` };
      }
      
      // Scenario E: Risk-Free Position (50% target)
      const fiftyPercentTarget = targetPL * 0.5;
      if (unrealizedPL >= fiftyPercentTarget) {
        // Move stop to entry level but continue monitoring
        console.log(`📊 SCENARIO E: Risk-free position at 50% target (${unrealizedPL}/${targetPL})`);
      }
      
      // Scenario F: Duration-Based Dynamic Stop (50% duration)
      if (completionPercentage >= 50) {
        const trailingStopDistance = 10; // 10 point trailing stop
        const dynamicStop = isUptrend ? 
          currentPrice - trailingStopDistance : 
          currentPrice + trailingStopDistance;
        
        if ((isUptrend && currentPrice <= dynamicStop) || 
            (!isUptrend && currentPrice >= dynamicStop)) {
          return { exit: true, price: dynamicStop, reason: `Scenario F: Duration-Based Trailing Stop (${completionPercentage.toFixed(1)}%)` };
        }
      }
      
      return { exit: false, price: currentPrice, reason: '' };
    };
    
    console.log(`🔍 BATTU API 6 EXIT SCENARIOS SIMULATION:`);
    console.log(`   Entry Candle Start: ${new Date(entryCandle.timestamp * 1000).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}`);
    console.log(`   Entry Price: ${entryPrice}`);
    console.log(`   Stop Loss: ${stopLoss}`);
    console.log(`   Target: ${targetPrice}`);
    
    // Apply 6 Exit Scenarios immediately on entry candle
    let scenarioResult = evaluate6ExitScenarios(entryCandle.close, entryCandle.timestamp, 'entry');
    if (scenarioResult.exit) {
      exitPrice = scenarioResult.price;
      exitReason = scenarioResult.reason;
      console.log(`   🎯 ${exitReason} on entry candle`);
    }
    
    // If no exit on entry candle, apply 6 Exit Scenarios on 6th candle if available
    if (!exitPrice && sixthCandle && entryCandle !== sixthCandle) {
      console.log(`🔍 6TH CANDLE BATTU API EXIT VALIDATION:`);
      console.log(`   Entry Candle Time: ${new Date(entryCandle.timestamp * 1000).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}`);
      console.log(`   6th Candle Time: ${new Date(sixthCandle.timestamp * 1000).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}`);
      
      if (sixthCandle.timestamp > entryCandle.timestamp) {
        // Apply 6 Exit Scenarios on 6th candle
        scenarioResult = evaluate6ExitScenarios(sixthCandle.close, sixthCandle.timestamp, '6th');
        if (scenarioResult.exit) {
          exitPrice = scenarioResult.price;
          exitReason = scenarioResult.reason;
          console.log(`   🎯 ${exitReason} on 6th candle`);
        } else {
          // Default to 6th candle close if no scenario triggered
          exitPrice = sixthCandle.close;
          exitReason = 'Scenario C: Market Close Protection (6th candle close)';
          console.log(`   📊 Default exit at 6th candle close: ${sixthCandle.close}`);
        }
      } else {
        console.log(`   ⚠️ TIMING ERROR: 6th candle timestamp invalid - using market close scenario`);
        exitPrice = entryCandle.close;
        exitReason = 'Scenario C: Market Close Protection (timing error)';
      }
    } else if (!exitPrice) {
      // No 6th candle available - apply Scenario C (Market Close Protection)
      console.log(`⚠️ Scenario C: Market close detected for ${timeframe}min timeframe.`);
      exitPrice = entryCandle.close;
      exitReason = 'Scenario C: Market Close Protection (no 6th candle)';
    }
    
    // Calculate P&L using BATTU API 6 Exit Scenarios
    if (exitPrice) {
      profitLoss = isUptrend 
        ? (exitPrice - entryPrice) * quantity
        : (entryPrice - exitPrice) * quantity;
    }
    
    // CRITICAL: Use REAL Fyers API timestamps from Point A and Point B data
    let exactEntryTime = '';
    let exactExitTime = '';
    let exactEntryDate = '';
    
    // Extract real Point A and Point B timestamps from pattern data
    const pointATimestamp = pattern.pointA?.timestamp;
    const pointBTimestamp = pattern.pointB?.timestamp;
    const pointAExactTime = pattern.pointA?.exactTime;
    const pointBExactTime = pattern.pointB?.exactTime;
    
    console.log(`🔍 REAL FYERS API TIMING DATA:`);
    console.log(`   Point A: ${pattern.pointA?.candle} @ ${pattern.pointA?.price} | Time: ${pointAExactTime}`);
    console.log(`   Point B: ${pattern.pointB?.candle} @ ${pattern.pointB?.price} | Time: ${pointBExactTime}`);
    console.log(`🎯 REAL ENTRY TIME FROM API: Will be determined from breakout detection`);
    console.log(`📊 Point A: ${pointAExactTime || 'N/A'}`);
    console.log(`📊 Point B: ${pointBExactTime || 'N/A'}`);
    console.log(`📊 Entry Candle Raw: ${entryCandle.timestamp} = ${new Date(entryCandle.timestamp * 1000).toISOString()}`);
    
    // CRITICAL FIX: Use consistent exit timing for Simulation Results 
    if (exitReason.includes('6th candle') && sixthCandle) {
      // Use 6th candle completion time (end of 6th candle)
      const sixthCandleEndTime = sixthCandle.timestamp + (timeframe * 60);
      const sixthCandleDateTime = new Date(sixthCandleEndTime * 1000);
      exactExitTime = sixthCandleDateTime.toLocaleTimeString('en-US', { 
        hour12: true, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
      });
      console.log(`🎯 SIMULATION RESULTS: Using 6th candle completion: ${exactExitTime}`);
    } else if (exitReason.includes('market close')) {
      // Market close exit at 15:30 IST
      exactExitTime = '03:30 PM';
      console.log(`🎯 SIMULATION RESULTS: Market close exit`);
    } else {
      // For target/SL hits, use the candle period where it occurred
      const exitDateTime = new Date(entryCandle.timestamp * 1000);
      exactExitTime = exitDateTime.toLocaleTimeString('en-US', { 
        hour12: true, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
      });
      console.log(`🎯 SIMULATION RESULTS: Target/SL exit timing: ${exactExitTime}`);
    }
    
    console.log(`🎯 REAL EXIT TIME: ${exactExitTime} (Using actual candle timestamps + IST timezone)`);

    // CRITICAL DEBUG: Verify timing variables before creating trade result
    console.log(`🔍 TRADE RESULT CREATION DEBUG for ${timeframe}min timeframe:`);
    console.log(`   📅 exactEntryDate: "${exactEntryDate}"`);
    console.log(`   ⏰ exactEntryTime: "${exactEntryTime}"`);
    console.log(`   ⏰ exactExitTime: "${exactExitTime}"`);
    console.log(`   🕐 Entry Candle Raw: ${entryCandle.timestamp} = ${new Date(entryCandle.timestamp * 1000).toISOString()}`);
    console.log(`   🕕 6th Candle Raw: ${sixthCandle?.timestamp || 'N/A'} = ${sixthCandle ? new Date(sixthCandle.timestamp * 1000).toISOString() : 'N/A'}`);
    
    // SPECIAL DEBUG for 10min timeframe to catch fake timestamps
    if (timeframe === 10) {
      console.log(`🚨 10MIN TIMEFRAME DEBUG - CHECKING FOR FAKE TIMESTAMPS:`);
      console.log(`   Entry Variables Empty? exactEntryTime="${exactEntryTime}" exactExitTime="${exactExitTime}"`);
      console.log(`   Entry Candle IST: ${new Date(entryCandle.timestamp * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      if (sixthCandle) {
        console.log(`   6th Candle IST: ${new Date(sixthCandle.timestamp * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      }
    }

    // Calculate exact breakout time from 1-minute data (Cycle 3) - This becomes our REAL entry time
    let exactBreakoutTime = null;
    let breakoutCandle = null;
    if (cycle3OneMinuteData.length > 0) {
      for (const oneMinCandle of cycle3OneMinuteData) {
        const minuteBreakout = pattern.type === 'UPTREND' 
          ? oneMinCandle.high > pattern.breakoutLevel
          : oneMinCandle.low < pattern.breakoutLevel;
        
        if (minuteBreakout) {
          breakoutCandle = oneMinCandle;
          exactBreakoutTime = new Date(oneMinCandle.timestamp * 1000).toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Kolkata'
          });
          
          // Use breakout time as the REAL entry time since this is when trade actually enters
          const breakoutDateTime = new Date(oneMinCandle.timestamp * 1000);
          exactEntryTime = exactBreakoutTime;
          exactEntryDate = breakoutDateTime.toLocaleDateString('en-US', {
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit'
          });
          
          console.log(`✅ EXACT BREAKOUT FOUND: ${exactBreakoutTime} at price ${pattern.type === 'UPTREND' ? oneMinCandle.high : oneMinCandle.low}`);
          
          console.log(`🚀 BREAKOUT TIME DETECTED: ${exactBreakoutTime} for ${pattern.type} pattern`);
          console.log(`🎯 USING BREAKOUT TIME AS REAL ENTRY: Date=${exactEntryDate}, Time=${exactEntryTime}`);
          break;
        }
      }
    }
    
    // If no breakout time found from 1-minute data, fallback to 5th candle start
    if (!exactBreakoutTime) {
      // Calculate 5th candle start time (entry candle + 4 * timeframe)
      const fifthCandleStartTime = entryCandle.timestamp + (timeframe * 60 * 4);
      const fifthCandleDateTime = new Date(fifthCandleStartTime * 1000);
      exactEntryTime = fifthCandleDateTime.toLocaleTimeString('en-US', { 
        hour12: true, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
      });
      exactEntryDate = fifthCandleDateTime.toLocaleDateString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
      console.log(`🎯 FALLBACK TO 5TH CANDLE START: Date=${exactEntryDate}, Time=${exactEntryTime}`);
    }

    const tradeResult = {
      id: `${Date.now()}-${pattern.type}-${timeframe}`,
      pattern: pattern.type,
      timeframe,
      entryPrice,
      exitPrice,
      targetPrice,
      stopLoss,
      quantity,
      profitLoss,
      exitReason,
      entryCandle: entryCandle.timestamp,
      exitCandle: sixthCandle?.timestamp || entryCandle.timestamp,
      direction: isUptrend ? 'BUY' : 'SELL',
      breakoutCandlePosition,
      timestamp: new Date().toISOString(),
      // Add exact 1-minute timing information
      date: exactEntryDate,
      entryTime: exactEntryTime,
      exitTime: exactExitTime,
      // Add Cycle 3 breakout time
      breakoutTime: exactBreakoutTime
    };

    // CRITICAL DEBUG: Verify what goes into the trade result
    console.log(`🔍 FINAL TRADE RESULT VERIFICATION for ${timeframe}min:`);
    console.log(`   📅 Final Date: "${tradeResult.date}"`);
    console.log(`   ⏰ Final Entry Time: "${tradeResult.entryTime}"`);
    console.log(`   ⏰ Final Exit Time: "${tradeResult.exitTime}"`);
    console.log(`   💼 Exit Reason: "${tradeResult.exitReason}"`);
    
    // ALERT if timestamps look fake for any timeframe
    if (tradeResult.entryTime?.includes('09:58') || tradeResult.entryTime?.includes('9:58')) {
      console.log(`🚨 FAKE TIMESTAMP DETECTED: ${timeframe}min trade has fake entry time: ${tradeResult.entryTime}`);
    }
    if (tradeResult.exitTime === '03:30 PM' && sixthCandle) {
      console.log(`🚨 FAKE EXIT DETECTED: ${timeframe}min trade shows market close but 6th candle exists`);
    }
    
    console.log(`💰 Trade Simulation Result: ${tradeResult.direction} ${pattern.type} - P&L: ${profitLoss.toFixed(2)} (${exitReason})`);
    
    return tradeResult;
  };

  // Get current cycle information
  const getCurrentCycleInfo = () => {
    if (!scannerState) return { cycle: 1, status: 'Not Started', progress: 0 };

    const { candlesCollected, candlesNeeded, currentTimeframe } = scannerState;
    const progress = Math.round((candlesCollected / candlesNeeded) * 100);

    if (candlesCollected < 4) {
      return { cycle: 1, status: 'Data Gathering', progress };
    } else if (candlesCollected < 6) {
      return { cycle: 2, status: 'Analysis', progress: Math.round(((candlesCollected - 4) / 2) * 100) };
    } else {
      return { cycle: 3, status: 'Transition', progress: 100 };
    }
  };

  const cycleInfo = getCurrentCycleInfo();

  // Unified scanner that handles both historical data completion and live monitor automatically
  const handleUnifiedScanner = () => {
    // CRITICAL FIX: For today's date, use existing historical data first, then live monitor
    const currentDate = new Date().toISOString().split('T')[0];
    const isAnalyzingCurrentDate = selectedDate === currentDate;
    const hasHistoricalData = historicalData.length >= 30;
    
    if (isAnalyzingCurrentDate && hasHistoricalData) {
      // TODAY'S DATE: Use existing past candles first, then live monitor
      console.log(`🚀 CURRENT DATE MODE: Using ${historicalData.length} past candles for historical analysis`);
      console.log(`📊 Phase 1: Complete all timeframes using past candles (${historicalData.length} candles)`);
      console.log(`📊 Phase 2: Switch to live monitor ONLY after historical completion`);
      
      // DISABLE ALL LIVE DATA FETCHING during historical completion
      setIsAutoFetchActive(false);
      console.log('⏸️ LIVE DATA BLOCKED: Using only past candles until historical analysis complete');
      console.log(`   FORCED MODE: Use ONLY existing ${historicalData.length} candles - NO new fetching`);
      
      // CRITICAL FIX: Use pure historical mode for existing data analysis
      console.log('🔒 PURE HISTORICAL MODE: Blocking all live data requests');
      console.log(`   Available candles: ${historicalData.length} | Mode: Historical-only processing`);
      
      // Start historical analysis with existing data
      handleStartScanner();
    } else if (!isAnalyzingCurrentDate) {
      // HISTORICAL DATE: Standard historical processing
      console.log(`🚀 HISTORICAL DATE MODE: Processing ${selectedDate}`);
      console.log(`📊 Mode: Historical data completion → Live monitoring disabled`);
      
      setIsAutoFetchActive(false);
      handleStartScanner();
    } else {
      // No historical data available, start live monitor directly
      console.log('📡 Starting Live Monitor - no historical data available');
      if (isMarketOpen) {
        setIsAutoFetchActive(true);
        console.log('🚀 Live Monitor activated (700ms interval)');
      } else {
        console.log('🔴 Cannot start live monitor - Market is closed');
      }
    }
  };

  // Start scanner with date range support (original function - now called by unified scanner)
  const handleStartScanner = () => {
    if (isDateRangeMode) {
      console.log('🔄 Starting 3-Cycle Scanner in DATE RANGE MODE...');
      console.log(`   Symbol: ${selectedSymbol}`);
      console.log(`   Date Range: ${startDate} to ${endDate}`);
      
      const dates = generateDateRange(startDate, endDate);
      console.log(`   Generated ${dates.length} trading dates (excluding weekends)`);
      
      setDateRangeProgress({
        dates,
        currentIndex: 0,
        totalDates: dates.length,
        originalTotalDates: dates.length,
        completedDates: 0,
        currentDateCompleted: false
      });
      setCurrentDateIndex(0);
      
      // Clear trades for fresh date range analysis to eliminate old fake timestamps
      setSimulationTrades([]);
      setAllPatternRecords([]);
      console.log('🧹 CLEARED all previous trade results for fresh date range analysis');
      
      // Start with first date
      console.log(`   Starting with first date: ${dates[0]}`);
      setSelectedDate(dates[0]);
      startScannerMutation.mutate({ symbol: selectedSymbol, date: dates[0] });
    } else {
      console.log('🔄 Starting 3-Cycle Scanner in SINGLE DATE MODE...');
      console.log(`   Symbol: ${selectedSymbol}`);
      console.log(`   Date: ${selectedDate}`);
      
      // CRITICAL FIX: For current date, check for existing historical patterns first
      const currentDate = new Date().toISOString().split('T')[0];
      const isAnalyzingCurrentDate = selectedDate === currentDate;
      
      if (isAnalyzingCurrentDate) {
        console.log('📅 CURRENT DATE ANALYSIS: Checking for existing historical patterns');
        // Don't clear trades yet - let the scanner fetch existing patterns first
        if (isMarketOpen) {
          console.log('🔴 MARKET OPEN: Keeping existing pattern records for current date - will merge with live data');
        } else {
          console.log('🛑 MARKET CLOSED: Using historical data only - no live data merging');
        }
      } else {
        // Reset trades for fresh analysis on historical dates
        setSimulationTrades([]);
        setAllPatternRecords([]);
        console.log('🧹 CLEARED all previous trade results for fresh historical analysis');
      }
      
      startScannerMutation.mutate({ symbol: selectedSymbol, date: selectedDate });
    }
  };

  // SEQUENTIAL PROGRESSION: Clear timeframe transition after historical data completion
  useEffect(() => {
    // CRITICAL FIX: Add debounce to prevent excessive calls (500ms delay)
    const timeoutId = setTimeout(() => {
      const autoProgressToNextTimeframe = async () => {
        // Don't run auto-progression if date range is completed AND current date is also completed
        if (isDateRangeMode && dateRangeProgress && 
            currentDateIndex >= dateRangeProgress.originalTotalDates - 1 &&
            dateRangeProgress.currentDateCompleted) {
          return; // Stop auto-progression when date range is complete
        }
        
        // CRITICAL FIX: Prevent continuous auto-progression for completed timeframes
        const currentTF = scannerState?.currentTimeframe || 5;
        const nextTF = currentTF * 2;
        if (completedTimeframes.has(nextTF)) {
          return; // Don't process the same timeframe multiple times
        }
        
        // CRITICAL FIX: Block auto-progression during active transitions
        if (autoProgressCountdown !== null) {
          return; // Don't start new transitions when countdown is active
        }
        
        if (isRequestInProgress) {
          return; // Don't start new transitions when request is active
        }
      
      // FIXED SEQUENTIAL MODE: Use historical data first, then progress timeframes cleanly
      const activeTimeframe = scannerState?.currentTimeframe || 5;
      console.log(`🔄 SEQUENTIAL PROGRESSION: Processing ${activeTimeframe}min timeframe (Historical Mode)`);
      console.log(`   Clean progression: 5min→10min→20min→40min→80min`);
      console.log(`   Completed timeframes: [${Array.from(completedTimeframes).join(', ')}]`);
      console.log(`   Available historical data: ${historicalData.length} 1-min candles`);
      
      // ENHANCED: Use all available data first, then switch to live streaming
      const now = new Date();
      const currentTimestamp = Math.floor(now.getTime() / 1000);
      const currentMarketTime = now.toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit', 
        timeZone: 'Asia/Kolkata' 
      });
      const timeframeMinutes = scannerState?.currentTimeframe || 5;
      const availableHistoricalCandles = historicalData.length;
      const requiredCandles = 6 * timeframeMinutes;
      
      console.log(`📊 ENHANCED DATA MANAGEMENT: ${timeframeMinutes}min timeframe`);
      console.log(`   Available Historical: ${availableHistoricalCandles} 1-min candles`);
      console.log(`   Required for 6 candles: ${requiredCandles} 1-min candles`);
      console.log(`   Current Time: ${currentMarketTime}`);
      
      // Check if we have sufficient historical data
      let hasValidatedCompletion = false;
      
      if (availableHistoricalCandles >= requiredCandles) {
        console.log(`✅ SUFFICIENT HISTORICAL DATA: Using ${availableHistoricalCandles} candles`);
        console.log(`   Strategy: Complete analysis with historical data first`);
        console.log(`🏛️ HISTORICAL MODE: Live streaming DISABLED for clean timeframe progression`);
        
        // CRITICAL FIX: Disable live streaming during historical analysis
        // This ensures clean timeframe progression (5min→10min→20min→40min→80min)
        // startStreamingOHLC(); // DISABLED for historical analysis
        
        hasValidatedCompletion = currentTimeframeData.length >= 6;
        
      } else if (currentTimeframeData.length >= 4) {
        console.log(`⚠️ INSUFFICIENT HISTORICAL DATA: Only ${availableHistoricalCandles} available`);
        console.log(`   Need: ${requiredCandles} candles for complete ${timeframeMinutes}min analysis`);
        console.log(`   Strategy: Switch to live streaming for remaining data`);
        
        // CRITICAL FIX: Disable live streaming during historical analysis
        console.log(`🏛️ HISTORICAL MODE: Insufficient data scenario but live streaming DISABLED`);
        console.log(`   Reason: Live streaming interferes with timeframe progression`);
        console.log(`   Strategy: Use available historical data and continue with next timeframe`);
        
        // DISABLED: Live streaming that was preventing timeframe progression
        /*
        const shouldStartLiveStreaming = !isAutoFetchActive;
        
        if (shouldStartLiveStreaming) {
          console.log(`🚀 STARTING LIVE DATA STREAM: 700ms intervals for candle completion`);
          
          // Start Cycle 3 live streaming
          try {
            const lastCandle = currentTimeframeData[currentTimeframeData.length - 1];
            const response = await fetch('/api/cycle3/start-live-streaming', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                symbol: selectedSymbol,
                timeframeMinutes: timeframeMinutes,
                sixthCandleStartTime: lastCandle?.timestamp || currentTimestamp
              })
            });
            
            if (response.ok) {
              console.log(`📡 CYCLE 3 LIVE STREAMING ACTIVATED: ${timeframeMinutes}min completion`);
              setIsAutoFetchActive(true);
              
              // Start streaming OHLC for real-time updates
              if (!streamingInterval) {
                console.log(`🚀 STARTING LIVE OHLC STREAMING: 700ms updates`);
                startStreamingOHLC();
              }
            }
          } catch (error) {
            console.error('Error starting live streaming:', error);
          }
          
          return; // Wait for live data to complete the timeframe
        }
        */
      }
      
      // For large timeframes, still allow completion if insufficient data (market close scenarios)
      const hasNormalCompletion = hasValidatedCompletion;
      
      // LIVE MARKET FIX: Check if we're in live market mode vs historical mode
      const currentDate = new Date().toISOString().split('T')[0];
      const isAnalyzingCurrentDate = selectedDate === currentDate;
      const isLiveMarketMode = isMarketOpen && isAnalyzingCurrentDate;
      const isInsufficientDataScenario = currentTimeframeData.length >= 4 && 
                                         currentTimeframeData.length < 6 &&
                                         patternAnalysis &&
                                         scannerState?.currentTimeframe &&
                                         !scannerState?.cycle2Status?.sixthCandleData;
      
      // For large timeframes, only allow completion if NOT in live market mode
      const hasLargeTimeframeCompletion = isInsufficientDataScenario &&
                                         scannerState?.currentTimeframe &&
                                         scannerState?.currentTimeframe >= 40 &&
                                         !isLiveMarketMode; // Don't complete if live market is open
      
      // LIVE MARKET AUTO-FETCH: Instead of completing, start continuous data fetching
      const shouldStartContinuousFetch = isInsufficientDataScenario &&
                                        isLiveMarketMode &&
                                        !isAutoFetchActive; // Prevent multiple intervals
      
      // Only log every 5th check to reduce console spam (20% chance)
      if (Math.random() < 0.2) {
        console.log('🔍 AUTO-PROGRESSION CHECK:', {
          currentTime: new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
          candleCount: currentTimeframeData.length,
          hasPatternAnalysis: !!patternAnalysis,
          hasSixthCandleInState: !!scannerState?.cycle2Status?.sixthCandleData,
          hasNormalCompletion: hasNormalCompletion,
          hasLargeTimeframeCompletion: hasLargeTimeframeCompletion,
          isWaitingForSixthCandle: isWaitingForSixthCandle,
          currentTimeframe: scannerState?.currentTimeframe,
          countdownActive: autoProgressCountdown !== null
        });
      }
      
      // CRITICAL FIX: Disable continuous fetch during historical analysis
      console.log(`🏛️ HISTORICAL MODE: Continuous fetch DISABLED for clean timeframe progression`);
      console.log(`   Reason: Continuous fetch was preventing timeframe transitions`);
      console.log(`   Strategy: Complete timeframes with available historical data`);
      
      // DISABLED: Continuous fetch that was blocking timeframe progression
      /*
      if (shouldStartContinuousFetch) {
        console.log('🚀 LIVE MARKET AUTO-FETCH: Starting continuous 1-minute data fetching...');
        console.log(`   Timeframe: ${scannerState?.currentTimeframe}min`);
        console.log(`   Current Candles: ${currentTimeframeData.length}/6`);
        console.log(`   Auto-fetch Interval: 700ms`);
        
        setIsAutoFetchActive(true);
        
        const continuousFetchInterval = setInterval(async () => {
          try {
            // Fetch fresh 1-minute data
            const response = await fetch(`/api/battu/3-cycle-scanner/data/${selectedSymbol}?date=${selectedDate}&timeframe=1`);
            const result = await response.json();
            
            if (result.success && result.data.length > 0) {
              // Resample to current timeframe
              const resampleResponse = await apiRequest(
                `/api/battu/3-cycle-scanner/resample`,
                'POST',
                {
                  data: result.data,
                  sourceTimeframe: 1,
                  targetTimeframe: scannerState?.currentTimeframe || 5
                }
              );
              
              if (resampleResponse.success && resampleResponse.data.length > currentTimeframeData.length) {
                console.log(`📈 NEW DATA AVAILABLE: ${resampleResponse.data.length} candles (was ${currentTimeframeData.length})`);
                setCurrentTimeframeData(resampleResponse.data);
                
                // Check if we now have 6th candle
                if (resampleResponse.data.length >= 6) {
                  console.log('✅ 6th CANDLE NOW AVAILABLE: Stopping auto-fetch and continuing analysis');
                  clearInterval(continuousFetchInterval);
                  setIsAutoFetchActive(false);
                  setAutoFetchInterval(null);
                }
              }
            }
          } catch (error) {
            console.error('❌ Auto-fetch error:', error);
          }
        }, 700);
        
        setAutoFetchInterval(continuousFetchInterval);
        
        // Store interval for cleanup
        setTimeout(() => {
          if (continuousFetchInterval) {
            clearInterval(continuousFetchInterval);
            setIsAutoFetchActive(false);
            setAutoFetchInterval(null);
            console.log('⏰ Auto-fetch timeout: Stopped after 5 minutes');
          }
        }, 300000); // Stop after 5 minutes
        
        return; // Don't proceed with completion, wait for auto-fetch
      }
      */
      
      if (
        (hasNormalCompletion || hasLargeTimeframeCompletion) &&
        patternAnalysis && 
        (!isWaitingForSixthCandle || hasLargeTimeframeCompletion) &&
        autoProgressCountdown === null
        // CRITICAL FIX: Removed !isAutoFetchActive blocking - allow progression during auto-fetch
      ) {
        let completionType = '';
        if (hasNormalCompletion) {
          completionType = '6th candle';
        } else if (hasLargeTimeframeCompletion) {
          completionType = 'last available candle (historical market close - insufficient data for 6th candle)';
        }
        // SEQUENTIAL FIX: Mark current timeframe as completed to prevent re-processing
        const currentTF = scannerState?.currentTimeframe || 5;
        setCompletedTimeframes(prev => new Set(prev).add(currentTF));
        console.log(`✅ TIMEFRAME COMPLETED: ${currentTF}min analysis finished`);
        console.log(`📊 Progress: [${Array.from(completedTimeframes).join(', ')}] + ${currentTF}min = [${Array.from(new Set([...Array.from(completedTimeframes), currentTF])).join(', ')}]`);
        
        // CRITICAL FIX: Reset request progress to allow auto-progression
        setIsRequestInProgress(false);
        console.log('✅ CLEARED REQUEST PROGRESS: Auto-progression now allowed');
        
        console.log(`🚀 AUTO-PROGRESSION: ${completionType} completed, preparing timeframe transition...`);
        console.log(`   Current: ${currentTF}min → Next: ${currentTF * 2}min`);
        console.log(`   CRITICAL DEBUG: hasNormalCompletion=${hasNormalCompletion}, hasLargeTimeframeCompletion=${hasLargeTimeframeCompletion}`);
        console.log(`   CRITICAL DEBUG: currentTimeframeData.length=${currentTimeframeData.length}, sixthCandleData=${!!sixthCandleData}`);
        console.log(`   CRITICAL DEBUG: scannerState.cycle2Status.sixthCandleData=${!!scannerState?.cycle2Status?.sixthCandleData}`);
        
        if (currentTF >= 80) {
          console.log(`   🎯 FINAL TIMEFRAME: ${scannerState?.currentTimeframe || 80}min analysis complete - No further transitions`);
        } else {
          console.log(`   Current TF: ${scannerState?.currentTimeframe || 5}min → Next TF: ${(scannerState?.currentTimeframe || 5) * 2}min`);
        }
        console.log('📊 Position Status Check:', {
          isBreakoutDetected: scannerState?.cycle2Status?.isBreakoutDetected,
          exitReason: scannerState?.cycle2Status?.exitReason,
          hasExitData: !!scannerState?.cycle2Status
        });
        
        // Check completion scenarios based on date and timeframe
        const currentDate = new Date().toISOString().split('T')[0];
        const analysisDate = selectedDate;
        
        // OVERRIDE: Force today's date to behave as historical when doing Historical Analysis
        const isUsingHistoricalAnalysisMode = scannerState !== null; // If Historical Analysis button was clicked
        const isAnalyzingCurrentDate = (analysisDate === currentDate) && !isUsingHistoricalAnalysisMode;
        const shouldSwitchToLiveMonitor = scannerState?.cycle2Status && 'shouldSwitchToLiveMonitor' in scannerState.cycle2Status ? scannerState.cycle2Status.shouldSwitchToLiveMonitor : false;
        const isHistoricalDate = scannerState?.cycle2Status && 'isHistoricalDate' in scannerState.cycle2Status ? scannerState.cycle2Status.isHistoricalDate : false;
        const isFinalTimeframe = scannerState?.currentTimeframe && scannerState?.currentTimeframe >= 80;
        
        // HISTORICAL MODE OR DATE RANGE MODE: Allow completion and progression
        if (isFinalTimeframe) {
          console.log('🎯 FINAL TIMEFRAME: Analysis complete. 3-cycle scanner finished successfully!');
          console.log(`   Date: ${analysisDate}`);
          console.log(`   Timeframe: ${scannerState?.currentTimeframe}min (maximum reached)`);
          console.log('   Status: All timeframes analyzed with historical data only');
          
          // 🚀 NOW START OHLC STREAMING: ALL historical timeframes are complete
          console.log('🚀 ALL HISTORICAL TIMEFRAMES COMPLETE: Now enabling OHLC streaming');
          console.log('   5min→10min→20min→40min→80min progression finished');
          console.log('   OHLC streaming can now start safely without interfering with timeframe transitions');
          
          // Only start OHLC streaming after ALL historical analysis is complete
          if (isAnalyzingCurrentDate) {
            console.log('📡 STARTING OHLC STREAMING: Historical analysis complete, starting live monitoring');
            startStreamingOHLC();
          } else {
            console.log('🏛️ HISTORICAL DATE: No OHLC streaming needed for past dates');
          }
          
          // Check if we're in date range mode and have more dates to scan
          if (isDateRangeMode) {
            console.log('📅 DATE RANGE MODE: Checking for next date...');
            
            // Mark current date as completed and check if there are more dates
            const newCompletedDates = (dateRangeProgress?.completedDates || 0) + 1;
            
            if (dateRangeProgress) {
              setDateRangeProgress(prev => prev ? {
                ...prev,
                currentDateCompleted: true,
                completedDates: newCompletedDates
              } : null);
            }
            
            // Only continue if we have more dates in the predefined range
            console.log('📊 DATE PROGRESSION DEBUG:', {
              currentDateIndex,
              dateRangeProgress: dateRangeProgress,
              originalTotalDates: dateRangeProgress?.originalTotalDates,
              totalDates: dateRangeProgress?.totalDates,
              condition: `${currentDateIndex} < ${(dateRangeProgress?.originalTotalDates || 0) - 1}`,
              result: dateRangeProgress && currentDateIndex < dateRangeProgress.originalTotalDates - 1,
              availableDates: dateRangeProgress?.dates?.length,
              allDates: dateRangeProgress?.dates,
              hasDateRangeProgress: !!dateRangeProgress
            });
            
            if (dateRangeProgress && currentDateIndex < dateRangeProgress.originalTotalDates - 1) {
              const nextDateIndex = currentDateIndex + 1;
              const nextDate = dateRangeProgress.dates[nextDateIndex];
              
              console.log(`   Current Date: ${getCurrentScanDate()} (${currentDateIndex + 1}/${dateRangeProgress.originalTotalDates})`);
              console.log(`   Next Date: ${nextDate} (${nextDateIndex + 1}/${dateRangeProgress.originalTotalDates})`);
              
              // Update date range progress for next date
              setCurrentDateIndex(nextDateIndex);
              setDateRangeProgress(prev => prev ? {
                ...prev,
                currentIndex: nextDateIndex,
                currentDateCompleted: false // Reset for new date
              } : null);
              
              // Reset scanner for new date (but keep cumulative trades)
              setSelectedDate(nextDate);
              setScannerState(null);
              setHistoricalData([]);
              setCurrentTimeframeData([]);
              setPatternAnalysis(null);
              setFifthCandleData(null);
              setSixthCandleData(null);
              // DON'T reset simulationTrades - keep accumulating across dates
              setIsWaitingForSixthCandle(false);
              setAutoProgressCountdown(null);
              setIsWaitingForPositionClosure(false);
              
              // Start scanner for next date with delay
              setTimeout(() => {
                console.log(`🚀 AUTO-STARTING next date scan: ${nextDate}`);
                startScannerMutation.mutate({ 
                  symbol: selectedSymbol, 
                  date: nextDate 
                });
              }, 3000);
              
              return;
            } else {
              // End of predefined date range - stop scanning
              console.log('🏁 END OF DATE RANGE: All predefined dates completed. Scanning stopped.');
              console.log(`   Completed: ${newCompletedDates} dates`);
              console.log(`   Date Range: ${startDate} to ${endDate}`);
              
              // Clear all scanning states to properly stop
              setScannerState(null);
              setHistoricalData([]);
              setCurrentTimeframeData([]);
              setPatternAnalysis(null);
              setFifthCandleData(null);
              setSixthCandleData(null);
              setIsWaitingForSixthCandle(false);
              setAutoProgressCountdown(null);
              setIsWaitingForPositionClosure(false);
              
              // Mark date range as completed
              setDateRangeProgress((prev: DateRangeProgress | null) => prev ? {
                ...prev,
                currentIndex: prev.originalTotalDates,
                completedDates: prev.originalTotalDates,
                currentDateCompleted: true
              } : null);
              
              return;
            }
          }
          
          return;
        }
        
        // Check if any positions are still open (wait for 98% auto-close to complete)
        const hasOpenPositions = scannerState?.cycle2Status && 
          scannerState.cycle2Status.isBreakoutDetected && 
          (!scannerState.cycle2Status.exitReason || 
           scannerState.cycle2Status.exitReason === 'Position Open' || 
           scannerState.cycle2Status.exitReason === 'Waiting for exit' ||
           scannerState.cycle2Status.exitReason.includes('Open'));
        
        if (hasOpenPositions) {
          console.log('⏳ AUTO-PROGRESSION: Waiting for open positions to close at 98% duration...');
          console.log('   Will wait 4 seconds for position auto-closure, then start countdown...');
          
          // Set waiting flag for UI indication
          setIsWaitingForPositionClosure(true);
          
          // Wait additional time for position closure (98% of 6th candle duration)
          setTimeout(() => {
            console.log('🔄 AUTO-PROGRESSION: Position closure wait complete, starting countdown...');
            setIsWaitingForPositionClosure(false);
            setAutoProgressCountdown(3);
            
            // Start countdown immediately after position closure wait
            const countdownInterval = setInterval(() => {
              setAutoProgressCountdown(prev => {
                if (prev === null || prev <= 1) {
                  clearInterval(countdownInterval);
                  console.log('⚡ SEQUENTIAL PROGRESSION: Countdown complete, moving to next timeframe...');
                  
                  // CRITICAL FIX: Block all requests during transition to prevent interference
                  setIsRequestInProgress(true);
                  
                  setTimeout(() => {
                    const currentTF = scannerState?.currentTimeframe || 5;
                    const nextTF = currentTF * 2;
                    
                    console.log(`🚀 CLEAN TRANSITION: ${currentTF}min → ${nextTF}min (No overlapping processes)`);
                    console.log(`📊 Historical data available: ${historicalData.length} candles`);
                    
                    // Execute clean transition
                    moveToTimeframeTransition().finally(() => {
                      setAutoProgressCountdown(null);
                      setIsRequestInProgress(false); // Unblock requests after transition
                      console.log(`✅ TRANSITION COMPLETE: Now analyzing ${nextTF}min timeframe`);
                    });
                  }, 100);
                  return null;
                }
                return prev - 1;
              });
            }, 1000);
          }, 4000); // 4 second delay for position closure
          
          return; // Exit early to avoid duplicate countdown
        } else {
          console.log('✅ AUTO-PROGRESSION: No open positions, starting countdown immediately...');
          
          // CRITICAL FIX: Stop all live activities during transition
          setIsAutoFetchActive(false);
          stopStreamingOHLC();
          console.log('🛑 Stopped all live activities for clean timeframe transition');
          
          setAutoProgressCountdown(3);
        }
        
        // Countdown timer
        const countdownInterval = setInterval(() => {
          setAutoProgressCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              console.log('⚡ SEQUENTIAL PROGRESSION: Countdown complete, transitioning to next timeframe...');
              
              // CRITICAL FIX: Check if we're already at the final timeframe (80min)
              const currentTF = scannerState?.currentTimeframe || 5;
              const nextTF = currentTF * 2;
              
              if (currentTF >= 80) {
                console.log('🏁 FINAL TIMEFRAME REACHED: 80min analysis complete - No further transitions allowed');
                console.log('   Status: All timeframes (5min→10min→20min→40min→80min) completed successfully');
                console.log('   Action: Stopping auto-progression to prevent infinite loop');
                setAutoProgressCountdown(null);
                return null;
              }
              
              // CRITICAL FIX: Block requests during transition
              setIsRequestInProgress(true);
              
              setTimeout(() => {
                console.log(`🚀 TIMEFRAME TRANSITION: ${currentTF}min → ${nextTF}min (Sequential progression)`);
                
                // Execute transition and cleanup
                moveToTimeframeTransition().finally(() => {
                  setAutoProgressCountdown(null);
                  setIsRequestInProgress(false);
                });
                
                // Keep live monitor disabled during historical processing
                const currentDate = new Date().toISOString().split('T')[0];
                const isAnalyzingCurrentDate = selectedDate === currentDate;
                const hasHistoricalData = historicalData.length >= 30;
                const activeTimeframe = scannerState?.currentTimeframe || 5;
                
                // CRITICAL FIX: Keep live activities disabled during all historical analysis
                console.log('🏛️ HISTORICAL MODE: All live activities remain DISABLED');
                console.log(`   Reason: Ensures clean timeframe progression without interference`);
                console.log(`   Current TF: ${activeTimeframe}min | Next: ${activeTimeframe * 2}min`);
                // DISABLED: Live monitor re-activation that was causing progression issues
                // setTimeout(() => setIsAutoFetchActive(true), 2000);
              }, 100);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }
    };

      autoProgressToNextTimeframe();
    }, 500); // 500ms debounce to prevent excessive calls
    
    return () => clearTimeout(timeoutId);
  }, [
    // OPTIMIZED: Only essential dependencies to prevent excessive re-runs
    scannerState?.currentTimeframe,
    patternAnalysis?.hasValidatedCompletion,
    autoProgressCountdown,
    isRequestInProgress
  ]);

  // Cycle 3: Timeframe Transition - "Zoom Out" Phase with 6th candle completion requirement
  const moveToTimeframeTransition = async () => {
    console.log('🔄 SEQUENTIAL TRANSITION: Starting clean timeframe progression...');
    
    // SEQUENTIAL FIX: Get current timeframe and prepare for next progression
    const activeTimeframe = scannerState?.currentTimeframe || 5;
    const nextTimeframe = activeTimeframe * 2;
    
    console.log(`📊 PROGRESSION STATUS: ${activeTimeframe}min → ${nextTimeframe}min`);
    console.log(`🗂️ Available data: ${historicalData.length} 1-min candles`);
    
    if (!currentTimeframeData.length || !patternAnalysis) {
      console.log('❌ CYCLE 3: Missing requirements:', { 
        scannerState: !!scannerState, 
        currentTimeframeData: currentTimeframeData.length,
        patternAnalysis: !!patternAnalysis 
      });
      return;
    }
    
    // CRITICAL FIX: Check for 6th candle completion from multiple sources for historical data
    const hasSixthCandleFromState = scannerState?.cycle2Status?.sixthCandleData != null;
    const hasSixthCandleFromDirect = sixthCandleData != null;
    const hasSixthCandle = hasSixthCandleFromState || hasSixthCandleFromDirect;
    const hasCompletedSimulation = !isWaitingForSixthCandle;
    
    // CRITICAL FIX: For historical patterns, don't block if we have completed historical data
    const currentDate = new Date().toISOString().split('T')[0];
    const isHistoricalPattern = selectedDate !== currentDate;
    const hasHistoricalCompletion = isHistoricalPattern && currentTimeframeData.length >= 6;
    
    if ((!hasSixthCandle || isWaitingForSixthCandle) && !hasHistoricalCompletion) {
      console.log('⏳ CYCLE 3: Waiting for 6th candle completion before timeframe transition...');
      console.log(`   6th Candle (State): ${hasSixthCandleFromState ? '✅' : '❌'} | 6th Candle (Direct): ${hasSixthCandleFromDirect ? '✅' : '❌'}`);
      console.log(`   Simulation Complete: ${hasCompletedSimulation ? '✅' : '❌'} | Historical: ${isHistoricalPattern ? '✅' : '❌'}`);
      return;
    }
    
    console.log(`✅ CYCLE 3: Pattern completed, proceeding with transition...`);
    console.log(`   Historical Pattern: ${isHistoricalPattern}, Candles Available: ${currentTimeframeData.length}`);
    console.log(`   6th Candle Sources: State=${hasSixthCandleFromState}, Direct=${hasSixthCandleFromDirect}`);
    
    
    // Check if we have enough candles and 6th candle is complete
    if (currentTimeframeData.length >= 4 && hasSixthCandle) {
      console.log(`✅ CYCLE 3: 6th candle completed for ${activeTimeframe}min. Starting timeframe transition...`);
      
      // Double the timeframe (T = T x 2)
      const nextTimeframe = activeTimeframe * 2;
      
      if (nextTimeframe <= 80) {
        console.log(`📈 CYCLE 3: Transitioning ${activeTimeframe}min → ${nextTimeframe}min (T = T x 2)`);
        
        // SEQUENCING FIX: Check if we're reaching higher timeframes (40min+) on current date
        const currentDate = new Date().toISOString().split('T')[0];
        // OVERRIDE: Force today's date to behave as historical when doing Historical Analysis
        const isUsingHistoricalAnalysisMode = scannerState !== null; // If Historical Analysis button was clicked
        const isAnalyzingCurrentDate = (selectedDate === currentDate) && !isUsingHistoricalAnalysisMode;
        
        if (isAnalyzingCurrentDate && nextTimeframe >= 40) {
          console.log(`🏛️ HISTORICAL ANALYSIS COMPLETE: Data completed up to ${activeTimeframe}min`);
          console.log(`📡 MANUAL LIVE MONITOR REQUIRED: User must start Live Monitor from ${nextTimeframe}min`);
          console.log('🚫 AUTO-LIVE MONITOR DISABLED: No automatic transitions to live monitoring');
          
          // Clear scanner state but DO NOT auto-enable live monitor
          setScannerState(null);
          
          console.log(`✅ HISTORICAL PROCESSING FINISHED: User can now manually start Live Monitor`);
          console.log('🏛️ COMPLETE SEPARATION: Historical analysis finished, awaiting manual Live Monitor activation');
          return; // Complete historical processing, await manual live monitor
        }
        
        // SEQUENTIAL UPDATE: Transition to next timeframe cleanly
        console.log(`🔄 UPDATING SCANNER STATE: ${activeTimeframe}min → ${nextTimeframe}min`);
        
        setScannerState({
          sessionId: scannerState?.sessionId || generateSessionId(),
          symbol: selectedSymbol,
          date: selectedDate,
          currentCycle: 1, // RESTART at Cycle 1 for new timeframe
          status: 'data_gathering',
          currentTimeframe: nextTimeframe,
          candlesCollected: 0,
          candlesNeeded: 4,
          startTime: new Date().toISOString(),
          timeline: [],
          cycle2Status: undefined // Clear previous cycle status
        });
        
        console.log(`✅ SCANNER STATE UPDATED: Now processing ${nextTimeframe}min timeframe`);
        
        // Clear simulation states for new timeframe
        setPatternAnalysis(null);
        setFifthCandleData(null);
        setSixthCandleData(null);
        setIsWaitingForSixthCandle(false);
        
        // SEQUENTIAL RESAMPLING: Use existing historical data for next timeframe
        console.log(`📊 RESAMPLING: Converting ${historicalData.length} 1-min candles to ${nextTimeframe}min timeframe...`);
        
        if (historicalData.length > 0) {
          await resampleToTimeframe(historicalData, nextTimeframe);
          console.log(`✅ RESAMPLING COMPLETE: ${nextTimeframe}min timeframe ready for analysis`);
        } else {
          console.log(`❌ NO HISTORICAL DATA: Cannot resample to ${nextTimeframe}min timeframe`);
        }
        
        // CRITICAL FIX: Just update timeframe, don't restart entire scanner
        setTimeout(() => {
          console.log(`🔄 TIMEFRAME UPDATE: Progressing from ${activeTimeframe}min to ${nextTimeframe}min`);
          
          // Update scanner state to next timeframe without restarting
          setScannerState(prev => prev ? {
            ...prev,
            currentTimeframe: nextTimeframe,
            currentCycle: 1,
            status: 'data_gathering',
            candlesCollected: 0,
            candlesNeeded: 4,
            cycle2Status: undefined // Reset cycle2 status for new timeframe
          } : null);
          
          // Clear pattern analysis states for new timeframe
          setPatternAnalysis(null);
          setFifthCandleData(null);
          setSixthCandleData(null);
          setIsWaitingForSixthCandle(false);
          
          // Immediately start analysis with existing historical data
          if (historicalData.length >= 30) {
            console.log(`📊 CONTINUING ANALYSIS: Using existing ${historicalData.length} candles for ${nextTimeframe}min timeframe`);
            resampleToTimeframe(historicalData, nextTimeframe);
          }
          
          console.log(`✅ TIMEFRAME TRANSITION COMPLETE: Now analyzing ${nextTimeframe}min timeframe`);
          console.log(`📊 C2 Block Analysis preserved across timeframe transition`);
        }, 2000);
        
      } else {
        console.log(`🔄 CYCLE 3: Maximum timeframe (80min) reached. Continuing analysis at 80min timeframe...`);
        
        // CRITICAL FIX: Stop at 80min - no further progression
        console.log(`🏁 MAXIMUM TIMEFRAME REACHED: 80min analysis complete`);
        console.log(`   Status: All timeframes (5min→10min→20min→40min→80min) completed successfully`);
        console.log(`   Action: Stopping progression - no further analysis needed`);
        
        // Clear scanner states to indicate completion
        setScannerState(null);
        setPatternAnalysis(null);
        setFifthCandleData(null);
        setSixthCandleData(null);
        setIsWaitingForSixthCandle(false);
        // Keep C2 Block Analysis data for display
        
        console.log(`✅ ALL TIMEFRAMES COMPLETE: Historical analysis finished successfully`);
      }
    } else {
      console.log(`⏳ CYCLE 3: Need 6th candle completion (have ${currentTimeframeData.length} candles, 6th candle: ${hasSixthCandle ? 'Complete' : 'Pending'})`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scanner Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            3-Cycle Scanner Configuration
            {/* Live Price Display */}
            <div className="ml-auto flex items-center gap-4">
              {livePrice && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg border border-green-200">
                  <Activity className="h-4 w-4 text-green-600" />
                  <div className="text-sm">
                    <span className="font-semibold text-green-800">₹{livePrice.toFixed(2)}</span>
                    {priceChangePercent !== 0 && (
                      <span className={`ml-2 text-xs ${priceChangePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ({priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(3)}%)
                      </span>
                    )}
                  </div>
                </div>
              )}
              {lastPriceUpdate && (
                <div className="text-xs text-gray-500">
                  Updated: {lastPriceUpdate}
                </div>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Configure symbol and date/date range for the 3-cycle timeframe progression scanner.
            Date range mode will automatically scan through multiple dates sequentially.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Exchange Selection */}
          <div className="space-y-3">
            <Label>Exchange</Label>
            <RadioGroup
              value={selectedExchange}
              onValueChange={(value) => handleExchangeChange(value as 'NSE' | 'MCX' | 'CRYPTO')}
              className="flex flex-row gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="NSE" id="nse" />
                <Label htmlFor="nse" className="cursor-pointer">
                  NSE
                  <span className="block text-xs text-gray-500">9:15 - 3:30</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MCX" id="mcx" />
                <Label htmlFor="mcx" className="cursor-pointer">
                  MCX
                  <span className="block text-xs text-gray-500">9:00 - 11:30</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CRYPTO" id="crypto" />
                <Label htmlFor="crypto" className="cursor-pointer">
                  Crypto
                  <span className="block text-xs text-gray-500">24/7</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scanner-symbol">Symbol</Label>
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger id="scanner-symbol">
                  <SelectValue placeholder="Select symbol" />
                </SelectTrigger>
                <SelectContent>
                  {getSymbolsByExchange(selectedExchange).map((symbol) => (
                    <SelectItem key={symbol.value} value={symbol.value}>
                      {symbol.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={isDateRangeMode}
                  onChange={(e) => setIsDateRangeMode(e.target.checked)}
                  className="w-4 h-4"
                />
                Date Range Mode
              </Label>
              {isDateRangeMode ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="start-date" className="text-xs">Start Date</Label>
                    <Input 
                      id="start-date"
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date" className="text-xs">End Date</Label>
                    <Input 
                      id="end-date"
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="scanner-date">Single Date</Label>
                  <Input 
                    id="scanner-date"
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              )}
            </div>
            
            {/* Date range progress indicator */}
            {isDateRangeMode && dateRangeProgress && (
              <div className="space-y-2">
                <Label>Range Progress</Label>
                <div className="space-y-1">
                  <div className="text-sm">
                    Date {currentDateIndex + 1} of {dateRangeProgress.originalTotalDates}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentDateIndex + 1) / dateRangeProgress.originalTotalDates) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Current: {getCurrentScanDate()}
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="scanner-status">Control</Label>
              <div className="flex gap-2">
                {/* Historical Analysis Button - Processes all historical timeframes sequentially */}
                <div className="flex gap-2">
                  <Button 
                    onClick={(e) => {
                      if (scannerState || startScannerMutation.isPending) return; // Prevent if already active
                    
                    // CONTROL-CLICK: Remove sync and allow independent operation
                    if (e.ctrlKey || e.metaKey) {
                      console.log('🔓 CTRL+CLICK HISTORICAL: Removing sync restrictions');
                      console.log('   Independent operation mode - Historical can run with Live Monitor');
                      console.log('   No mutual exclusion enforced');
                      
                      // CRITICAL FIX: Clear completed timeframes for control-click too
                      setCompletedTimeframes(new Set());
                      console.log('🔄 CTRL+CLICK: Cleared completed timeframes for fresh progression');
                      
                      // Start scanner without stopping live monitor
                      startScannerMutation.mutate({ 
                        symbol: selectedSymbol, 
                        date: selectedDate 
                      });
                      return;
                    }
                    
                    console.log('🏛️ HISTORICAL ANALYSIS: Starting sequential historical processing...');
                    console.log('   Phase 1: Historical data analysis (5min→10min→20min→40min)');
                    console.log('   Live Monitor: COMPLETELY DISABLED during historical processing');
                    
                    // CRITICAL FIX: Clear completed timeframes to allow fresh timeframe progression
                    setCompletedTimeframes(new Set());
                    console.log('🔄 CLEARED completed timeframes for fresh historical analysis');
                    console.log('   This allows 5min→10min→20min→40min progression without loop prevention');
                    
                    // FORCE DISABLE live monitor completely during historical processing
                    setIsAutoFetchActive(false);
                    // Note: Removed setLiveMonitorTimeframe since Live Monitor is completely removed
                    
                    // CRITICAL FIX: Use handleStartScanner for proper date range support
                    handleStartScanner();
                  }}
                  disabled={startScannerMutation.isPending || !!scannerState}
                  className="flex-1"
                  variant="default"
                  title="Click to start Historical Analysis. Ctrl+Click to run independently."
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {startScannerMutation.isPending ? 'Starting...' : 
                   scannerState ? 'Historical Active' :
                   'Historical Analysis'}
                  </Button>

                  {/* Stop Scanner Button - Only show when scanner is active */}
                  {scannerState && (
                    <Button 
                      onClick={handleStopScanner}
                      variant="destructive"
                      size="default"
                      title="Stop scanner and candle progression monitoring"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop Scanner
                    </Button>
                  )}
                </div>

                <Button 
                  onClick={() => {
                    setSimulationTrades([]);
                    setAllPatternRecords([]);
                    setIsAutoFetchActive(false);
                    
                    // CRITICAL FIX: Stop candle progression monitoring
                    stopProgressionMonitoring.mutate();
                    
                    // Stop auto-fetch if active
                    if (autoFetchInterval) {
                      clearInterval(autoFetchInterval);
                      setAutoFetchInterval(null);
                      console.log('🛑 Stopped auto-fetch during manual reset');
                    }
                    
                    // Stop streaming OHLC if active
                    stopStreamingOHLC();
                    
                    setLivePrice(null);
                    setLastPriceUpdate('');
                    setPriceChangePercent(0);
                    console.log('🔄 Manual reset: All trades and patterns cleared');
                  }}
                  variant="destructive"
                  size="sm"
                  className="shrink-0"
                >
                  Reset
                </Button>
              </div>
              
              {/* Market Status & Auto-Fetch Status */}
              <div className="col-span-full flex items-center gap-4 pt-2">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                  isMarketOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  Market {isMarketOpen ? 'Open' : 'Closed'} (9:15 AM - 3:30 PM IST)
                </div>
                

              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Range Summary - Only show when in date range mode */}
      {isDateRangeMode && dateRangeProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Range Scan Progress
            </CardTitle>
            <CardDescription>
              Multi-date scanning progress and cumulative results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Current Status</Label>
                <div className="text-sm space-y-1">
                  <div className="font-medium">
                    Date {currentDateIndex + 1} of {dateRangeProgress.originalTotalDates}
                  </div>
                  {currentDateIndex >= dateRangeProgress.originalTotalDates - 1 ? (
                    <div className="text-green-600 font-medium">✅ Date Range Complete</div>
                  ) : (
                    <div className="text-gray-600">
                      Scanning: {getCurrentScanDate()}
                    </div>
                  )}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentDateIndex + 1) / dateRangeProgress.originalTotalDates) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="text-sm space-y-1">
                  <div>Start: {startDate}</div>
                  <div>End: {endDate}</div>
                  <div className="text-gray-600">
                    {dateRangeProgress.totalDates} trading days
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Pattern Summary</Label>
                <div className="text-sm space-y-1">
                  <div>Total Patterns: {allPatternRecords.length}</div>
                  <div>Uptrends: {allPatternRecords.filter(p => p.type === 'UPTREND').length}</div>
                  <div>Downtrends: {allPatternRecords.filter(p => p.type === 'DOWNTREND').length}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Trade Results</Label>
                <div className="text-sm space-y-1">
                  {(() => {
                    // Debug: Log trade data for inspection
                    if (isDateRangeMode) {
                      console.log('🔍 TRADE RESULTS DEBUG (Date Range Mode):', {
                        totalTrades: simulationTrades.length,
                        tradeData: simulationTrades.map(t => ({
                          date: t.exactEntryDate,
                          timeframe: t.timeframe,
                          type: t.type,
                          profitLoss: t.profitLoss,
                          entryPrice: t.entryPrice,
                          exitPrice: t.exitPrice,
                          exitReason: t.exitReason
                        }))
                      });
                    }
                    
                    // Filter out trades with invalid/null profitLoss
                    const validTrades = simulationTrades.filter(trade => 
                      trade.profitLoss !== null && 
                      trade.profitLoss !== undefined && 
                      !isNaN(trade.profitLoss)
                    );
                    
                    // LIVE P&L FIX: Calculate profits/losses with live P&L for active trades
                    const calculateTradeProfit = (trade: any) => {
                      if (scannerState && livePrice && trade.entryPrice) {
                        return trade.direction === 'SELL' 
                          ? (trade.entryPrice - livePrice) * 100  // DOWNTREND/SELL
                          : (livePrice - trade.entryPrice) * 100; // UPTREND/BUY
                      }
                      return trade.profitLoss || 0;
                    };
                    
                    const totalProfits = validTrades.filter(trade => calculateTradeProfit(trade) > 0).reduce((sum, trade) => sum + calculateTradeProfit(trade), 0);
                    const totalLosses = Math.abs(validTrades.filter(trade => calculateTradeProfit(trade) < 0).reduce((sum, trade) => sum + calculateTradeProfit(trade), 0));
                    const netPL = validTrades.reduce((sum, trade) => sum + calculateTradeProfit(trade), 0);
                    const winningTrades = validTrades.filter(trade => calculateTradeProfit(trade) > 0).length;
                    const winRate = validTrades.length > 0 ? ((winningTrades / validTrades.length) * 100) : 0;
                    
                    if (isDateRangeMode) {
                      console.log('🔍 TRADE CALCULATIONS DEBUG:', {
                        totalTrades: simulationTrades.length,
                        validTrades: validTrades.length,
                        invalidTrades: simulationTrades.length - validTrades.length,
                        totalProfits,
                        totalLosses,
                        netPL,
                        winningTrades,
                        winRate: winRate.toFixed(1)
                      });
                    }
                    
                    return (
                      <>
                        <div>Total Trades: {validTrades.length} {simulationTrades.length !== validTrades.length && <span className="text-orange-500">({simulationTrades.length - validTrades.length} invalid)</span>}</div>
                        <div className="text-green-600">
                          Total Profit: ₹{totalProfits.toFixed(2)}
                        </div>
                        <div className="text-red-600">
                          Total Loss: ₹{totalLosses.toFixed(2)}
                        </div>
                        <div className={netPL >= 0 ? 'text-green-600' : 'text-red-600'}>
                          Net P&L: ₹{netPL.toFixed(2)}
                        </div>
                        <div>
                          Win Rate: {winRate.toFixed(1)}%
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Activity Status - Show when scanner is active */}
      {scannerState && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
              Scanner Active - {selectedDate}
            </CardTitle>
            <CardDescription>
              3-Cycle BATTU pattern analysis in progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-2 bg-white dark:bg-gray-800 rounded">
                <div className="text-gray-500">Current Timeframe</div>
                <div className="font-bold text-lg text-blue-600">
                  {scannerState?.currentTimeframe || 5}min
                </div>
              </div>
              <div className="p-2 bg-white dark:bg-gray-800 rounded">
                <div className="text-gray-500">Active Cycle</div>
                <div className="font-bold text-lg text-green-600">
                  Cycle {cycleInfo.cycle}
                </div>
              </div>
              <div className="p-2 bg-white dark:bg-gray-800 rounded">
                <div className="text-gray-500">Patterns Detected</div>
                <div className="font-bold text-lg text-purple-600">
                  {patternAnalysis?.patterns?.length || 0}
                </div>
              </div>
            </div>
            
            {/* Real-time Progress */}
            <div className="p-2 bg-white dark:bg-gray-800 rounded text-xs">
              <div className="font-medium mb-1">Analysis Progress:</div>
              <div className="space-y-1">
                <div>✅ Point A/B extraction: {patternAnalysis ? 'Complete' : 'In progress...'}</div>
                <div>✅ Pattern validation: {scannerState?.cycle2Status ? 'Complete' : 'In progress...'}</div>
                <div>🔄 Live monitoring: {scannerState?.cycle2Status ? 'Active' : 'Pending...'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CRITICAL DEBUG: Show current data state */}
      {(() => {
        console.log('🔍 DISPLAY DEBUG:', {
          allPatternRecords: allPatternRecords.length,
          simulationTrades: simulationTrades.length,
          isDateRangeMode: isDateRangeMode,
          scannerState: !!scannerState,
          patternAnalysis: !!patternAnalysis,
          recursiveAnalysis: !!recursiveAnalysis,
          currentTimeframe: scannerState?.currentTimeframe
        });
        
        // Log recursive analysis state for debugging
        if (recursiveAnalysis) {
          console.log('🔄 RECURSIVE ANALYSIS AVAILABLE:', {
            uptrendPatterns: recursiveAnalysis.uptrendList?.length || 0,
            downtrendPatterns: recursiveAnalysis.downtrendList?.length || 0,
            totalLevels: recursiveAnalysis.totalLevels
          });
        }
        
        return null;
      })()}

      {/* Analysis Summary - Show when there is data or scanner is active */}
      {(allPatternRecords.length > 0 || simulationTrades.length > 0 || scannerState || patternAnalysis) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Analysis Summary - {selectedDate}
            </CardTitle>
            <CardDescription>
              Pattern analysis and trading results for the selected date
              {simulationTrades.length === 0 && allPatternRecords.length === 0 && scannerState && 
                <span className="text-orange-600 font-medium"> - Scanner active, results will appear here</span>
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pattern Summary */}
              <div className="space-y-2">
                <Label>Pattern Summary</Label>
                <div className="text-sm space-y-1">
                  <div>Total Patterns: {allPatternRecords.length}</div>
                  <div>Uptrends: {allPatternRecords.filter(p => p.type === 'UPTREND').length}</div>
                  <div>Downtrends: {allPatternRecords.filter(p => p.type === 'DOWNTREND').length}</div>
                  <div className="text-gray-600">
                    Timeframes: {Array.from(new Set(allPatternRecords.map(p => p.timeframe))).join(', ')}min
                  </div>
                </div>
              </div>
              
              {/* Trade Results */}
              <div className="space-y-2">
                <Label>Trade Results</Label>
                <div className="text-sm space-y-1">
                  <div>Total Trades: {simulationTrades.length}</div>
                  <div className="text-green-600">
                    Total Profit: ₹{simulationTrades.filter(trade => (trade.profitLoss || 0) > 0).reduce((sum, trade) => sum + (trade.profitLoss || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-red-600">
                    Total Loss: ₹{Math.abs(simulationTrades.filter(trade => (trade.profitLoss || 0) < 0).reduce((sum, trade) => sum + (trade.profitLoss || 0), 0)).toFixed(2)}
                  </div>
                  <div className={simulationTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    Net P&L: ₹{simulationTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0).toFixed(2)}
                  </div>
                  <div>
                    Win Rate: {simulationTrades.length > 0 
                      ? ((simulationTrades.filter(trade => trade.profitLoss && trade.profitLoss > 0).length / simulationTrades.length) * 100).toFixed(1)
                      : 0}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Master Pattern Summary - Show for date range mode or when requested */}
      {(isDateRangeMode || allPatternRecords.length > 20) && allPatternRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Master Pattern Summary
            </CardTitle>
            <CardDescription>
              Overview of all detected patterns across timeframes and dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{allPatternRecords.length}</div>
                <div className="text-xs text-gray-600">Total Patterns</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{allPatternRecords.filter(p => p.type === 'UPTREND').length}</div>
                <div className="text-xs text-gray-600">Uptrend Patterns</div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{allPatternRecords.filter(p => p.type === 'DOWNTREND').length}</div>
                <div className="text-xs text-gray-600">Downtrend Patterns</div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                <div className="text-xl font-bold text-purple-600">
                  {Array.from(new Set(allPatternRecords.map(p => p.timeframe))).join(', ')}min
                </div>
                <div className="text-xs text-gray-600">Timeframes Analyzed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Status */}
      {historicalData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Data Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500">1-Min Candles</div>
                <div className="font-medium">{historicalData.length}</div>
              </div>
              <div>
                <div className="text-gray-500">Current Timeframe</div>
                <div className="font-medium">{scannerState?.currentTimeframe || 5} min</div>
              </div>
              <div>
                <div className="text-gray-500">Resampled Candles</div>
                <div className="font-medium">{currentTimeframeData.length}</div>
              </div>
              <div>
                <div className="text-gray-500">Progress</div>
                <div className="font-medium">{cycleInfo.progress}%</div>
              </div>
            </div>
            
            {/* Auto-progression status alerts */}
            {isWaitingForPositionClosure && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <TrendingUp className="h-4 w-4 animate-pulse" />
                  <span className="font-medium">
                    ⏳ Waiting for open positions to close at 98% duration before auto-progression...
                  </span>
                </div>
              </div>
            )}
            {autoProgressCountdown !== null && !isWaitingForPositionClosure && (
              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                  <TrendingUp className="h-4 w-4 animate-pulse" />
                  <span className="font-medium">
                    🚀 Auto-progressing to {scannerState?.currentTimeframe && scannerState.currentTimeframe * 2}-minute timeframe in {autoProgressCountdown} seconds...
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3-Cycle Windows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cycle 1: Point A/B Analysis (4 Candle Rule Methodology) */}
        <Card className={cycleInfo.cycle === 1 ? 'ring-2 ring-blue-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Cycle 1: Point A/B Analysis (4 Candle Rule Methodology)
            </CardTitle>
            <CardDescription>
              Extract exact timestamps and patterns from 1-minute precision data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Timeframe:</span>
                <span className="font-medium">{scannerState?.currentTimeframe || 5} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>First 4 Candles:</span>
                <span className="font-medium">
                  {Math.min(currentTimeframeData.length, 4)} / 4
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <span className={`font-medium ${cycleInfo.cycle === 1 ? 'text-blue-500' : 'text-gray-500'}`}>
                  {cycleInfo.cycle === 1 ? 'Active' : 'Complete'}
                </span>
              </div>
            </div>
            
            {/* Point A/B Analysis Display - Using 4 Candle Rule Methodology */}
            {currentTimeframeData.length >= 4 && (
              <div className="space-y-3">
                {/* Point A/B Exact Timestamps (Same as 4 Candle Rule) */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Point A/B Analysis (4 Candle Rule Methodology)
                  </div>
                  {cycle1PointABData ? (
                    <div className="space-y-2">
                      {/* Uptrend */}
                      {cycle1PointABData.uptrend.pointA && cycle1PointABData.uptrend.pointB && (
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs font-medium text-green-700 dark:text-green-300">Uptrend Pattern</div>
                            {cycle1PointABData.uptrend.patternLabel && (
                              <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-xs font-bold text-green-800 dark:text-green-200">
                                {cycle1PointABData.uptrend.patternLabel}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-medium">Point A (Low):</span>
                              <div>{cycle1PointABData.uptrend.pointA.exactTime}</div>
                              <div>Price: {cycle1PointABData.uptrend.pointA.price}</div>
                              {cycle1PointABData.uptrend.pointA.candleBlock && (
                                <div className="text-gray-600 dark:text-gray-400">{cycle1PointABData.uptrend.pointA.candleBlock}</div>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Point B (High):</span>
                              <div>{cycle1PointABData.uptrend.pointB.exactTime}</div>
                              <div>Price: {cycle1PointABData.uptrend.pointB.price}</div>
                              {cycle1PointABData.uptrend.pointB.candleBlock && (
                                <div className="text-gray-600 dark:text-gray-400">{cycle1PointABData.uptrend.pointB.candleBlock}</div>
                              )}
                            </div>
                          </div>
                          {/* Duration & Slope Analysis */}
                          <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="font-medium">Duration:</span>
                                <div>{((cycle1PointABData.uptrend.pointB.timestamp - cycle1PointABData.uptrend.pointA.timestamp) / 60).toFixed(0)} min</div>
                              </div>
                              <div>
                                <span className="font-medium">Change:</span>
                                <div>+{(cycle1PointABData.uptrend.pointB.price - cycle1PointABData.uptrend.pointA.price).toFixed(1)} pts</div>
                              </div>
                              <div>
                                <span className="font-medium">Slope:</span>
                                <div>{((cycle1PointABData.uptrend.pointB.price - cycle1PointABData.uptrend.pointA.price) / ((cycle1PointABData.uptrend.pointB.timestamp - cycle1PointABData.uptrend.pointA.timestamp) / 60)).toFixed(3)} pts/min</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Downtrend */}
                      {cycle1PointABData.downtrend.pointA && cycle1PointABData.downtrend.pointB && (
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs font-medium text-red-700 dark:text-red-300">Downtrend Pattern</div>
                            {cycle1PointABData.downtrend.patternLabel && (
                              <div className="px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded text-xs font-bold text-red-800 dark:text-red-200">
                                {cycle1PointABData.downtrend.patternLabel}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-medium">Point A (High):</span>
                              <div>{cycle1PointABData.downtrend.pointA.exactTime}</div>
                              <div>Price: {cycle1PointABData.downtrend.pointA.price}</div>
                              {cycle1PointABData.downtrend.pointA.candleBlock && (
                                <div className="text-gray-600 dark:text-gray-400">{cycle1PointABData.downtrend.pointA.candleBlock}</div>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Point B (Low):</span>
                              <div>{cycle1PointABData.downtrend.pointB.exactTime}</div>
                              <div>Price: {cycle1PointABData.downtrend.pointB.price}</div>
                              {cycle1PointABData.downtrend.pointB.candleBlock && (
                                <div className="text-gray-600 dark:text-gray-400">{cycle1PointABData.downtrend.pointB.candleBlock}</div>
                              )}
                            </div>
                          </div>
                          {/* Duration & Slope Analysis */}
                          <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-700">
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="font-medium">Duration:</span>
                                <div>{((cycle1PointABData.downtrend.pointB.timestamp - cycle1PointABData.downtrend.pointA.timestamp) / 60).toFixed(0)} min</div>
                              </div>
                              <div>
                                <span className="font-medium">Change:</span>
                                <div>{(cycle1PointABData.downtrend.pointB.price - cycle1PointABData.downtrend.pointA.price).toFixed(1)} pts</div>
                              </div>
                              <div>
                                <span className="font-medium">Slope:</span>
                                <div>{((cycle1PointABData.downtrend.pointB.price - cycle1PointABData.downtrend.pointA.price) / ((cycle1PointABData.downtrend.pointB.timestamp - cycle1PointABData.downtrend.pointA.timestamp) / 60)).toFixed(3)} pts/min</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Fetching exact timestamps from 1-minute data...
                    </div>
                  )}
                </div>
                
                {/* C2 Block (C2A, C2B) */}
                {currentTimeframeData.length >= 4 && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                      C2 Block (Candles 3-4)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {currentTimeframeData.slice(2, 4).map((candle, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded text-xs">
                          <div className="font-medium text-orange-600 mb-1">
                            C2{index === 0 ? 'A' : 'B'}
                          </div>
                          <div className="space-y-0.5 text-xs">
                            <div>O: {candle.open?.toFixed(2)}</div>
                            <div>H: {candle.high?.toFixed(2)}</div>
                            <div>L: {candle.low?.toFixed(2)}</div>
                            <div>C: {candle.close?.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Block Analysis Summary */}
                {currentTimeframeData.length >= 4 && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                    <div className="font-medium mb-1">4-Candle Analysis Ready</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      C1 Block: {currentTimeframeData[0]?.high >= currentTimeframeData[1]?.high ? 'C1A High' : 'C1B High'} | 
                      C2 Block: {currentTimeframeData[2]?.high >= currentTimeframeData[3]?.high ? 'C2A High' : 'C2B High'}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Progress:</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${cycleInfo.cycle === 1 ? cycleInfo.progress : 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">4 Candle Rule:</div>
              <div className="text-xs text-gray-600">
                Extract Point A & B from C1/C2 blocks using 1-minute precision data for exact timestamps
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cycle 2: Pattern Analysis 1 min data */}
        <Card className={cycleInfo.cycle === 2 ? 'ring-2 ring-green-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Cycle 2: Pattern Analysis 1 min data
            </CardTitle>
            <CardDescription>
              Point A/B Analysis using 4 Candle Rule Methodology with 1-minute precision
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Analysis Target:</span>
                <span className="font-medium">First 4 Candles → Point A/B Analysis</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pattern Ready:</span>
                <span className="font-medium">
                  {currentTimeframeData.length >= 4 ? '✅ Ready' : '⏳ Waiting'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <span className={`font-medium ${cycleInfo.cycle === 2 ? 'text-green-500' : 'text-gray-500'}`}>
                  {cycleInfo.cycle === 2 ? 'Active' : cycleInfo.cycle > 2 ? 'Complete' : 'Pending'}
                </span>
              </div>
            </div>

            {/* Pattern Analysis Results - Always show when pattern analysis exists */}
            {(currentTimeframeData.length >= 4 || patternAnalysis) && (
              <div className="space-y-3">
                {/* Point A/B Analysis */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Point A/B Analysis (4 Candle Rule Methodology)
                    </div>
                    {/* Deep Analysis button removed */}
                  </div>
                  {patternAnalysis ? (
                    <div className="space-y-2">

                      
                      {/* Show recursive fractal analysis when available, or fallback to individual patterns */}
                      {recursiveAnalysis ? (
                        <div className="space-y-3">
                          {/* Recursive Point A/B Analysis (80min → 5min fractal drilling) */}
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
                              🔄 Recursive Point A/B Analysis (80min → 5min)
                              <span className="bg-blue-100 dark:bg-blue-800 px-1 rounded text-[10px]">{recursiveAnalysis.totalLevels} Levels</span>
                            </div>
                            
                            {/* Pattern Lists */}
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                                  📈 Uptrend Sequence
                                </div>
                                <div className="text-[10px] text-green-600 dark:text-green-400 font-mono">
                                  [{recursiveAnalysis.uptrendList.map((p: string | null) => p || 'None').join(', ')}]
                                </div>
                                <div className="text-[10px] text-green-500 mt-1">
                                  Patterns: {recursiveAnalysis.uptrendList.filter((p: string | null) => p !== null).length}/5
                                </div>
                              </div>
                              
                              <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                                  📉 Downtrend Sequence
                                </div>
                                <div className="text-[10px] text-red-600 dark:text-red-400 font-mono">
                                  [{recursiveAnalysis.downtrendList.map((p: string | null) => p || 'None').join(', ')}]
                                </div>
                                <div className="text-[10px] text-red-500 mt-1">
                                  Patterns: {recursiveAnalysis.downtrendList.filter((p: string | null) => p !== null).length}/5
                                </div>
                              </div>
                            </div>
                            
                            {/* Timeframe Levels */}
                            <div className="text-[10px] text-gray-600 dark:text-gray-400 space-y-1">
                              {recursiveAnalysis.levelAnalyses?.slice(0, 3).map((level: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center">
                                  <span className="font-mono">L{level.level}: {level.timeframe}</span>
                                  <span className="text-blue-600 dark:text-blue-400">
                                    {level.timeRange.start} → {level.timeRange.end}
                                  </span>
                                </div>
                              ))}
                              {recursiveAnalysis.levelAnalyses?.length > 3 && (
                                <div className="text-center text-gray-500">
                                  +{recursiveAnalysis.levelAnalyses.length - 3} more levels...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Fallback to individual patterns */}
                          {/* Uptrend */}
                          {patternAnalysis.patterns?.[0] && patternAnalysis.patterns[0].type === 'UPTREND' && (
                            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                              <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Uptrend Pattern</div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="font-medium">Point A (Low):</span>
                                  <div>{patternAnalysis.patterns[0].pointA.exactTime}</div>
                                  <div>Price: {patternAnalysis.patterns[0].pointA.price}</div>
                                </div>
                                <div>
                                  <span className="font-medium">Point B (High):</span>
                                  <div>{patternAnalysis.patterns[0].pointB.exactTime}</div>
                                  <div>Price: {patternAnalysis.patterns[0].pointB.price}</div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Downtrend */}
                          {patternAnalysis.patterns?.[1] && patternAnalysis.patterns[1].type === 'DOWNTREND' && (
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                              <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Downtrend Pattern</div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="font-medium">Point A (High):</span>
                                  <div>{patternAnalysis.patterns[1].pointA.exactTime}</div>
                                  <div>Price: {patternAnalysis.patterns[1].pointA.price}</div>
                                </div>
                                <div>
                                  <span className="font-medium">Point B (Low):</span>
                                  <div>{patternAnalysis.patterns[1].pointB.exactTime}</div>
                                  <div>Price: {patternAnalysis.patterns[1].pointB.price}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Fetching exact timestamps from 1-minute data...
                    </div>
                  )}
                </div>

                {/* Slope & Timing Analysis */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Slope & Timing Analysis
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="font-medium">Uptrend Slope:</div>
                        <div className="text-green-600">
                          {patternAnalysis?.patterns?.[0]?.slope?.toFixed(4) || '0.0000'} pts/min
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Downtrend Slope:</div>
                        <div className="text-red-600">
                          {patternAnalysis?.patterns?.[1]?.slope?.toFixed(4) || '0.0000'} pts/min
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Duration: {(scannerState?.currentTimeframe || 5) * 2} minutes (2 candle blocks)
                    </div>
                  </div>
                </div>



                {/* Deep Mini Analysis */}
                <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border-l-4 border-indigo-400">
                  <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-3">
                    Deep Mini Analysis
                  </div>
                  
                  {(patternAnalysis?.pointABData || cycle1PointABData) ? (
                    <div className="space-y-3">
                      {/* Uptrend Pattern */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                        <div className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Uptrend Pattern ({(patternAnalysis?.pointABData || cycle1PointABData)?.uptrend?.patternLabel || 'N/A'})
                          </div>
                          <div className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded font-medium">
                            {scannerState?.currentTimeframe || 5}min
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border-l-2 border-green-400">
                            <div className="font-medium text-green-700 dark:text-green-300">Point A (Low)</div>
                            <div className="text-gray-600 dark:text-gray-400">
                              Time: {(patternAnalysis?.pointABData || cycle1PointABData)?.uptrend?.pointA?.exactTime || (patternAnalysis?.pointABData || cycle1PointABData)?.uptrend?.pointA?.time || 'N/A'}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              Price: ₹{(patternAnalysis?.pointABData || cycle1PointABData)?.uptrend?.pointA?.price || 'N/A'}
                            </div>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border-l-2 border-green-400">
                            <div className="font-medium text-green-700 dark:text-green-300">Point B (High)</div>
                            <div className="text-gray-600 dark:text-gray-400">
                              Time: {(patternAnalysis?.pointABData || cycle1PointABData)?.uptrend?.pointB?.exactTime || (patternAnalysis?.pointABData || cycle1PointABData)?.uptrend?.pointB?.time || 'N/A'}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              Price: ₹{(patternAnalysis?.pointABData || cycle1PointABData)?.uptrend?.pointB?.price || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Downtrend Pattern */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                        <div className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4" />
                            Downtrend Pattern ({(patternAnalysis?.pointABData || cycle1PointABData)?.downtrend?.patternLabel || 'N/A'})
                          </div>
                          <div className="text-xs bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded font-medium">
                            {scannerState?.currentTimeframe || 5}min
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded border-l-2 border-red-400">
                            <div className="font-medium text-red-700 dark:text-red-300">Point A (High)</div>
                            <div className="text-gray-600 dark:text-gray-400">
                              Time: {(patternAnalysis?.pointABData || cycle1PointABData)?.downtrend?.pointA?.exactTime || (patternAnalysis?.pointABData || cycle1PointABData)?.downtrend?.pointA?.time || 'N/A'}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              Price: ₹{(patternAnalysis?.pointABData || cycle1PointABData)?.downtrend?.pointA?.price || 'N/A'}
                            </div>
                          </div>
                          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded border-l-2 border-red-400">
                            <div className="font-medium text-red-700 dark:text-red-300">Point B (Low)</div>
                            <div className="text-gray-600 dark:text-gray-400">
                              Time: {(patternAnalysis?.pointABData || cycle1PointABData)?.downtrend?.pointB?.exactTime || (patternAnalysis?.pointABData || cycle1PointABData)?.downtrend?.pointB?.time || 'N/A'}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              Price: ₹{(patternAnalysis?.pointABData || cycle1PointABData)?.downtrend?.pointB?.price || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>



                      {/* Deep Mini Analysis Methodology Note */}
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded text-xs text-indigo-700 dark:text-indigo-300">
                        <div className="font-medium mb-1">Deep Mini Analysis: 4 Candle Rule Methodology</div>
                        <div className="text-indigo-600 dark:text-indigo-400">
                          Authentic Point A/B timing analysis using real 1-minute OHLC data from Fyers API
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-xs text-gray-600 dark:text-gray-400 p-4 bg-white dark:bg-gray-800 rounded border border-dashed">
                        No Point A/B pattern data available. Click button below to fetch exact timing.
                      </div>
                      <button 
                        onClick={fetchPointABData}
                        disabled={!scannerState?.currentTimeframe}
                        className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm rounded transition-colors"
                      >
                        {!scannerState?.currentTimeframe ? 'Start Scanner First' : 'Fetch Point A/B Data'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Advanced Internal Pattern Analysis */}
                {patternAnalysis?.advancedAnalysis && (
                  <div className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border-l-4 border-orange-400">
                    <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2 flex items-center gap-2">
                      🎯 Deep Pattern Analysis (Integrated)
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 italic">
                      Recursive C2 block breakdown with pattern strength comparison across timeframes
                    </div>
                    <div className="space-y-2">
                      {/* Selected Trend & Score */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="font-medium">Selected Trend:</div>
                          <div className={`font-bold ${patternAnalysis.advancedAnalysis.selectedTrend === 'uptrend' ? 'text-green-600' : 'text-red-600'}`}>
                            {patternAnalysis.advancedAnalysis.selectedTrend.toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Trend Score:</div>
                          <div className="font-bold text-blue-600">
                            {patternAnalysis.advancedAnalysis.trendScore.toFixed(1)}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Optimal Timeframe:</div>
                          <div className="font-bold text-purple-600">
                            {patternAnalysis.advancedAnalysis.optimalTimeframe}min
                          </div>
                        </div>
                      </div>
                      
                      {/* Main 80min Patterns (from Deep Analysis) - Fixed Display Logic */}
                      <div className="space-y-1">
                        <div className="font-medium text-xs">
                          {scannerState?.currentTimeframe || 80}min Timeframe Patterns:
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-2 rounded text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex justify-between">
                              <span>Downtrend:</span>
                              <span className="font-medium text-red-600">
                                {patternAnalysis.advancedAnalysis.strongestDowntrend?.pattern || 'None'} ({patternAnalysis.advancedAnalysis.strongestDowntrend?.score || 0})
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Uptrend:</span>
                              <span className="font-medium text-green-600">
                                {patternAnalysis.advancedAnalysis.strongestUptrend?.pattern || 'None'} ({patternAnalysis.advancedAnalysis.strongestUptrend?.score || 0})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Internal Pattern Breakdown (Sub-timeframes) */}
                      <div className="space-y-1">
                        <div className="font-medium text-xs">Internal Pattern Breakdown:</div>
                        {patternAnalysis.advancedAnalysis.internalPatterns.map((pattern: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs">
                            <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {pattern.timeframe}min Sub-analysis:
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex justify-between">
                                <span>Downtrend:</span>
                                <span className="font-medium">
                                  {pattern.patterns.downtrend.pattern || 'None'} ({pattern.patterns.downtrend.score || 0})
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Uptrend:</span>
                                <span className="font-medium">
                                  {pattern.patterns.uptrend.pattern || 'None'} ({pattern.patterns.uptrend.score || 0})
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Recommendation */}
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <div className="font-medium text-xs text-blue-700 dark:text-blue-300">Recommendation:</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          {patternAnalysis.advancedAnalysis.recommendation}
                        </div>
                      </div>
                    </div>
                  </div>
                )}



                {/* Breakout & Trigger Levels */}
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                    Breakout & Trigger Levels
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="font-medium text-green-600">Uptrend Levels:</div>
                      <div>Breakout: {patternAnalysis?.patterns?.[0]?.breakoutLevel?.toFixed(2) || 'N/A'}</div>
                      <div>Stop Loss: {patternAnalysis?.patterns?.[0]?.stopLoss?.toFixed(2) || 'N/A'}</div>
                      <div>Trigger: 5th/6th candle break</div>
                    </div>
                    <div>
                      <div className="font-medium text-red-600">Downtrend Levels:</div>
                      <div>Breakout: {patternAnalysis?.patterns?.[1]?.breakoutLevel?.toFixed(2) || 'N/A'}</div>
                      <div>Stop Loss: {patternAnalysis?.patterns?.[1]?.stopLoss?.toFixed(2) || 'N/A'}</div>
                      <div>Trigger: 5th/6th candle break</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">Analysis Rules:</div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• Extract Point A & B from C1/C2 blocks</div>
                <div>• Calculate exact timing and slope</div>
                <div>• Determine breakout levels and triggers</div>
                <div>• Monitor 5th/6th candle for pattern completion</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Progress:</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${cycleInfo.cycle === 2 ? cycleInfo.progress : cycleInfo.cycle > 2 ? 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Cycle 2 Simulation Tracking */}
        {scannerState?.cycle2Status && (
          <Card className="ring-2 ring-indigo-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                Cycle 2 Simulation Tracking
              </CardTitle>
              <CardDescription>
                Complete 5th/6th candle analysis with target/SL exit values
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Trade Parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-2">
                    Trade Parameters
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Direction:</span>
                      <span className={`font-medium ${scannerState.cycle2Status.tradeDirection === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                        {scannerState.cycle2Status.tradeDirection}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pattern:</span>
                      <span className="font-medium">{scannerState.cycle2Status.patternType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entry:</span>
                      <span className="font-medium">{scannerState.cycle2Status.entryPrice?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Target:</span>
                      <span className="font-medium text-green-600">{scannerState.cycle2Status.targetPrice?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stop Loss:</span>
                      <span className="font-medium text-red-600">{scannerState.cycle2Status.stopLoss?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                    Breakout Status
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Detected:</span>
                      <span className={`font-medium ${scannerState.cycle2Status.isBreakoutDetected ? 'text-green-600' : 'text-gray-500'}`}>
                        {scannerState.cycle2Status.isBreakoutDetected ? '✅ Yes' : '⏳ Waiting'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exit Reason:</span>
                      <span className="font-medium text-xs">{scannerState.cycle2Status.exitReason || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5th and 6th Candle Analysis */}
              <div className="space-y-3">
                <div className="text-sm font-medium">5th & 6th Candle Analysis</div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* 5th Candle */}
                  {scannerState.cycle2Status.fifthCandleData && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                        5th Candle Data
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="grid grid-cols-2 gap-1">
                          <span>Open:</span>
                          <span className="font-medium">{scannerState.cycle2Status.fifthCandleData.open?.toFixed(2)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <span>High:</span>
                          <span className="font-medium text-green-600">{scannerState.cycle2Status.fifthCandleData.high?.toFixed(2)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <span>Low:</span>
                          <span className="font-medium text-red-600">{scannerState.cycle2Status.fifthCandleData.low?.toFixed(2)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <span>Close:</span>
                          <span className="font-medium">{scannerState.cycle2Status.fifthCandleData.close?.toFixed(2)}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t">
                          <div className="text-xs text-gray-600">
                            Breakout Check: {scannerState.cycle2Status.tradeDirection === 'BUY' 
                              ? (scannerState.cycle2Status.fifthCandleData.high > (scannerState.cycle2Status.entryPrice || 0)) ? '🚀 Triggered' : '⏳ Waiting'
                              : (scannerState.cycle2Status.fifthCandleData.low < (scannerState.cycle2Status.entryPrice || 0)) ? '🚀 Triggered' : '⏳ Waiting'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6th Candle */}
                  {scannerState.cycle2Status.sixthCandleData ? (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                        6th Candle Data ✅
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="grid grid-cols-2 gap-1">
                          <span>Open:</span>
                          <span className="font-medium">{scannerState.cycle2Status.sixthCandleData.open?.toFixed(2)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <span>High:</span>
                          <span className="font-medium text-green-600">{scannerState.cycle2Status.sixthCandleData.high?.toFixed(2)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <span>Low:</span>
                          <span className="font-medium text-red-600">{scannerState.cycle2Status.sixthCandleData.low?.toFixed(2)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <span>Close:</span>
                          <span className="font-medium">{scannerState.cycle2Status.sixthCandleData.close?.toFixed(2)}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t">
                          <div className="text-xs text-green-600 font-medium">
                            ✅ Complete - Ready for Timeframe Transition
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        6th Candle ⏳
                      </div>
                      <div className="text-xs text-gray-600 mb-3">
                        Waiting for 6th candle completion before timeframe transition...
                      </div>
                      
                      {/* Manual Progression Button & Countdown */}
                      {fifthCandleData && !sixthCandleData && !isWaitingForSixthCandle && (
                        <div className="space-y-2">
                          {/* Countdown Display */}
                          {progressionCountdown && (
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded text-center">
                              <div className="text-xs text-orange-700 dark:text-orange-300">
                                Auto-progression in
                              </div>
                              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                {Math.floor(progressionCountdown / 60)}:{(progressionCountdown % 60).toString().padStart(2, '0')}
                              </div>
                            </div>
                          )}
                          
                          {/* Manual Progression Button */}
                          <Button 
                            onClick={handleProgressToSixthCandle}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                            data-testid="button-progress-sixth-candle"
                          >
                            Progress to 6th Candle
                          </Button>
                        </div>
                      )}
                      
                      {/* Waiting State */}
                      {isWaitingForSixthCandle && (
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-center">
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                            Processing 6th candle progression...
                          </div>
                        </div>
                      )}
                      
                      {/* Progress Bar */}
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6th Candle Completion Status */}
                <div className={`p-3 rounded-lg ${scannerState.cycle2Status.sixthCandleData ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                  <div className="text-sm font-medium mb-2">
                    {scannerState.cycle2Status.sixthCandleData ? '✅ 6th Candle Analysis Complete' : '⏳ Waiting for 6th Candle Completion'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {scannerState.cycle2Status.sixthCandleData 
                      ? 'All 6 candles analyzed. System ready to progress to next timeframe.' 
                      : 'System will wait for complete 6th candle before moving to next timeframe.'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Cycle 3: Real-Time Data Validation */}
        <Card className={cycleInfo.cycle === 3 ? 'ring-2 ring-orange-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Cycle 3: Real-Time Data Validation
            </CardTitle>
            <CardDescription>
              Compare Cycle 2 analysis against live 1-minute data for 6 candles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cycle 2 Analysis Reference - BLOCK FOR COMPLETED TIMEFRAMES */}
            {(() => {
              const currentDate = new Date().toISOString().split('T')[0];
              const analysisDate = selectedDate;
              const isAnalyzingCurrentDate = analysisDate === currentDate;
              const sixthCandle = scannerState?.cycle2Status?.sixthCandleData;
              const isCompletedTimeframe = sixthCandle && isAnalyzingCurrentDate;
              
              if (isCompletedTimeframe) {
                const sixthCandleTime = new Date(sixthCandle.timestamp * 1000);
                const currentTime = new Date();
                const timeDiff = (currentTime.getTime() - sixthCandleTime.getTime()) / (1000 * 60);
                
                return (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                      🚀 TIMEFRAME {scannerState?.currentTimeframe}MIN COMPLETED - CONTINUING WITH LIVE DATA
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
                      <div>6th Candle Completed: {sixthCandleTime.toLocaleTimeString('en-US', { hour12: true, timeZone: 'Asia/Kolkata' })}</div>
                      <div>Current Time: {currentTime.toLocaleTimeString('en-US', { hour12: true, timeZone: 'Asia/Kolkata' })}</div>
                      <div>Time Elapsed: {timeDiff.toFixed(0)} minutes ago</div>
                      <div className="font-medium mt-2">✅ LIVE DATA STREAMING - 700MS AUTO-FETCH ACTIVE</div>
                    </div>
                  </div>
                );
              }
              
              return patternAnalysis && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Cycle 2 Analysis Reference ({scannerState?.currentTimeframe}min)
                  </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {patternAnalysis.patterns.map((pattern: any, index: number) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded">
                      <div className={`font-medium mb-1 ${pattern.type === 'UPTREND' ? 'text-green-600' : 'text-red-600'}`}>
                        {pattern.type} Pattern
                      </div>
                      <div className="space-y-1">
                        <div>Entry: <span className="font-medium">{pattern.breakoutLevel.toFixed(2)}</span></div>
                        <div>Target: <span className="font-medium text-green-600">{pattern.target?.toFixed(2)}</span></div>
                        <div>SL: <span className="font-medium text-red-600">{pattern.stopLoss.toFixed(2)}</span></div>
                        <div className="text-gray-600">Point A→B: {pattern.pointA.price.toFixed(2)} → {pattern.pointB.price.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              );
            })()}

            {/* Real-Time 1-Minute Data Tracking - BLOCK FOR COMPLETED TIMEFRAMES */}
            {(() => {
              const currentDate = new Date().toISOString().split('T')[0];
              const analysisDate = selectedDate;
              const isAnalyzingCurrentDate = analysisDate === currentDate;
              const sixthCandle = scannerState?.cycle2Status?.sixthCandleData;
              const isCompletedTimeframe = sixthCandle && isAnalyzingCurrentDate;
              
              // ENHANCED: Enable Cycle 3 even for completed timeframes with live data
              if (isCompletedTimeframe) {
                return (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                      🚀 CYCLE 3 ENABLED - CONTINUING WITH LIVE DATA
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      Pattern completed, now streaming live data for next timeframes. Auto-fetch active.
                    </div>
                  </div>
                );
              }
              
              return (
                <div className="space-y-3">
                  <div className="text-sm font-medium">Real-Time 1-Minute Data Validation</div>
                  
                  {/* Live Tracking Data Status */}
                  {dataAvailability && (
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded border border-blue-200 mb-4">
                      <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Live Tracking Data Status
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-xs mb-3">
                        <div className="text-center">
                          <div className="font-mono text-lg text-green-600 dark:text-green-400">
                            {dataAvailability.availableCandles}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Available</div>
                        </div>
                        <div className="text-center">
                          <div className="font-mono text-lg text-orange-600 dark:text-orange-400">
                            {dataAvailability.requiredUntilClose}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Needed</div>
                        </div>
                        <div className="text-center">
                          <div className="font-mono text-lg text-blue-600 dark:text-blue-400">
                            {dataAvailability.percentageComplete.toFixed(1)}%
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Complete</div>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${dataAvailability.percentageComplete}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>Market closes: {dataAvailability.estimatedMarketClose}</span>
                        <span className={`font-medium ${
                          dataAvailability.isLiveDataNeeded 
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {dataAvailability.isLiveDataNeeded ? '🔄 Live data needed' : '✅ Sufficient data'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Live Data Fetching Progress */}
                  {liveDataProgress?.isActive && (
                    <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded border border-orange-200 mb-4">
                      <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4 animate-spin" />
                        Fetching Live Data - 700ms Intervals
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-orange-700 dark:text-orange-300">
                            Progress: {liveDataProgress.currentCandle}/{liveDataProgress.totalCandles} candles
                          </span>
                          <span className="font-mono bg-orange-200 dark:bg-orange-800 px-2 py-1 rounded">
                            {liveDataProgress.progressPercent.toFixed(1)}%
                          </span>
                        </div>
                        
                        {/* Countdown Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-700 relative"
                            style={{ width: `${liveDataProgress.progressPercent}%` }}
                          >
                            <div className="absolute inset-0 bg-white bg-opacity-30 animate-pulse"></div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>Fetch speed: {liveDataProgress.fetchingSpeed.toFixed(1)} updates/min</span>
                          <span>ETA: {liveDataProgress.estimatedCompletion}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Incomplete Candle OHLC Tracking */}
                  {incompleteCandleStatus?.isActive && (
                    <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded border border-yellow-200 mb-4">
                      <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4 animate-pulse" />
                        {incompleteCandleStatus.candlePosition} Candle - Live OHLC Tracking ({incompleteCandleStatus.timeframeMinutes}min)
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3 text-xs mb-3">
                        <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                          <div className="font-semibold text-gray-600 dark:text-gray-400 mb-1">Open</div>
                          <div className="font-mono text-sm">{incompleteCandleStatus.currentOHLC.open.toFixed(2)}</div>
                        </div>
                        <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                          <div className="font-semibold text-green-600 dark:text-green-400 mb-1">High</div>
                          <div className="font-mono text-sm text-green-600 dark:text-green-400">{incompleteCandleStatus.currentOHLC.high.toFixed(2)}</div>
                        </div>
                        <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                          <div className="font-semibold text-red-600 dark:text-red-400 mb-1">Low</div>
                          <div className="font-mono text-sm text-red-600 dark:text-red-400">{incompleteCandleStatus.currentOHLC.low.toFixed(2)}</div>
                        </div>
                        <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                          <div className="font-semibold text-gray-600 dark:text-gray-400 mb-1">Close</div>
                          <div className="font-mono text-sm">{incompleteCandleStatus.currentOHLC.close.toFixed(2)}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-yellow-700 dark:text-yellow-300">
                            Completion: {incompleteCandleStatus.completionPercent.toFixed(1)}%
                          </span>
                          <span className="font-mono bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded">
                            {Math.floor(incompleteCandleStatus.remainingSeconds / 60)}:{(incompleteCandleStatus.remainingSeconds % 60).toString().padStart(2, '0')} remaining
                          </span>
                        </div>
                        
                        {/* Candle Completion Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-1000 relative"
                            style={{ width: `${incompleteCandleStatus.completionPercent}%` }}
                          >
                            <div className="absolute inset-0 bg-white bg-opacity-20 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Enhanced Streaming OHLC Display with Candle Count Bar */}
                  <div className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded border border-orange-200">
                    <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4 animate-pulse" />
                      Streaming OHLC Values (700ms auto-updates)
                      <button
                        onClick={streamingInterval ? stopStreamingOHLC : startStreamingOHLC}
                        className={`ml-auto px-2 py-1 text-xs rounded ${
                          streamingInterval 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {streamingInterval ? 'Stop' : 'Start'}
                      </button>
                    </div>
                    
                    {/* Candle Count Progress Bar */}
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-orange-700 dark:text-orange-300">
                          {scannerState?.currentTimeframe || 5}min Timeframe Progress
                        </span>
                        <span className="font-mono bg-orange-200 dark:bg-orange-800 px-2 py-1 rounded">
                          {currentTimeframeData.length}/6 candles
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full transition-all duration-500 relative"
                          style={{ width: `${Math.min(100, (currentTimeframeData.length / 6) * 100)}%` }}
                        >
                          <div className="absolute inset-0 bg-white bg-opacity-20 animate-pulse"></div>
                        </div>
                      </div>
                      
                      {/* Data Source & Status */}
                      <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                        <span>
                          📊 Data: {historicalData.length > (6 * (scannerState?.currentTimeframe || 5)) ? 'Historical' : 'Live Stream'}
                        </span>
                        <span>
                          Available: {historicalData.length} 1min candles
                        </span>
                        {streamingInterval && (
                          <span className="text-green-600 dark:text-green-400">
                            🟢 Streaming (700ms)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      {/* C1A Candle */}
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                        <div className="font-semibold text-blue-600 dark:text-blue-400 mb-1">C1A</div>
                        {streamingOHLC.c1a ? (
                          <div className="space-y-1">
                            <div className="flex justify-between"><span>O:</span><span className="font-mono">{streamingOHLC.c1a.open.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>H:</span><span className="font-mono text-green-600">{streamingOHLC.c1a.high.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>L:</span><span className="font-mono text-red-600">{streamingOHLC.c1a.low.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>C:</span><span className="font-mono">{streamingOHLC.c1a.close.toFixed(2)}</span></div>
                          </div>
                        ) : (
                          <div className="text-gray-400">Waiting...</div>
                        )}
                      </div>
                      
                      {/* C1B Candle */}
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                        <div className="font-semibold text-blue-600 dark:text-blue-400 mb-1">C1B</div>
                        {streamingOHLC.c1b ? (
                          <div className="space-y-1">
                            <div className="flex justify-between"><span>O:</span><span className="font-mono">{streamingOHLC.c1b.open.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>H:</span><span className="font-mono text-green-600">{streamingOHLC.c1b.high.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>L:</span><span className="font-mono text-red-600">{streamingOHLC.c1b.low.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>C:</span><span className="font-mono">{streamingOHLC.c1b.close.toFixed(2)}</span></div>
                          </div>
                        ) : (
                          <div className="text-gray-400">Waiting...</div>
                        )}
                      </div>
                      
                      {/* C2A Candle */}
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                        <div className="font-semibold text-purple-600 dark:text-purple-400 mb-1">C2A</div>
                        {streamingOHLC.c2a ? (
                          <div className="space-y-1">
                            <div className="flex justify-between"><span>O:</span><span className="font-mono">{streamingOHLC.c2a.open.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>H:</span><span className="font-mono text-green-600">{streamingOHLC.c2a.high.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>L:</span><span className="font-mono text-red-600">{streamingOHLC.c2a.low.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>C:</span><span className="font-mono">{streamingOHLC.c2a.close.toFixed(2)}</span></div>
                          </div>
                        ) : (
                          <div className="text-gray-400">Waiting...</div>
                        )}
                      </div>
                      
                      {/* C2B Candle */}
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                        <div className="font-semibold text-purple-600 dark:text-purple-400 mb-1">C2B</div>
                        {streamingOHLC.c2b ? (
                          <div className="space-y-1">
                            <div className="flex justify-between"><span>O:</span><span className="font-mono">{streamingOHLC.c2b.open.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>H:</span><span className="font-mono text-green-600">{streamingOHLC.c2b.high.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>L:</span><span className="font-mono text-red-600">{streamingOHLC.c2b.low.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>C:</span><span className="font-mono">{streamingOHLC.c2b.close.toFixed(2)}</span></div>
                          </div>
                        ) : (
                          <div className="text-gray-400">Waiting...</div>
                        )}
                      </div>
                      
                      {/* 5th Candle */}
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border border-green-300">
                        <div className="font-semibold text-green-600 dark:text-green-400 mb-1">5th Candle</div>
                        {streamingOHLC.fifth ? (
                          <div className="space-y-1">
                            <div className="flex justify-between"><span>O:</span><span className="font-mono">{streamingOHLC.fifth.open.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>H:</span><span className="font-mono text-green-600">{streamingOHLC.fifth.high.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>L:</span><span className="font-mono text-red-600">{streamingOHLC.fifth.low.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>C:</span><span className="font-mono">{streamingOHLC.fifth.close.toFixed(2)}</span></div>
                          </div>
                        ) : (
                          <div className="text-gray-400">Waiting...</div>
                        )}
                      </div>
                      
                      {/* 6th Candle */}
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border border-red-300">
                        <div className="font-semibold text-red-600 dark:text-red-400 mb-1">6th Candle</div>
                        {streamingOHLC.sixth ? (
                          <div className="space-y-1">
                            <div className="flex justify-between"><span>O:</span><span className="font-mono">{streamingOHLC.sixth.open.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>H:</span><span className="font-mono text-green-600">{streamingOHLC.sixth.high.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>L:</span><span className="font-mono text-red-600">{streamingOHLC.sixth.low.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>C:</span><span className="font-mono">{streamingOHLC.sixth.close.toFixed(2)}</span></div>
                          </div>
                        ) : (
                          <div className="text-gray-400">Waiting...</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      Auto-updating every 700ms • Keeps scanner running continuously
                    </div>
                  </div>
                  
                  {/* 1-Minute Data Status */}
                  {cycle3OneMinuteData.length > 0 && (
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200">
                  <div className="text-xs text-green-700 dark:text-green-300">
                    ✅ Tracking {cycle3OneMinuteData.length} one-minute candles for real-time validation
                    {scannerState && ` (${scannerState.currentTimeframe}min timeframe)`}
                  </div>
                </div>
              )}
              
              {/* ENHANCED: Live Candle Tracking - Show All Available Data */}
              <div className="space-y-3">
                {/* Real-Time Candle Count Display */}
                <div className="p-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                    📊 Live Streaming OHLC Data (700ms Updates)
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="text-center">
                      <div className="font-mono text-lg text-green-600 dark:text-green-400">
                        {cycle3OneMinuteData.length || historicalData.length}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">1-Min Candles</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono text-lg text-blue-600 dark:text-blue-400">
                        {currentTimeframeData.length}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">{scannerState?.currentTimeframe || 5}min Candles</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono text-lg text-orange-600 dark:text-orange-400">
                        {Math.min(6, currentTimeframeData.length)}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Displayed</div>
                    </div>
                  </div>
                </div>
                
                {/* 6 Candle Tracking Grid - ENHANCED: Show actual available candles */}
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((candleNum) => {
                    // ENHANCED FIX: Show actual available candles from current timeframe data
                    const timeframeCandle = currentTimeframeData[candleNum - 1];
                    const isAvailable = timeframeCandle != null;
                    
                    // Get the most recent 1-minute data for real-time updates
                    const latestOneMinData = cycle3OneMinuteData[cycle3OneMinuteData.length - 1] || historicalData[historicalData.length - 1];
                    
                    // Use timeframe candle data, but update with latest price if it's the current active candle
                    const isCurrentlyActiveCandle = candleNum === currentTimeframeData.length;
                    const candleData = isCurrentlyActiveCandle && latestOneMinData 
                      ? { ...timeframeCandle, close: latestOneMinData.close, high: Math.max(timeframeCandle?.high || 0, latestOneMinData.high), low: Math.min(timeframeCandle?.low || Infinity, latestOneMinData.low) }
                      : timeframeCandle;
                  
                    return (
                      <div 
                        key={candleNum} 
                      className={`p-2 rounded-lg border ${
                        !isAvailable 
                          ? 'bg-gray-50 dark:bg-gray-900/20 border-gray-200' 
                          : isCurrentlyActiveCandle 
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 ring-2 ring-yellow-400' 
                            : candleNum <= 4
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'
                              : 'bg-green-50 dark:bg-green-900/20 border-green-200'
                      }`}
                    >
                      <div className="text-xs font-medium mb-1">
                        {candleNum <= 4 ? `C${Math.ceil(candleNum/2)}${candleNum % 2 === 1 ? 'A' : 'B'}` : `${candleNum === 5 ? '5th' : '6th'} Candle`}
                        {isCurrentlyActiveCandle && ' (Live)'}
                      </div>
                      
                      {isAvailable && candleData ? (
                        <div className="space-y-1 text-xs">
                          <div className="grid grid-cols-2 gap-1">
                            <span>O:</span>
                            <span className="font-medium">{candleData.open?.toFixed(2)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <span>H:</span>
                            <span className="font-medium text-green-600">{candleData.high?.toFixed(2)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <span>L:</span>
                            <span className="font-medium text-red-600">{candleData.low?.toFixed(2)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <span>C:</span>
                            <span className="font-medium">{candleData.close?.toFixed(2)}</span>
                          </div>
                          
                          {/* Breakout Check for 5th/6th Candles with Exact Timing */}
                          {candleNum >= 5 && patternAnalysis && (
                            <div className="mt-2 pt-2 border-t">
                              {patternAnalysis.patterns.map((pattern: any, pIndex: number) => {
                                const isBreakout = pattern.type === 'UPTREND' 
                                  ? candleData.high > pattern.breakoutLevel 
                                  : candleData.low < pattern.breakoutLevel;
                                
                                // Find exact breakout time using cycle3 data
                                let candleBreakoutTime = null;
                                if (isBreakout && cycle3OneMinuteData.length > 0) {
                                  for (const oneMinCandle of cycle3OneMinuteData.slice(-20)) {
                                    const minuteBreakout = pattern.type === 'UPTREND' 
                                      ? oneMinCandle.high > pattern.breakoutLevel
                                      : oneMinCandle.low < pattern.breakoutLevel;
                                    
                                    if (minuteBreakout) {
                                      candleBreakoutTime = new Date(oneMinCandle.timestamp * 1000).toLocaleTimeString('en-US', {
                                        hour12: true,
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZone: 'Asia/Kolkata'
                                      });
                                      break;
                                    }
                                  }
                                }
                                
                                return (
                                  <div key={pIndex} className="mb-1">
                                    <div className={`text-xs font-medium ${pattern.type === 'UPTREND' ? 'text-green-600' : 'text-red-600'}`}>
                                      {pattern.type.slice(0,2)}:
                                    </div>
                                    <div className="text-xs">
                                      {isBreakout ? '🚀 BREAKOUT' : '⏳ Waiting'}
                                      {isBreakout && candleBreakoutTime && (
                                        <div className="text-indigo-600 font-medium mt-1">
                                          @ {candleBreakoutTime}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">
                          {candleNum <= currentTimeframeData.length + 1 ? 'Waiting for 1-min data...' : 'Pending timeframe'}
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              </div>

              {/* Real-Time Trade Status */}
              {patternAnalysis && currentTimeframeData.length >= 5 && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                    Real-Time Trade Status Validation
                  </div>
                  <div className="space-y-2">
                    {patternAnalysis.patterns.map((pattern: any, index: number) => {
                      // UPDATE 5TH CANDLE WITH LIVE PRICE
                      let currentCandle = currentTimeframeData[currentTimeframeData.length - 1];
                      
                      // If we have live price, update the 5th candle's high/low/close
                      if (livePrice && currentCandle) {
                        currentCandle = {
                          ...currentCandle,
                          high: Math.max(currentCandle.high, livePrice),
                          low: Math.min(currentCandle.low, livePrice),
                          close: livePrice
                        };
                        console.log(`🔄 5TH CANDLE UPDATED: High=${currentCandle.high}, Low=${currentCandle.low}, Close=${livePrice}`);
                      }
                      
                      // CYCLE 3 CRITICAL LOGIC: Check exact breakout timing against Point B level
                      const isBreakout = pattern.type === 'UPTREND' 
                        ? currentCandle?.high > pattern.breakoutLevel
                        : currentCandle?.low < pattern.breakoutLevel;
                        
                      // CYCLE 3 BREAKOUT VALIDATION: Monitor 1-minute precision for exact timing
                      let exactBreakoutTime = null;
                      let exactBreakoutMinute = null;
                      
                      if (isBreakout && cycle3OneMinuteData.length > 0) {
                        console.log(`🎯 CYCLE 3 BREAKOUT MONITORING: Scanning 1-minute data for exact ${pattern.type} breakout`);
                        console.log(`   Pattern Breakout Level: ${pattern.breakoutLevel}`);
                        console.log(`   5th Candle Range: H:${currentCandle?.high} L:${currentCandle?.low}`);
                        
                        // CRITICAL VERIFICATION: Find exact minute when price crossed breakout level
                        // This must scan ONLY the 5th candle period (current timeframe duration)
                        const currentTimeframe = scannerState?.currentTimeframe || 5;
                        const fifthCandleStart = currentCandle?.timestamp || 0;
                        const fifthCandleEnd = fifthCandleStart + (currentTimeframe * 60);
                        
                        console.log(`🔍 BREAKOUT VERIFICATION: Scanning 5th candle period only`);
                        console.log(`   5th Candle Period: ${new Date(fifthCandleStart * 1000).toLocaleTimeString()} - ${new Date(fifthCandleEnd * 1000).toLocaleTimeString()}`);
                        console.log(`   Timeframe: ${currentTimeframe} minutes`);
                        
                        // Filter 1-minute data to ONLY the 5th candle period
                        const fifthCandleMinutes = cycle3OneMinuteData.filter(minute => 
                          minute.timestamp >= fifthCandleStart && minute.timestamp < fifthCandleEnd
                        );
                        
                        console.log(`   Found ${fifthCandleMinutes.length} 1-minute candles in 5th candle period`);
                        
                        // Find the exact minute when price crossed the breakout level
                        for (let i = 0; i < fifthCandleMinutes.length; i++) {
                          const minute = fifthCandleMinutes[i];
                          
                          // Check if THIS minute broke the level
                          const thisMinuteBreakout = pattern.type === 'UPTREND' 
                            ? minute.high > pattern.breakoutLevel
                            : minute.low < pattern.breakoutLevel;
                            
                          if (thisMinuteBreakout) {
                            exactBreakoutTime = minute.timestamp;
                            exactBreakoutMinute = i + 1; // 1-indexed within 5th candle
                            
                            console.log(`🚀 EXACT BREAKOUT DETECTED in minute ${exactBreakoutMinute} of 5th candle:`);
                            console.log(`   Real Timestamp: ${exactBreakoutTime}`);
                            console.log(`   Real Time: ${new Date(exactBreakoutTime * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
                            console.log(`   Real Minute OHLC: O:${minute.open} H:${minute.high} L:${minute.low} C:${minute.close}`);
                            console.log(`   Real Breakout Price: ${pattern.type === 'UPTREND' ? minute.high : minute.low}`);
                            console.log(`   Breakout Level: ${pattern.breakoutLevel}`);
                            break;
                          }
                        }
                        
                        if (!exactBreakoutTime) {
                          console.log(`❌ NO EXACT BREAKOUT FOUND despite 5th candle showing breakout`);
                          console.log(`   This suggests timing mismatch between candle aggregation and 1-minute data`);
                        }
                      }
                      
                      // DEBUG: Log pattern and breakout info
                      console.log(`🎯 PATTERN ${index + 1}:`, {
                        type: pattern.type,
                        breakoutLevel: pattern.breakoutLevel,
                        currentHigh: currentCandle?.high,
                        currentLow: currentCandle?.low,
                        isBreakout,
                        livePrice,
                        livePriceAvailable: !!livePrice,
                        candleUpdatedWithLive: !!(livePrice && currentCandle)
                      });
                      
                      // CYCLE 3 BREAKOUT TIME DISPLAY: Use exact timing from 1-minute monitoring
                      let breakoutTime = null;
                      let breakoutPrice = null;
                      
                      if (isBreakout) {
                        if (exactBreakoutTime) {
                          // Use the EXACT 1-minute breakout timing from Cycle 3 monitoring
                          const breakoutDate = new Date(exactBreakoutTime * 1000);
                          
                          breakoutTime = breakoutDate.toLocaleTimeString('en-IN', {
                            hour12: true,
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            timeZone: 'Asia/Kolkata'
                          });
                          
                          // STOP LIMIT ORDER: Use exact breakout level as BOTH trigger and execution price
                          // Never use actual market breakout price - use predetermined level
                          breakoutPrice = pattern.breakoutLevel; // Fixed level for stop limit order
                          
                          console.log(`✅ CYCLE 3 EXACT BREAKOUT TIME: ${breakoutTime} @ ${breakoutPrice} (minute ${exactBreakoutMinute})`);
                        } else {
                          // Fallback: Use 5th candle completion time if exact timing not found
                          console.log(`⚠️ Using 5th candle completion time as fallback`);
                          if (currentCandle && currentCandle.timestamp) {
                            const fifthCandleEndTime = currentCandle.timestamp + (scannerState?.currentTimeframe || 5) * 60;
                            const breakoutDate = new Date(fifthCandleEndTime * 1000);
                            
                            breakoutTime = breakoutDate.toLocaleTimeString('en-IN', {
                              hour12: true,
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              timeZone: 'Asia/Kolkata'
                            });
                            
                            // CRITICAL: Use EXACT breakout level for stop limit order - NOT actual breakout price
                            // Stop Limit Order: Trigger at exact breakout level, execution at same level
                            breakoutPrice = pattern.breakoutLevel; // EXACT LEVEL for stop limit order
                              
                            console.log(`⏰ FALLBACK BREAKOUT TIME: ${breakoutTime} @ ${breakoutPrice} (5th candle end)`);
                          }
                        }
                      }
                      
                      let tradeStatus = 'NO TRADE';
                      let pnl = 0;
                      let exitPrice = 0;
                      let exitReason = 'No breakout detected';
                      
                      if (isBreakout) {
                        // CRITICAL FIX: Check if this is a completed historical pattern
                        const currentDate = new Date().toISOString().split('T')[0];
                        const isHistoricalDate = selectedDate !== currentDate;
                        
                        if (isHistoricalDate && currentTimeframeData.length >= 6) {
                          // Historical patterns: Close at 6th candle completion
                          const sixthCandle = currentTimeframeData[5]; // 6th candle (0-indexed)
                          const finalPrice = sixthCandle?.close || currentCandle?.close || 0;
                          
                          // Check final outcome at 6th candle close
                          const targetHit = pattern.type === 'UPTREND' 
                            ? finalPrice >= (pattern.target || 0)
                            : finalPrice <= (pattern.target || 0);
                          
                          const slHit = pattern.type === 'UPTREND'
                            ? finalPrice <= pattern.stopLoss
                            : finalPrice >= pattern.stopLoss;
                          
                          if (targetHit) {
                            tradeStatus = 'PROFIT';
                            exitPrice = pattern.target || finalPrice;
                            exitReason = 'Target reached - Historical completed';
                            pnl = pattern.type === 'UPTREND' 
                              ? (pattern.target || finalPrice) - pattern.breakoutLevel
                              : pattern.breakoutLevel - (pattern.target || finalPrice);
                          } else if (slHit) {
                            tradeStatus = 'LOSS';
                            exitPrice = pattern.stopLoss;
                            exitReason = 'Stop loss hit - Historical completed';
                            pnl = pattern.type === 'UPTREND'
                              ? pattern.stopLoss - pattern.breakoutLevel
                              : pattern.breakoutLevel - pattern.stopLoss;
                          } else {
                            tradeStatus = 'CLOSED';
                            exitPrice = finalPrice;
                            exitReason = 'Historical pattern closed at 6th candle';
                            pnl = pattern.type === 'UPTREND'
                              ? finalPrice - pattern.breakoutLevel
                              : pattern.breakoutLevel - finalPrice;
                          }
                        } else {
                          // Live patterns: Check current candle for target/SL
                          const targetHit = pattern.type === 'UPTREND' 
                            ? currentCandle?.high >= (pattern.target || 0)
                            : currentCandle?.low <= (pattern.target || 0);
                          
                          const slHit = pattern.type === 'UPTREND'
                            ? currentCandle?.low <= pattern.stopLoss
                            : currentCandle?.high >= pattern.stopLoss;
                          
                          if (targetHit) {
                            tradeStatus = 'PROFIT';
                            exitPrice = pattern.target || 0;
                            exitReason = 'Target reached';
                            pnl = pattern.type === 'UPTREND' 
                              ? (pattern.target || 0) - pattern.breakoutLevel
                              : pattern.breakoutLevel - (pattern.target || 0);
                          } else if (slHit) {
                            tradeStatus = 'LOSS';
                            exitPrice = pattern.stopLoss;
                            exitReason = 'Stop loss hit';
                            pnl = pattern.type === 'UPTREND'
                              ? pattern.stopLoss - pattern.breakoutLevel
                              : pattern.breakoutLevel - pattern.stopLoss;
                          } else {
                            tradeStatus = 'OPEN';
                            exitReason = 'Trade in progress (5th candle close)';
                            // P&L based on 5th candle close price vs breakout entry level
                            pnl = pattern.type === 'UPTREND'
                              ? (currentCandle?.close || 0) - pattern.breakoutLevel
                              : pattern.breakoutLevel - (currentCandle?.close || 0);
                          }
                        }
                      }
                      
                      return (
                        <div key={index} className="p-2 bg-white dark:bg-gray-800 rounded">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-xs font-medium ${pattern.type === 'UPTREND' ? 'text-green-600' : 'text-red-600'}`}>
                              {pattern.type}
                            </span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              tradeStatus === 'PROFIT' ? 'bg-green-100 text-green-700' :
                              tradeStatus === 'LOSS' ? 'bg-red-100 text-red-700' :
                              tradeStatus === 'OPEN' ? 'bg-yellow-100 text-yellow-700' :
                              tradeStatus === 'CLOSED' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {tradeStatus}
                            </span>
                          </div>
                          <div className="text-xs space-y-1">
                            <div>Entry: {pattern.breakoutLevel.toFixed(2)} | Current: {livePrice ? livePrice.toFixed(2) : currentCandle?.close?.toFixed(2)} {livePrice ? <span className="text-green-500 text-xs ml-1 animate-pulse">LIVE 700ms</span> : <span className="text-blue-500 text-xs ml-1">5th Close</span>}</div>
                            <div className="text-xs text-gray-500">5th Candle: O:{currentCandle?.open?.toFixed(2)} H:{currentCandle?.high?.toFixed(2)} L:{currentCandle?.low?.toFixed(2)} C:{currentCandle?.close?.toFixed(2)}</div>
                            {isBreakout && breakoutTime && (
                              <div className="text-indigo-600 font-medium">
                                🚀 Breakout at: {breakoutTime} @ {breakoutPrice?.toFixed(2)}
                              </div>
                            )}
                            <div>P&L: <span className={((() => {
                              // LIVE P&L: Use live price for any breakout pattern
                              if (livePrice && isBreakout) {
                                console.log(`🔥 LIVE P&L CALC: Live=${livePrice}, Entry=${pattern.breakoutLevel}, Type=${pattern.type}`);
                                const livePnL = pattern.type === 'UPTREND' 
                                  ? livePrice - pattern.breakoutLevel
                                  : pattern.breakoutLevel - livePrice;
                                return livePnL >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold';
                              }
                              return pnl >= 0 ? 'text-green-600' : 'text-red-600';
                            })())}>{(() => {
                              // LIVE P&L DISPLAY: Show live P&L for any breakout trade
                              if (livePrice && isBreakout) {
                                const livePnL = pattern.type === 'UPTREND' 
                                  ? livePrice - pattern.breakoutLevel
                                  : pattern.breakoutLevel - livePrice;
                                console.log(`💰 DISPLAYING LIVE P&L: ${livePnL.toFixed(2)} (${pattern.type})`);
                                return `${livePnL >= 0 ? '+' : ''}${livePnL.toFixed(2)}`;
                              }
                              return `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`;
                            })()}</span> {livePrice && isBreakout && <span className="text-blue-500 text-xs ml-1 animate-pulse">LIVE 700ms 🔴</span>}</div>
                            <div className="text-gray-600">{exitReason}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
                </div>
              );
            })()}

            {/* 6th Candle Completion Status */}
            <div className={`p-3 rounded-lg ${
              currentTimeframeData.length >= 6 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : 'bg-yellow-50 dark:bg-yellow-900/20'
            }`}>
              <div className="text-sm font-medium mb-2">
                {currentTimeframeData.length >= 6 
                  ? '✅ 6th Candle Complete - Ready for Timeframe Transition' 
                  : `⏳ Tracking Real Data: ${currentTimeframeData.length}/6 candles completed`
                }
              </div>
              <div className="text-xs text-gray-600">
                {currentTimeframeData.length >= 6
                  ? 'All 6 candles analyzed against Cycle 2 patterns. System ready to progress to next timeframe.'
                  : `Waiting for ${6 - currentTimeframeData.length} more 1-minute candles to complete validation.`
                }
              </div>
              
              {/* Progress Bar */}
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentTimeframeData.length >= 6 ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min((currentTimeframeData.length / 6) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {currentTimeframeData.length}/6 candles ({Math.min((currentTimeframeData.length / 6) * 100, 100).toFixed(1)}%)
                </div>
              </div>
            </div>

            {/* Transition Button */}
            {currentTimeframeData.length >= 6 && (
              <Button 
                onClick={moveToTimeframeTransition}
                className="w-full"
                variant="default"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Progress to Next Timeframe ({(scannerState?.currentTimeframe || 5) * 2}min)
              </Button>
            )}

            {/* Validation Rules */}
            <div className="text-xs text-gray-600 space-y-1">
              <div className="font-medium">Validation Rules:</div>
              <div>• Track 6 candles of real 1-minute data</div>
              <div>• Compare 5th/6th candle against Cycle 2 breakout levels</div>
              <div>• Show PROFIT if target reached, LOSS if SL hit</div>
              <div>• Show NO TRADE if breakout level not broken</div>
              <div>• Wait for 6th candle close before timeframe transition</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trade Results Summary - Show when scanner is active OR has trades */}
      {(simulationTrades.length > 0 || scannerState) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Simulation Results Summary
            </CardTitle>
            <CardDescription>
              Live trade simulations showing which candle breakout occurred and P&L results ({simulationTrades.length} trades executed)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Trade Summary Statistics */}
            {simulationTrades.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Total Trades</div>
                    <div className="font-bold text-lg">{simulationTrades.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Profitable Trades</div>
                    <div className="font-bold text-lg text-green-600">
                      {simulationTrades.filter(t => t.profitLoss > 0).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Loss Trades</div>
                    <div className="font-bold text-lg text-red-600">
                      {simulationTrades.filter(t => t.profitLoss < 0).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Win Rate</div>
                    <div className="font-bold text-lg text-blue-600">
                      {simulationTrades.length > 0 ? 
                        ((simulationTrades.filter(t => t.profitLoss > 0).length / simulationTrades.length) * 100).toFixed(1) : '0'}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Total P&L</div>
                    <div className={`font-bold text-lg ${
                      simulationTrades.reduce((sum, t) => sum + t.profitLoss, 0) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {simulationTrades.reduce((sum, t) => sum + t.profitLoss, 0) > 0 ? '+' : ''}{simulationTrades.reduce((sum, t) => sum + t.profitLoss, 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Cycle 3 Timing Summary */}
                {cycle3OneMinuteData.length > 0 && patternAnalysis && (
                  <div className="mt-4 pt-3 border-t border-blue-200">
                    <div className="text-sm font-medium text-blue-700 mb-2">Cycle 3 Real-Time Validation Summary</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">1-Min Candles Tracked</div>
                        <div className="font-bold text-indigo-600">{cycle3OneMinuteData.length}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Patterns Validated</div>
                        <div className="font-bold text-indigo-600">{patternAnalysis.patterns?.length || 0}</div>
                      </div>
                      {/* Show breakout times if detected */}
                      {(() => {
                        const currentCandle = currentTimeframeData[currentTimeframeData.length - 1];
                        const breakoutTimes = patternAnalysis.patterns?.map((pattern: any) => {
                          const isBreakout = pattern.type === 'UPTREND' 
                            ? currentCandle?.high > pattern.breakoutLevel
                            : currentCandle?.low < pattern.breakoutLevel;
                          
                          if (isBreakout && cycle3OneMinuteData.length > 0) {
                            for (const oneMinCandle of cycle3OneMinuteData) {
                              const minuteBreakout = pattern.type === 'UPTREND' 
                                ? oneMinCandle.high > pattern.breakoutLevel
                                : oneMinCandle.low < pattern.breakoutLevel;
                              
                              if (minuteBreakout) {
                                return {
                                  type: pattern.type,
                                  time: new Date(oneMinCandle.timestamp * 1000).toLocaleTimeString('en-US', {
                                    hour12: true,
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'Asia/Kolkata'
                                  })
                                };
                              }
                            }
                          }
                          return null;
                        })?.filter(Boolean) || [];

                        return breakoutTimes.length > 0 && (
                          <div>
                            <div className="text-gray-500">Breakout Times</div>
                            <div className="space-y-1">
                              {breakoutTimes.map((breakout: any, index: number) => (
                                <div key={index} className="text-xs font-medium text-indigo-600">
                                  {breakout.type.slice(0,2)}: {breakout.time}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Scrollable Trade List */}
            <div className="max-h-96 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {simulationTrades.map((trade, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${
                  trade.profitLoss && trade.profitLoss > 0 ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 
                  trade.profitLoss && trade.profitLoss < 0 ? 'border-red-200 bg-red-50 dark:bg-red-900/20' : 
                  'border-gray-200 bg-gray-50 dark:bg-gray-900/20'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.direction === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.direction}
                      </div>
                      <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {trade.timeframe}min
                      </div>
                      {trade.breakoutCandlePosition && (
                        <div className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                          {trade.breakoutCandlePosition} Candle Breakout
                        </div>
                      )}
                    </div>
                    <div className={`font-bold text-lg ${
                      (() => {
                        // LIVE P&L FIX: Use live price for active trades
                        if (scannerState && livePrice && trade.entryPrice) {
                          const livePL = trade.direction === 'SELL' 
                            ? (trade.entryPrice - livePrice) * 100  // DOWNTREND/SELL
                            : (livePrice - trade.entryPrice) * 100; // UPTREND/BUY
                          return livePL > 0 ? 'text-green-600' : livePL < 0 ? 'text-red-600' : 'text-gray-600';
                        }
                        return (trade.profitLoss || 0) > 0 ? 'text-green-600' : 
                               (trade.profitLoss || 0) < 0 ? 'text-red-600' : 'text-gray-600';
                      })()
                    }`}>
                      {(() => {
                        // LIVE P&L FIX: Display live P&L for active trades
                        if (scannerState && livePrice && trade.entryPrice) {
                          const livePL = trade.direction === 'SELL' 
                            ? (trade.entryPrice - livePrice) * 100  // DOWNTREND/SELL
                            : (livePrice - trade.entryPrice) * 100; // UPTREND/BUY
                          return `${livePL > 0 ? '+' : ''}${livePL.toFixed(2)} LIVE`;
                        }
                        return `${(trade.profitLoss || 0) > 0 ? '+' : ''}${(trade.profitLoss || 0).toFixed(2)}`;
                      })()}
                    </div>
                  </div>
                  
                  {/* Trade Date and Timing Information */}
                  <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div>
                        <span className="text-gray-500">Date: </span>
                        <span className="font-medium">{trade.date || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Entry Time: </span>
                        <span className="font-medium">{trade.breakoutTime || trade.entryTime || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Exit Time: </span>
                        <span className="font-medium">{trade.exitTime || 'N/A'}</span>
                      </div>
                      {/* Cycle 3 Breakout Time - Extract from 1-minute data if available */}
                      {(() => {
                        if (cycle3OneMinuteData.length > 0 && patternAnalysis) {
                          // Find the pattern that matches this trade
                          const matchingPattern = patternAnalysis.patterns?.find((pattern: any) => 
                            (trade.direction === 'BUY' && pattern.type === 'UPTREND') ||
                            (trade.direction === 'SELL' && pattern.type === 'DOWNTREND')
                          );
                          
                          if (matchingPattern) {
                            // Find exact breakout time from 1-minute data
                            for (const oneMinCandle of cycle3OneMinuteData) {
                              const minuteBreakout = matchingPattern.type === 'UPTREND' 
                                ? oneMinCandle.high > matchingPattern.breakoutLevel
                                : oneMinCandle.low < matchingPattern.breakoutLevel;
                              
                              if (minuteBreakout) {
                                const breakoutTime = new Date(oneMinCandle.timestamp * 1000).toLocaleTimeString('en-US', {
                                  hour12: true,
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  timeZone: 'Asia/Kolkata'
                                });
                                
                                return (
                                  <div>
                                    <span className="text-gray-500">C3 Breakout: </span>
                                    <span className="font-medium text-indigo-600">{breakoutTime}</span>
                                  </div>
                                );
                              }
                            }
                          }
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  
                  {/* Trade Price Information */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500">Entry Price</div>
                      <div className="font-medium">{trade.entryPrice ? trade.entryPrice.toFixed(2) : 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Exit Price</div>
                      <div className="font-medium">{trade.exitPrice ? trade.exitPrice.toFixed(2) : 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Stop Loss</div>
                      <div className="font-medium">{trade.stopLoss ? trade.stopLoss.toFixed(2) : 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Exit Reason</div>
                      <div className="font-medium text-xs">{trade.exitReason || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pattern Records Tab */}
      {allPatternRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Pattern Records - All Timeframes
            </CardTitle>
            <CardDescription>
              All detected patterns across timeframes with Point A/B analysis and breakout triggers ({allPatternRecords.length} total patterns)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {allPatternRecords.map((pattern: any, index: number) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${
                  pattern.type === 'UPTREND' ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <div className={`font-semibold text-lg ${pattern.type === 'UPTREND' ? 'text-green-700' : 'text-red-700'}`}>
                      {pattern.patternName} ({pattern.timeframe}min)
                    </div>
                    <div className="flex gap-2">
                      <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {pattern.timeframe}min
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        pattern.type === 'UPTREND' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {pattern.type}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {/* Point Analysis */}
                    <div>
                      <div className="font-medium mb-2">Point Analysis</div>
                      <div className="space-y-1">
                        <div>Point A: {pattern.pointA?.exactTime || 'N/A'} @ {pattern.pointA?.price || 'N/A'}</div>
                        <div>Point B: {pattern.pointB?.exactTime || 'N/A'} @ {pattern.pointB?.price || 'N/A'}</div>
                        <div>Duration: {pattern.duration?.toFixed(1) || 'N/A'} min</div>
                        <div>Slope: {pattern.slope?.toFixed(4) || 'N/A'} pts/min</div>
                      </div>
                    </div>
                    
                    {/* Levels */}
                    <div>
                      <div className="font-medium mb-2">Trading Levels</div>
                      <div className="space-y-1">
                        <div>Breakout: {pattern.breakoutLevel?.toFixed(2) || 'N/A'}</div>
                        <div>Stop Loss: {pattern.stopLoss?.toFixed(2) || 'N/A'}</div>
                        <div>Risk/Reward: {pattern.breakoutLevel && pattern.stopLoss ? ((pattern.breakoutLevel - pattern.stopLoss) / Math.abs(pattern.breakoutLevel - pattern.stopLoss)).toFixed(2) : 'N/A'}</div>
                      </div>
                    </div>
                    
                    {/* Breakout Details */}
                    <div>
                      <div className="font-medium mb-2">Breakout Info</div>
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="font-medium">Trigger:</span> 5th/6th Candle
                        </div>
                        <div className="text-xs text-gray-600">
                          Break {pattern.type === 'UPTREND' ? 'above' : 'below'} {pattern.breakoutLevel?.toFixed(2) || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600">
                          Wait {pattern.trigger?.timing34Percent?.toFixed(1) || 'N/A'}min (34% rule)
                        </div>
                      </div>
                    </div>
                    
                    {/* Timing Rules & Candle Triggers */}
                    <div>
                      <div className="font-medium mb-2">Timing Rules</div>
                      <div className="space-y-1">
                        <div>Wait: {pattern.timingRules?.waitFor34Percent?.toFixed(1) || 'N/A'} min</div>
                        <div>Trigger: {pattern.trigger?.type || 'N/A'}</div>
                        <div className="text-xs text-gray-600">{pattern.trigger?.description || 'Standard breakout trigger'}</div>
                      </div>
                      
                      {/* 5th/6th Candle Trigger Times */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="font-medium mb-2 text-sm text-indigo-600">🕐 Candle Trigger Times</div>
                        <div className="space-y-1">
                          {(() => {
                            if (pattern.entryCandle?.timestamp && pattern.timeframe) {
                              const entryTime = new Date(pattern.entryCandle.timestamp * 1000);
                              const fifthCandleStart = new Date(entryTime.getTime() + (pattern.timeframe * 4 * 60 * 1000));
                              const sixthCandleStart = new Date(entryTime.getTime() + (pattern.timeframe * 5 * 60 * 1000));
                              const sixthCandleEnd = new Date(entryTime.getTime() + (pattern.timeframe * 6 * 60 * 1000));
                              
                              return (
                                <>
                                  <div className="text-xs flex justify-between">
                                    <span className="text-yellow-600 font-medium">5th Candle:</span> 
                                    <span>{fifthCandleStart.toLocaleTimeString('en-US', {
                                      hour12: true, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
                                    })}</span>
                                  </div>
                                  <div className="text-xs flex justify-between">
                                    <span className="text-green-600 font-medium">6th Candle:</span> 
                                    <span>{sixthCandleStart.toLocaleTimeString('en-US', {
                                      hour12: true, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
                                    })} - {sixthCandleEnd.toLocaleTimeString('en-US', {
                                      hour12: true, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
                                    })}</span>
                                  </div>
                                  {pattern.exactBreakoutTime && (
                                    <div className="text-xs flex justify-between">
                                      <span className="text-orange-600 font-medium">🚀 Breakout:</span> 
                                      <span className="font-bold">{pattern.exactBreakoutTime}</span>
                                    </div>
                                  )}
                                </>
                              );
                            }
                            return (
                              <div className="text-xs text-gray-500">
                                Trigger timing calculation requires entry candle data
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              

            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanner Timeline */}
      {scannerState && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Scanner Timeline & Results
            </CardTitle>
            <CardDescription>
              Live timeline showing scanner progression from market open to close
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm font-medium">Session Progress:</div>
              <div className="space-y-2">
                <div className={`flex justify-between items-center p-2 rounded ${
                  cycleInfo.cycle === 1 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-900'
                }`}>
                  <span className="text-sm">
                    {scannerState.currentTimeframe}min - Data Gathering Phase
                  </span>
                  <span className={`text-xs ${cycleInfo.cycle === 1 ? 'text-blue-500' : 'text-gray-500'}`}>
                    {cycleInfo.cycle === 1 ? 'Active' : 'Complete'}
                  </span>
                </div>
                <div className={`flex justify-between items-center p-2 rounded ${
                  cycleInfo.cycle === 2 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'
                } ${cycleInfo.cycle < 2 ? 'opacity-50' : ''}`}>
                  <span className="text-sm">
                    {scannerState.currentTimeframe}min - Analysis Phase
                  </span>
                  <span className={`text-xs ${cycleInfo.cycle === 2 ? 'text-green-500' : 'text-gray-500'}`}>
                    {cycleInfo.cycle === 2 ? 'Active' : cycleInfo.cycle > 2 ? 'Complete' : 'Pending'}
                  </span>
                </div>
                <div className={`flex justify-between items-center p-2 rounded ${
                  cycleInfo.cycle === 3 ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-gray-100 dark:bg-gray-800'
                } ${cycleInfo.cycle < 3 ? 'opacity-50' : ''}`}>
                  <span className="text-sm">
                    Transition to {(scannerState.currentTimeframe || 5) * 2}min
                  </span>
                  <span className={`text-xs ${cycleInfo.cycle === 3 ? 'text-purple-500' : 'text-gray-500'}`}>
                    {cycleInfo.cycle === 3 ? 'Active' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5th Candle Pattern Record Window */}
      <FifthCandlePatternRecord 
        symbol={selectedSymbol}
        date={getCurrentScanDate()}
        patternAnalysis={patternAnalysis}
        fifthCandleData={fifthCandleData}
        currentTimeframe={scannerState?.currentTimeframe}
      />

      {/* Deep Pattern Analysis removed - ready for new implementation */}
    </div>
  );
}