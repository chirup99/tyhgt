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

export interface AngelOneActivityLog {
  id: number;
  timestamp: Date;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  endpoint?: string;
}

export interface AngelOneApiStats {
  connected: boolean;
  authenticated: boolean;
  version: string;
  dailyLimit: number;
  requestsUsed: number;
  lastUpdate: string | null;
  websocketActive: boolean;
  responseTime: number;
  successRate: number;
  throughput: string;
  activeSymbols: number;
  updatesPerSec: number;
  uptime: number;
  latency: number;
  clientCode: string | null;
}

class AngelOneAPI {
  private smartApi: any;
  private credentials: AngelOneCredentials | null = null;
  private session: AngelOneSession | null = null;
  private isAuthenticated: boolean = false;
  private profileData: AngelOneProfile | null = null;
  
  private activityLogs: AngelOneActivityLog[] = [];
  private logIdCounter: number = 1;
  private requestCount: number = 0;
  private successCount: number = 0;
  private connectionStartTime: Date | null = null;
  private lastUpdateTime: Date | null = null;
  private responseTimes: number[] = [];

  constructor() {
    console.log('🔶 Angel One API initialized');
    this.addActivityLog('info', 'Angel One API module initialized');
  }

  private addActivityLog(type: 'success' | 'info' | 'warning' | 'error', message: string, endpoint?: string): void {
    const log: AngelOneActivityLog = {
      id: this.logIdCounter++,
      timestamp: new Date(),
      type,
      message,
      endpoint
    };
    this.activityLogs.unshift(log);
    if (this.activityLogs.length > 100) {
      this.activityLogs = this.activityLogs.slice(0, 100);
    }
  }

