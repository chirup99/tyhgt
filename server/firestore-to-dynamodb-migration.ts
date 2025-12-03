import { getFirestore } from 'firebase-admin/firestore';
import { awsDynamoDBService } from './aws-dynamodb-service';

interface MigrationStats {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  errors: string[];
  startTime: Date;
  endTime?: Date;
}

class FirestoreToDynamoDBMigration {
  private db = getFirestore();
  private stats: MigrationStats = {
    totalProcessed: 0,
    successCount: 0,
    failureCount: 0,
    skippedCount: 0,
    errors: [],
    startTime: new Date()
  };

  /**
   * Migrate trading journal data from Firestore to DynamoDB
   * Path: users/{userId}/trading-journal/{date} → DynamoDB tradebook-heatmaps table
   */
  async migrateAllUserJournals(): Promise<MigrationStats> {
    try {
      console.log('📋 Starting Firestore to DynamoDB migration...');
      console.log('🔍 Reading users collection from Firestore...');
      
      const usersSnapshot = await this.db.collection('users').get();
      console.log(`📊 Found ${usersSnapshot.size} users`);

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        console.log(`\n👤 Processing user: ${userId}`);
        
        await this.migrateUserJournal(userId);
      }

      this.stats.endTime = new Date();
      const duration = this.getDuration(this.stats.startTime, this.stats.endTime);
      
      console.log('\n✅ Migration Summary:');
      console.log(`   Total Processed: ${this.stats.totalProcessed}`);
      console.log(`   Success: ${this.stats.successCount}`);
      console.log(`   Failed: ${this.stats.failureCount}`);
      console.log(`   Skipped: ${this.stats.skippedCount}`);
      console.log(`   Duration: ${duration}`);
      
      if (this.stats.errors.length > 0) {
        console.log(`\n⚠️ Errors during migration:`);
        this.stats.errors.forEach((err, idx) => {
          console.log(`   ${idx + 1}. ${err}`);
        });
      }

      return this.stats;
    } catch (error) {
      const errorMsg = `❌ Migration failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      this.stats.errors.push(errorMsg);
      this.stats.endTime = new Date();
      return this.stats;
    }
  }

  /**
   * Migrate single user's journal data
   */
  private async migrateUserJournal(userId: string): Promise<void> {
    try {
      const journalRef = this.db.collection('users').doc(userId).collection('trading-journal');
      const docsSnapshot = await journalRef.get();
      
      console.log(`   📅 Found ${docsSnapshot.size} journal entries for user ${userId}`);

      for (const docSnapshot of docsSnapshot.docs) {
        const date = docSnapshot.id;
        const journalData = docSnapshot.data();
        
        this.stats.totalProcessed++;

        try {
          // Transform data for DynamoDB
          const dateKey = `journal_${userId}_${date}`;
          
          // Validate data structure
          if (!journalData) {
            console.log(`   ⏭️ Skipped empty entry for ${date}`);
            this.stats.skippedCount++;
            return;
          }

          // Transform and enrich data
          const transformedData = {
            userId,
            date,
            trades: journalData.trades || [],
            heatmap: journalData.heatmap || {},
            performance: journalData.performance || {},
            risk: journalData.risk || {},
            summary: journalData.summary || {},
            metadata: {
              migratedFrom: 'firestore',
              migratedAt: new Date().toISOString(),
              originalTimestamp: journalData.timestamp || journalData.createdAt,
            }
          };

          // Save to DynamoDB
          const saved = await awsDynamoDBService.saveJournalData(dateKey, transformedData);
          
          if (saved) {
            console.log(`   ✅ Migrated: ${date}`);
            this.stats.successCount++;
          } else {
            console.log(`   ❌ Failed to save: ${date}`);
            this.stats.failureCount++;
            this.stats.errors.push(`Failed to migrate ${userId}/${date} to DynamoDB`);
          }
        } catch (entryError) {
          const errorMsg = `Error migrating ${userId}/${date}: ${entryError instanceof Error ? entryError.message : String(entryError)}`;
          console.error(`   ❌ ${errorMsg}`);
          this.stats.failureCount++;
          this.stats.errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Error processing user ${userId}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`   ❌ ${errorMsg}`);
      this.stats.errors.push(errorMsg);
    }
  }

  /**
   * Verify migration - compare Firestore and DynamoDB data
   */
  async verifyMigration(): Promise<{ isValid: boolean; issues: string[] }> {
    console.log('\n🔍 Verifying migration...');
    const issues: string[] = [];

    try {
      // Get all data from DynamoDB
      const dynamoData = await awsDynamoDBService.getAllJournalData();
      console.log(`   📊 DynamoDB has ${Object.keys(dynamoData).length} entries`);

      // Get all Firestore data count
      const usersSnapshot = await this.db.collection('users').get();
      let firestoreCount = 0;

      for (const userDoc of usersSnapshot.docs) {
        const journalRef = this.db.collection('users').doc(userDoc.id).collection('trading-journal');
        const docsSnapshot = await journalRef.get();
        firestoreCount += docsSnapshot.size;
      }

      console.log(`   📊 Firestore has ${firestoreCount} entries`);

      if (Object.keys(dynamoData).length !== firestoreCount) {
        issues.push(`Data mismatch: DynamoDB (${Object.keys(dynamoData).length}) vs Firestore (${firestoreCount})`);
      }

      // Sample verification - check a few entries
      const sampleEntries = Object.keys(dynamoData).slice(0, 3);
      for (const key of sampleEntries) {
        const data = dynamoData[key];
        if (!data.userId || !data.date) {
          issues.push(`Invalid data structure in ${key}: missing userId or date`);
        }
      }

      if (issues.length === 0) {
        console.log('   ✅ Verification passed!');
      }

      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      const errorMsg = `Verification failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`   ❌ ${errorMsg}`);
      return {
        isValid: false,
        issues: [errorMsg]
      };
    }
  }

  /**
   * Rollback - delete migrated data from DynamoDB (optional safety feature)
   */
  async rollbackMigration(dryRun: boolean = true): Promise<boolean> {
    console.log(`\n⚠️ Initiating rollback (${dryRun ? 'DRY RUN' : 'ACTUAL'})...`);
    
    try {
      const allData = await awsDynamoDBService.getAllJournalData();
      const migratedKeys = Object.keys(allData).filter(key => key.startsWith('journal_'));
      
      console.log(`   Found ${migratedKeys.length} migrated entries to rollback`);

      if (!dryRun) {
        for (const key of migratedKeys) {
          await awsDynamoDBService.deleteJournalData(key);
        }
        console.log(`   ✅ Rollback completed - deleted ${migratedKeys.length} entries`);
      } else {
        console.log(`   🔍 DRY RUN: Would delete ${migratedKeys.length} entries`);
      }

      return true;
    } catch (error) {
      console.error(`   ❌ Rollback failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  private getDuration(start: Date, end: Date): string {
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
}

export const migration = new FirestoreToDynamoDBMigration();

// Export for use in routes
export async function executeMigration() {
  console.log('\n='.repeat(60));
  console.log('🔄 FIRESTORE TO DYNAMODB MIGRATION STARTED');
  console.log('='.repeat(60));
  
  const stats = await migration.migrateAllUserJournals();
  const verification = await migration.verifyMigration();

  console.log('\n' + '='.repeat(60));
  console.log('📋 MIGRATION REPORT');
  console.log('='.repeat(60));
  console.log(`Migration Status: ${verification.isValid ? '✅ VALID' : '⚠️ ISSUES FOUND'}`);
  console.log(`\nStatistics:`);
  console.log(`  Processed: ${stats.totalProcessed}`);
  console.log(`  Success: ${stats.successCount}`);
  console.log(`  Failed: ${stats.failureCount}`);
  console.log(`  Skipped: ${stats.skippedCount}`);
  
  if (verification.issues.length > 0) {
    console.log(`\nVerification Issues:`);
    verification.issues.forEach((issue, idx) => {
      console.log(`  ${idx + 1}. ${issue}`);
    });
  }
  console.log('='.repeat(60) + '\n');

  return { stats, verification };
}
