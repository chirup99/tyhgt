// @ts-ignore - smartapi-javascript doesn't have type declarations
import { SmartAPI } from 'smartapi-javascript';
// @ts-ignore - totp-generator import compatibility
import { TOTP } from 'totp-generator';

export interface AngelOneCredentials {
  clientCode: string;
  pin: string;
  apiKey: string;
  totpSecret: string;
}

export interface AngelOneSession {
  jwtToken: string;
  refreshToken: string;
  feedToken: string;
}

export interface AngelOneProfile {
  clientcode: string;
  name: string;
  email: string;
  mobileno: string;
  exchanges: string[];
  products: string[];
  lastlogintime: string;
  broker: string;
}

export interface AngelOneQuote {
  symbol: string;
  tradingSymbol: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
  volume: number;
  exchange: string;
}

export interface AngelOneCandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AngelOneApiResponse<T> {
  status: boolean;
  message: string;
  errorcode: string;
  data?: T;
}

class AngelOneAPI {
  private smartApi: any;
  private credentials: AngelOneCredentials | null = null;
  private session: AngelOneSession | null = null;
  private isAuthenticated: boolean = false;
  private profileData: AngelOneProfile | null = null;

  constructor() {
    console.log('🔶 Angel One API initialized');
  }

  setCredentials(credentials: AngelOneCredentials): void {
    this.credentials = credentials;
    this.smartApi = new SmartAPI({
      api_key: credentials.apiKey
    });
    console.log('🔶 [Angel One] Credentials set for client:', credentials.clientCode);
  }

  async generateSession(): Promise<AngelOneSession | null> {
    if (!this.credentials || !this.smartApi) {
      console.error('🔶 [Angel One] Credentials not set');
      throw new Error('Angel One credentials not configured');
    }

    try {
      const totpToken = await TOTP.generate(this.credentials.totpSecret);
      console.log('🔶 [Angel One] Generated TOTP token:', totpToken);

      const response = await this.smartApi.generateSession(
        this.credentials.clientCode,
        this.credentials.pin,
        totpToken
      );

      if (response.status && response.data) {
        this.session = {
          jwtToken: response.data.jwtToken,
          refreshToken: response.data.refreshToken,
          feedToken: response.data.feedToken
        };
        this.isAuthenticated = true;
        console.log('🔶 [Angel One] Session generated successfully');
        return this.session;
      } else {
        console.error('🔶 [Angel One] Session generation failed:', response.message);
        throw new Error(response.message || 'Failed to generate session');
      }
    } catch (error: any) {
      console.error('🔶 [Angel One] Error generating session:', error.message);
      this.isAuthenticated = false;
      throw error;
    }
  }

  async refreshSession(): Promise<AngelOneSession | null> {
    if (!this.session?.refreshToken) {
      console.log('🔶 [Angel One] No refresh token available, generating new session');
      return this.generateSession();
    }

    try {
      const response = await this.smartApi.generateToken({
        refreshToken: this.session.refreshToken
      });

      if (response.status && response.data) {
        this.session = {
          ...this.session,
          jwtToken: response.data.jwtToken,
          refreshToken: response.data.refreshToken
        };
        console.log('🔶 [Angel One] Session refreshed successfully');
        return this.session;
      }
    } catch (error: any) {
      console.error('🔶 [Angel One] Error refreshing session:', error.message);
    }
    return this.generateSession();
  }

  async getProfile(): Promise<AngelOneProfile | null> {
    if (!this.isAuthenticated || !this.session) {
      throw new Error('Angel One not authenticated');
    }

    try {
      const response = await this.smartApi.getProfile();
      
      if (response.status && response.data) {
        this.profileData = response.data;
        console.log('🔶 [Angel One] Profile fetched:', response.data.name);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch profile');
      }
    } catch (error: any) {
      console.error('🔶 [Angel One] Error fetching profile:', error.message);
      throw error;
    }
  }