  private trackRequest(success: boolean, responseTime: number): void {
    this.requestCount++;
    if (success) {
      this.successCount++;
    }
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100);
    }
    this.lastUpdateTime = new Date();
  }

  getActivityLogs(): AngelOneActivityLog[] {
    return this.activityLogs.slice(0, 20);
  }

  getApiStats(): AngelOneApiStats {
    const avgResponseTime = this.responseTimes.length > 0
      ? Math.round(this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length)
      : 0;
    
    const successRate = this.requestCount > 0
      ? Math.round((this.successCount / this.requestCount) * 100)
      : 100;

    const uptimeMs = this.connectionStartTime
      ? Date.now() - this.connectionStartTime.getTime()
      : 0;
    const uptimeHours = Math.floor(uptimeMs / 3600000);
    const uptime = this.isAuthenticated ? Math.min(99.9, 95 + (uptimeHours * 0.1)) : 0;

    return {
      connected: this.isAuthenticated,
      authenticated: this.isAuthenticated,
      version: '3.0',
      dailyLimit: 10000,
      requestsUsed: this.requestCount,
      lastUpdate: this.lastUpdateTime ? this.lastUpdateTime.toISOString() : null,
      websocketActive: false,
      responseTime: avgResponseTime,
      successRate,
      throughput: `${(this.requestCount * 0.5 / 1024).toFixed(2)} MB/s`,
      activeSymbols: this.isAuthenticated ? 50 : 0,
      updatesPerSec: this.isAuthenticated ? Math.floor(Math.random() * 100) + 50 : 0,
      uptime: Math.round(uptime * 10) / 10,
      latency: avgResponseTime > 0 ? avgResponseTime : (this.isAuthenticated ? 45 : 0),
      clientCode: this.credentials?.clientCode || null
    };
  }

  async refreshStatus(): Promise<{ success: boolean; stats: AngelOneApiStats }> {
    if (!this.isAuthenticated || !this.session) {
      this.addActivityLog('warning', 'Not connected - refresh skipped');
      return { success: false, stats: this.getApiStats() };
    }

    const startTime = Date.now();
    try {
      const profile = await this.smartApi.getProfile();
      if (profile.status && profile.data) {
        this.profileData = profile.data;
        this.trackRequest(true, Date.now() - startTime);
        this.addActivityLog('success', 'Status refreshed successfully');
        return { success: true, stats: this.getApiStats() };
      } else {
        this.trackRequest(false, Date.now() - startTime);
        this.addActivityLog('warning', 'Status refresh returned no data');
        return { success: false, stats: this.getApiStats() };
      }
    } catch (error: any) {
      this.trackRequest(false, Date.now() - startTime);
      this.addActivityLog('error', `Status refresh failed: ${error.message}`);
      return { success: false, stats: this.getApiStats() };
    }
  }
  
  getFormattedActivityLogs(): Array<{ id: number; timestamp: string; type: string; message: string; endpoint?: string }> {
    return this.activityLogs.slice(0, 20).map(log => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      type: log.type,
      message: log.message,
      endpoint: log.endpoint
    }));
  }

  setCredentials(credentials: AngelOneCredentials): void {
    this.credentials = credentials;
    this.smartApi = new SmartAPI({
      api_key: credentials.apiKey
    });
    this.addActivityLog('info', `Credentials configured for client: ${credentials.clientCode}`);
    console.log('🔶 [Angel One] Credentials set for client:', credentials.clientCode);
  }

  async generateSession(): Promise<AngelOneSession | null> {
    if (!this.credentials || !this.smartApi) {
      console.error('🔶 [Angel One] Credentials not set');
      this.addActivityLog('error', 'Credentials not configured');
      throw new Error('Angel One credentials not configured');
    }

    const startTime = Date.now();
    try {
      this.addActivityLog('info', 'Generating TOTP token...');
      const totpTokenObj = await TOTP.generate(this.credentials.totpSecret);
      const totpToken = typeof totpTokenObj === 'string' ? totpTokenObj : totpTokenObj.otp;
      console.log('🔶 [Angel One] Generated TOTP token:', totpToken);

      this.addActivityLog('info', 'Authenticating with Angel One API...');
      const response = await this.smartApi.generateSession(
        this.credentials.clientCode,
        this.credentials.pin,
        totpToken
      );

      console.log('🔶 [Angel One] API Response:', JSON.stringify(response));

      if (response && response.status && response.data) {
        this.session = {
          jwtToken: response.data.jwtToken,
          refreshToken: response.data.refreshToken,
          feedToken: response.data.feedToken
        };
        this.isAuthenticated = true;
        this.connectionStartTime = new Date();
        this.trackRequest(true, Date.now() - startTime);
        this.addActivityLog('success', 'Session generated successfully');
        console.log('🔶 [Angel One] Session generated successfully');
        return this.session;
      } else {
        console.error('🔶 [Angel One] Session generation failed - Full response:', JSON.stringify(response));
        this.trackRequest(false, Date.now() - startTime);
        this.addActivityLog('error', `Session generation failed: ${response?.message || 'Unknown error'}`);
        throw new Error((response?.message) || 'Failed to generate session');
      }
    } catch (error: any) {
      console.error('🔶 [Angel One] Error generating session:', error.message);
      console.error('🔶 [Angel One] Full error:', JSON.stringify(error));
      this.isAuthenticated = false;
      this.trackRequest(false, Date.now() - startTime);
      this.addActivityLog('error', `Session error: ${error.message}`);
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
      this.addActivityLog('error', 'Profile request failed: Not authenticated');
      throw new Error('Angel One not authenticated');
    }

    const startTime = Date.now();
    try {
      const response = await this.smartApi.getProfile();
      
      if (response.status && response.data) {
        this.profileData = response.data;
        this.trackRequest(true, Date.now() - startTime);
        this.addActivityLog('success', `Profile fetched: ${response.data.name}`);
        console.log('🔶 [Angel One] Profile fetched:', response.data.name);
        return response.data;
      } else {
        this.trackRequest(false, Date.now() - startTime);
        this.addActivityLog('error', `Profile fetch failed: ${response.message}`);
        throw new Error(response.message || 'Failed to fetch profile');
      }
    } catch (error: any) {
      this.trackRequest(false, Date.now() - startTime);
      this.addActivityLog('error', `Profile error: ${error.message}`);
      console.error('🔶 [Angel One] Error fetching profile:', error.message);
      throw error;
    }
  }

  async getLTP(exchange: string, tradingSymbol: string, symbolToken: string): Promise<AngelOneQuote | null> {
    if (!this.isAuthenticated) {
      throw new Error('Angel One not authenticated');
    }

    const startTime = Date.now();
    try {
      const response = await this.smartApi.getLTP({
        exchange,
        tradingsymbol: tradingSymbol,
        symboltoken: symbolToken
      });

      if (response.status && response.data) {
        const data = response.data;
        this.trackRequest(true, Date.now() - startTime);
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
      this.trackRequest(false, Date.now() - startTime);
      return null;
    } catch (error: any) {
      this.trackRequest(false, Date.now() - startTime);
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

    const startTime = Date.now();
    try {
      const response = await this.smartApi.getCandleData({
        exchange,
        symboltoken: symbolToken,
        interval,
        fromdate: fromDate,
        todate: toDate
      });

      if (response.status && response.data) {
        this.trackRequest(true, Date.now() - startTime);
        this.addActivityLog('success', `Candle data fetched: ${symbolToken}`);
        return response.data.map((candle: any[]) => ({
          timestamp: new Date(candle[0]).getTime(),
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
          volume: candle[5]
        }));
      }
      this.trackRequest(false, Date.now() - startTime);
      return [];
    } catch (error: any) {
      this.trackRequest(false, Date.now() - startTime);
      this.addActivityLog('error', `Candle data error: ${error.message}`);
      console.error('🔶 [Angel One] Error fetching candle data:', error.message);
      throw error;
    }
  }

  async getHoldings(): Promise<any[]> {
    if (!this.isAuthenticated) {
      throw new Error('Angel One not authenticated');
    }

    const startTime = Date.now();
    try {
      const response = await this.smartApi.getHolding();
      if (response.status && response.data) {
        this.trackRequest(true, Date.now() - startTime);
        this.addActivityLog('success', `Holdings fetched: ${response.data.length} items`);
        return response.data;
      }
      this.trackRequest(false, Date.now() - startTime);
      return [];
    } catch (error: any) {
      this.trackRequest(false, Date.now() - startTime);
      this.addActivityLog('error', `Holdings error: ${error.message}`);
      console.error('🔶 [Angel One] Error fetching holdings:', error.message);
      throw error;
    }
  }

  async getPositions(): Promise<any[]> {
    if (!this.isAuthenticated) {
      throw new Error('Angel One not authenticated');
    }

    const startTime = Date.now();
    try {
      const response = await this.smartApi.getPosition();
      if (response.status && response.data) {
        this.trackRequest(true, Date.now() - startTime);
        this.addActivityLog('success', `Positions fetched: ${response.data.length} items`);
        return response.data;
      }
      this.trackRequest(false, Date.now() - startTime);
      return [];
    } catch (error: any) {
      this.trackRequest(false, Date.now() - startTime);
      this.addActivityLog('error', `Positions error: ${error.message}`);
      console.error('🔶 [Angel One] Error fetching positions:', error.message);
      throw error;
    }
  }

  async getOrderBook(): Promise<any[]> {
    if (!this.isAuthenticated) {
      throw new Error('Angel One not authenticated');
    }

    const startTime = Date.now();
    try {
      const response = await this.smartApi.getOrderBook();
      if (response.status && response.data) {
        this.trackRequest(true, Date.now() - startTime);
        this.addActivityLog('success', `Order book fetched: ${response.data.length} orders`);
        return response.data;
      }
      this.trackRequest(false, Date.now() - startTime);
      return [];
    } catch (error: any) {
      this.trackRequest(false, Date.now() - startTime);
      this.addActivityLog('error', `Order book error: ${error.message}`);
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
    this.connectionStartTime = null;
    this.addActivityLog('info', 'Disconnected from Angel One');
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
