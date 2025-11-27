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
}

interface RealClientConnection {
  id: string;
  res: Response;
  symbol: string;
  symbolToken: string;
  exchange: string;
  tradingSymbol: string;
  lastPrice: RealLivePrice | null;
}

class AngelOneRealTicker {
  private clients = new Map<string, RealClientConnection>();
  private broadcastInterval: NodeJS.Timeout | null = null;

  addClient(clientId: string, res: Response, symbol: string, symbolToken: string, exchange: string, tradingSymbol: string): void {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    // Store client
    const client: RealClientConnection = {
      id: clientId,
      res,
      symbol,
      symbolToken,
      exchange,
      tradingSymbol,
      lastPrice: null
    };

    this.clients.set(clientId, client);
    console.log(`📡 [REAL-TICKER] Client connected: ${clientId} for ${symbol} (Total: ${this.clients.size})`);

    // Start broadcast if not running
    if (!this.broadcastInterval) {
      this.startBroadcast();
    }

    // Handle disconnect
    res.on('close', () => {
      this.removeClient(clientId);
    });
  }

  private startBroadcast(): void {
    console.log('📡 [REAL-TICKER] Starting 700ms real market data broadcast from Angel One');
    
    let broadcastCount = 0;
    this.broadcastInterval = setInterval(async () => {
      broadcastCount++;
      const activeClients = this.clients.size;
      
      if (broadcastCount % 10 === 1) { // Log every 10 broadcasts (every 7 seconds)
        console.log(`📡 [REAL-TICKER] Broadcast cycle ${broadcastCount} to ${activeClients} clients (real Angel One data)`);
      }

      // Fetch real data for each client
      this.clients.forEach(async (client) => {
        try {
          // Get real quote from Angel One API
          // Use the proper trading symbol format (e.g., "Nifty 50" for indices, "RELIANCE-EQ" for stocks)
          const quote = await angelOneApi.getLTP(client.exchange, client.tradingSymbol, client.symbolToken);
          
          if (quote && client.res.writable) {
            const livePrice: RealLivePrice = {
              symbol: client.symbol,
              symbolToken: client.symbolToken,
              exchange: client.exchange,
              tradingSymbol: client.tradingSymbol,
              time: Math.floor(Date.now() / 1000),
              open: quote.open,
              high: quote.high,
              low: quote.low,
              close: quote.close,
              ltp: quote.ltp || quote.close, // Use LTP if available, fallback to close
              volume: quote.volume
            };

            // Update cached price
            client.lastPrice = livePrice;

            // Send to client in proper SSE format
            client.res.write(`data: ${JSON.stringify(livePrice)}\n\n`);
            
            if (broadcastCount % 10 === 1) {
              console.log(`📊 [REAL-TICKER] Real quote for ${client.symbol}: LTP ${livePrice.ltp}`);
            }
          } else if (!client.res.writable) {
            console.log(`⚠️ [REAL-TICKER] Client ${client.id} not writable`);
          }
        } catch (error) {
          if (broadcastCount % 10 === 1) { // Log errors only periodically
            console.error(`❌ [REAL-TICKER] Failed to get real data for ${client.symbol}:`, error instanceof Error ? error.message : String(error));
          }
        }
      });
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
      clients: Array.from(this.clients.values()).map(c => ({
        id: c.id,
        symbol: c.symbol,
        lastPrice: c.lastPrice
      }))
    };
  }
}

export const angelOneRealTicker = new AngelOneRealTicker();
