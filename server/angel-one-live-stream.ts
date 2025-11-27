import { angelOneApi } from './angel-one-api';
import { Response } from 'express';

export interface JournalLiveData {
  symbol: string;
  symbolToken: string;
  exchange: string;
  interval: string;
  currentCandle: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
  countdown: {
    remaining: number; // seconds remaining
    total: number; // total interval seconds
    formatted: string; // MM:SS format
  };
  ltp: number;
  lastUpdate: number;
  isMarketOpen: boolean;
}

interface SSEClient {
  res: Response;
  symbol: string;
  symbolToken: string;
  exchange: string;
  interval: string;
  lastUpdate: number;
}

class AngelOneLiveStream {
  private clients: Map<string, SSEClient> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private currentCandles: Map<string, JournalLiveData['currentCandle']> = new Map();
  private lastLTP: Map<string, number> = new Map();

  constructor() {
    console.log('🔴 Angel One Live Stream Service initialized');
  }

  // Get interval duration in seconds
  private getIntervalSeconds(interval: string): number {
    const intervalMap: { [key: string]: number } = {
      'ONE_MINUTE': 60,
      'THREE_MINUTE': 180,
      'FIVE_MINUTE': 300,
      'TEN_MINUTE': 600,
      'FIFTEEN_MINUTE': 900,
      'THIRTY_MINUTE': 1800,
      'ONE_HOUR': 3600,
      'ONE_DAY': 86400,
    };
    return intervalMap[interval] || 900; // Default to 15 min
  }

  // Calculate candle end time and countdown
  private calculateCountdown(interval: string): { remaining: number; total: number; formatted: string; candleEndTime: number } {
    const intervalSeconds = this.getIntervalSeconds(interval);
    const now = new Date();
    
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    
    // Get seconds since market open (9:15 AM IST)
    const marketOpenHour = 9;
    const marketOpenMinute = 15;
    const marketOpenMs = (marketOpenHour * 60 + marketOpenMinute) * 60 * 1000;
    
    const currentMs = (istTime.getUTCHours() * 60 + istTime.getUTCMinutes()) * 60 * 1000 + istTime.getUTCSeconds() * 1000;
    const secondsSinceMarketOpen = Math.floor((currentMs - marketOpenMs) / 1000);
    
    // Calculate current candle number and remaining time
    const currentCandleNumber = Math.floor(secondsSinceMarketOpen / intervalSeconds);
    const secondsIntoCurrentCandle = secondsSinceMarketOpen % intervalSeconds;
    const remaining = intervalSeconds - secondsIntoCurrentCandle;
    
    // Calculate candle end time
    const candleEndTime = Math.floor(now.getTime() / 1000) + remaining;
    
    // Format as MM:SS
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    return { remaining, total: intervalSeconds, formatted, candleEndTime };
  }

  // Check if Indian market is open
  private isMarketOpen(): boolean {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    
    const day = istTime.getUTCDay();
    if (day === 0 || day === 6) return false; // Weekend
    
    const hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    const timeInMinutes = hours * 60 + minutes;
    
    // Market hours: 9:15 AM to 3:30 PM IST
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM
    
    return timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
  }

