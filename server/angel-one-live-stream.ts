import { angelOneApi } from './angel-one-api';
import { Response } from 'express';

export interface LivePrice {
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  time: number;
  isLive?: boolean;
}

interface SSEClient {
  res: Response;
  symbol: string;
  symbolToken: string;
  exchange: string;
  lastUpdate: number;
}

interface InitialCandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  time: number;
}

class AngelOneLiveStream {
  private clients: Map<string, SSEClient> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private currentCandle: Map<string, LivePrice> = new Map();
  private lastSuccessfulCandle: Map<string, LivePrice> = new Map();
  private initialChartCandle: Map<string, InitialCandleData> = new Map();
  private failureCount: Map<string, number> = new Map();

  constructor() {
    console.log('🔴 Angel One Live Stream Service initialized');
  }

  setInitialChartData(symbol: string, symbolToken: string, candleData: InitialCandleData): void {
    const key = `${symbol}_${symbolToken}`;
    this.initialChartCandle.set(key, candleData);
    console.log(`📊 [SSE] Initial chart data set for ${symbol}: O:${candleData.open} H:${candleData.high} L:${candleData.low} C:${candleData.close}`);
  }

  addClient(clientId: string, res: Response, symbol: string, symbolToken: string, exchange: string): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    this.clients.set(clientId, {
      res,
      symbol,
      symbolToken,
      exchange,
      lastUpdate: Date.now()
    });

    console.log(`🔴 [SSE] Client ${clientId} connected for ${symbol}`);

    const key = `${symbol}_${symbolToken}`;
    if (!this.currentCandle.has(key)) {
      const initialData = this.initialChartCandle.get(key);
      const now = Math.floor(Date.now() / 1000);
      
      if (initialData && initialData.close > 0) {
        this.currentCandle.set(key, {
          ltp: initialData.close,
          open: initialData.open,
          high: initialData.high,
          low: initialData.low,
          close: initialData.close,
          time: now,
          isLive: false
        });
        console.log(`📊 [SSE] Using chart data as initial OHLC for ${symbol}`);
      } else {
        this.currentCandle.set(key, {
          ltp: 0,
          open: 0,
          high: 0,
          low: 0,
          close: 0,
          time: now,
          isLive: false
        });
      }
    }

    this.failureCount.set(key, 0);
    this.startPolling(symbol, symbolToken, exchange);

    res.on('close', () => {
      this.removeClient(clientId);
    });
  }

  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      console.log(`🔴 [SSE] Client ${clientId} disconnected`);

      const key = `${client.symbol}_${client.symbolToken}`;
      const hasOtherClients = Array.from(this.clients.values()).some(
        c => `${c.symbol}_${c.symbolToken}` === key
      );

      if (!hasOtherClients) {
        this.stopPolling(key);
      }
    }
  }

  private startPolling(symbol: string, symbolToken: string, exchange: string): void {
    const key = `${symbol}_${symbolToken}`;
    
    if (this.pollingIntervals.has(key)) {
      return;
    }

    console.log(`📡 [POLL] Starting live price polling for ${symbol} at 700ms intervals`);

    const interval = setInterval(async () => {
      try {
        if (!angelOneApi.isConnected()) {
          this.handleFallback(key);
          return;
        }

        const ltp = await angelOneApi.getLTP(exchange, symbol, symbolToken);
        
        if (ltp && ltp.ltp > 0) {
          this.failureCount.set(key, 0);
          
          let candle = this.currentCandle.get(key);
          const now = Math.floor(Date.now() / 1000);
          
          if (!candle || candle.open === 0) {
            candle = {
              ltp: ltp.ltp,
              open: ltp.open || ltp.ltp,
              high: ltp.high || ltp.ltp,
              low: ltp.low || ltp.ltp,
              close: ltp.ltp,
              time: now,
              isLive: true
            };
          } else {
            candle.high = Math.max(candle.high, ltp.ltp);
            candle.low = candle.low > 0 ? Math.min(candle.low, ltp.ltp) : ltp.ltp;
            candle.close = ltp.ltp;
            candle.ltp = ltp.ltp;
            candle.time = now;
            candle.isLive = true;
          }

          this.currentCandle.set(key, candle);
          this.lastSuccessfulCandle.set(key, { ...candle });
          this.broadcastUpdate(key, candle);
        } else {
          this.handleFallback(key);
        }
      } catch (error: any) {
        this.handleFallback(key);
      }
    }, 700);

    this.pollingIntervals.set(key, interval);
  }

  private handleFallback(key: string): void {
    const failures = (this.failureCount.get(key) || 0) + 1;
    this.failureCount.set(key, failures);

    let candle = this.lastSuccessfulCandle.get(key) || this.currentCandle.get(key);
    
    if (!candle || candle.close === 0) {
      const initialData = this.initialChartCandle.get(key);
      if (initialData && initialData.close > 0) {
        candle = {
          ltp: initialData.close,
          open: initialData.open,
          high: initialData.high,
          low: initialData.low,
          close: initialData.close,
          time: Math.floor(Date.now() / 1000),
          isLive: false
        };
      }
    }

    if (candle && candle.close > 0) {
      const now = Math.floor(Date.now() / 1000);
      const updatedCandle: LivePrice = {
        ...candle,
        time: now,
        isLive: false
      };
      
      this.currentCandle.set(key, updatedCandle);
      this.broadcastUpdate(key, updatedCandle);
    }
  }

  private stopPolling(key: string): void {
    const interval = this.pollingIntervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(key);
      console.log(`📡 [POLL] Stopped polling for ${key}`);
    }
  }

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

  getStatus(): { activeClients: number; activePolls: number; symbols: string[] } {
    return {
      activeClients: this.clients.size,
      activePolls: this.pollingIntervals.size,
      symbols: Array.from(this.pollingIntervals.keys())
    };
  }
}

export const angelOneLiveStream = new AngelOneLiveStream();
