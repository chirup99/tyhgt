import { Response } from 'express';
import { angelOneApi } from './angel-one-api';
import { angelOneWebSocket } from './angel-one-websocket';

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
  fallbackCount: number;
  webSocketSubscribed: boolean; // Track WebSocket subscription status
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
      fallbackCount: 0,
      webSocketSubscribed: false
    };

    this.clients.set(clientId, client);
    console.log(`📡 [REAL-TICKER] Client connected: ${clientId} for ${symbol} (Total: ${this.clients.size})`);

    // Subscribe to WebSocket for real-time tick-by-tick updates
    this.subscribeToWebSocket(client);

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

  private subscribeToWebSocket(client: RealClientConnection): void {
    // Subscribe to WebSocket for tick-by-tick updates
    const key = `${client.symbol}_${client.symbolToken}`;
    
    const tickCallback = (wsData: any) => {
      // Convert WebSocket OHLC data to RealLivePrice format
      const livePrice: RealLivePrice = {
        symbol: client.symbol,
        symbolToken: client.symbolToken,
        exchange: client.exchange,
        tradingSymbol: client.tradingSymbol,
        time: Math.floor(Date.now() / 1000),
        open: wsData.open || client.initialOhlc.open,
        high: wsData.high || client.initialOhlc.high,
        low: wsData.low || client.initialOhlc.low,
        close: wsData.close || client.initialOhlc.close,
        ltp: wsData.close || wsData.ltp || client.initialOhlc.close,
        volume: wsData.volume || 0,
        isRealTime: true,
        marketStatus: 'live'
      };
      
      client.lastPrice = livePrice;
      if (client.res.writable) {
        client.res.write(`data: ${JSON.stringify(livePrice)}\n\n`);
      }
    };

    // Subscribe using Angel One API
    angelOneApi.subscribeToWebSocket(
      client.exchange,
      client.symbolToken,
      client.tradingSymbol,
      tickCallback
    );
    
    client.webSocketSubscribed = true;
    console.log(`📡 [REAL-TICKER] WebSocket subscribed for ${client.symbol}`);
  }

  private startBroadcast(): void {
    console.log(`📡 [REAL-TICKER] Starting broadcast loop for fallback data (700ms interval)`);
    
    let broadcastCount = 0;
    
    this.broadcastInterval = setInterval(() => {
      broadcastCount++;
      
      // Log status periodically
      if (broadcastCount % 50 === 1) {
        const activeClients = this.clients.size;
        const marketStatus = this.isMarketOpen() ? 'OPEN' : 'CLOSED';
        console.log(`📡 [REAL-TICKER] Cycle ${broadcastCount} | ${activeClients} clients | Market: ${marketStatus}`);
      }

      // For each client, send fallback data if WebSocket hasn't provided live data
      const clientEntries = Array.from(this.clients.entries());
      for (const [clientId, client] of clientEntries) {
        try {
          // If no live price yet, use fallback data (will be overridden by WebSocket)
          if (!client.lastPrice) {
            const fallbackPrice: RealLivePrice = {
              symbol: client.symbol,
              symbolToken: client.symbolToken,
              exchange: client.exchange,
              tradingSymbol: client.tradingSymbol,
              time: Math.floor(Date.now() / 1000),
              open: client.initialOhlc.open,
              high: client.initialOhlc.high,
              low: client.initialOhlc.low,
              close: client.initialOhlc.close,
              ltp: client.initialOhlc.close,
              volume: client.initialOhlc.volume,
              isRealTime: false,
              marketStatus: this.isMarketOpen() ? 'awaiting_websocket' : 'closed'
            };

            client.fallbackCount++;
            if (client.fallbackCount === 1) {
              console.log(`📊 [REAL-TICKER] Waiting for WebSocket data: ${client.symbol}`);
            }

            if (client.res.writable) {
              client.lastPrice = fallbackPrice;
              client.res.write(`data: ${JSON.stringify(fallbackPrice)}\n\n`);
            }
          }
        } catch (error) {
          if (broadcastCount % 100 === 1) {
            console.error(`❌ [REAL-TICKER] Error for ${client.symbol}:`, error instanceof Error ? error.message : String(error));
          }
        }
      }
    }, 700); // 700ms interval - fallback only, WebSocket provides live updates
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
