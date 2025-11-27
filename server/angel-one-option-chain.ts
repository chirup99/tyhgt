import { angelOneInstruments, OptionChainData, OptionChainStrike, OptionInstrument } from './angel-one-instruments';
import { angelOneApi } from './angel-one-api';
import axios from 'axios';

interface OptionQuoteData {
  token: string;
  ltp: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  oi?: number;
  change?: number;
  changePercent?: number;
}

class AngelOneOptionChain {
  private priceCache = new Map<string, OptionQuoteData>();
  private lastPriceFetch: Date | null = null;
  private priceCacheTTL = 5000; // 5 seconds cache for prices

  constructor() {
    console.log('📊 [OPTION-CHAIN] Angel One Option Chain service initialized');
  }

  async getOptionChain(underlying: string, expiry?: string): Promise<OptionChainData | null> {
    try {
      console.log(`📊 [OPTION-CHAIN] Fetching option chain for ${underlying}${expiry ? ` (${expiry})` : ''}...`);
      
      // Ensure instruments are loaded
      await angelOneInstruments.ensureInstruments();
      
      if (!angelOneInstruments.isLoaded()) {
        throw new Error('Instrument data not available');
      }

      // Get expiry dates
      const expiryDates = angelOneInstruments.getExpiryDates(underlying);
      if (expiryDates.length === 0) {
        throw new Error(`No expiry dates found for ${underlying}`);
      }

      // Use provided expiry or nearest one
      const selectedExpiry = expiry || angelOneInstruments.getNearestExpiry(underlying) || expiryDates[0];

      // Build option chain structure
      const strikes = angelOneInstruments.buildOptionChainStructure(underlying, selectedExpiry);
      
      if (strikes.length === 0) {
        throw new Error(`No option strikes found for ${underlying} expiry ${selectedExpiry}`);
      }

      // Get spot price
      const spotPrice = await this.getSpotPrice(underlying);

      // Calculate ATM strike
      const atmStrike = this.findATMStrike(strikes.map(s => s.strikePrice), spotPrice);

      // Fetch live prices for options (limit to strikes around ATM for performance)
      const enrichedStrikes = await this.enrichStrikesWithPrices(strikes, spotPrice, atmStrike);

      const optionChainData: OptionChainData = {
        underlying: underlying.toUpperCase(),
        spotPrice,
        expiry: selectedExpiry,
        expiryDates,
        strikes: enrichedStrikes,
        atmStrike,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ [OPTION-CHAIN] Built option chain for ${underlying} with ${enrichedStrikes.length} strikes`);
      return optionChainData;

    } catch (error: any) {
      console.error(`❌ [OPTION-CHAIN] Error fetching option chain for ${underlying}:`, error.message);
      return null;
    }
  }

  private async getSpotPrice(underlying: string): Promise<number> {
    const normalizedUnderlying = underlying.toUpperCase().trim();
    
    // Default spot prices for indices (fallback)
    const defaultPrices: { [key: string]: number } = {
      'NIFTY': 24500,
      'BANKNIFTY': 52000,
      'FINNIFTY': 23000,
      'MIDCPNIFTY': 12000
    };

    try {
      // Try to get live price from Angel One
      if (angelOneApi.isConnected()) {
        const indexMappings: { [key: string]: { exchange: string; token: string; symbol: string } } = {
          'NIFTY': { exchange: 'NSE', token: '99926000', symbol: 'Nifty 50' },
          'BANKNIFTY': { exchange: 'NSE', token: '99926009', symbol: 'Nifty Bank' },
          'FINNIFTY': { exchange: 'NSE', token: '99926037', symbol: 'Nifty Fin Service' },
          'MIDCPNIFTY': { exchange: 'NSE', token: '99926074', symbol: 'NIFTY MID SELECT' }
        };

        const indexInfo = indexMappings[normalizedUnderlying];
        if (indexInfo) {
          const quote = await angelOneApi.getLTP(indexInfo.exchange, indexInfo.symbol, indexInfo.token);
          if (quote && quote.ltp > 0) {
            console.log(`📊 [OPTION-CHAIN] Got spot price for ${normalizedUnderlying}: ${quote.ltp}`);
            return quote.ltp;
          }
        }
      }
    } catch (error: any) {
      console.log(`📊 [OPTION-CHAIN] Could not fetch live spot price for ${normalizedUnderlying}, using default`);
    }

    return defaultPrices[normalizedUnderlying] || 24500;
  }

  private findATMStrike(strikes: number[], spotPrice: number): number {
    if (strikes.length === 0) return spotPrice;
    
    return strikes.reduce((prev, curr) => 
      Math.abs(curr - spotPrice) < Math.abs(prev - spotPrice) ? curr : prev
    );
  }

  private async enrichStrikesWithPrices(
    strikes: OptionChainStrike[], 
    spotPrice: number,
    atmStrike: number
  ): Promise<OptionChainStrike[]> {
    // Limit strikes to +/- 15 around ATM for performance
    const strikeRange = 15;
    const filteredStrikes = strikes.filter(strike => {
      const atmIndex = strikes.findIndex(s => s.strikePrice === atmStrike);
      const currentIndex = strikes.findIndex(s => s.strikePrice === strike.strikePrice);
      return Math.abs(currentIndex - atmIndex) <= strikeRange;
    });

    // Collect all option tokens to fetch prices
    const optionTokens: { token: string; strike: number; type: 'CE' | 'PE' }[] = [];
    
    for (const strike of filteredStrikes) {
      if (strike.CE) {
        optionTokens.push({ token: strike.CE.token, strike: strike.strikePrice, type: 'CE' });
      }
      if (strike.PE) {
        optionTokens.push({ token: strike.PE.token, strike: strike.strikePrice, type: 'PE' });
      }
    }

    // Fetch prices in batches using Angel One API
    const priceMap = await this.fetchOptionPrices(optionTokens);

    // Enrich strikes with price data
    const enrichedStrikes = filteredStrikes.map(strike => {
      const enriched: OptionChainStrike = { ...strike };
      
      if (strike.CE) {
        const cePrice = priceMap.get(strike.CE.token);
        enriched.CE = {
          ...strike.CE,
          ltp: cePrice?.ltp || this.calculateTheoreticalPrice(strike.strikePrice, spotPrice, 'CE'),
          volume: cePrice?.volume || 0,
          oi: cePrice?.oi || 0,
          change: cePrice?.change || 0
        };
      }
      
      if (strike.PE) {
        const pePrice = priceMap.get(strike.PE.token);
        enriched.PE = {
          ...strike.PE,
          ltp: pePrice?.ltp || this.calculateTheoreticalPrice(strike.strikePrice, spotPrice, 'PE'),
          volume: pePrice?.volume || 0,
          oi: pePrice?.oi || 0,
          change: pePrice?.change || 0
        };
      }
      
      return enriched;
    });

    return enrichedStrikes;
  }

  private async fetchOptionPrices(
    tokens: { token: string; strike: number; type: 'CE' | 'PE' }[]
  ): Promise<Map<string, OptionQuoteData>> {
    const priceMap = new Map<string, OptionQuoteData>();

    if (!angelOneApi.isConnected()) {
      console.log('📊 [OPTION-CHAIN] Angel One not connected, using theoretical prices');
      return priceMap;
    }

    try {
      // Batch tokens for API call (Angel One allows up to 50 tokens per request)
      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < tokens.length; i += batchSize) {
        batches.push(tokens.slice(i, i + batchSize));
      }

      const session = angelOneApi.getSession();
      const credentials = angelOneApi.getCredentials();
      
      if (!session || !credentials) {
        return priceMap;
      }

      for (const batch of batches) {
        try {
          const tokenList = batch.map(t => t.token);
          
          const response = await axios.post(
            'https://apiconnect.angelone.in/rest/secure/angelbroking/market/v1/quote/',
            {
              mode: 'FULL',
              exchangeTokens: {
                'NFO': tokenList
              }
            },
            {
              headers: {
                'Authorization': `Bearer ${session.jwtToken}`,
                'Content-Type': 'application/json',
                'X-UserType': 'USER',
                'X-SourceID': 'WEB',
                'X-ClientLocalIP': '127.0.0.1',
                'X-ClientPublicIP': '127.0.0.1',
                'X-MACAddress': '00:00:00:00:00:00',
                'X-PrivateKey': credentials.apiKey
              },
              timeout: 10000
            }
          );

          if (response.data?.status && response.data?.data?.fetched) {
            for (const quote of response.data.data.fetched) {
              priceMap.set(quote.symbolToken, {
                token: quote.symbolToken,
                ltp: parseFloat(quote.ltp) || 0,
                open: parseFloat(quote.open) || 0,
                high: parseFloat(quote.high) || 0,
                low: parseFloat(quote.low) || 0,
                close: parseFloat(quote.close) || 0,
                volume: parseInt(quote.tradeVolume) || 0,
                oi: parseInt(quote.opnInterest) || 0,
                change: (parseFloat(quote.ltp) || 0) - (parseFloat(quote.close) || 0)
              });
            }
          }
          
          // Small delay between batches to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error: any) {
          console.log(`📊 [OPTION-CHAIN] Batch fetch error:`, error.message);
        }
      }

      console.log(`📊 [OPTION-CHAIN] Fetched prices for ${priceMap.size} options`);
      
    } catch (error: any) {
      console.error('📊 [OPTION-CHAIN] Error fetching option prices:', error.message);
    }

    return priceMap;
  }

  private calculateTheoreticalPrice(strike: number, spot: number, type: 'CE' | 'PE'): number {
    // Simple intrinsic value calculation for fallback
    if (type === 'CE') {
      return Math.max(0, spot - strike);
    } else {
      return Math.max(0, strike - spot);
    }
  }

  getExpiryDates(underlying: string): string[] {
    return angelOneInstruments.getExpiryDates(underlying);
  }

  async getStatus(): Promise<{
    instrumentsLoaded: boolean;
    instrumentCount: number;
    lastFetch: string | null;
    angelOneConnected: boolean;
  }> {
    return {
      instrumentsLoaded: angelOneInstruments.isLoaded(),
      instrumentCount: angelOneInstruments.getInstrumentCount(),
      lastFetch: angelOneInstruments.getLastFetchTime()?.toISOString() || null,
      angelOneConnected: angelOneApi.isConnected()
    };
  }
}

export const angelOneOptionChain = new AngelOneOptionChain();
