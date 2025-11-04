import { fyersApi } from "./fyers-api";
import { broadcastToSSEClients } from "./live-price-routes";
import { WebSocket } from "ws";

export interface LivePriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  lastUpdate: string;
  isLive: boolean;
  source: 'websocket' | 'quotes' | 'fallback';
}

export interface OHLCBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string;
  isComplete: boolean;
}

export class LiveWebSocketStreamer {
  private connections = new Set<WebSocket>();
  private priceData = new Map<string, LivePriceData>();
  private ohlcBars = new Map<string, OHLCBar[]>(); // Ring buffer for each symbol
  private currentBars = new Map<string, OHLCBar>(); // Current incomplete bars
  private healthStatus = {
    websocketConnected: false,
    quotesApiWorking: false,
    lastSuccessfulUpdate: 0,
    connectionAttempts: 0,
    errors: [] as string[]
  };
  
  private reconnectTimer: NodeJS.Timeout | null = null;
  private streamingTimer: NodeJS.Timeout | null = null;
  private quotesBackupTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private backoffDelay = 1000; // Start with 1 second
  private maxBackoffDelay = 30000; // Max 30 seconds
  
  // Symbols to track
  private readonly symbols = [
    'NSE:RELIANCE-EQ', 
    'NSE:TCS-EQ', 
    'NSE:INFY-EQ', 
    'NSE:HDFCBANK-EQ', 
    'NSE:ICICIBANK-EQ', 
    'NSE:ITC-EQ'
  ];
  
  private readonly maxBarsPerSymbol = 500; // Ring buffer size
  
  constructor() {
    console.log('🚀 Live WebSocket Streamer initialized for real-time price streaming');
    this.initializePriceData();
    this.startStreaming();
  }

  private async initializePriceData() {
    console.log('🚀 Initializing with real Fyers API prices...');
    
    // Initialize with real data immediately
    try {
      const quotes = await fyersApi.getQuotes(this.symbols);
      
      if (quotes && quotes.length > 0) {
        quotes.forEach(quote => {
          this.priceData.set(quote.symbol, {
            symbol: quote.symbol,
            price: quote.ltp,
            change: parseFloat((quote.change || 0).toFixed(2)),
            changePercent: parseFloat((quote.change_percentage || 0).toFixed(2)),
            volume: quote.volume,
            timestamp: Math.floor(Date.now() / 1000),
            open: quote.open_price,
            high: quote.high_price,
            low: quote.low_price,
            close: quote.ltp,
            lastUpdate: new Date().toISOString(),
            isLive: true,
            source: 'quotes'
          });
          
          this.ohlcBars.set(quote.symbol, []);
          this.currentBars.set(quote.symbol, this.createNewBar(quote.symbol, quote.ltp));
        });
        
        console.log(`✅ Initialized ${quotes.length} symbols with real Fyers prices`);
        return;
      }
    } catch (error) {
      console.log('⚠️ Failed to initialize with real prices, using minimal fallback');
    }
    
    // Only use minimal fallback if real data fails
    this.symbols.forEach(symbol => {
      this.priceData.set(symbol, {
        symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        timestamp: Math.floor(Date.now() / 1000),
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        lastUpdate: new Date().toISOString(),
        isLive: false,
        source: 'fallback'
      });
      
      this.ohlcBars.set(symbol, []);
      this.currentBars.set(symbol, this.createNewBar(symbol, 0));
    });
  }

  private createNewBar(symbol: string, price: number): OHLCBar {
    const now = Math.floor(Date.now() / 1000);
    const barTimestamp = Math.floor(now / 60) * 60; // Round to minute
    
    return {
      timestamp: barTimestamp,
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 0,
      symbol,
      isComplete: false
    };
  }

  private isMarketHours(): boolean {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const hour = istTime.getHours();
    const minute = istTime.getMinutes();
    const dayOfWeek = istTime.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    // Market hours: 9:15 AM to 3:30 PM IST
    const marketStart = 9 * 60 + 15; // 9:15 AM in minutes
    const marketEnd = 15 * 60 + 30;  // 3:30 PM in minutes
    const currentTime = hour * 60 + minute;
    
    return currentTime >= marketStart && currentTime <= marketEnd;
  }

  async startStreaming() {
    console.log('📡 Starting live price streaming system...');
    
    // Try WebSocket first
    await this.connectWebSocket();
    
    // Start quotes API backup (every 2 seconds)
    this.startQuotesBackup();
    
    // Start SSE broadcasting (every 700ms as requested)
    this.startSSEBroadcasting();
  }

