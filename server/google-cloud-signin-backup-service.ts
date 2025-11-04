import { googleCloudService } from './google-cloud-service';

// Signin data record structure - mirroring NIFTY data approach
export interface SigninDataRecord {
  userId: string;
  email: string;
  signupDate: string;
  signupTimestamp: Date;
  status: 'active' | 'inactive';
  dataSource: string;
  lastUpdated: Date;
}

// Collections - using exact same pattern as NIFTY data
const COLLECTIONS = {
  SIGNIN_DATA: 'backup-signin-data', // Same pattern as 'backup-historical-data'
  SIGNIN_INDEX: 'backup-signin-index'
};

// Response interfaces - mirroring NIFTY data approach
export interface SigninStorageResponse {
  success: boolean;
  stored: number;
  skipped: number;
  errors: string[];
}

export interface SigninQueryParams {
  userId?: string;
  email?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SigninQueryResponse {
  success: boolean;
  source: 'google_cloud_signin_backup';
  recordsFound: number;
  dateRange?: { from: string; to: string };
  data?: SigninDataRecord[];
  error?: string;
}

/**
 * Google Cloud Signin Backup Service
 * Uses the EXACT same approach as the successful GoogleCloudBackupService for NIFTY data
 */
export class GoogleCloudSigninBackupService {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the service - EXACT same pattern as working NIFTY backup service
   */
  private async initialize() {
    try {
      // Use the same health check approach as working NIFTY backup service  
      const healthCheck = await googleCloudService.healthCheck();
      if (healthCheck.firestore && healthCheck.initialized) {
        this.initialized = true;
        console.log('☁️📝 Google Cloud Signin Backup Service initialized successfully');
      } else {
        throw new Error('Google Cloud Firestore not available');
      }
    } catch (error: any) {
      console.error('❌ Failed to initialize Google Cloud Signin Backup Service:', error.message);
      this.initialized = false;
    }
  }

  /**
   * Store signin data records - EXACT same logic as NIFTY data storage
   */
  async storeSigninData(records: SigninDataRecord[]): Promise<SigninStorageResponse> {
    if (!this.initialized) {
      await this.initialize();
      if (!this.initialized) {
        return { success: false, stored: 0, skipped: records.length, errors: ['Google Cloud not initialized'] };
      }
    }

    console.log(`☁️💾 Storing ${records.length} signin backup records in Google Cloud...`);
    
    let stored = 0;
    let skipped = 0;
    const errors: string[] = [];

    try {
      for (const record of records) {
        try {
          const documentId = `${record.userId}_${record.signupDate}`;
          
          const firestoreRecord = {
            userId: record.userId,
            email: record.email,
            signupDate: record.signupDate,
            signupTimestamp: record.signupTimestamp,
            status: record.status,
            dataSource: record.dataSource,
            lastUpdated: record.lastUpdated,
            createdAt: new Date()
          };

          // Store in Firestore using the EXACT same method as NIFTY data
          await googleCloudService.storeData(COLLECTIONS.SIGNIN_DATA, documentId, firestoreRecord);
          console.log(`☁️💾 Stored ${record.userId} (${record.email}) - signin record`);

          // Update index - same pattern as NIFTY data
          await this.updateSigninIndex(record.userId, record.email, record.signupDate);
          stored++;

        } catch (error: any) {
          const errorMsg = `Failed to store ${record.userId}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
          skipped++;
        }
      }

      console.log(`✅ Google Cloud signin backup storage complete: ${stored} stored, ${skipped} skipped`);
      return { success: true, stored, skipped, errors };

    } catch (error: any) {
      console.error(`❌ Google Cloud signin backup storage failed: ${error.message}`);
      return { success: false, stored, skipped, errors: [...errors, error.message] };
    }
  }

  /**
   * Update signin index - same pattern as NIFTY data indexing
   */
  private async updateSigninIndex(userId: string, email: string, signupDate: string): Promise<void> {
    try {
      const indexId = `signin_${userId}`;
      
      const indexRecord = {
        userId,
        email,
        signupDate,
        lastUpdated: new Date(),
        recordCount: 1
      };

      await googleCloudService.storeData(COLLECTIONS.SIGNIN_INDEX, indexId, indexRecord);
    } catch (error: any) {
      console.error(`⚠️ Failed to update signin index for ${userId}:`, error.message);
      // Don't throw - index update failure shouldn't break main storage
    }
  }

  /**
   * Retrieve signin data - same pattern as NIFTY data retrieval
   */
  async getSigninData(params: SigninQueryParams): Promise<SigninQueryResponse> {
    if (!this.initialized) {
      await this.initialize();
      if (!this.initialized) {
        return {
          success: false,
          source: 'google_cloud_signin_backup',
          recordsFound: 0,
          error: 'Google Cloud not initialized'
        };
      }
    }

    try {
      let queryResults: any[] = [];

      if (params.userId) {
        const queryResults = await googleCloudService.getData(COLLECTIONS.SIGNIN_DATA, `${params.userId}_${params.dateFrom || ''}`);
        if (queryResults) {
          return {
            success: true,
            source: 'google_cloud_signin_backup',
            recordsFound: 1,
            data: [queryResults as SigninDataRecord]
          };
        }
      } else {
        // Get all signin data - same pattern as NIFTY data
        const allData = await googleCloudService.getAllData(COLLECTIONS.SIGNIN_DATA);
        if (Array.isArray(allData)) {
          queryResults = allData;
        } else if (allData && typeof allData === 'object' && 'data' in allData) {
          queryResults = (allData as any).data || [];
        }
      }

      return {
        success: true,
        source: 'google_cloud_signin_backup',
        recordsFound: queryResults.length,
        data: queryResults as SigninDataRecord[]
      };

    } catch (error: any) {
      console.error('❌ Error retrieving signin data from Google Cloud:', error);
      return {
        success: false,
        source: 'google_cloud_signin_backup',
        recordsFound: 0,
        error: error.message
      };
    }
  }

  /**
   * Check if signin data exists for user - same pattern as NIFTY data checks
   */
  async hasSigninData(userId: string, email: string): Promise<boolean> {
    try {
      const result = await this.getSigninData({ userId });
      return result.success && result.recordsFound > 0;
    } catch (error) {
      console.error('❌ Error checking signin data existence:', error);
      return false;
    }
  }
}

/**
 * Create and export signin backup service instance - same pattern as NIFTY service
 */
export function createGoogleCloudSigninBackupService(): GoogleCloudSigninBackupService {
  return new GoogleCloudSigninBackupService();
}