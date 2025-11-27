import { angelOneApi } from './angel-one-api';
import { Response } from 'express';

export interface LivePrice {
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  time: number;
}

interface SSEClient {
  res: Response;
  symbol: string;
  symbolToken: string;
  exchange: string;
  lastUpdate: number;
}

class AngelOneLiveStream {
  private clients: Map<string, SSEClient> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private currentCandle: Map<string, LivePrice> = new Map();

  constructor() {
    console.log('🔴 Angel One Live Stream Service initialized');
  }

  // Add SSE client
  addClient(clientId: string, res: Response, symbol: string, symbolToken: string, exchange: string): void {
    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Store client
    this.clients.set(clientId, {
      res,
      symbol,
      symbolToken,
      exchange,
      lastUpdate: Date.now()
    });

    console.log(`🔴 [SSE] Client ${clientId} connected for ${symbol}`);

    // Initialize candle
    const key = `${symbol}_${symbolToken}`;
    if (!this.currentCandle.has(key)) {
      this.currentCandle.set(key, {
        ltp: 0,
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        time: Math.floor(Date.now() / 1000)
      });
    }

    // Start polling
    this.startPolling(symbol, symbolToken, exchange);

    // Handle disconnect
    res.on('close', () => {
      this.removeClient(clientId);
    });
  }

  // Remove client
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      console.log(`🔴 [SSE] Client ${clientId} disconnected`);

      // Stop polling if no clients
      const key = `${client.symbol}_${client.symbolToken}`;
      const hasOtherClients = Array.from(this.clients.values()).some(
        c => `${c.symbol}_${c.symbolToken}` === key
      );

      if (!hasOtherClients) {
        this.stopPolling(key);
      }
    }
  }

  // Start polling for live prices
  private startPolling(symbol: string, symbolToken: string, exchange: string): void {
    const key = `${symbol}_${symbolToken}`;
    
    if (this.pollingIntervals.has(key)) {
      return; // Already polling
    }

    console.log(`📡 [POLL] Starting live price polling for ${symbol}`);

    // Poll every 700ms
    const interval = setInterval(async () => {
      try {
        const ltp = await angelOneApi.getLTP(exchange, symbol, symbolToken);
        
        if (ltp && ltp.ltp > 0) {
          const candle = this.currentCandle.get(key) || {
            ltp: ltp.ltp,
            open: ltp.ltp,
            high: ltp.ltp,
            low: ltp.ltp,
            close: ltp.ltp,
            time: Math.floor(Date.now() / 1000)
          };

          // Update OHLC
          if (candle.open === 0) candle.open = ltp.ltp;
          candle.high = Math.max(candle.high, ltp.ltp);
          candle.low = Math.min(candle.low, ltp.ltp);
          candle.close = ltp.ltp;

          this.currentCandle.set(key, candle);

          // Broadcast to all clients for this symbol
          this.broadcastUpdate(key, candle);
        }
      } catch (error) {
        // Silently fail - will retry next poll
      }
    }, 700);

    this.pollingIntervals.set(key, interval);
  }

  // Stop polling
  private stopPolling(key: string): void {
    const interval = this.pollingIntervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(key);
      console.log(`📡 [POLL] Stopped polling for ${key}`);
    }
  }

  // Broadcast update to all clients
  private broadcastUpdate(key: string, candle: LivePrice): void {
    this.clients.forEach((client) => {
      const clientKey = `${client.symbol}_${client.symbolToken}`;
      if (clientKey === key) {
        try {
          client.res.write(`data: ${JSON.stringify(candle)}\n\n`);
        } catch (error) {
          console.debug(`[SSE] Failed to send to client`);
        }
      }
    });
  }
}

export const angelOneLiveStream = new AngelOneLiveStream();