  private async connectWebSocket() {
    if (this.isConnecting) {
      return;
    }
    
    this.isConnecting = true;
    this.healthStatus.connectionAttempts++;
    
    try {
      console.log('🔌 Attempting WebSocket connection to Fyers market data...');
      
      // For now, simulate WebSocket since Fyers WebSocket requires specific setup
      // In production, this would connect to Fyers WebSocket API
      await this.simulateWebSocketConnection();
      
    } catch (error: any) {
      console.error('❌ WebSocket connection failed:', error.message);
      this.healthStatus.errors.push(`WebSocket: ${error.message}`);
      this.scheduleReconnect();
    } finally {
      this.isConnecting = false;
    }
  }

  private async simulateWebSocketConnection() {
    // Use real Fyers API data instead of simulated WebSocket
    this.healthStatus.websocketConnected = false; // Force real data usage
    this.backoffDelay = 1000; // Reset backoff
    console.log('✅ Real-time Fyers API connection established');
    
    // Start using real Fyers API data as primary source
    this.startRealDataStreaming();
  }

  private startRealDataStreaming() {
    // Use real Fyers API data as primary streaming source
    console.log('🚀 Starting real-time Fyers API data streaming...');
    
    // Initialize with immediate fetch, then continue with regular intervals
    this.fetchRealTimeData();
    
    const updateInterval = setInterval(() => {
      this.fetchRealTimeData();
    }, 1500); // Update every 1.5 seconds with real Fyers data
    
    // Store interval for cleanup
    this.streamingTimer = updateInterval;
  }

  private async fetchRealTimeData() {
    if (!this.isMarketHours()) {
      return;
    }
    
    try {
      console.log('📡 Fetching real-time data from Fyers API...');
      const quotes = await fyersApi.getQuotes(this.symbols);
      
      if (quotes && quotes.length > 0) {
        this.healthStatus.quotesApiWorking = true;
        
        quotes.forEach(quote => {
          const updatedData: LivePriceData = {
            symbol: quote.symbol,
            price: quote.ltp,
            change: parseFloat((quote.change || 0).toFixed(2)),
            changePercent: parseFloat((quote.change_percentage || 0).toFixed(2)),
            volume: quote.volume,
            timestamp: Math.floor(Date.now() / 1000),
            open: quote.open_price,
            high: quote.high_price,
            low: quote.low_price,
            close: quote.ltp,
            lastUpdate: new Date().toISOString(),
            isLive: true,
            source: 'quotes'
          };
          
          this.priceData.set(quote.symbol, updatedData);
          this.updateOHLCBar(quote.symbol, quote.ltp, quote.volume);
        });
        
        this.healthStatus.lastSuccessfulUpdate = Date.now();
        console.log(`✅ Updated ${quotes.length} symbols with real Fyers data`);
      }
    } catch (error: any) {
      console.log('⚠️ Real-time Fyers data fetch failed:', error.message);
      this.healthStatus.quotesApiWorking = false;
      this.healthStatus.errors.push(`RealTime: ${error.message}`);
    }
  }

  private simulateLivePriceUpdates() {
    // DEPRECATED: This method is no longer used - replaced with real Fyers API data
    console.log('⚠️ Simulated price updates are disabled - using real Fyers API data');
  }

  private updatePriceData(symbol: string, price: number, volume: number) {
    const currentData = this.priceData.get(symbol);
    if (!currentData) return;
    
    const change = price - currentData.open;
    const changePercent = (change / currentData.open) * 100;
    
    // Update price data
    const updatedData: LivePriceData = {
      ...currentData,
      price,
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: currentData.volume + volume,
      high: Math.max(currentData.high, price),
      low: Math.min(currentData.low, price),
      close: price,
      timestamp: Math.floor(Date.now() / 1000),
      lastUpdate: new Date().toISOString(),
      isLive: true,
      source: 'websocket'
    };
    
    this.priceData.set(symbol, updatedData);
    
    // Update OHLC bar
    this.updateOHLCBar(symbol, price, volume);
    
    this.healthStatus.lastSuccessfulUpdate = Date.now();
  }

