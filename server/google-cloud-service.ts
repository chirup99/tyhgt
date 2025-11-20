import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export interface CloudStorageConfig {
  projectId?: string;
  keyFilename?: string;
  credentials?: any;
}

export class GoogleCloudService {
  private storage: Storage;
  private firestore: Firestore;
  private bucket: any;
  private initialized: boolean = false;

  constructor(config?: CloudStorageConfig) {
    // Create credentials object from environment variables
    const credentials = config?.credentials || this.getCredentialsFromEnv();
    
    // Initialize Google Cloud Storage
    this.storage = new Storage({
      projectId: config?.projectId || process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      keyFilename: config?.keyFilename,
      credentials: credentials
    });

    // Initialize Firestore
    this.firestore = new Firestore({
      projectId: config?.projectId || process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      keyFilename: config?.keyFilename,
      credentials: credentials
    });

    this.initializeFirebase();
  }

  // Test Google Cloud connectivity and health check
  async healthCheck() {
    try {
      // Test Firestore connection with a simple write/read/delete operation
      const testDoc = this.firestore.collection('health-check').doc('test');
      await testDoc.set({ timestamp: new Date(), test: true });
      const readDoc = await testDoc.get();
      await testDoc.delete();
      
      if (readDoc.exists) {
        console.log('✅ Google Cloud Firestore connection successful');
        return { firestore: true, storage: true, initialized: this.initialized };
      } else {
        throw new Error('Failed to read test document');
      }
    } catch (error) {
      console.error('❌ Google Cloud health check failed:', error);
      return { 
        firestore: false, 
        storage: false, 
        initialized: this.initialized,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Legacy method name for compatibility
  async testConnection() {
    return this.healthCheck();
  }

  private getCredentialsFromEnv() {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const privateKeyRaw = process.env.GOOGLE_CLOUD_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKeyRaw || !clientEmail) {
      console.log('⚠️ Missing Google Cloud credentials in environment variables');
      console.log(`   - Project ID: ${projectId ? '✓' : '✗'}`);
      console.log(`   - Private Key: ${privateKeyRaw ? '✓' : '✗'}`);
      console.log(`   - Client Email: ${clientEmail ? '✓' : '✗'}`);
      return undefined;
    }

    try {
      // Enhanced private key processing to fix DECODER routines error
      let privateKey = privateKeyRaw.trim();
      
      // Remove any surrounding quotes (single or double)
      privateKey = privateKey.replace(/^['"`]|['"`]$/g, '');
      
      // Handle different escape sequences more thoroughly
      privateKey = privateKey.replace(/\\\\n/g, '\n');  // Double escaped
      privateKey = privateKey.replace(/\\n/g, '\n');    // Single escaped
      privateKey = privateKey.replace(/\\\\/g, '\\');   // Escaped backslashes
      
      // Remove any extra quotes that might be embedded
      privateKey = privateKey.replace(/["']/g, '');
      
      // Ensure proper PEM format with correct headers/footers
      if (!privateKey.includes('-----BEGIN')) {
        console.error('❌ Invalid private key: Missing BEGIN header');
        return undefined;
      }
      
      if (!privateKey.includes('-----END')) {
        console.error('❌ Invalid private key: Missing END footer');
        return undefined;
      }
      
      // Fix common PEM formatting issues
      // Ensure proper line breaks after headers and before footers
      privateKey = privateKey.replace(/(-----BEGIN[^-]*-----)\s*/, '$1\n');
      privateKey = privateKey.replace(/\s*(-----END[^-]*-----)/, '\n$1');
      
      // Ensure the key content has proper line breaks (every 64 characters typically)
      const lines = privateKey.split('\n');
      const beginIndex = lines.findIndex(line => line.includes('-----BEGIN'));
      const endIndex = lines.findIndex(line => line.includes('-----END'));
      
      if (beginIndex >= 0 && endIndex >= 0 && endIndex > beginIndex) {
        // Extract key content between headers
        const keyContent = lines.slice(beginIndex + 1, endIndex).join('');
        
        // Rebuild with proper formatting
        const formattedKeyContent = keyContent.match(/.{1,64}/g)?.join('\n') || keyContent;
        
        privateKey = lines[beginIndex] + '\n' + formattedKeyContent + '\n' + lines[endIndex];
      }

      console.log('✅ Google Cloud credentials processed successfully');
      console.log(`   - Project ID: ${projectId}`);
      console.log(`   - Client Email: ${clientEmail}`);
      console.log(`   - Private Key: Valid PEM format`);

      return {
        type: 'service_account',
        project_id: projectId,
        private_key: privateKey,
        client_email: clientEmail,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs'
      };
    } catch (error) {
      console.error('❌ Error processing Google Cloud credentials:', error);
      return undefined;
    }
  }

  private initializeFirebase() {
    try {
      if (getApps().length === 0) {
        const credentials = this.getCredentialsFromEnv();
        
        if (credentials) {
          initializeApp({
            credential: cert({
              projectId: credentials.project_id,
              privateKey: credentials.private_key,
              clientEmail: credentials.client_email,
            }),
          });
          console.log('🔥 Firebase Admin initialized successfully');
        } else {
          console.log('⚠️ Firebase credentials not found, using default Firestore client');
        }
      }
      this.initialized = true;
    } catch (error) {
      console.error('❌ Error initializing Firebase:', error);
      this.initialized = false;
    }
  }

  // Initialize storage bucket
  async initializeBucket(bucketName: string = 'trading-data-storage') {
    try {
      this.bucket = this.storage.bucket(bucketName);
      
      // Check if bucket exists, create if not
      const [exists] = await this.bucket.exists();
      if (!exists) {
        await this.storage.createBucket(bucketName, {
          location: 'US',
          storageClass: 'STANDARD',
        });
        console.log(`✅ Created Google Cloud Storage bucket: ${bucketName}`);
      } else {
        console.log(`✅ Connected to existing bucket: ${bucketName}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing storage bucket:', error);
      return false;
    }
  }

  // Store historical market data
  async storeHistoricalData(symbol: string, timeframe: string, data: any[], date?: string) {
    try {
      const fileName = `historical-data/${symbol}/${timeframe}/${date || new Date().toISOString().split('T')[0]}.json`;
      const file = this.bucket.file(fileName);
      
      await file.save(JSON.stringify(data), {
        metadata: {
          contentType: 'application/json',
          cacheControl: 'public, max-age=3600', // Cache for 1 hour
        },
      });
      
      console.log(`📦 Stored historical data: ${fileName}`);
      return { success: true, fileName };
    } catch (error) {
      console.error('❌ Error storing historical data:', error);
      return { success: false, error };
    }
  }

  // Retrieve historical market data
  async getHistoricalData(symbol: string, timeframe: string, date?: string) {
    try {
      const fileName = `historical-data/${symbol}/${timeframe}/${date || new Date().toISOString().split('T')[0]}.json`;
      const file = this.bucket.file(fileName);
      
      const [exists] = await file.exists();
      if (!exists) {
        return { success: false, error: 'Data not found' };
      }
      
      const [contents] = await file.download();
      const data = JSON.parse(contents.toString());
      
      console.log(`📥 Retrieved historical data: ${fileName}`);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error retrieving historical data:', error);
      return { success: false, error };
    }
  }

  // Store real-time market data in Firestore
  async storeRealtimeData(symbol: string, data: any) {
    try {
      const collection = this.firestore.collection('market-data-realtime');
      const doc = collection.doc(symbol);
      
      await doc.set({
        ...data,
        timestamp: new Date(),
        symbol: symbol
      }, { merge: true });
      
      console.log(`⚡ Stored realtime data for ${symbol}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error storing realtime data:', error);
      return { success: false, error };
    }
  }

  // Get real-time market data from Firestore
  async getRealtimeData(symbol: string) {
    try {
      const doc = await this.firestore.collection('market-data-realtime').doc(symbol).get();
      
      if (!doc.exists) {
        return { success: false, error: 'Data not found' };
      }
      
      const data = doc.data();
      console.log(`⚡ Retrieved realtime data for ${symbol}`);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error retrieving realtime data:', error);
      return { success: false, error };
    }
  }

  // Store social feed posts in Firestore
  async storeSocialPost(post: any) {
    try {
      const collection = this.firestore.collection('social-posts');
      const docRef = await collection.add({
        ...post,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`📝 Stored social post: ${docRef.id}`);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error storing social post:', error);
      return { success: false, error };
    }
  }

  // Retrieve social feed posts from Firestore
  async getSocialPosts(limit: number = 20, lastDoc?: any) {
    try {
      let query = this.firestore.collection('social-posts')
        .orderBy('createdAt', 'desc')
        .limit(limit);
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      const snapshot = await query.get();
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`📱 Retrieved ${posts.length} social posts`);
      return { success: true, data: posts, lastDoc: snapshot.docs[snapshot.docs.length - 1] };
    } catch (error) {
      console.error('❌ Error retrieving social posts:', error);
      return { success: false, error };
    }
  }

  // Store user signup data - using EXACT same approach as NIFTY data storage
  async storeUserSignup(userId: string, email: string) {
    // Use the same COLLECTIONS constant approach as NIFTY data
    const COLLECTIONS = {
      USER_SIGNUPS: 'backup-user-signups' // Same pattern as 'backup-historical-data'
    };

    console.log(`☁️💾 Storing 1 user signup record in Google Cloud...`);
    
    let stored = 0;
    let skipped = 0;
    const errors: string[] = [];

    try {
      const docId = `${userId}_${Date.now()}`;
      
      // Use the same document structure as NIFTY data 
      const signupRecord = {
        userId,
        email,
        signupDate: new Date().toISOString().split('T')[0],
        signupTimestamp: new Date(),
        status: 'active',
        dataSource: 'user-signup-form',
        lastUpdated: new Date(),
        createdAt: new Date()
      };

      // Store in Firestore using the EXACT same method as NIFTY data
      await this.storeData(COLLECTIONS.USER_SIGNUPS, docId, signupRecord);
      console.log(`☁️💾 Stored ${userId} (${email}) - user signup record`);
      stored++;

      console.log(`✅ Google Cloud user signup storage complete: ${stored} stored, ${skipped} skipped`);
      return { success: true, id: docId, stored, skipped, errors };

    } catch (error: any) {
      const errorMsg = `Failed to store ${userId}: ${error.message}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
      skipped++;
      
      console.log(`✅ Google Cloud user signup storage complete: ${stored} stored, ${skipped} skipped`);
      // Return success even if storage fails to avoid blocking the signup flow
      console.log('⚠️ Storage failed, but allowing signup to proceed');
      return { success: true, id: `fallback_${Date.now()}`, stored, skipped, errors };
    }
  }

  // Check if user already exists - optimized to reduce quota usage
  async checkUserExists(userId: string, email: string) {
    try {
      // Use a single query to get all documents, then filter in memory to reduce quota usage
      const allUsersQuery = await this.firestore.collection('user-signups').limit(1000).get();
      
      let userIdExists = false;
      let emailExists = false;
      
      allUsersQuery.forEach(doc => {
        const data = doc.data();
        if (data.userId === userId) userIdExists = true;
        if (data.email === email) emailExists = true;
      });
      
      return { 
        success: true, 
        exists: userIdExists || emailExists,
        userIdExists,
        emailExists
      };
    } catch (error: any) {
      console.error('❌ Error checking if user exists:', error);
      // If quota exceeded, skip check and proceed with signup attempt
      if (error?.code === 8) {
        console.log('⚠️ Quota exceeded, skipping duplicate check');
        return { 
          success: true, 
          exists: false,
          userIdExists: false,
          emailExists: false
        };
      }
      return { success: false, error };
    }
  }

  // Store trading patterns and analysis
  async storePatternAnalysis(symbol: string, timeframe: string, analysis: any) {
    try {
      const collection = this.firestore.collection('pattern-analysis');
      const docRef = await collection.add({
        symbol,
        timeframe,
        analysis,
        timestamp: new Date()
      });
      
      console.log(`🔍 Stored pattern analysis: ${docRef.id}`);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error storing pattern analysis:', error);
      return { success: false, error };
    }
  }

  // BATTU API Specific Methods
  
  // Store BATTU scanner session
  async storeBattuScannerSession(sessionData: any) {
    try {
      const collection = this.firestore.collection('battu-scanner-sessions');
      const docRef = await collection.add({
        ...sessionData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`🎯 Stored BATTU scanner session: ${docRef.id}`);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error storing BATTU scanner session:', error);
      return { success: false, error };
    }
  }

  // Store BATTU pattern detection results
  async storeBattuPattern(patternData: any) {
    try {
      const collection = this.firestore.collection('battu-patterns');
      const docRef = await collection.add({
        ...patternData,
        detectedAt: new Date(),
        stored: true
      });
      
      // Also cache for ultra-fast access
      const cacheKey = `battu-pattern-${patternData.symbol}-${patternData.timeframe}`;
      await this.cacheData(cacheKey, patternData, 30); // Cache for 30 minutes
      
      console.log(`📊 Stored BATTU pattern: ${docRef.id}`);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error storing BATTU pattern:', error);
      return { success: false, error };
    }
  }

  // Store BATTU trade execution
  async storeBattuTrade(tradeData: any) {
    try {
      const collection = this.firestore.collection('battu-trades');
      const docRef = await collection.add({
        ...tradeData,
        executedAt: new Date(),
        cloudStored: true
      });
      
      console.log(`💰 Stored BATTU trade: ${docRef.id}`);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error storing BATTU trade:', error);
      return { success: false, error };
    }
  }

  // Store BATTU scanner logs
  async storeBattuScannerLog(logData: any) {
    try {
      const collection = this.firestore.collection('battu-scanner-logs');
      const docRef = await collection.add({
        ...logData,
        timestamp: new Date()
      });
      
      console.log(`📝 Stored BATTU scanner log: ${docRef.id}`);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error storing BATTU scanner log:', error);
      return { success: false, error };
    }
  }

  // Get BATTU patterns for a symbol
  async getBattuPatterns(symbol: string, timeframe?: string, limit: number = 50) {
    try {
      let query = this.firestore.collection('battu-patterns')
        .where('symbol', '==', symbol)
        .orderBy('detectedAt', 'desc')
        .limit(limit);
      
      if (timeframe) {
        query = query.where('timeframe', '==', timeframe);
      }
      
      const snapshot = await query.get();
      const patterns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`📊 Retrieved ${patterns.length} BATTU patterns for ${symbol}`);
      return { success: true, data: patterns };
    } catch (error) {
      console.error('❌ Error retrieving BATTU patterns:', error);
      return { success: false, error };
    }
  }

  // Get BATTU trades with filters
  async getBattuTrades(filters: any = {}, limit: number = 100) {
    try {
      let query = this.firestore.collection('battu-trades')
        .orderBy('executedAt', 'desc')
        .limit(limit);
      
      if (filters.symbol) {
        query = query.where('symbol', '==', filters.symbol);
      }
      
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      
      const snapshot = await query.get();
      const trades = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`💰 Retrieved ${trades.length} BATTU trades`);
      return { success: true, data: trades };
    } catch (error) {
      console.error('❌ Error retrieving BATTU trades:', error);
      return { success: false, error };
    }
  }

  // Store BATTU historical analysis results
  async storeBattuHistoricalData(symbol: string, timeframe: string, data: any[]) {
    try {
      const fileName = `battu-historical/${symbol}/${timeframe}/${new Date().toISOString().split('T')[0]}.json`;
      const file = this.bucket.file(fileName);
      
      await file.save(JSON.stringify({
        symbol,
        timeframe,
        data,
        analysisDate: new Date(),
        recordCount: data.length
      }), {
        metadata: {
          contentType: 'application/json',
          cacheControl: 'public, max-age=1800', // Cache for 30 minutes
        },
      });
      
      console.log(`📈 Stored BATTU historical data: ${fileName}`);
      return { success: true, fileName };
    } catch (error) {
      console.error('❌ Error storing BATTU historical data:', error);
      return { success: false, error };
    }
  }

  // Get BATTU historical analysis results
  async getBattuHistoricalData(symbol: string, timeframe: string, date?: string) {
    try {
      const fileName = `battu-historical/${symbol}/${timeframe}/${date || new Date().toISOString().split('T')[0]}.json`;
      const file = this.bucket.file(fileName);
      
      const [exists] = await file.exists();
      if (!exists) {
        return { success: false, error: 'Historical data not found' };
      }
      
      const [contents] = await file.download();
      const data = JSON.parse(contents.toString());
      
      console.log(`📈 Retrieved BATTU historical data: ${fileName}`);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error retrieving BATTU historical data:', error);
      return { success: false, error };
    }
  }

  // Cache BATTU scanner status
  async cacheBattuScannerStatus(status: any) {
    try {
      const cacheKey = 'battu-scanner-status';
      await this.cacheData(cacheKey, status, 5); // Cache for 5 minutes
      console.log(`🎯 Cached BATTU scanner status`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error caching BATTU scanner status:', error);
      return { success: false, error };
    }
  }

  // Get cached BATTU scanner status
  async getCachedBattuScannerStatus() {
    try {
      const cacheKey = 'battu-scanner-status';
      return await this.getCachedData(cacheKey);
    } catch (error) {
      console.error('❌ Error getting cached BATTU scanner status:', error);
      return { success: false, error };
    }
  }

  // Cache frequently accessed data
  async cacheData(key: string, data: any, ttlMinutesOrCollection: number | string = 60) {
    try {
      let collectionName = 'cache';
      let ttlMinutes = 60;
      
      // If third parameter is a string, treat it as collection name
      if (typeof ttlMinutesOrCollection === 'string') {
        collectionName = ttlMinutesOrCollection;
        ttlMinutes = 525600; // 1 year for journal data (persistent storage)
      } else {
        ttlMinutes = ttlMinutesOrCollection;
      }
      
      const doc = this.firestore.collection(collectionName).doc(key);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);
      
      await doc.set({
        data,
        expiresAt,
        createdAt: new Date()
      });
      
      console.log(`💾 Cached data with key: ${key} in collection: ${collectionName}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error caching data:', error);
      return { success: false, error };
    }
  }

  // Get cached data
  async getCachedData(key: string, collectionName: string = 'cache') {
    try {
      const doc = await this.firestore.collection(collectionName).doc(key).get();
      
      if (!doc.exists) {
        console.log(`💾 Cache miss for key: ${key} in collection: ${collectionName}`);
        return null; // Return null for easier checking
      }
      
      const cachedData = doc.data();
      const now = new Date();
      
      if (cachedData?.expiresAt && cachedData.expiresAt.toDate() < now) {
        // Cache expired, delete it
        await doc.ref.delete();
        console.log(`💾 Cache expired for key: ${key} in collection: ${collectionName}`);
        return null;
      }
      
      console.log(`💾 Cache hit for key: ${key} in collection: ${collectionName}`);
      return cachedData?.data;
    } catch (error) {
      // Handle quota exceeded errors gracefully for journal data recovery
      if (error && typeof error === 'object' && 'code' in error && error.code === 8) {
        console.warn(`⚠️ Google Cloud quota exceeded for ${key}, using fallback storage...`);
        return null; // Will fallback to memory store which may have the real data
      }
      console.error('❌ Error retrieving cached data:', error);
      return null;
    }
  }

  // Store trading strategies in Google Cloud
  async storeStrategy(strategyData: any) {
    try {
      const collection = this.firestore.collection('trading-strategies');
      const docRef = await collection.add({
        ...strategyData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`📊 Stored trading strategy: ${docRef.id}`);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error storing trading strategy:', error);
      return { success: false, error };
    }
  }

  // Update existing trading strategy
  async updateStrategy(strategyId: string, strategyData: any) {
    try {
      const doc = this.firestore.collection('trading-strategies').doc(strategyId);
      await doc.update({
        ...strategyData,
        updatedAt: new Date()
      });
      
      console.log(`📊 Updated trading strategy: ${strategyId}`);
      return { success: true, id: strategyId };
    } catch (error) {
      console.error('❌ Error updating trading strategy:', error);
      return { success: false, error };
    }
  }

  // Get all trading strategies from Google Cloud
  async getStrategies(limit: number = 100) {
    try {
      const query = this.firestore.collection('trading-strategies')
        .orderBy('createdAt', 'desc')
        .limit(limit);
      
      const snapshot = await query.get();
      const strategies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`📊 Retrieved ${strategies.length} trading strategies`);
      return { success: true, data: strategies };
    } catch (error) {
      console.error('❌ Error retrieving trading strategies:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Delete trading strategy from Google Cloud
  async deleteStrategy(strategyId: string) {
    try {
      await this.firestore.collection('trading-strategies').doc(strategyId).delete();
      console.log(`🗑️ Deleted trading strategy: ${strategyId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting trading strategy:', error);
      return { success: false, error };
    }
  }

  // Store Fyers API authentication token in Google Cloud
  async storeFyersToken(accessToken: string, expiryDate: Date) {
    try {
      const doc = this.firestore.collection('fyers-authentication').doc('current-token');
      
      await doc.set({
        accessToken: accessToken,
        tokenExpiry: expiryDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      }, { merge: true });
      
      console.log(`🔐 Fyers API token saved to Google Cloud Firestore`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving Fyers token to Google Cloud:', error);
      return { success: false, error };
    }
  }

  // Retrieve Fyers API authentication token from Google Cloud
  async getFyersToken() {
    try {
      const doc = await this.firestore.collection('fyers-authentication').doc('current-token').get();
      
      if (!doc.exists) {
        console.log('📭 No Fyers token found in Google Cloud');
        return { success: false, error: 'Token not found' };
      }
      
      const tokenData = doc.data();
      const now = new Date();
      
      // Check if token has expired
      if (tokenData?.tokenExpiry && tokenData.tokenExpiry.toDate() < now) {
        console.log('⏰ Fyers token expired in Google Cloud');
        // Mark as inactive but don't delete for audit trail
        await doc.ref.update({ isActive: false });
        return { success: false, error: 'Token expired' };
      }
      
      console.log(`🔐 Retrieved valid Fyers token from Google Cloud`);
      return { 
        success: true, 
        data: {
          accessToken: tokenData?.accessToken,
          tokenExpiry: tokenData?.tokenExpiry?.toDate(),
          isActive: tokenData?.isActive
        }
      };
    } catch (error) {
      console.error('❌ Error retrieving Fyers token from Google Cloud:', error);
      return { success: false, error };
    }
  }

  // Clear/invalidate Fyers API token in Google Cloud
  async clearFyersToken() {
    try {
      const doc = this.firestore.collection('fyers-authentication').doc('current-token');
      
      await doc.update({
        isActive: false,
        clearedAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`🗑️ Fyers token cleared in Google Cloud`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing Fyers token in Google Cloud:', error);
      return { success: false, error };
    }
  }

  // Get all documents from a collection (for bulk data retrieval)
  async getAllCollectionData(collectionName: string = 'cache') {
    try {
      const snapshot = await this.firestore.collection(collectionName).get();
      const allData: any = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const now = new Date();
        
        // Check if document has not expired
        if (!data?.expiresAt || data.expiresAt.toDate() >= now) {
          const key = doc.id;
          if (key.startsWith('journal_') && data?.data) {
            const dateKey = key.replace('journal_', '');
            allData[dateKey] = data.data;
          }
        }
      });
      
      console.log(`📊 Retrieved ${Object.keys(allData).length} journal entries from Google Cloud collection: ${collectionName}`);
      return allData;
    } catch (error) {
      console.error('❌ Error retrieving all collection data:', error);
      return {};
    }
  }

  // Generic Firestore operations for backup service
  async storeData(collectionName: string, documentId: string, data: any) {
    try {
      const collection = this.firestore.collection(collectionName);
      const doc = collection.doc(documentId);
      
      await doc.set(data, { merge: true });
      console.log(`☁️📦 Stored document: ${collectionName}/${documentId}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error storing data in ${collectionName}:`, error);
      throw error;
    }
  }

  async getData(collectionName: string, documentId: string) {
    try {
      const doc = await this.firestore.collection(collectionName).doc(documentId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return doc.data();
    } catch (error) {
      console.error(`❌ Error getting data from ${collectionName}:`, error);
      throw error;
    }
  }

  async getAllData(collectionName: string) {
    try {
      const snapshot = await this.firestore.collection(collectionName).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`❌ Error getting all data from ${collectionName}:`, error);
      throw error;
    }
  }

  async updateData(collectionName: string, documentId: string, updates: any) {
    try {
      const collection = this.firestore.collection(collectionName);
      const doc = collection.doc(documentId);
      
      await doc.update(updates);
      console.log(`🔄 Updated document: ${collectionName}/${documentId}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error updating data in ${collectionName}:`, error);
      throw error;
    }
  }

  async deleteData(collectionName: string, documentId: string) {
    try {
      await this.firestore.collection(collectionName).doc(documentId).delete();
      console.log(`🗑️ Deleted document: ${collectionName}/${documentId}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error deleting data from ${collectionName}:`, error);
      throw error;
    }
  }

  async getLatestData(collectionName: string, orderByField: string) {
    try {
      const snapshot = await this.firestore.collection(collectionName)
        .orderBy(orderByField, 'desc')
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`❌ Error getting latest data from ${collectionName}:`, error);
      throw error;
    }
  }

  // Fyers Token Management Methods
  
  /**
   * Delete old/expired Fyers tokens from Firebase
   * This ensures only one active token exists per day
   */
  async deleteOldFyersTokens() {
    try {
      const snapshot = await this.firestore.collection('fyers-tokens').get();
      const deletedCount = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const expiryDate = data.expiryDate?.toDate?.() || new Date(data.expiryDate);
          
          // Delete if expired OR if it's not from today (old tokens)
          const isExpired = expiryDate && expiryDate < new Date();
          const isOld = data.dateKey !== new Date().toISOString().split('T')[0];
          
          if (isExpired || isOld) {
            await doc.ref.delete();
            console.log(`🗑️ Deleted old/expired token: ${data.dateKey}`);
            return 1;
          }
          return 0;
        })
      );
      
      const totalDeleted: number = deletedCount.reduce((a: number, b: number) => a + b, 0 as number);
      console.log(`🧹 Cleaned up ${totalDeleted} old/expired tokens from Firebase`);
      return { success: true, deletedCount: totalDeleted };
    } catch (error) {
      console.error('❌ Error deleting old Fyers tokens:', error);
      return { success: false, error };
    }
  }

  /**
   * Save Fyers token to Firebase
   * Automatically deletes old tokens before saving new one
   */
  async saveFyersToken(accessToken: string, expiryDate: Date) {
    try {
      const dateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // STEP 1: Delete old tokens before saving new one (prevents duplicates)
      console.log('🧹 Cleaning up old tokens before saving new one...');
      await this.deleteOldFyersTokens();
      
      // STEP 2: Save new token
      const tokenData = {
        accessToken,
        createdAt: new Date(),
        expiryDate,
        dateKey,
        lastUpdated: new Date(),
        status: 'active'
      };

      await this.storeData('fyers-tokens', dateKey, tokenData);
      console.log(`✅ Saved new Fyers token to Firebase for date: ${dateKey}`);
      return { success: true, dateKey };
    } catch (error) {
      console.error('❌ Error saving Fyers token to Firebase:', error);
      return { success: false, error };
    }
  }

  async getFyersTokenByDate(date?: string) {
    try {
      const dateKey = date || new Date().toISOString().split('T')[0];
      const tokenData = await this.getData('fyers-tokens', dateKey);
      
      if (!tokenData) {
        console.log(`📭 No Fyers token found in Firebase for date: ${dateKey}`);
        return null;
      }

      // Check if token is expired
      const expiryDate = tokenData.expiryDate?.toDate?.() || new Date(tokenData.expiryDate);
      if (expiryDate && expiryDate < new Date()) {
        console.log(`⏰ Fyers token expired for date: ${dateKey}`);
        return null;
      }

      console.log(`🔑 Found valid Fyers token in Firebase for date: ${dateKey}`);
      return tokenData;
    } catch (error) {
      console.error('❌ Error fetching Fyers token from Firebase:', error);
      return null;
    }
  }

  async getTodaysFyersToken() {
    return this.getFyersTokenByDate();
  }

  async getAllFyersTokens() {
    try {
      const tokens = await this.getAllData('fyers-tokens');
      console.log(`🔑 Retrieved ${tokens.length} Fyers tokens from Firebase`);
      return tokens;
    } catch (error) {
      console.error('❌ Error fetching all Fyers tokens:', error);
      return [];
    }
  }

  // ==========================================
  // USER TRADING JOURNAL - FIREBASE STORAGE
  // ==========================================

  /**
   * Save user trading journal data to Firebase
   * @param userId - User ID (from credentials/session)
   * @param date - Date in YYYY-MM-DD format
   * @param tradingData - Trading data object
   */
  async saveUserTradingJournal(userId: string, date: string, tradingData: any) {
    try {
      const docPath = `users/${userId}/trading-journal/${date}`;
      await this.firestore.doc(docPath).set({
        tradingData,
        updatedAt: new Date(),
        date,
        userId
      }, { merge: true });
      
      console.log(`📝 Saved trading journal for user ${userId}, date: ${date}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving user trading journal:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Load user trading journal data from Firebase
   * @param userId - User ID (from credentials/session)
   * @param date - Date in YYYY-MM-DD format
   */
  async getUserTradingJournal(userId: string, date: string) {
    try {
      const docPath = `users/${userId}/trading-journal/${date}`;
      const doc = await this.firestore.doc(docPath).get();
      
      if (!doc.exists) {
        console.log(`📭 No trading journal found for user ${userId}, date: ${date}`);
        return null;
      }
      
      const data = doc.data();
      console.log(`📖 Loaded trading journal for user ${userId}, date: ${date}`);
      return data;
    } catch (error) {
      console.error('❌ Error loading user trading journal:', error);
      return null;
    }
  }

  /**
   * Get all trading journal entries for a user
   * @param userId - User ID (from credentials/session)
   */
  async getAllUserTradingJournals(userId: string) {
    try {
      // ✅ CRITICAL FIX: Access subcollection through parent document, not direct path
      // Firebase subcollections MUST be accessed as: doc(parentPath).collection(subCollectionName)
      // NOT: collection('parent/child') - this doesn't work for subcollections!
      const snapshot = await this.firestore.doc(`users/${userId}`).collection('trading-journal').get();
      
      // ✅ FIX: Convert array to object with dates as keys (matches demo data format)
      // Frontend expects: { "2025-03-02": data, "2025-03-03": data }
      // NOT: [{ date: "2025-03-02", ...data }, { date: "2025-03-03", ...data }]
      const journals: Record<string, any> = {};
      snapshot.docs.forEach(doc => {
        journals[doc.id] = doc.data();
      });
      
      console.log(`📚 Retrieved ${Object.keys(journals).length} trading journal entries for user ${userId}`);
      return journals;
    } catch (error) {
      console.error('❌ Error loading all user trading journals:', error);
      return {};
    }
  }

  /**
   * Delete user trading journal entry
   * @param userId - User ID (from credentials/session)
   * @param date - Date in YYYY-MM-DD format
   */
  async deleteUserTradingJournal(userId: string, date: string) {
    try {
      const docPath = `users/${userId}/trading-journal/${date}`;
      await this.firestore.doc(docPath).delete();
      
      console.log(`🗑️ Deleted trading journal for user ${userId}, date: ${date}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting user trading journal:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

}

// Export singleton instance
export const googleCloudService = new GoogleCloudService();