  async getLTP(exchange: string, tradingSymbol: string, symbolToken: string): Promise<AngelOneQuote | null> {
    if (!this.isAuthenticated) {
      throw new Error('Angel One not authenticated');
    }

    try {
      const response = await this.smartApi.getLTP({
        exchange,
        tradingsymbol: tradingSymbol,
        symboltoken: symbolToken
      });

      if (response.status && response.data) {
        const data = response.data;
        return {
          symbol: symbolToken,
          tradingSymbol: tradingSymbol,
          ltp: data.ltp || 0,
          open: data.open || 0,
          high: data.high || 0,
          low: data.low || 0,
          close: data.close || 0,
          change: data.ltp - data.close,
          changePercent: data.close ? ((data.ltp - data.close) / data.close) * 100 : 0,
          volume: data.volume || 0,
          exchange
        };
      }
      return null;
    } catch (error: any) {
      console.error('🔶 [Angel One] Error fetching LTP:', error.message);
      throw error;
    }
  }

  async getQuotes(symbolsData: Array<{ exchange: string; tradingSymbol: string; symbolToken: string }>): Promise<AngelOneQuote[]> {
    if (!this.isAuthenticated) {
      throw new Error('Angel One not authenticated');
    }

    const quotes: AngelOneQuote[] = [];

    for (const symbolData of symbolsData) {
      try {
        const quote = await this.getLTP(symbolData.exchange, symbolData.tradingSymbol, symbolData.symbolToken);
        if (quote) {
          quotes.push(quote);
        }
      } catch (error) {
        console.error(`🔶 [Angel One] Failed to get quote for ${symbolData.tradingSymbol}`);
      }
    }

    return quotes;
  }

  async getCandleData(
    exchange: string,
    symbolToken: string,
    interval: string,
    fromDate: string,
    toDate: string
  ): Promise<AngelOneCandleData[]> {
    if (!this.isAuthenticated) {
      throw new Error('Angel One not authenticated');
    }

    try {
      const response = await this.smartApi.getCandleData({
        exchange,
        symboltoken: symbolToken,
        interval,
        fromdate: fromDate,
        todate: toDate
      });

      if (response.status && response.data) {
        return response.data.map((candle: any[]) => ({
          timestamp: new Date(candle[0]).getTime(),
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
          volume: candle[5]
        }));
      }
      return [];
    } catch (error: any) {
      console.error('🔶 [Angel One] Error fetching candle data:', error.message);
      throw error;
    }
  }

  async getHoldings(): Promise<any[]> {
    if (!this.isAuthenticated) {
      throw new Error('Angel One not authenticated');
    }

    try {
      const response = await this.smartApi.getHolding();
      if (response.status && response.data) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      console.error('🔶 [Angel One] Error fetching holdings:', error.message);
      throw error;
    }
  }

  async getPositions(): Promise<any[]> {
    if (!this.isAuthenticated) {
      throw new Error('Angel One not authenticated');
    }

    try {
      const response = await this.smartApi.getPosition();
      if (response.status && response.data) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      console.error('🔶 [Angel One] Error fetching positions:', error.message);
      throw error;
    }
  }

  async getOrderBook(): Promise<any[]> {
    if (!this.isAuthenticated) {
      throw new Error('Angel One not authenticated');
    }

    try {
      const response = await this.smartApi.getOrderBook();
      if (response.status && response.data) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      console.error('🔶 [Angel One] Error fetching order book:', error.message);
      throw error;
    }
  }

  getConnectionStatus(): { connected: boolean; profile: AngelOneProfile | null; session: boolean } {
    return {
      connected: this.isAuthenticated,
      profile: this.profileData,
      session: !!this.session
    };
  }

  logout(): void {
    this.session = null;
    this.isAuthenticated = false;
    this.profileData = null;
    console.log('🔶 [Angel One] Logged out');
  }

  isConnected(): boolean {
    return this.isAuthenticated;
  }

  getSession(): AngelOneSession | null {
    return this.session;
  }
}

export const angelOneApi = new AngelOneAPI();
export default angelOneApi;