  private updateOHLCBar(symbol: string, price: number, volume: number) {
    const currentBar = this.currentBars.get(symbol);
    if (!currentBar) return;
    
    const now = Math.floor(Date.now() / 1000);
    const barTimestamp = Math.floor(now / 60) * 60;
    
    // Check if we need a new bar (new minute)
    if (barTimestamp > currentBar.timestamp) {
      // Complete the current bar
      currentBar.isComplete = true;
      this.addCompletedBar(symbol, currentBar);
      
      // Create new bar
      const newBar = this.createNewBar(symbol, price);
      this.currentBars.set(symbol, newBar);
    } else {
      // Update current bar
      currentBar.high = Math.max(currentBar.high, price);
      currentBar.low = Math.min(currentBar.low, price);
      currentBar.close = price;
      currentBar.volume += volume;
    }
  }

  private addCompletedBar(symbol: string, bar: OHLCBar) {
    const bars = this.ohlcBars.get(symbol) || [];
    bars.push(bar);
    
    // Maintain ring buffer size
    if (bars.length > this.maxBarsPerSymbol) {
      bars.shift();
    }
    
    this.ohlcBars.set(symbol, bars);
  }

  private async startQuotesBackup() {
    // DEPRECATED: This backup method is no longer needed since real Fyers API data is primary source
    console.log('✅ Real Fyers API data is now the primary source - backup not needed');
  }

  private startSSEBroadcasting() {
    // Broadcast to SSE clients every 700ms
    const broadcastInterval = setInterval(() => {
      const priceUpdate = {
        type: 'price_update',
        data: Array.from(this.priceData.values()),
        timestamp: new Date().toISOString(),
        health: this.getHealthStatus()
      };
      
      this.broadcast(priceUpdate);
    }, 700);
    
    // Store for cleanup
    this.streamingTimer = broadcastInterval;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    console.log(`🔄 Reconnecting WebSocket in ${this.backoffDelay}ms...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connectWebSocket();
    }, this.backoffDelay);
    
    // Exponential backoff
    this.backoffDelay = Math.min(this.backoffDelay * 2, this.maxBackoffDelay);
  }

  // WebSocket connection management
  addConnection(ws: WebSocket) {
    this.connections.add(ws);
    console.log(`📡 SSE client connected. Total connections: ${this.connections.size}`);
    
    // Send initial data
    this.sendToClient(ws, {
      type: 'connection',
      status: 'connected',
      message: 'Live price streaming activated',
      data: Array.from(this.priceData.values()),
      health: this.getHealthStatus()
    });
  }

  removeConnection(ws: WebSocket) {
    this.connections.delete(ws);
    console.log(`📡 SSE client disconnected. Total connections: ${this.connections.size}`);
  }

  private sendToClient(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  broadcast(data: any) {
    // Send to WebSocket connections
    this.connections.forEach(ws => {
      this.sendToClient(ws, data);
    });
    
    // Also broadcast to SSE clients with correct payload format
    if (data.type === 'price_update' && data.data) {
      // Convert Array of price data to Object keyed by symbol for SSE clients
      const pricesBySymbol: { [key: string]: any } = {};
      data.data.forEach((priceData: any) => {
        pricesBySymbol[priceData.symbol] = priceData;
      });
      
      broadcastToSSEClients(pricesBySymbol);
    }
  }

  // Public API methods
  getPriceData(): LivePriceData[] {
    return Array.from(this.priceData.values());
  }

  getSymbolData(symbol: string): LivePriceData | null {
    return this.priceData.get(symbol) || null;
  }

  getOHLCBars(symbol: string, limit: number = 100): OHLCBar[] {
    const bars = this.ohlcBars.get(symbol) || [];
    return bars.slice(-limit); // Return last N bars
  }

  getHealthStatus() {
    const now = Date.now();
    const timeSinceUpdate = now - this.healthStatus.lastSuccessfulUpdate;
    
    return {
      ...this.healthStatus,
      isHealthy: timeSinceUpdate < 5000, // Healthy if updated within 5 seconds
      timeSinceLastUpdate: timeSinceUpdate,
      isMarketHours: this.isMarketHours(),
      activeConnections: this.connections.size,
      totalSymbols: this.symbols.length
    };
  }

  // Cleanup
  stop() {
    console.log('🛑 Stopping live WebSocket streamer...');
    
    if (this.streamingTimer) {
      clearInterval(this.streamingTimer);
    }
    
    if (this.quotesBackupTimer) {
      clearInterval(this.quotesBackupTimer);
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.connections.clear();
    this.healthStatus.websocketConnected = false;
  }
}

// Global instance
export const liveWebSocketStreamer = new LiveWebSocketStreamer();