# Firestore to DynamoDB Migration Guide

## Overview
This guide helps you migrate your Journal/Tradebook heatmap data from Firebase Firestore to AWS DynamoDB.

## Prerequisites
- AWS credentials configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)
- DynamoDB table "tradebook-heatmaps" created in AWS
- Firebase admin credentials configured

## Migration Steps

### Step 1: Prepare for Migration
```bash
# Verify AWS credentials are set in .env
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
echo $AWS_REGION

# Ensure DynamoDB table exists
# Table Name: tradebook-heatmaps
# Partition Key: dateKey (String)
```

### Step 2: Backup Firestore Data (Optional but Recommended)
```bash
# Export Firestore data as backup before migration
# Use Firebase console or gcloud CLI
gcloud firestore export gs://your-backup-bucket/firestore-backup
```

### Step 3: Execute Migration

#### Option A: Via API Endpoint
```bash
curl -X POST http://localhost:5000/api/migration/firestore-to-dynamodb/start \
  -H "Content-Type: application/json"
```

#### Option B: Via Server Startup (Automatic)
Add to your server startup process to run migration on boot:
```typescript
import { executeMigration } from './firestore-to-dynamodb-migration';
await executeMigration();
```

### Step 4: Verify Migration

```bash
# Check migration status and verification report
curl http://localhost:5000/api/migration/firestore-to-dynamodb/status
```

### Step 5: Validate Data Integrity

```bash
# Compare entry counts between Firestore and DynamoDB
# The system will provide detailed comparison
curl http://localhost:5000/api/migration/firestore-to-dynamodb/verify
```

## Data Transformation

### Source (Firestore)
```
users/{userId}/trading-journal/{date}
  ├── trades: Trade[]
  ├── heatmap: object
  ├── performance: object
  ├── risk: object
  └── summary: object
```

### Target (DynamoDB)
```
tradebook-heatmaps table
  ├── dateKey: "journal_{userId}_{date}" (Partition Key)
  ├── data: {
  │   ├── userId: string
  │   ├── date: string
  │   ├── trades: Trade[]
  │   ├── heatmap: object
  │   ├── performance: object
  │   ├── risk: object
  │   ├── summary: object
  │   └── metadata: {
  │       ├── migratedFrom: "firestore"
  │       ├── migratedAt: ISO timestamp
  │       └── originalTimestamp: ISO timestamp
  │   }
  ├── updatedAt: ISO timestamp
```

## Migration Monitoring

### Success Indicators
- ✅ Total Processed count > 0
- ✅ Success count = Total Processed
- ✅ Failed count = 0
- ✅ Verification shows no issues
- ✅ DynamoDB entry count matches Firestore

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "AWS credentials not found" | Missing env vars | Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY |
| "Failed to save journal data" | DynamoDB permissions | Verify IAM user has DynamoDB write permissions |
| "Data mismatch" | Incomplete migration | Re-run migration or check for data corruption |
| "No data found in Firestore" | Empty source | Verify Firestore structure matches expected path |

## Rollback Procedure

If issues occur, you can rollback the migration:

```bash
# Dry run (preview what will be deleted)
curl -X POST http://localhost:5000/api/migration/firestore-to-dynamodb/rollback \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'

# Actual rollback (deletes DynamoDB entries)
curl -X POST http://localhost:5000/api/migration/firestore-to-dynamodb/rollback \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'
```

## Performance Considerations

- **Migration Time**: ~1-2 seconds per 100 entries
- **Concurrent Writes**: Limited by DynamoDB write capacity
- **Best Practice**: Run during off-peak hours
- **Batch Size**: Currently processes user-by-user (can be optimized)

## Next Steps After Migration

1. Update frontend to read from DynamoDB instead of Firestore
2. Update backend routes to use DynamoDB service
3. Remove Firestore read permissions for journal data
4. Monitor DynamoDB usage and adjust capacity if needed
5. Schedule archival of old Firestore data (optional)

## API Endpoints

### Start Migration
```
POST /api/migration/firestore-to-dynamodb/start
Response: { stats, verification }
```

### Get Status
```
GET /api/migration/firestore-to-dynamodb/status
Response: { currentStatus, lastMigration }
```

### Verify Migration
```
GET /api/migration/firestore-to-dynamodb/verify
Response: { isValid, issues }
```

### Rollback
```
POST /api/migration/firestore-to-dynamodb/rollback
Body: { dryRun: boolean }
Response: { success, message }
```

## Support

For issues or questions:
1. Check the migration logs in server console
2. Verify DynamoDB table structure
3. Confirm AWS credentials and permissions
4. Review data format in Firestore
