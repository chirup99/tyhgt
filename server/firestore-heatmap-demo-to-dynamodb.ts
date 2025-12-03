import { getFirestore } from 'firebase-admin/firestore';
import { awsDynamoDBService } from './aws-dynamodb-service';

interface HeatmapMigrationStats {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors: string[];
  startTime: Date;
  endTime?: Date;
  dataSize?: string;
}

class FirestoreHeatmapDemoMigration {
  private db = getFirestore();
  private stats: HeatmapMigrationStats = {
    totalProcessed: 0,
    successCount: 0,
    failureCount: 0,
    errors: [],
    startTime: new Date()
  };

  /**
   * Migrate ONLY tradebook demo heatmap universal data from Firestore to DynamoDB
   * Looks for heatmap data in multiple possible Firestore locations:
   * 1. /heatmap-data (collection root)
   * 2. /demo-heatmap (collection root)
   * 3. /tradebook-demo (collection root)
   * 4. /universal-data (collection root)
   */
  async migrateHeatmapDemoData(): Promise<HeatmapMigrationStats> {
    try {
      console.log('📊 Starting Heatmap Demo Data Migration (Firestore → DynamoDB)...');
      
      // Try multiple possible collection names for heatmap data
      const possibleCollections = [
        'heatmap-data',
        'demo-heatmap',
        'tradebook-demo',
        'universal-data',
        'heatmap-demo-data',
        'tradebook-heatmaps-demo'
      ];

      for (const collectionName of possibleCollections) {
        console.log(`\n🔍 Checking collection: ${collectionName}`);
        const found = await this.migrateFromCollection(collectionName);
        
        if (found) {
          console.log(`✅ Found and migrated data from: ${collectionName}`);
          break;
        }
      }

      this.stats.endTime = new Date();
      const duration = this.getDuration(this.stats.startTime, this.stats.endTime);
      
      console.log('\n✅ Migration Summary:');
      console.log(`   Total Processed: ${this.stats.totalProcessed}`);
      console.log(`   Success: ${this.stats.successCount}`);
      console.log(`   Failed: ${this.stats.failureCount}`);
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
   * Try to migrate from a specific Firestore collection
   */
  private async migrateFromCollection(collectionName: string): Promise<boolean> {
    try {
      const collectionRef = this.db.collection(collectionName);
      const docsSnapshot = await collectionRef.get();
      
      if (docsSnapshot.empty) {
        console.log(`   ⏭️ Collection empty or not found`);
        return false;
      }

      console.log(`   📄 Found ${docsSnapshot.size} documents in ${collectionName}`);

      for (const docSnapshot of docsSnapshot.docs) {
        const docId = docSnapshot.id;
        const heatmapData = docSnapshot.data();
        
        this.stats.totalProcessed++;

        try {
          // Validate data structure
          if (!heatmapData) {
            console.log(`   ⏭️ Skipped empty document: ${docId}`);
            continue;
          }

          // Create DynamoDB key
          const dateKey = `heatmap_demo_${docId}_${new Date().getTime()}`;
          
          // Transform and preserve original structure
          const transformedData = {
            originalId: docId,
            collectionSource: collectionName,
            heatmapData: heatmapData,
            metadata: {
              migratedFrom: 'firestore',
              migratedAt: new Date().toISOString(),
              originalTimestamp: heatmapData.timestamp || heatmapData.createdAt || heatmapData.date,
              dataType: 'heatmap-demo'
            }
          };

          // Calculate data size
          const dataSize = JSON.stringify(transformedData).length;
          if (!this.stats.dataSize) {
            this.stats.dataSize = `${(dataSize / 1024).toFixed(2)} KB`;
          }

          // Save to DynamoDB
          const saved = await awsDynamoDBService.saveJournalData(dateKey, transformedData);
          
          if (saved) {
            console.log(`   ✅ Migrated: ${docId}`);
            this.stats.successCount++;
          } else {
            console.log(`   ❌ Failed to save: ${docId}`);
            this.stats.failureCount++;
            this.stats.errors.push(`Failed to migrate ${collectionName}/${docId}`);
          }
        } catch (entryError) {
          const errorMsg = `Error migrating ${collectionName}/${docId}: ${entryError instanceof Error ? entryError.message : String(entryError)}`;
          console.error(`   ❌ ${errorMsg}`);
          this.stats.failureCount++;
          this.stats.errors.push(errorMsg);
        }
      }

      return true;
    } catch (error) {
      // Collection doesn't exist or other error - not a failure, just move to next
      return false;
    }
  }

  /**
   * Get specific heatmap data by user ID from Firestore
   */
  async migrateUserHeatmapData(userId: string): Promise<HeatmapMigrationStats> {
    try {
      console.log(`📊 Migrating heatmap data for user: ${userId}`);
      
      // Try to find heatmap data under user
      const userHeatmapPath = `users/${userId}/heatmap-data`;
      const userHeatmapRef = this.db.collection(userHeatmapPath);
      const docsSnapshot = await userHeatmapRef.get();
      
      if (!docsSnapshot.empty) {
        console.log(`   📄 Found ${docsSnapshot.size} heatmap entries for user ${userId}`);
        
        for (const docSnapshot of docsSnapshot.docs) {
          const docId = docSnapshot.id;
          const heatmapData = docSnapshot.data();
          
          this.stats.totalProcessed++;

          try {
            const dateKey = `heatmap_${userId}_${docId}`;
            
            const transformedData = {
              userId,
              docId,
              heatmapData: heatmapData,
              metadata: {
                migratedFrom: 'firestore',
                migratedAt: new Date().toISOString(),
                dataType: 'user-heatmap'
              }
            };

            const saved = await awsDynamoDBService.saveJournalData(dateKey, transformedData);
            
            if (saved) {
              this.stats.successCount++;
            } else {
              this.stats.failureCount++;
            }
          } catch (entryError) {
            this.stats.failureCount++;
            this.stats.errors.push(`Failed to migrate ${userId}/${docId}`);
          }
        }
      }

      this.stats.endTime = new Date();
      return this.stats;
    } catch (error) {
      console.error(`Error migrating user heatmap data: ${error}`);
      this.stats.endTime = new Date();
      return this.stats;
    }
  }

  /**
   * Verify heatmap migration
   */
  async verifyHeatmapMigration(): Promise<{ isValid: boolean; issues: string[] }> {
    console.log('\n🔍 Verifying heatmap migration...');
    const issues: string[] = [];

    try {
      const allData = await awsDynamoDBService.getAllJournalData();
      const heatmapEntries = Object.keys(allData).filter(key => key.startsWith('heatmap_'));
      
      console.log(`   📊 Found ${heatmapEntries.length} migrated heatmap entries in DynamoDB`);

      if (heatmapEntries.length === 0) {
        issues.push('No heatmap entries found in DynamoDB');
      }

      // Sample verification
      const sampleEntries = heatmapEntries.slice(0, 3);
      for (const key of sampleEntries) {
        const data = allData[key];
        if (!data.heatmapData && !data.metadata) {
          issues.push(`Invalid data structure in ${key}`);
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
      return {
        isValid: false,
        issues: [errorMsg]
      };
    }
  }

  private getDuration(start: Date, end: Date): string {
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
}

export const heatmapMigration = new FirestoreHeatmapDemoMigration();

export async function executeHeatmapMigration() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 FIRESTORE HEATMAP DEMO DATA TO DYNAMODB MIGRATION');
  console.log('='.repeat(70));
  
  const stats = await heatmapMigration.migrateHeatmapDemoData();
  const verification = await heatmapMigration.verifyHeatmapMigration();

  console.log('\n' + '='.repeat(70));
  console.log('📋 HEATMAP MIGRATION REPORT');
  console.log('='.repeat(70));
  console.log(`Status: ${verification.isValid ? '✅ VALID' : '⚠️ ISSUES'}`);
  console.log(`Processed: ${stats.totalProcessed} | Success: ${stats.successCount} | Failed: ${stats.failureCount}`);
  if (stats.dataSize) {
    console.log(`Data Size: ${stats.dataSize}`);
  }
  
  if (verification.issues.length > 0) {
    console.log(`\nIssues:`);
    verification.issues.forEach((issue, idx) => {
      console.log(`  ${idx + 1}. ${issue}`);
    });
  }
  console.log('='.repeat(70) + '\n');

  return { stats, verification };
}
