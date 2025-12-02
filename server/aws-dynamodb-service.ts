import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  ScanCommand, 
  DeleteCommand,
  QueryCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = "tradebook-heatmaps";

class AWSDynamoDBService {
  private client: DynamoDBClient | null = null;
  private docClient: DynamoDBDocumentClient | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || "eu-north-1";

    if (!accessKeyId || !secretAccessKey) {
      console.log("⚠️ AWS credentials not found in environment variables");
      console.log("   Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION");
      return;
    }

    try {
      this.client = new DynamoDBClient({
        region: region,
        credentials: {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey
        }
      });

      this.docClient = DynamoDBDocumentClient.from(this.client, {
        marshallOptions: {
          removeUndefinedValues: true,
          convertEmptyValues: true
        }
      });

      this.isInitialized = true;
      console.log(`✅ AWS DynamoDB initialized successfully`);
      console.log(`   Region: ${region}`);
      console.log(`   Table: ${TABLE_NAME}`);
    } catch (error) {
      console.error("❌ Failed to initialize AWS DynamoDB:", error);
    }
  }

  isConnected(): boolean {
    return this.isInitialized && this.docClient !== null;
  }

  async saveJournalData(dateKey: string, data: any): Promise<boolean> {
    if (!this.isConnected()) {
      console.error("❌ AWS DynamoDB not connected");
      return false;
    }

    try {
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          dateKey: dateKey,
          data: data,
          updatedAt: new Date().toISOString()
        }
      });

      await this.docClient!.send(command);
      console.log(`✅ AWS: Saved journal data for ${dateKey}`);
      return true;
    } catch (error) {
      console.error(`❌ AWS: Failed to save journal data for ${dateKey}:`, error);
      return false;
    }
  }

  async getJournalData(dateKey: string): Promise<any | null> {
    if (!this.isConnected()) {
      console.error("❌ AWS DynamoDB not connected");
      return null;
    }

    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { dateKey: dateKey }
      });

      const response = await this.docClient!.send(command);
      
      if (response.Item) {
        console.log(`✅ AWS: Retrieved journal data for ${dateKey}`);
        return response.Item.data;
      }
      
      console.log(`⚠️ AWS: No data found for ${dateKey}`);
      return null;
    } catch (error) {
      console.error(`❌ AWS: Failed to get journal data for ${dateKey}:`, error);
      return null;
    }
  }

  async getAllJournalData(): Promise<Record<string, any>> {
    if (!this.isConnected()) {
      console.error("❌ AWS DynamoDB not connected");
      return {};
    }

    try {
      const command = new ScanCommand({
        TableName: TABLE_NAME
      });

      const response = await this.docClient!.send(command);
      
      const result: Record<string, any> = {};
      
      if (response.Items) {
        for (const item of response.Items) {
          if (item.dateKey && item.data) {
            const cleanKey = item.dateKey.replace('journal_', '');
            result[cleanKey] = item.data;
          }
        }
        console.log(`✅ AWS: Retrieved ${Object.keys(result).length} journal entries`);
      }
      
      return result;
    } catch (error) {
      console.error("❌ AWS: Failed to get all journal data:", error);
      return {};
    }
  }

  async deleteJournalData(dateKey: string): Promise<boolean> {
    if (!this.isConnected()) {
      console.error("❌ AWS DynamoDB not connected");
      return false;
    }

    try {
      const command = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { dateKey: dateKey }
      });

      await this.docClient!.send(command);
      console.log(`✅ AWS: Deleted journal data for ${dateKey}`);
      return true;
    } catch (error) {
      console.error(`❌ AWS: Failed to delete journal data for ${dateKey}:`, error);
      return false;
    }
  }

  async getCachedData(key: string): Promise<any | null> {
    return this.getJournalData(key);
  }

  async setCachedData(key: string, data: any): Promise<boolean> {
    return this.saveJournalData(key, data);
  }

  async getAllCollectionData(): Promise<Record<string, any>> {
    return this.getAllJournalData();
  }
}

export const awsDynamoDBService = new AWSDynamoDBService();
