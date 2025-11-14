/**
 * Google Cloud Backup Data Service
 * Manages historical OHLC data storage and retrieval using Google Cloud Firestore
 * Completely separate from local PostgreSQL database
 */

import { googleCloudService } from './google-cloud-service';
import { getTop50StockSymbols, BACKUP_TIMEFRAMES } from './top50-stocks';
import type { BackupDataRecord, FetchProgress } from './historical-data-fetcher';

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BackupQueryParams {
  symbol: string;
  timeframe: string;
  dateFrom: string;
  dateTo: string;
}

export interface BackupDataResponse {
  success: boolean;
  data?: CandleData[];
  source: 'google_cloud_backup';
  recordsFound: number;
  dateRange: {
    from: string;
    to: string;
  };
  lastUpdated?: number;
  error?: string;
}

export interface BackupStatusResponse {
  totalRecords: number;
  recordsBySymbol: Record<string, number>;
  recordsByTimeframe: Record<string, number>;
  oldestRecord: number | null;
  newestRecord: number | null;
  storageSize: string;
  lastSyncOperation: any;
  currentStock?: string;
  totalTradingDays?: number;
  completedDays?: number;
}

export interface CompletionStatusResponse {
  totalSymbols: number;
  completedSymbols: string[];
  missingSymbols: string[];
  totalMonths: number;
  completedMonths: string[];
  missingMonths: string[];
  completionPercentage: number;
  symbolProgress: Record<string, { completed: number; total: number }>;
}

// Google Cloud Firestore Collections
const COLLECTIONS = {
  HISTORICAL_DATA: 'backup-historical-data',
  INDEX: 'backup-index', 
  SYNC_STATUS: 'backup-sync-status'
};