  // Add SSE client
  addClient(clientId: string, res: Response, symbol: string, symbolToken: string, exchange: string, interval: string): void {
    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Store client
    this.clients.set(clientId, {
      res,
      symbol,
      symbolToken,
      exchange,
      interval,
      lastUpdate: Date.now()
    });

    console.log(`🔴 [SSE] Client ${clientId} connected for ${symbol} (${interval})`);

    // Initialize current candle if not exists
    const candleKey = `${symbol}_${interval}`;
    if (!this.currentCandles.has(candleKey)) {
      this.currentCandles.set(candleKey, {
        time: Math.floor(Date.now() / 1000),
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        volume: 0
      });
    }

    // Start polling for this symbol if not already
    this.startPolling(symbol, symbolToken, exchange, interval);

    // Send initial data
    this.sendUpdate(clientId);

    // Handle client disconnect
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

      // Check if we should stop polling for this symbol
      const candleKey = `${client.symbol}_${client.interval}`;
      const hasOtherClients = Array.from(this.clients.values()).some(
        c => `${c.symbol}_${c.interval}` === candleKey
      );

      if (!hasOtherClients) {
        this.stopPolling(candleKey);
      }
    }
  }

  // Start polling for LTP
  private startPolling(symbol: string, symbolToken: string, exchange: string, interval: string): void {
    const candleKey = `${symbol}_${interval}`;
    
    if (this.pollingIntervals.has(candleKey)) {
      return; // Already polling
    }

    console.log(`🔴 [POLL] Starting polling for ${candleKey}`);

    // Poll every 1 second for live updates
    const pollInterval = setInterval(async () => {
      await this.fetchAndBroadcast(symbol, symbolToken, exchange, interval);
    }, 1000);

    this.pollingIntervals.set(candleKey, pollInterval);

    // Initial fetch
    this.fetchAndBroadcast(symbol, symbolToken, exchange, interval);
  }

  // Stop polling
  private stopPolling(candleKey: string): void {
    const interval = this.pollingIntervals.get(candleKey);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(candleKey);
      console.log(`🔴 [POLL] Stopped polling for ${candleKey}`);
    }
  }

  // Fetch LTP and broadcast to clients
  private async fetchAndBroadcast(symbol: string, symbolToken: string, exchange: string, interval: string): Promise<void> {
    const candleKey = `${symbol}_${interval}`;

    try {
      // Always send updates with countdown (including pre-market)
      // Fetch LTP from Angel One
      const ltp = await angelOneApi.getLTP(exchange, symbol, symbolToken);
      
      if (ltp && ltp.ltp > 0) {
        const currentLtp = ltp.ltp;
        const prevLtp = this.lastLTP.get(candleKey) || currentLtp;
        
        // Update current candle
        let candle = this.currentCandles.get(candleKey);
        if (!candle || candle.open === 0) {
          candle = {
            time: Math.floor(Date.now() / 1000),
            open: currentLtp,
            high: currentLtp,
            low: currentLtp,
            close: currentLtp,
            volume: ltp.volume || 0
          };
        } else {
          candle.high = Math.max(candle.high, currentLtp);
          candle.low = Math.min(candle.low, currentLtp);
          candle.close = currentLtp;
          candle.volume = ltp.volume || candle.volume;
        }

        this.currentCandles.set(candleKey, candle);
        this.lastLTP.set(candleKey, currentLtp);

        // Check if candle is complete (countdown reached 0)
        const countdown = this.calculateCountdown(interval);
        if (countdown.remaining <= 1) {
          // Reset for new candle
          setTimeout(() => {
            this.currentCandles.set(candleKey, {
              time: Math.floor(Date.now() / 1000),
              open: currentLtp,
              high: currentLtp,
              low: currentLtp,
              close: currentLtp,
              volume: 0
            });
          }, 1000);
        }

        // Broadcast to all clients watching this symbol/interval
        this.broadcastToClients(candleKey, symbol, symbolToken, exchange, interval, currentLtp);
      }
    } catch (error) {
      // Silent fail - will retry next poll
      console.debug(`🔴 [POLL] Error fetching ${candleKey}:`, error);
    }
  }

  // Broadcast update to relevant clients
  private broadcastToClients(candleKey: string, symbol: string, symbolToken: string, exchange: string, interval: string, ltp: number | null): void {
    const candle = this.currentCandles.get(candleKey);
    const countdown = this.calculateCountdown(interval);
    const isMarketOpen = this.isMarketOpen();

    const data: JournalLiveData = {
      symbol,
      symbolToken,
      exchange,
      interval,
      currentCandle: candle || {
        time: Math.floor(Date.now() / 1000),
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        volume: 0
      },
      countdown: {
        remaining: countdown.remaining,
        total: countdown.total,
        formatted: countdown.formatted
      },
      ltp: ltp || this.lastLTP.get(candleKey) || 0,
      lastUpdate: Date.now(),
      isMarketOpen
    };

    // Send to all matching clients
    this.clients.forEach((client, clientId) => {
      if (`${client.symbol}_${client.interval}` === candleKey) {
        try {
          client.res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
          this.removeClient(clientId);
        }
      }
    });
  }

  // Send update to specific client
  private sendUpdate(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const candleKey = `${client.symbol}_${client.interval}`;
    const candle = this.currentCandles.get(candleKey);
    const countdown = this.calculateCountdown(client.interval);
    const isMarketOpen = this.isMarketOpen();

    const data: JournalLiveData = {
      symbol: client.symbol,
      symbolToken: client.symbolToken,
      exchange: client.exchange,
      interval: client.interval,
      currentCandle: candle || {
        time: Math.floor(Date.now() / 1000),
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        volume: 0
      },
      countdown: {
        remaining: countdown.remaining,
        total: countdown.total,
        formatted: countdown.formatted
      },
      ltp: this.lastLTP.get(candleKey) || 0,
      lastUpdate: Date.now(),
      isMarketOpen
    };

    try {
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      this.removeClient(clientId);
    }
  }

  // Get status
  getStatus(): { clients: number; symbols: string[] } {
    return {
      clients: this.clients.size,
      symbols: Array.from(this.pollingIntervals.keys())
    };
  }
}

export const angelOneLiveStream = new AngelOneLiveStream();
