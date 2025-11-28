import { Response } from 'express';
import { angelOneApi } from './angel-one-api';

export interface RealLivePrice {
  symbol: string;
  symbolToken: string;
  exchange: string;
  tradingSymbol: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  ltp: number;
  volume: number;
  isRealTime?: boolean;
  marketStatus?: 'live' | 'delayed' | 'closed';
}

interface RealClientConnection {
  id: string;
  res: Response;
  symbol: string;
  symbolToken: string;
  exchange: string;
  tradingSymbol: string;
  lastPrice: RealLivePrice | null;
  initialOhlc: { open: number; high: number; low: number; close: number; volume: number; ltp?: number };
  fallbackCount: number; // Track fallback usage
}

class AngelOneRealTicker {
  private clients = new Map<string, RealClientConnection>();
  private broadcastInterval: NodeJS.Timeout | null = null;
  private lastRealDataTime: number = 0;

  addClient(clientId: string, res: Response, symbol: string, symbolToken: string, exchange: string, tradingSymbol: string, initialOhlc?: { open: number; high: number; low: number; close: number; volume: number; ltp?: number }): void {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    // Initialize with last known candle data
    const ohlc = initialOhlc || { open: 0, high: 0, low: 0, close: 0, volume: 0, ltp: 0 };

    // Store client
    const client: RealClientConnection = {
      id: clientId,
      res,
      symbol,
      symbolToken,
      exchange,
      tradingSymbol,
      lastPrice: null,
      initialOhlc: ohlc,
      fallbackCount: 0
    };

    this.clients.set(clientId, client);
    console.log(`📡 [REAL-TICKER] Client connected: ${clientId} for ${symbol} (Fallback OHLC: ${ohlc.close}) (Total: ${this.clients.size})`);

    // Start broadcast if not running
    if (!this.broadcastInterval) {
      this.startBroadcast();
    }

    // Handle disconnect
    res.on('close', () => {
      this.removeClient(clientId);
    });
  }

  private isMarketOpen(): boolean {
    // Check if Indian market is open (9:15 AM - 3:30 PM IST, Monday-Friday)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset);
    
    const dayOfWeek = istTime.getUTCDay();
    const hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    const timeInMinutes = hours * 60 + minutes;
    
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM
    
    return dayOfWeek >= 1 && dayOfWeek <= 5 && timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
  }

  private startBroadcast(): void {
    const marketOpen = this.isMarketOpen();
    console.log(`📡 [REAL-TICKER] Starting market data stream (Market: ${marketOpen ? 'OPEN' : 'CLOSED'})`);
    
    let broadcastCount = 0;
    let lastQuoteFetchTime = 0;
    const QUOTE_FETCH_INTERVAL = 1000; // Fetch quotes every 1 second max
    
    this.broadcastInterval = setInterval(async () => {
      broadcastCount++;
      const activeClients = this.clients.size;
      const currentTime = Date.now();
      
      // Log status periodically
      if (broadcastCount % 50 === 1) {
        const marketStatus = this.isMarketOpen() ? 'OPEN' : 'CLOSED';
        console.log(`📡 [REAL-TICKER] Cycle ${broadcastCount} | ${activeClients} clients | Market: ${marketStatus}`);
      }

      // Throttle API calls
      const shouldFetchQuotes = currentTime - lastQuoteFetchTime >= QUOTE_FETCH_INTERVAL;
      
      // Fetch real data for each client
      const clientEntries = Array.from(this.clients.entries());
      for (const [clientId, client] of clientEntries) {
        try {
          let livePrice: RealLivePrice | null = null;
          let gotRealData = false;

          // Try to get real quote from Angel One API (throttled)
          if (shouldFetchQuotes) {
            try {
              const quote = await angelOneApi.getLTP(client.exchange, client.tradingSymbol, client.symbolToken);
              
              if (quote && quote.ltp > 0) {
                livePrice = {
                  symbol: client.symbol,
                  symbolToken: client.symbolToken,
                  exchange: client.exchange,
                  tradingSymbol: client.tradingSymbol,
                  time: Math.floor(Date.now() / 1000),
                  open: quote.open,
                  high: quote.high,
                  low: quote.low,
                  close: quote.close,
                  ltp: quote.ltp,
                  volume: quote.volume,
                  isRealTime: true,
                  marketStatus: 'live'
                };
                client.fallbackCount = 0;
                this.lastRealDataTime = Date.now();
                gotRealData = true;
                lastQuoteFetchTime = currentTime;
                
                if (broadcastCount % 30 === 1) {
                  console.log(`✅ [REAL-TICKER] LIVE: ${client.symbol} @ ₹${livePrice.ltp.toFixed(2)}`);
                }
              }
            } catch (apiError: any) {
              // API failed - log only occasionally to avoid spam
              if (broadcastCount % 100 === 1) {
                console.log(`⚠️ [REAL-TICKER] API unavailable for ${client.symbol}: ${apiError.message || 'Unknown error'}`);
              }
            }
          }

          // If no real data, use last candle data (static - no simulation)
          if (!livePrice) {
            // Use the last known price without any random changes
            const basePrice = client.lastPrice || {
              open: client.initialOhlc.open,
              high: client.initialOhlc.high,
              low: client.initialOhlc.low,
              close: client.initialOhlc.close,
              ltp: client.initialOhlc.close,
              volume: client.initialOhlc.volume
            };

            livePrice = {
              symbol: client.symbol,
              symbolToken: client.symbolToken,
              exchange: client.exchange,
              tradingSymbol: client.tradingSymbol,
              time: Math.floor(Date.now() / 1000),
              open: basePrice.open,
              high: basePrice.high,
              low: basePrice.low,
              close: basePrice.close,
              ltp: basePrice.ltp || basePrice.close,
              volume: basePrice.volume,
              isRealTime: false,
              marketStatus: this.isMarketOpen() ? 'delayed' : 'closed'
            };
            
            client.fallbackCount++;
            
            // Log market closed status once
            if (client.fallbackCount === 1) {
              const status = this.isMarketOpen() ? 'Using last known price' : 'Market closed';
              console.log(`📊 [REAL-TICKER] ${status}: ${client.symbol} @ ₹${livePrice.ltp.toFixed(2)}`);
            }
          }

          // Send data if available
          if (livePrice && client.res.writable) {
            client.lastPrice = livePrice;
            client.res.write(`data: ${JSON.stringify(livePrice)}\n\n`);
          }
        } catch (error) {
          if (broadcastCount % 50 === 1) {
            console.error(`❌ [REAL-TICKER] Error for ${client.symbol}:`, error instanceof Error ? error.message : String(error));
          }
        }
      }
    }, 700); // 700ms interval
  }

  private removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`📡 [REAL-TICKER] Client disconnected: ${clientId} (Remaining: ${this.clients.size})`);

    if (this.clients.size === 0 && this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
      console.log('📡 [REAL-TICKER] Broadcast stopped (no active clients)');
    }
  }

  getStatus(): any {
    return {
      activeClients: this.clients.size,
      isStreaming: this.broadcastInterval !== null,
      lastRealDataTime: this.lastRealDataTime,
      clients: Array.from(this.clients.values()).map(c => ({
        id: c.id,
        symbol: c.symbol,
        usingFallback: c.fallbackCount > 0,
        fallbackCount: c.fallbackCount,
        lastPrice: c.lastPrice
      }))
    };
  }
}

export const angelOneRealTicker = new AngelOneRealTicker();
