import { users, apiStatus, marketData, activityLog, analysisInstructions, analysisResults, livestreamSettings, verifiedReports, type User, type InsertUser, type ApiStatus, type InsertApiStatus, type MarketData, type InsertMarketData, type ActivityLog, type InsertActivityLog, type AnalysisInstructions, type InsertAnalysisInstructions, type AnalysisResults, type InsertAnalysisResults, type LivestreamSettings, type InsertLivestreamSettings, type VerifiedReport, type InsertVerifiedReport } from "@shared/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc as descOrder, and, lt, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getApiStatus(): Promise<ApiStatus | undefined>;
  updateApiStatus(status: InsertApiStatus): Promise<ApiStatus>;
  
  getAllMarketData(): Promise<MarketData[]>;
  getMarketDataBySymbol(symbol: string): Promise<MarketData | undefined>;
  updateMarketData(data: InsertMarketData): Promise<MarketData>;
  
  getRecentActivityLogs(limit?: number): Promise<ActivityLog[]>;
  addActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Analysis Instructions methods
  getAllAnalysisInstructions(): Promise<AnalysisInstructions[]>;
  getAnalysisInstructionById(id: number): Promise<AnalysisInstructions | undefined>;
  getAnalysisInstructionByName(name: string): Promise<AnalysisInstructions | undefined>;
  createAnalysisInstruction(instruction: InsertAnalysisInstructions): Promise<AnalysisInstructions>;
  updateAnalysisInstruction(id: number, instruction: Partial<InsertAnalysisInstructions>): Promise<AnalysisInstructions>;
  deleteAnalysisInstruction(id: number): Promise<void>;
  
  // Analysis Results methods
  getAnalysisResults(instructionId?: number, limit?: number): Promise<AnalysisResults[]>;
  createAnalysisResult(result: InsertAnalysisResults): Promise<AnalysisResults>;
  deleteAnalysisResults(instructionId: number): Promise<void>;
  
  // Livestream Settings methods
  getLivestreamSettings(): Promise<LivestreamSettings | undefined>;
  updateLivestreamSettings(settings: InsertLivestreamSettings): Promise<LivestreamSettings>;
  
  // Verified Reports methods
  createVerifiedReport(report: InsertVerifiedReport): Promise<VerifiedReport>;
  getVerifiedReport(reportId: string): Promise<VerifiedReport | undefined>;
  incrementReportViews(reportId: string): Promise<void>;
  deleteExpiredReports(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private currentUserId: number;
  private apiStatusData: ApiStatus | undefined;
  private marketDataMap: Map<string, MarketData>;
  private activityLogsList: ActivityLog[];
  private currentMarketDataId: number;
  private currentActivityLogId: number;
  private analysisInstructionsMap: Map<number, AnalysisInstructions>;
  private analysisResultsList: AnalysisResults[];  
  private currentAnalysisInstructionId: number;
  private currentAnalysisResultId: number;
  private livestreamSettingsData: LivestreamSettings | undefined;
  private verifiedReportsMap: Map<string, VerifiedReport>;
  private currentVerifiedReportId: number;

  constructor() {
    this.users = new Map();
    this.currentUserId = 1;
    this.marketDataMap = new Map();
    this.activityLogsList = [];
    this.currentMarketDataId = 1;
    this.currentActivityLogId = 1;
    this.analysisInstructionsMap = new Map();
    this.analysisResultsList = [];
    this.currentAnalysisInstructionId = 1;
    this.currentAnalysisResultId = 1;
    this.verifiedReportsMap = new Map();
    this.currentVerifiedReportId = 1;
    
    // Initialize with default API status
    this.apiStatusData = {
      id: 1,
      connected: false,
      authenticated: false,
      lastUpdate: new Date(),
      version: "v3.0.0",
      dailyLimit: 100000,
      requestsUsed: 0,
      websocketActive: false,
      responseTime: 0,
      successRate: 0,
      throughput: "0 MB/s",
      activeSymbols: 0,
      updatesPerSec: 0,
      uptime: 0,
      latency: 0,
      accessToken: null,
      tokenExpiry: null,
    };

    // NO DEMO DATA - Only real-time data will be populated from Fyers API
    this.initializeDefaultActivityLogs();
  }

  // REMOVED: No demo market data - only real-time Fyers API data allowed

  private initializeDefaultActivityLogs() {
    // Only system startup logs - no fake data
    const logs = [
      { type: "info", message: "System initialized - waiting for real Fyers API authentication" },
    ];

    logs.forEach(logData => {
      // Create IST timestamp
      const istTimestamp = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      
      const log: ActivityLog = {
        id: this.currentActivityLogId++,
        timestamp: istTimestamp,
        type: logData.type,
        message: logData.message,
      };
      this.activityLogsList.push(log);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getApiStatus(): Promise<ApiStatus | undefined> {
    return this.apiStatusData;
  }

  async updateApiStatus(status: InsertApiStatus): Promise<ApiStatus> {
    this.apiStatusData = {
      id: 1,
      connected: status.connected ?? false,
      authenticated: status.authenticated ?? false,
      version: status.version ?? "v3.0.0",
      dailyLimit: status.dailyLimit ?? 100000,
      requestsUsed: status.requestsUsed ?? 0,
      websocketActive: status.websocketActive ?? false,
      responseTime: status.responseTime ?? 0,
      successRate: status.successRate ?? 0,
      throughput: status.throughput ?? "0 MB/s",
      activeSymbols: status.activeSymbols ?? 0,
      updatesPerSec: status.updatesPerSec ?? 0,
      uptime: status.uptime ?? 0,
      latency: status.latency ?? 0,
      accessToken: status.accessToken ?? null,
      tokenExpiry: status.tokenExpiry ?? null,
      lastUpdate: new Date(),
    };
    return this.apiStatusData;
  }

  async getAllMarketData(): Promise<MarketData[]> {
    return Array.from(this.marketDataMap.values());
  }

  async getMarketDataBySymbol(symbol: string): Promise<MarketData | undefined> {
    return this.marketDataMap.get(symbol);
  }

  async updateMarketData(data: InsertMarketData): Promise<MarketData> {
    const existing = this.marketDataMap.get(data.symbol);
    const marketData: MarketData = {
      id: existing?.id || this.currentMarketDataId++,
      ...data,
      lastUpdate: new Date(),
    };
    this.marketDataMap.set(data.symbol, marketData);
    return marketData;
  }

  async getRecentActivityLogs(limit: number = 10): Promise<ActivityLog[]> {
    return this.activityLogsList
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async addActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    // Create IST timestamp
    const istTimestamp = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    const activityLog: ActivityLog = {
      id: this.currentActivityLogId++,
      timestamp: istTimestamp,
      ...log,
    };
    this.activityLogsList.push(activityLog);
    
    // Keep only last 100 logs
    if (this.activityLogsList.length > 100) {
      this.activityLogsList = this.activityLogsList.slice(-100);
    }
    
    return activityLog;
  }

  // Analysis Instructions methods
  async getAllAnalysisInstructions(): Promise<AnalysisInstructions[]> {
    return Array.from(this.analysisInstructionsMap.values());
  }

  async getAnalysisInstructionById(id: number): Promise<AnalysisInstructions | undefined> {
    return this.analysisInstructionsMap.get(id);
  }

  async getAnalysisInstructionByName(name: string): Promise<AnalysisInstructions | undefined> {
    return Array.from(this.analysisInstructionsMap.values()).find(
      (instruction) => instruction.name === name
    );
  }

  async createAnalysisInstruction(instruction: InsertAnalysisInstructions): Promise<AnalysisInstructions> {
    const id = this.currentAnalysisInstructionId++;
    const analysisInstruction: AnalysisInstructions = {
      id,
      name: instruction.name,
      description: instruction.description,
      instructions: Array.isArray(instruction.instructions) ? instruction.instructions : [],
      isActive: instruction.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.analysisInstructionsMap.set(id, analysisInstruction);
    return analysisInstruction;
  }

  async updateAnalysisInstruction(id: number, instruction: Partial<InsertAnalysisInstructions>): Promise<AnalysisInstructions> {
    const existing = this.analysisInstructionsMap.get(id);
    if (!existing) {
      throw new Error(`Analysis instruction with id ${id} not found`);
    }
    
    const updated: AnalysisInstructions = {
      ...existing,
      name: instruction.name ?? existing.name,
      description: instruction.description ?? existing.description,
      instructions: Array.isArray(instruction.instructions) ? instruction.instructions : existing.instructions,
      isActive: instruction.isActive ?? existing.isActive,
      updatedAt: new Date(),
    };
    this.analysisInstructionsMap.set(id, updated);
    return updated;
  }

  async deleteAnalysisInstruction(id: number): Promise<void> {
    this.analysisInstructionsMap.delete(id);
    // Also delete related results
    this.analysisResultsList = this.analysisResultsList.filter(
      (result) => result.instructionId !== id
    );
  }

  // Analysis Results methods
  async getAnalysisResults(instructionId?: number, limit: number = 20): Promise<AnalysisResults[]> {
    let results = this.analysisResultsList;
    
    if (instructionId !== undefined) {
      results = results.filter((result) => result.instructionId === instructionId);
    }
    
    return results
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
      .slice(0, limit);
  }

  async createAnalysisResult(result: InsertAnalysisResults): Promise<AnalysisResults> {
    const analysisResult: AnalysisResults = {
      id: this.currentAnalysisResultId++,
      instructionId: result.instructionId,
      symbol: result.symbol,
      timeframe: result.timeframe,
      dateRange: result.dateRange,
      inputData: Array.isArray(result.inputData) ? result.inputData : [],
      processedData: result.processedData || {},
      metadata: result.metadata ? {
        executionTime: result.metadata.executionTime || 0,
        dataPoints: result.metadata.dataPoints || 0,
        errors: Array.isArray(result.metadata.errors) ? result.metadata.errors : undefined,
        warnings: Array.isArray(result.metadata.warnings) ? result.metadata.warnings : undefined,
      } : null,
      executedAt: new Date(),
      createdAt: new Date(),
    };
    this.analysisResultsList.push(analysisResult);
    
    // Keep only last 100 results
    if (this.analysisResultsList.length > 100) {
      this.analysisResultsList = this.analysisResultsList.slice(-100);
    }
    
    return analysisResult;
  }

  async deleteAnalysisResults(instructionId: number): Promise<void> {
    this.analysisResultsList = this.analysisResultsList.filter(
      (result) => result.instructionId !== instructionId
    );
  }

  async getLivestreamSettings(): Promise<LivestreamSettings | undefined> {
    return this.livestreamSettingsData;
  }

  async updateLivestreamSettings(settings: InsertLivestreamSettings): Promise<LivestreamSettings> {
    const livestreamSettings: LivestreamSettings = {
      id: 1,
      youtubeUrl: settings.youtubeUrl ?? null,
      updatedAt: new Date(),
    };
    this.livestreamSettingsData = livestreamSettings;
    return livestreamSettings;
  }

  // Verified Reports methods
  async createVerifiedReport(report: InsertVerifiedReport): Promise<VerifiedReport> {
    const verifiedReport: VerifiedReport = {
      id: this.currentVerifiedReportId++,
      reportId: report.reportId,
      userId: report.userId,
      username: report.username,
      reportData: report.reportData,
      shareUrl: report.shareUrl,
      views: 0,
      createdAt: new Date(),
      expiresAt: report.expiresAt,
    };
    this.verifiedReportsMap.set(report.reportId, verifiedReport);
    return verifiedReport;
  }

  async getVerifiedReport(reportId: string): Promise<VerifiedReport | undefined> {
    const report = this.verifiedReportsMap.get(reportId);
    // Check if report exists and hasn't expired
    if (report && report.expiresAt > new Date()) {
      return report;
    }
    return undefined;
  }

  async incrementReportViews(reportId: string): Promise<void> {
    const report = this.verifiedReportsMap.get(reportId);
    if (report) {
      report.views++;
      this.verifiedReportsMap.set(reportId, report);
    }
  }

  async deleteExpiredReports(): Promise<void> {
    const now = new Date();
    const entries = Array.from(this.verifiedReportsMap.entries());
    for (const [reportId, report] of entries) {
      if (report.expiresAt <= now) {
        this.verifiedReportsMap.delete(reportId);
      }
    }
  }
}

// PostgreSQL Storage Implementation
export class PgStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    try {
      // Check if API status exists, if not create default
      const existingStatus = await this.db.select().from(apiStatus).limit(1);
      if (existingStatus.length === 0) {
        await this.db.insert(apiStatus).values({
          connected: false,
          authenticated: false,
          lastUpdate: new Date(),
          version: "v3.0.0",
          dailyLimit: 100000,
          requestsUsed: 0,
          websocketActive: false,
          responseTime: 0,
          successRate: 0,
          throughput: "0 MB/s",
          activeSymbols: 0,
          updatesPerSec: 0,
          uptime: 0,
          latency: 0,
          accessToken: null,
          tokenExpiry: null,
        });
      }

      // NO DEMO DATA - Market data will only be populated from real-time Fyers API
    } catch (error) {
      console.error('Failed to initialize default data:', error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  async getApiStatus(): Promise<ApiStatus | undefined> {
    const result = await this.db.select().from(apiStatus).limit(1);
    return result[0];
  }

  async updateApiStatus(status: InsertApiStatus): Promise<ApiStatus> {
    const existing = await this.getApiStatus();
    if (existing) {
      const result = await this.db
        .update(apiStatus)
        .set({ ...status, lastUpdate: new Date() })
        .where(eq(apiStatus.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await this.db.insert(apiStatus).values({
        ...status,
        lastUpdate: new Date(),
      }).returning();
      return result[0];
    }
  }

  async getAllMarketData(): Promise<MarketData[]> {
    return await this.db.select().from(marketData);
  }

  async getMarketDataBySymbol(symbol: string): Promise<MarketData | undefined> {
    const result = await this.db.select().from(marketData).where(eq(marketData.symbol, symbol)).limit(1);
    return result[0];
  }

  async updateMarketData(data: InsertMarketData): Promise<MarketData> {
    const existing = await this.getMarketDataBySymbol(data.symbol);
    if (existing) {
      const result = await this.db
        .update(marketData)
        .set({ ...data, lastUpdate: new Date() })
        .where(eq(marketData.symbol, data.symbol))
        .returning();
      return result[0];
    } else {
      const result = await this.db.insert(marketData).values({
        ...data,
        lastUpdate: new Date(),
      }).returning();
      return result[0];
    }
  }

  async getRecentActivityLogs(limit: number = 10): Promise<ActivityLog[]> {
    return await this.db.select().from(activityLog).orderBy(descOrder(activityLog.timestamp)).limit(limit);
  }

  async addActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const result = await this.db.insert(activityLog).values({
      ...log,
      timestamp: new Date(),
    }).returning();
    return result[0];
  }

  // Analysis Instructions methods
  async getAllAnalysisInstructions(): Promise<AnalysisInstructions[]> {
    return await this.db.select().from(analysisInstructions);
  }

  async getAnalysisInstructionById(id: number): Promise<AnalysisInstructions | undefined> {
    const result = await this.db.select().from(analysisInstructions).where(eq(analysisInstructions.id, id)).limit(1);
    return result[0];
  }

  async getAnalysisInstructionByName(name: string): Promise<AnalysisInstructions | undefined> {
    const result = await this.db.select().from(analysisInstructions).where(eq(analysisInstructions.name, name)).limit(1);
    return result[0];
  }

  async createAnalysisInstruction(instruction: InsertAnalysisInstructions): Promise<AnalysisInstructions> {
    const result = await this.db.insert(analysisInstructions).values({
      name: instruction.name,
      description: instruction.description,
      instructions: Array.isArray(instruction.instructions) ? instruction.instructions : [],
      isActive: instruction.isActive ?? true,
    }).returning();
    return result[0];
  }

  async updateAnalysisInstruction(id: number, instruction: Partial<InsertAnalysisInstructions>): Promise<AnalysisInstructions> {
    const updateData: any = { ...instruction };
    if (instruction.instructions && !Array.isArray(instruction.instructions)) {
      updateData.instructions = Array.isArray(instruction.instructions) ? instruction.instructions : [];
    }
    
    const result = await this.db
      .update(analysisInstructions)
      .set(updateData)
      .where(eq(analysisInstructions.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Analysis instruction with id ${id} not found`);
    }
    
    return result[0];
  }

  async deleteAnalysisInstruction(id: number): Promise<void> {
    // Delete related results first
    await this.db.delete(analysisResults).where(eq(analysisResults.instructionId, id));
    // Then delete the instruction
    await this.db.delete(analysisInstructions).where(eq(analysisInstructions.id, id));
  }

  // Analysis Results methods
  async getAnalysisResults(instructionId?: number, limit: number = 20): Promise<AnalysisResults[]> {
    let baseQuery = this.db.select().from(analysisResults);
    
    if (instructionId !== undefined) {
      return await baseQuery.where(eq(analysisResults.instructionId, instructionId)).orderBy(descOrder(analysisResults.executedAt)).limit(limit);
    }
    
    return await baseQuery.orderBy(descOrder(analysisResults.executedAt)).limit(limit);
  }

  async createAnalysisResult(result: InsertAnalysisResults): Promise<AnalysisResults> {
    const dbResult = await this.db.insert(analysisResults).values({
      instructionId: result.instructionId,
      symbol: result.symbol,
      timeframe: result.timeframe,
      dateRange: result.dateRange,
      inputData: Array.isArray(result.inputData) ? result.inputData : [],
      processedData: result.processedData || {},
      metadata: result.metadata ? {
        executionTime: result.metadata.executionTime || 0,
        dataPoints: result.metadata.dataPoints || 0,
        errors: Array.isArray(result.metadata.errors) ? result.metadata.errors : undefined,
        warnings: Array.isArray(result.metadata.warnings) ? result.metadata.warnings : undefined,
      } : null,
    }).returning();
    return dbResult[0];
  }

  async deleteAnalysisResults(instructionId: number): Promise<void> {
    await this.db.delete(analysisResults).where(eq(analysisResults.instructionId, instructionId));
  }

  async getLivestreamSettings(): Promise<LivestreamSettings | undefined> {
    const settings = await this.db.select().from(livestreamSettings).where(eq(livestreamSettings.id, 1));
    return settings[0];
  }

  async updateLivestreamSettings(settings: InsertLivestreamSettings): Promise<LivestreamSettings> {
    const existing = await this.getLivestreamSettings();
    const updatedAt = new Date();
    
    if (existing) {
      const updated = await this.db.update(livestreamSettings)
        .set({ youtubeUrl: settings.youtubeUrl, updatedAt })
        .where(eq(livestreamSettings.id, 1))
        .returning();
      return updated[0];
    } else {
      const created = await this.db.insert(livestreamSettings)
        .values({ youtubeUrl: settings.youtubeUrl, updatedAt })
        .returning();
      return created[0];
    }
  }

  // Verified Reports methods
  async createVerifiedReport(report: InsertVerifiedReport): Promise<VerifiedReport> {
    const created = await this.db.insert(verifiedReports)
      .values({
        reportId: report.reportId,
        userId: report.userId,
        username: report.username,
        reportData: report.reportData,
        shareUrl: report.shareUrl,
        expiresAt: report.expiresAt,
      })
      .returning();
    return created[0];
  }

  async getVerifiedReport(reportId: string): Promise<VerifiedReport | undefined> {
    const reports = await this.db.select()
      .from(verifiedReports)
      .where(eq(verifiedReports.reportId, reportId))
      .limit(1);
    
    if (reports.length > 0 && reports[0].expiresAt > new Date()) {
      return reports[0];
    }
    return undefined;
  }

  async incrementReportViews(reportId: string): Promise<void> {
    await this.db.update(verifiedReports)
      .set({ views: sql`${verifiedReports.views} + 1` })
      .where(eq(verifiedReports.reportId, reportId));
  }

  async deleteExpiredReports(): Promise<void> {
    const now = new Date();
    await this.db.delete(verifiedReports)
      .where(lt(verifiedReports.expiresAt, now));
  }
}

// Firebase-only storage - no PostgreSQL
import { storage as firebaseStorage } from './firebase-storage';
export const storage = firebaseStorage;
