import { getFirestore } from 'firebase-admin/firestore';
import type {
  User, InsertUser,
  ApiStatus, InsertApiStatus,
  MarketData, InsertMarketData,
  ActivityLog, InsertActivityLog,
  AnalysisInstructions, InsertAnalysisInstructions,
  AnalysisResults, InsertAnalysisResults,
  LivestreamSettings, InsertLivestreamSettings
} from "@shared/schema";
import type { IStorage } from './storage';

export class FirebaseStorage implements IStorage {
  private _db: FirebaseFirestore.Firestore | null = null;

  private get db(): FirebaseFirestore.Firestore {
    if (!this._db) {
      this._db = getFirestore();
    }
    return this._db;
  }

  constructor() {
  }

  async getUser(id: number): Promise<User | undefined> {
    const usersSnapshot = await this.db.collection('users')
      .where('id', '==', id)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) return undefined;
    return usersSnapshot.docs[0].data() as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const usersSnapshot = await this.db.collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) return undefined;
    return usersSnapshot.docs[0].data() as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const idDoc = await this.db.collection('_counters').doc('users').get();
    const currentId = idDoc.exists ? (idDoc.data()?.lastId || 0) : 0;
    const newId = currentId + 1;
    
    const user: User = {
      ...insertUser,
      id: newId
    };
    
    await this.db.collection('users').doc(`user_${newId}`).set(user);
    await this.db.collection('_counters').doc('users').set({ lastId: newId });
    
    return user;
  }

  async getApiStatus(): Promise<ApiStatus | undefined> {
    const doc = await this.db.collection('global').doc('api_status').get();
    if (!doc.exists) return undefined;
    return doc.data() as ApiStatus;
  }

  async updateApiStatus(status: InsertApiStatus): Promise<ApiStatus> {
    const apiStatus: ApiStatus = {
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
    
    await this.db.collection('global').doc('api_status').set(apiStatus);
    return apiStatus;
  }

  async getAllMarketData(): Promise<MarketData[]> {
    const snapshot = await this.db.collection('global').doc('market_data').collection('symbols').get();
    return snapshot.docs.map(doc => doc.data() as MarketData);
  }

  async getMarketDataBySymbol(symbol: string): Promise<MarketData | undefined> {
    const doc = await this.db.collection('global').doc('market_data')
      .collection('symbols').doc(symbol).get();
    if (!doc.exists) return undefined;
    return doc.data() as MarketData;
  }

  async updateMarketData(data: InsertMarketData): Promise<MarketData> {
    const existing = await this.getMarketDataBySymbol(data.symbol);
    
    const idDoc = await this.db.collection('_counters').doc('market_data').get();
    const currentId = idDoc.exists ? (idDoc.data()?.lastId || 0) : 0;
    
    const marketData: MarketData = {
      id: existing?.id || currentId + 1,
      ...data,
      lastUpdate: new Date(),
    };
    
    if (!existing) {
      await this.db.collection('_counters').doc('market_data').set({ lastId: currentId + 1 });
    }
    
    await this.db.collection('global').doc('market_data')
      .collection('symbols').doc(data.symbol).set(marketData);
    
    return marketData;
  }

  async getRecentActivityLogs(limit: number = 10): Promise<ActivityLog[]> {
    const snapshot = await this.db.collection('global').doc('activity_logs')
      .collection('logs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => doc.data() as ActivityLog);
  }

  async addActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const idDoc = await this.db.collection('_counters').doc('activity_logs').get();
    const currentId = idDoc.exists ? (idDoc.data()?.lastId || 0) : 0;
    const newId = currentId + 1;
    
    const activityLog: ActivityLog = {
      id: newId,
      timestamp: new Date(),
      type: log.type,
      message: log.message,
    };
    
    await this.db.collection('global').doc('activity_logs')
      .collection('logs').doc(`log_${newId}`).set(activityLog);
    await this.db.collection('_counters').doc('activity_logs').set({ lastId: newId });
    
    return activityLog;
  }

  async getAllAnalysisInstructions(): Promise<AnalysisInstructions[]> {
    const snapshot = await this.db.collection('analysis_instructions').get();
    return snapshot.docs.map(doc => doc.data() as AnalysisInstructions);
  }

  async getAnalysisInstructionById(id: number): Promise<AnalysisInstructions | undefined> {
    const snapshot = await this.db.collection('analysis_instructions')
      .where('id', '==', id)
      .limit(1)
      .get();
    
    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as AnalysisInstructions;
  }

  async getAnalysisInstructionByName(name: string): Promise<AnalysisInstructions | undefined> {
    const snapshot = await this.db.collection('analysis_instructions')
      .where('name', '==', name)
      .limit(1)
      .get();
    
    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as AnalysisInstructions;
  }

  async createAnalysisInstruction(instruction: InsertAnalysisInstructions): Promise<AnalysisInstructions> {
    const idDoc = await this.db.collection('_counters').doc('analysis_instructions').get();
    const currentId = idDoc.exists ? (idDoc.data()?.lastId || 0) : 0;
    const newId = currentId + 1;
    
    const newInstruction: AnalysisInstructions = {
      ...instruction,
      id: newId,
      isActive: instruction.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await this.db.collection('analysis_instructions').doc(`instruction_${newId}`).set(newInstruction);
    await this.db.collection('_counters').doc('analysis_instructions').set({ lastId: newId });
    
    return newInstruction;
  }

  async updateAnalysisInstruction(id: number, instruction: Partial<InsertAnalysisInstructions>): Promise<AnalysisInstructions> {
    const snapshot = await this.db.collection('analysis_instructions')
      .where('id', '==', id)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      throw new Error(`Analysis instruction with id ${id} not found`);
    }
    
    const doc = snapshot.docs[0];
    const existing = doc.data() as AnalysisInstructions;
    
    const updated: AnalysisInstructions = {
      ...existing,
      ...instruction,
      updatedAt: new Date(),
    };
    
    await doc.ref.set(updated);
    return updated;
  }

  async deleteAnalysisInstruction(id: number): Promise<void> {
    const snapshot = await this.db.collection('analysis_instructions')
      .where('id', '==', id)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.delete();
    }
  }

  async getAnalysisResults(instructionId?: number, limit: number = 10): Promise<AnalysisResults[]> {
    let query: FirebaseFirestore.Query = this.db.collection('analysis_results')
      .orderBy('executedAt', 'desc')
      .limit(limit);
    
    if (instructionId !== undefined) {
      query = query.where('instructionId', '==', instructionId);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as AnalysisResults);
  }

  async createAnalysisResult(result: InsertAnalysisResults): Promise<AnalysisResults> {
    const idDoc = await this.db.collection('_counters').doc('analysis_results').get();
    const currentId = idDoc.exists ? (idDoc.data()?.lastId || 0) : 0;
    const newId = currentId + 1;
    
    const newResult: AnalysisResults = {
      ...result,
      id: newId,
      metadata: result.metadata ?? null,
      executedAt: new Date(),
      createdAt: new Date(),
    };
    
    await this.db.collection('analysis_results').doc(`result_${newId}`).set(newResult);
    await this.db.collection('_counters').doc('analysis_results').set({ lastId: newId });
    
    return newResult;
  }

  async deleteAnalysisResults(instructionId: number): Promise<void> {
    const snapshot = await this.db.collection('analysis_results')
      .where('instructionId', '==', instructionId)
      .get();
    
    const batch = this.db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  async getLivestreamSettings(): Promise<LivestreamSettings | undefined> {
    try {
      const doc = await this.db.collection('global').doc('livestream_settings').get();
      if (!doc.exists) {
        console.log('📺 No livestream settings found in Firebase, returning undefined');
        return undefined;
      }
      
      const data = doc.data();
      // Convert Firestore Timestamp to Date
      const settings = {
        id: data?.id || 1,
        youtubeUrl: data?.youtubeUrl ?? null,
        updatedAt: data?.updatedAt?.toDate?.() || new Date(),
      };
      console.log('📺 Livestream settings retrieved from Firebase:', settings);
      return settings;
    } catch (error: any) {
      console.error('❌ Error fetching livestream settings from Firebase:', error.message);
      // Return undefined instead of throwing to prevent API failures
      return undefined;
    }
  }

  async updateLivestreamSettings(settings: InsertLivestreamSettings): Promise<LivestreamSettings> {
    try {
      const now = new Date();
      const livestreamSettings: LivestreamSettings = {
        id: 1,
        youtubeUrl: settings.youtubeUrl ?? null,
        updatedAt: now,
      };
      
      console.log('💾 Saving livestream settings to Firebase:', livestreamSettings);
      await this.db.collection('global').doc('livestream_settings').set(livestreamSettings);
      console.log('✅ Livestream settings saved to Firebase successfully');
      return livestreamSettings;
    } catch (error: any) {
      console.error('❌ Error saving livestream settings to Firebase:', error.message);
      throw error; // Re-throw to let the API route handle it
    }
  }

  async initializeDefaultData(): Promise<void> {
    const apiStatus = await this.getApiStatus();
    if (!apiStatus) {
      await this.updateApiStatus({
        connected: false,
        authenticated: false,
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
        lastUpdate: new Date(),
      });
    }

    const logs = await this.getRecentActivityLogs(1);
    if (logs.length === 0) {
      await this.addActivityLog({
        type: "info",
        message: "System initialized - waiting for real Fyers API authentication",
      });
    }
  }

  // Verified Reports methods
  async createVerifiedReport(report: InsertVerifiedReport): Promise<VerifiedReport> {
    try {
      const verifiedReport: VerifiedReport = {
        id: 0, // Firebase will auto-generate
        ...report,
        createdAt: new Date(),
      };

      const docRef = await this.db.collection('verified-reports').add(verifiedReport);
      const doc = await docRef.get();
      
      return { id: parseInt(docRef.id) || 0, ...doc.data() } as VerifiedReport;
    } catch (error) {
      console.error('Error creating verified report:', error);
      throw new Error('Failed to create verified report in Firebase');
    }
  }

  async getVerifiedReport(reportId: string): Promise<VerifiedReport | undefined> {
    try {
      const snapshot = await this.db.collection('verified-reports')
        .where('reportId', '==', reportId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return undefined;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      // Check if expired
      const expiresAt = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
      if (expiresAt <= new Date()) {
        return undefined;
      }

      return {
        id: parseInt(doc.id) || 0,
        reportId: data.reportId,
        userId: data.userId,
        username: data.username,
        reportData: data.reportData,
        shareUrl: data.shareUrl,
        views: data.views || 0,
        expiresAt,
        createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      } as VerifiedReport;
    } catch (error) {
      console.error('Error getting verified report:', error);
      return undefined;
    }
  }

  async incrementReportViews(reportId: string): Promise<void> {
    try {
      const snapshot = await this.db.collection('verified-reports')
        .where('reportId', '==', reportId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const currentViews = doc.data().views || 0;
        await doc.ref.update({ views: currentViews + 1 });
      }
    } catch (error) {
      console.error('Error incrementing report views:', error);
    }
  }

  async deleteExpiredReports(): Promise<void> {
    try {
      const now = new Date();
      const snapshot = await this.db.collection('verified-reports')
        .where('expiresAt', '<=', now)
        .get();

      const batch = this.db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Deleted ${snapshot.size} expired reports`);
    } catch (error) {
      console.error('Error deleting expired reports:', error);
    }
  }
}

export const storage = new FirebaseStorage();
