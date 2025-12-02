import { getFirestore } from 'firebase-admin/firestore';

export interface UniversalFormatData {
  brokerName: string;
  formatName: string;
  sampleLine: string;
  positions: {
    time: number[];
    order: number[];
    symbol: number[];
    type: number[];
    qty: number[];
    price: number[];
  };
  displayValues: {
    time: string;
    order: string;
    symbol: string;
    type: string;
    qty: string;
    price: string;
  };
  userId: string;
  savedAt: string;
  detectionScore?: number;
}

export class BrokerFormatsLibrary {
  private db = getFirestore();
  private brokerFormatsCollection = "brokerFormats";

  /**
   * Save format to universal broker library
   * Organizes by broker: brokerFormats/{brokerName}/formats/{formatId}
   */
  async saveFormatToLibrary(format: Omit<UniversalFormatData, 'savedAt'>): Promise<string> {
    try {
      const formatId = `${format.formatName}_${Date.now()}`;
      const brokerRef = this.db
        .collection(this.brokerFormatsCollection)
        .doc(format.brokerName)
        .collection('formats')
        .doc(formatId);

      const formatWithTimestamp: UniversalFormatData = {
        ...format,
        savedAt: new Date().toISOString()
      };

      await brokerRef.set(formatWithTimestamp);
      console.log(`✅ [FORMATS-LIBRARY] Saved format to broker library: ${format.brokerName}/${formatId}`);
      return formatId;
    } catch (error) {
      console.error('❌ [FORMATS-LIBRARY] Error saving format:', error);
      throw error;
    }
  }

  /**
   * Get all formats for a specific broker
   */
  async getFormatsByBroker(brokerName: string): Promise<UniversalFormatData[]> {
    try {
      const snapshot = await this.db
        .collection(this.brokerFormatsCollection)
        .doc(brokerName)
        .collection('formats')
        .get();

      const formats = snapshot.docs.map((doc: any) => doc.data() as UniversalFormatData);
      console.log(`📚 [FORMATS-LIBRARY] Found ${formats.length} formats for ${brokerName}`);
      return formats;
    } catch (error) {
      console.error('❌ [FORMATS-LIBRARY] Error fetching formats:', error);
      return [];
    }
  }

  /**
   * Get all available brokers that have saved formats
   */
  async getAllBrokers(): Promise<string[]> {
    try {
      const snapshot = await this.db
        .collection(this.brokerFormatsCollection)
        .get();

      const brokers = snapshot.docs.map((doc: any) => doc.id);
      console.log(`🏢 [FORMATS-LIBRARY] Found ${brokers.length} brokers in library`);
      return brokers;
    } catch (error) {
      console.error('❌ [FORMATS-LIBRARY] Error fetching brokers:', error);
      return [];
    }
  }

  /**
   * Auto-detect format by matching against all broker formats
   * Returns best match with confidence score
   */
  async autoDetectFormat(
    firstLine: string
  ): Promise<{ format: UniversalFormatData; confidence: number; brokerName: string } | null> {
    try {
      const brokers = await this.getAllBrokers();
      const allFormats: (UniversalFormatData & { brokerName: string })[] = [];

      // Collect all formats from all brokers
      for (const broker of brokers) {
        const formats = await this.getFormatsByBroker(broker);
        allFormats.push(...formats.map(f => ({ ...f, brokerName: broker })));
      }

      if (allFormats.length === 0) {
        console.log('📭 [FORMATS-LIBRARY] No formats in library for auto-detection');
        return null;
      }

      // Calculate match score for each format
      const scores = allFormats.map(format => ({
        format,
        score: calculateMatchScore(firstLine, format.sampleLine)
      }));

      // Sort by score descending
      scores.sort((a, b) => b.score - a.score);
      const bestMatch = scores[0];

      if (bestMatch.score > 0.5) {
        // Confidence threshold: 50% match
        console.log(
          `✅ [FORMATS-LIBRARY] Auto-detected format "${bestMatch.format.formatName}" from ${bestMatch.format.brokerName} (confidence: ${(bestMatch.score * 100).toFixed(0)}%)`
        );
        return {
          format: bestMatch.format,
          confidence: bestMatch.score,
          brokerName: bestMatch.format.brokerName
        };
      }

      console.log(`❌ [FORMATS-LIBRARY] No format matched above confidence threshold`);
      return null;
    } catch (error) {
      console.error('❌ [FORMATS-LIBRARY] Error in auto-detection:', error);
      return null;
    }
  }

  /**
   * Search formats by broker name (case-insensitive)
   */
  async searchFormats(query: string): Promise<UniversalFormatData[]> {
    try {
      const brokers = await this.getAllBrokers();
      const matchedBrokers = brokers.filter(b => b.toLowerCase().includes(query.toLowerCase()));

      const allFormats: UniversalFormatData[] = [];
      for (const broker of matchedBrokers) {
        const formats = await this.getFormatsByBroker(broker);
        allFormats.push(...formats);
      }

      return allFormats;
    } catch (error) {
      console.error('❌ [FORMATS-LIBRARY] Error searching formats:', error);
      return [];
    }
  }
}

/**
 * Calculate match score between current data format and saved format
 * Returns 0-1 score (1 = perfect match, 0 = no match)
 */
function calculateMatchScore(currentLine: string, sampleLine: string): number {
  try {
    // Parse both lines into words
    const currentWords = currentLine.split(/[\s\t]+/).filter(w => w.trim());
    const sampleWords = sampleLine.split(/[\s\t]+/).filter(w => w.trim());

    if (currentWords.length === 0 || sampleWords.length === 0) {
      return 0;
    }

    // Check how many words match
    let matchCount = 0;
    for (const sampleWord of sampleWords) {
      if (currentWords.some(w => w.toLowerCase() === sampleWord.toLowerCase())) {
        matchCount++;
      }
    }

    // Calculate percentage match
    const maxLen = Math.max(sampleWords.length, currentWords.length);
    return matchCount / maxLen;
  } catch (error) {
    console.error('❌ Error calculating match score:', error);
    return 0;
  }
}

export const brokerFormatsLibrary = new BrokerFormatsLibrary();