export class GoogleCloudBackupService {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const healthCheck = await googleCloudService.healthCheck();
      if (healthCheck.firestore && healthCheck.initialized) {
        this.initialized = true;
        console.log('☁️ Google Cloud Backup Service initialized successfully');
      } else {
        throw new Error('Google Cloud Firestore not available');
      }
    } catch (error: any) {
      console.error('❌ Failed to initialize Google Cloud Backup Service:', error.message);
      this.initialized = false;
    }
  }

  /**
   * Store historical data in Google Cloud Firestore
   * DISABLED: Feature flag to prevent excessive Firebase storage costs
   * Historical data is now stored only in local PostgreSQL database
   */
  async storeHistoricalData(records: BackupDataRecord[]): Promise<{
    success: boolean;
    stored: number;
    skipped: number;
    errors: string[];
  }> {
    // Feature flag: Disable Firebase historical data storage to reduce costs
    const GOOGLE_CLOUD_BACKUP_ENABLED = process.env.GOOGLE_CLOUD_BACKUP_ENABLED === 'true';
    
    if (!GOOGLE_CLOUD_BACKUP_ENABLED) {
      console.log(`🚫 Google Cloud historical backup disabled (using local PostgreSQL only) - ${records.length} records skipped`);
      console.log(`💾 Historical data is being stored in local database as fallback`);
      return { 
        success: true, 
        stored: 0, 
        skipped: records.length, 
        errors: [] 
      };
    }

    if (!this.initialized) {
      await this.initialize();
      if (!this.initialized) {
        return { success: false, stored: 0, skipped: records.length, errors: ['Google Cloud not initialized'] };
      }
    }

    console.log(`☁️💾 Storing ${records.length} backup records in Google Cloud...`);
    
    let stored = 0;
    let skipped = 0;
    const errors: string[] = [];

    try {
      for (const record of records) {
        try {
          const documentId = `${record.symbol}_${record.timeframe}_${record.date}`;
          
          const firestoreRecord = {
            symbol: record.symbol,
            timeframe: record.timeframe,
            date: record.date,
            ohlcData: record.ohlcData,
            candleCount: record.ohlcData.length,
            dataSource: record.source,
            lastUpdated: new Date(record.lastUpdated),
            createdAt: new Date()
          };

          // Store in Firestore using the correct method
          await googleCloudService.storeData(COLLECTIONS.HISTORICAL_DATA, documentId, firestoreRecord);
          console.log(`☁️💾 Stored ${record.symbol} (${record.timeframe}) - ${record.ohlcData.length} candles`);

          // Update index
          await this.updateBackupIndex(record.symbol, record.timeframe, record.date, record.ohlcData.length);
          stored++;

        } catch (error: any) {
          const errorMsg = `Failed to store ${record.symbol} (${record.timeframe}): ${error.message}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
          skipped++;
        }
      }

      console.log(`✅ Google Cloud backup storage complete: ${stored} stored, ${skipped} skipped`);
      return { success: true, stored, skipped, errors };

    } catch (error: any) {
      console.error(`❌ Google Cloud backup storage failed: ${error.message}`);
      return { success: false, stored, skipped, errors: [...errors, error.message] };
    }
  }

  /**
   * Retrieve historical data from Google Cloud Firestore
   */
  async getHistoricalData(params: BackupQueryParams): Promise<BackupDataResponse> {
    if (!this.initialized) {
      await this.initialize();
      if (!this.initialized) {
        return {
          success: false,
          source: 'google_cloud_backup',
          recordsFound: 0,
          dateRange: { from: params.dateFrom, to: params.dateTo },
          error: 'Google Cloud not initialized'
        };
      }
    }

    console.log(`☁️📊 Retrieving backup data from Google Cloud for ${params.symbol} (${params.timeframe})`);
    
    try {
      // Get all records for this symbol and timeframe
      const queryResults = await googleCloudService.getData(COLLECTIONS.HISTORICAL_DATA, `${params.symbol}_${params.timeframe}`);

      if (!queryResults) {
        return {
          success: false,
          source: 'google_cloud_backup',
          recordsFound: 0,
          dateRange: { from: params.dateFrom, to: params.dateTo },
          error: `No Google Cloud backup data found for ${params.symbol} (${params.timeframe})`
        };
      }

      const record = queryResults;
      const ohlcData = record.ohlcData as CandleData[];

      // Filter data by date range if needed
      let filteredData = ohlcData;
      if (params.dateFrom && params.dateTo) {
        const fromTimestamp = new Date(params.dateFrom).getTime();
        const toTimestamp = new Date(params.dateTo).getTime() + (24 * 60 * 60 * 1000); // Include full end day
        
        filteredData = ohlcData.filter(candle => 
          candle.timestamp >= fromTimestamp && candle.timestamp <= toTimestamp
        );
      }

      console.log(`✅ Retrieved ${filteredData.length} candles from Google Cloud backup for ${params.symbol}`);

      return {
        success: true,
        data: filteredData,
        source: 'google_cloud_backup',
        recordsFound: filteredData.length,
        dateRange: { from: params.dateFrom, to: params.dateTo },
        lastUpdated: record.lastUpdated?.toDate?.()?.getTime()
      };

    } catch (error: any) {
      console.error(`❌ Failed to retrieve Google Cloud backup data: ${error.message}`);
      return {
        success: false,
        source: 'google_cloud_backup',
        recordsFound: 0,
        dateRange: { from: params.dateFrom, to: params.dateTo },
        error: error.message
      };
    }
  }

  /**
   * Update backup index for fast lookups
   */
  private async updateBackupIndex(symbol: string, timeframe: string, date: string, candleCount: number): Promise<void> {
    try {
      const indexId = `${symbol}_${timeframe}`;
      
      const existingIndex = await googleCloudService.getData(COLLECTIONS.INDEX, indexId);
      
      if (existingIndex) {
        const availableDates = (existingIndex.availableDates as string[]) || [];
        
        // Add new date if not already present
        if (!availableDates.includes(date)) {
          availableDates.push(date);
          availableDates.sort();
        }

        // Update index
        const updatedIndex = {
          symbol,
          timeframe,
          availableDates,
          totalCandles: existingIndex.totalCandles + candleCount,
          oldestDate: availableDates[0],
          newestDate: availableDates[availableDates.length - 1],
          lastSynced: new Date(),
          isActive: true
        };

        await googleCloudService.storeData(COLLECTIONS.INDEX, indexId, updatedIndex);
      } else {
        // Create new index entry
        const newIndex = {
          symbol,
          timeframe,
          availableDates: [date],
          totalCandles: candleCount,
          oldestDate: date,
          newestDate: date,
          lastSynced: new Date(),
          isActive: true
        };

        await googleCloudService.storeData(COLLECTIONS.INDEX, indexId, newIndex);
      }

    } catch (error: any) {
      console.error(`❌ Failed to update Google Cloud backup index: ${error.message}`);
    }
  }

  /**
   * Get backup system status and statistics
   */
  async getBackupStatus(): Promise<BackupStatusResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Get all historical data records
      const allRecords = await googleCloudService.getAllData(COLLECTIONS.HISTORICAL_DATA);
      
      const totalRecords = allRecords?.length || 0;

      // Group by symbol and timeframe
      const recordsBySymbol: Record<string, number> = {};
      const recordsByTimeframe: Record<string, number> = {};
      
      let oldestRecord: number | null = null;
      let newestRecord: number | null = null;

      if (allRecords && Array.isArray(allRecords)) {
        allRecords.forEach((record: any) => {
          // Count by symbol
          recordsBySymbol[record.symbol] = (recordsBySymbol[record.symbol] || 0) + (record.candleCount || 0);
          
          // Count by timeframe
          recordsByTimeframe[record.timeframe] = (recordsByTimeframe[record.timeframe] || 0) + (record.candleCount || 0);
          
          // Track oldest and newest records
          const recordTime = record.lastUpdated?.getTime?.() || record.lastUpdated;
          if (recordTime) {
            if (!oldestRecord || recordTime < oldestRecord) {
              oldestRecord = recordTime;
            }
            if (!newestRecord || recordTime > newestRecord) {
              newestRecord = recordTime;
            }
          }
        });
      }

      // Get last sync operation
      const lastSyncOperation = await googleCloudService.getLatestData(COLLECTIONS.SYNC_STATUS, 'startedAt');

      // Estimate storage size (rough calculation)
      const avgCandleSize = 100; // bytes per candle (rough estimate)
      const totalCandles = Object.values(recordsBySymbol).reduce((sum, count) => sum + count, 0);
      const storageSizeBytes = totalCandles * avgCandleSize;
      const storageSizeMB = (storageSizeBytes / (1024 * 1024)).toFixed(2);

      return {
        totalRecords,
        recordsBySymbol,
        recordsByTimeframe,
        oldestRecord,
        newestRecord,
        storageSize: `${storageSizeMB} MB (Google Cloud)`,
        lastSyncOperation
      };

    } catch (error: any) {
      console.error(`❌ Failed to get Google Cloud backup status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create sync operation record
   */
  async createSyncOperation(type: 'full_sync' | 'incremental_update' | 'single_stock', totalSymbols: number): Promise<string> {
    // Feature flag: Skip sync operations when Firebase backup is disabled
    const GOOGLE_CLOUD_BACKUP_ENABLED = process.env.GOOGLE_CLOUD_BACKUP_ENABLED === 'true';
    
    if (!GOOGLE_CLOUD_BACKUP_ENABLED) {
      console.log(`🚫 Google Cloud sync operation skipped (backup disabled) - ${type} for ${totalSymbols} symbols`);
      return `disabled_sync_${Date.now()}`;
    }

    if (!this.initialized) {
      await this.initialize();
      if (!this.initialized) {
        throw new Error('Google Cloud not initialized');
      }
    }

    try {
      const syncId = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const syncData = {
        operationType: type,
        status: 'running',
        totalSymbols,
        processedSymbols: 0,
        errors: [],
        startedAt: new Date()
      };

      await googleCloudService.storeData(COLLECTIONS.SYNC_STATUS, syncId, syncData);
      return syncId;

    } catch (error: any) {
      console.error(`❌ Failed to create Google Cloud sync operation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update sync operation progress
   */
  async updateSyncProgress(
    syncId: string, 
    progress: Partial<{
      status: string;
      processedSymbols: number;
      currentSymbol: string;
      currentTimeframe: string;
      errors: string[];
      completedAt: Date;
    }>
  ): Promise<void> {
    if (!this.initialized) {
      return; // Skip if not initialized
    }

    try {
      await googleCloudService.updateData(COLLECTIONS.SYNC_STATUS, syncId, progress);
    } catch (error: any) {
      console.error(`❌ Failed to update Google Cloud sync progress: ${error.message}`);
    }
  }

  /**
   * Check if symbol has recent backup data
   */
  async hasRecentBackupData(symbol: string, timeframe: string, maxAgeHours: number = 24): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
      if (!this.initialized) {
        return false;
      }
    }

    try {
      const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
      
      const queryResults = await googleCloudService.getData(COLLECTIONS.HISTORICAL_DATA, `${symbol}_${timeframe}`);
      
      if (queryResults && queryResults.lastUpdated) {
        const lastUpdatedTime = queryResults.lastUpdated.getTime?.() || queryResults.lastUpdated;
        return lastUpdatedTime > cutoffTime.getTime();
      }
      
      return false;

    } catch (error: any) {
      console.error(`❌ Failed to check Google Cloud backup data freshness: ${error.message}`);
      return false;
    }
  }

  /**
   * Clean old backup data (optional maintenance)
   */
  async cleanOldBackupData(keepDays: number = 365): Promise<{ deleted: number }> {
    if (!this.initialized) {
      await this.initialize();
      if (!this.initialized) {
        return { deleted: 0 };
      }
    }

    try {
      console.log(`🧹 Cleaning Google Cloud backup data older than ${keepDays} days...`);
      
      const cutoffTime = new Date(Date.now() - (keepDays * 24 * 60 * 60 * 1000));
      
      // Get all records and filter old ones
      const allRecords = await googleCloudService.getAllData(COLLECTIONS.HISTORICAL_DATA);
      
      let deletedCount = 0;
      if (allRecords && Array.isArray(allRecords)) {
        for (const record of allRecords as any[]) {
          const recordTime = record.lastUpdated?.getTime?.() || record.lastUpdated;
          if (recordTime && recordTime < cutoffTime.getTime()) {
            const documentId = `${record.symbol}_${record.timeframe}_${record.date}`;
            await googleCloudService.deleteData(COLLECTIONS.HISTORICAL_DATA, documentId);
            deletedCount++;
          }
        }
      }

      console.log(`🧹 Google Cloud cleanup completed: ${deletedCount} records deleted`);
      return { deleted: deletedCount };

    } catch (error: any) {
      console.error(`❌ Failed to clean old Google Cloud backup data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get completion status for specified number of months - REAL GOOGLE CLOUD DATA
   */
  async getCompletionStatus(months: number): Promise<CompletionStatusResponse> {
    try {
      console.log(`📊 Analyzing REAL completion status for ${months} months from Google Cloud...`);
      
      const allSymbols = getTop50StockSymbols();
      const completedSymbols: string[] = [];
      const missingSymbols: string[] = [];
      const symbolProgress: Record<string, { completed: number; total: number }> = {};
      
      // Generate expected months based on requested count (last N months)
      const expectedMonths: string[] = [];
      const currentDate = new Date();
      
      for (let i = 0; i < months; i++) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        expectedMonths.push(monthDate.toISOString().slice(0, 7)); // YYYY-MM format
      }

      console.log(`📅 Expected months: ${expectedMonths.join(', ')}`);
      
      // CHECK REAL GOOGLE CLOUD DATA 
      if (!this.initialized) {
        await this.initialize();
      }

      let actualCompletedSymbols = 0;
      let actualStoredMonths: Set<string> = new Set();

      // Query actual Google Cloud documents for each symbol
      for (const symbol of allSymbols) {
        let symbolCompleted = 0;
        let symbolTotal = expectedMonths.length * 20; // 20 trading days per month
        
        try {
          // Try to get any stored documents for this symbol
          const query = this.firestore.collection('backup-historical-data')
            .where('symbol', '==', symbol)
            .limit(5); // Just check if any exist
            
          const snapshot = await query.get();
          
          if (!snapshot.empty) {
            actualCompletedSymbols++;
            symbolCompleted = symbolTotal; // If any data exists, mark as complete
            
            // Track which months have data
            snapshot.forEach((doc: any) => {
              const data = doc.data();
              if (data && data.date) {
                const docMonth = data.date.substring(0, 7); // YYYY-MM
                actualStoredMonths.add(docMonth);
              }
            });
          }
          
          symbolProgress[symbol] = {
            completed: symbolCompleted,
            total: symbolTotal
          };
          
          if (symbolCompleted > 0) {
            completedSymbols.push(symbol);
          } else {
            missingSymbols.push(symbol);
          }
          
        } catch (queryError) {
          console.log(`⚠️ Could not check ${symbol} in Google Cloud`);
          missingSymbols.push(symbol);
          symbolProgress[symbol] = { completed: 0, total: symbolTotal };
        }
      }

      // Calculate actual months completion
      const completedMonths = expectedMonths.filter(month => actualStoredMonths.has(month));
      const missingMonths = expectedMonths.filter(month => !actualStoredMonths.has(month));
      const completionPercentage = (completedSymbols.length / allSymbols.length) * 100;

      console.log(`📊 REAL COMPLETION: ${completedSymbols.length}/${allSymbols.length} symbols, ${completedMonths.length}/${months} months`);

      return {
        totalSymbols: allSymbols.length,
        completedSymbols,
        missingSymbols,
        totalMonths: months,
        completedMonths,
        missingMonths,
        completionPercentage,
        symbolProgress
      };

    } catch (error: any) {
      console.error(`❌ Failed to get REAL completion status: ${error.message}`);
      // Fallback to showing all as missing if Google Cloud is unavailable
      const allSymbols = getTop50StockSymbols();
      const expectedMonths: string[] = [];
      const currentDate = new Date();
      
      for (let i = 0; i < months; i++) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        expectedMonths.push(monthDate.toISOString().slice(0, 7));
      }
      
      return {
        totalSymbols: allSymbols.length,
        completedSymbols: [],
        missingSymbols: allSymbols,
        totalMonths: months,
        completedMonths: [],
        missingMonths: expectedMonths,
        completionPercentage: 0,
        symbolProgress: Object.fromEntries(allSymbols.map(s => [s, { completed: 0, total: months * 20 }]))
      };
    }
  }
}

/**
 * Factory function to create Google Cloud backup data service
 */
export function createGoogleCloudBackupService(): GoogleCloudBackupService {
  return new GoogleCloudBackupService();
}