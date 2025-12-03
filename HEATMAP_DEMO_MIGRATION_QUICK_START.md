# Tradebook Heatmap Demo Data Migration - Quick Start

## What Gets Migrated
**Tradebook Demo Heatmap Universal Data** from Firebase Firestore to AWS DynamoDB

## Three Simple Steps

### Step 1: Start Migration
```bash
curl -X POST http://localhost:5000/api/migration/heatmap-demo/start
```

**Response Example:**
```json
{
  "success": true,
  "message": "Heatmap migration completed",
  "stats": {
    "totalProcessed": 15,
    "successCount": 15,
    "failureCount": 0,
    "dataSize": "2.45 MB"
  },
  "verification": {
    "isValid": true,
    "issues": []
  },
  "timestamp": "2025-12-03T12:34:56.789Z"
}
```

### Step 2: Verify Migration
```bash
curl http://localhost:5000/api/migration/heatmap-demo/verify
```

**Response Example:**
```json
{
  "success": true,
  "verification": {
    "isValid": true,
    "issues": []
  },
  "timestamp": "2025-12-03T12:34:56.789Z"
}
```

### Step 3: (Optional) Migrate Specific User's Heatmap
```bash
curl -X POST http://localhost:5000/api/migration/heatmap-demo/user/userId123
```

## What Happens

✅ System automatically detects heatmap data location in Firestore
✅ Transforms data with metadata tracking
✅ Saves to AWS DynamoDB (tradebook-heatmaps table)
✅ Verifies data integrity
✅ Returns detailed statistics

## Data Flow

```
Firebase Firestore (Multiple Possible Locations)
├── heatmap-data collection
├── demo-heatmap collection
├── tradebook-demo collection
├── universal-data collection
└── users/{userId}/heatmap-data

                    ↓ (Migration)

AWS DynamoDB (tradebook-heatmaps table)
├── DateKey: heatmap_demo_{docId}_{timestamp}
├── Data: Transformed heatmap data
└── Metadata: Migration tracking info
```

## Success Indicators

- ✅ totalProcessed > 0
- ✅ successCount = totalProcessed
- ✅ failureCount = 0
- ✅ verification.isValid = true
- ✅ verification.issues = []

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No data found | Verify Firestore collection exists |
| Migration failed | Check AWS credentials in .env |
| Partial success | Check server logs for specific entry errors |

## After Migration

1. ✅ Heatmap data now in AWS DynamoDB
2. ✅ Original data remains in Firebase (safe)
3. ✅ Ready to update frontend to read from AWS
4. ✅ Can archive Firebase data after verification

## API Status
- **Endpoint**: `/api/migration/heatmap-demo/start`
- **Method**: POST
- **Authentication**: None (for now)
- **Timeout**: ~5 minutes for large datasets
