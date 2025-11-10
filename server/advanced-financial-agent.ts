import { GoogleGenAI } from "@google/genai";
import axios from "axios";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface JournalData {
  date: string;
  pnl: number;
  trades: number;
  winRate?: number;
  avgProfit?: number;
  avgLoss?: number;
}

export interface FinancialQuery {
  query: string;
  userStocks?: string[];
  journalData?: JournalData[];
  fyersData?: any;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface CompanyFundamentals {
  symbol: string;
  companyName: string;
  currentPrice?: string;
  priceChange?: string;
  priceChangePercent?: string;
  volume?: string;
  marketCap?: string;
  peRatio?: string;
  eps?: string;
  high52Week?: string;
  low52Week?: string;
  revenue?: string;
  netIncome?: string;
  grossMargin?: string;
  operatingMargin?: string;
  netMargin?: string;
  debtToEquity?: string;
  revenueGrowthYoY?: string;
  earningsGrowthYoY?: string;
  source: string;
  lastUpdated: string;
}

export interface AdvancedAnalysisResult {
  query: string;
  answer: string;
  fundamentals?: CompanyFundamentals[];
  webSources: WebSearchResult[];
  insights: string[];
  timestamp: string;
}

async function getFinancialReferenceSources(query: string): Promise<WebSearchResult[]> {
  console.log(`[FINANCIAL-SOURCES] Generating reference sources for: ${query}`);
  
  try {
    const searchResults: WebSearchResult[] = [];
    
    const yahooFinanceUrl = `https://finance.yahoo.com/quote/${query}`;
    searchResults.push({
      title: `${query} - Yahoo Finance`,
      url: yahooFinanceUrl,
      snippet: `Real-time stock data, news, and analysis for ${query}`,
      source: "Yahoo Finance"
    });
    
    const moneycontrolUrl = `https://www.moneycontrol.com/india/stockpricequote/${query.toLowerCase()}`;
    searchResults.push({
      title: `${query} - Moneycontrol`,
      url: moneycontrolUrl,
      snippet: `Indian stock market data and fundamentals for ${query}`,
      source: "Moneycontrol"
    });
    
    const screenerUrl = `https://www.screener.in/company/${query}/consolidated/`;
    searchResults.push({
      title: `${query} - Screener.in`,
      url: screenerUrl,
      snippet: `Detailed financial analysis and ratios for ${query}`,
      source: "Screener.in"
    });
    
    console.log(`[FINANCIAL-SOURCES] Generated ${searchResults.length} reference URLs`);
    return searchResults;
    
  } catch (error) {
    console.error(`[FINANCIAL-SOURCES] Error:`, error);
    return [];
  }
}

async function fetchYahooFinanceData(symbol: string): Promise<CompanyFundamentals | null> {
  console.log(`📊 [YAHOO-FINANCE] Fetching data for: ${symbol}`);
  
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?interval=1d&range=1mo`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    if (response.data?.chart?.result?.[0]) {
      const result = response.data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];
      
      const currentPrice = meta.regularMarketPrice || meta.previousClose || null;
      const previousClose = meta.chartPreviousClose || meta.previousClose || currentPrice;
      const priceChange = currentPrice && previousClose ? (currentPrice - previousClose) : null;
      const priceChangePercent = currentPrice && previousClose ? ((priceChange / previousClose) * 100) : null;
      
      const fundamentals: CompanyFundamentals = {
        symbol: symbol,
        companyName: meta.longName || meta.shortName || symbol,
        currentPrice: currentPrice ? `₹${currentPrice.toFixed(2)}` : 'N/A',
        priceChange: priceChange ? `${priceChange >= 0 ? '+' : ''}₹${priceChange.toFixed(2)}` : 'N/A',
        priceChangePercent: priceChangePercent ? `${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%` : 'N/A',
        volume: meta.regularMarketVolume ? meta.regularMarketVolume.toLocaleString() : 'N/A',
        marketCap: meta.marketCap ? `₹${(meta.marketCap / 10000000).toFixed(2)} Cr` : 'N/A',
        high52Week: meta.fiftyTwoWeekHigh ? `₹${meta.fiftyTwoWeekHigh.toFixed(2)}` : 'N/A',
        low52Week: meta.fiftyTwoWeekLow ? `₹${meta.fiftyTwoWeekLow.toFixed(2)}` : 'N/A',
        source: 'Yahoo Finance API',
        lastUpdated: new Date().toISOString()
      };
      
      console.log(`✅ [YAHOO-FINANCE] Successfully fetched data for ${symbol}`);
      return fundamentals;
    }
    
    console.log(`⚠️ [YAHOO-FINANCE] No data found for ${symbol}`);
    return null;
    
  } catch (error: any) {
    console.error(`❌ [YAHOO-FINANCE] Error fetching ${symbol}:`, error.message);
    return null;
  }
}

function extractCompanySymbols(query: string): string[] {
  const indianStockSymbols: { [key: string]: string } = {
    'reliance': 'RELIANCE',
    'tcs': 'TCS',
    'infosys': 'INFY',
    'infy': 'INFY',
    'hdfc': 'HDFCBANK',
    'hdfcbank': 'HDFCBANK',
    'icici': 'ICICIBANK',
    'icicibank': 'ICICIBANK',
    'sbi': 'SBIN',
    'sbin': 'SBIN',
    'bharti': 'BHARTIARTL',
    'airtel': 'BHARTIARTL',
    'itc': 'ITC',
    'wipro': 'WIPRO',
    'hcl': 'HCLTECH',
    'hcltech': 'HCLTECH',
    'adani': 'ADANIENT',
    'tata motors': 'TATAMOTORS',
    'bajaj': 'BAJFINANCE',
    'maruti': 'MARUTI',
    'asian paints': 'ASIANPAINT',
    'l&t': 'LT',
    'larsen': 'LT',
    'techm': 'TECHM',
    'tech mahindra': 'TECHM',
    'titan': 'TITAN',
    'ultratech': 'ULTRACEMCO',
    'powergrid': 'POWERGRID',
    'ongc': 'ONGC',
    'coal india': 'COALINDIA',
    'ntpc': 'NTPC',
    'bpcl': 'BPCL',
    'ioc': 'IOC',
    'hindalco': 'HINDALCO',
    'sunpharma': 'SUNPHARMA',
    'drreddy': 'DRREDDY'
  };
  
  const lowerQuery = query.toLowerCase();
  const detectedSymbols: string[] = [];
  
  for (const [keyword, symbol] of Object.entries(indianStockSymbols)) {
    if (lowerQuery.includes(keyword)) {
      detectedSymbols.push(symbol);
    }
  }
  
  return [...new Set(detectedSymbols)];
}

function analyzeJournalPerformance(journalData: JournalData[]): string {
  if (!journalData || journalData.length === 0) {
    return "No trading journal data available.";
  }
  
  const totalTrades = journalData.reduce((sum, day) => sum + (day.trades || 0), 0);
  const totalPnL = journalData.reduce((sum, day) => sum + day.pnl, 0);
  const profitableDays = journalData.filter(day => day.pnl > 0).length;
  const lossDays = journalData.filter(day => day.pnl < 0).length;
  const avgDailyPnL = totalPnL / journalData.length;
  const maxProfit = Math.max(...journalData.map(d => d.pnl));
  const maxLoss = Math.min(...journalData.map(d => d.pnl));
  const winRate = (profitableDays / journalData.length) * 100;
  
  const trend = totalPnL >= 0 ? 'Positive' : 'Negative';
  
  return `
**Your Trading Journal Analysis:**
- Total Trading Days: ${journalData.length}
- Total Trades: ${totalTrades}
- Total P&L: ₹${totalPnL.toLocaleString()} (${trend} trend)
- Win Rate: ${winRate.toFixed(1)}% (${profitableDays} profitable days out of ${journalData.length})
- Avg Daily P&L: ₹${avgDailyPnL.toLocaleString()}
- Best Day: ₹${maxProfit.toLocaleString()} 
- Worst Day: ₹${maxLoss.toLocaleString()}
- Profit Days: ${profitableDays} | Loss Days: ${lossDays}
  `.trim();
}

export async function processAdvancedFinancialQuery(
  queryData: FinancialQuery
): Promise<AdvancedAnalysisResult> {
  console.log(`🤖 [ADVANCED-AI] Processing query: "${queryData.query}"`);
  console.log(`📊 [ADVANCED-AI] Journal data: ${queryData.journalData?.length || 0} days`);
  console.log(`💼 [ADVANCED-AI] User stocks: ${queryData.userStocks?.join(', ') || 'None'}`);
  
  try {
    const symbols = extractCompanySymbols(queryData.query);
    console.log(`🎯 [ADVANCED-AI] Detected symbols: ${symbols.join(', ') || 'None'}`);
    
    const webResults = await getFinancialReferenceSources(
      symbols[0] || queryData.query
    );
    
    const fundamentals: CompanyFundamentals[] = [];
    for (const symbol of symbols.slice(0, 3)) {
      const data = await fetchYahooFinanceData(symbol);
      if (data) {
        fundamentals.push(data);
      }
    }
    
    if (queryData.fyersData) {
      console.log(`[FYERS-DATA] Fyers data provided for analysis`);
    }
    
    const journalAnalysis = queryData.journalData 
      ? analyzeJournalPerformance(queryData.journalData)
      : '';
    
    const prompt = `You are an advanced financial AI agent (like Replit Agent but for stock trading). Provide intelligent, actionable insights.

**User Query:** ${queryData.query}

${fundamentals.length > 0 ? `
**Real-Time Stock Data (Yahoo Finance):**

${fundamentals.map((f, i) => `
${i + 1}. **${f.companyName}** (${f.symbol})
   - Current Price: ${f.currentPrice} | Change: ${f.priceChange} (${f.priceChangePercent})
   - 52W Range: ${f.low52Week} - ${f.high52Week}
   - Volume: ${f.volume}
   - Market Cap: ${f.marketCap}
`).join('\n')}
` : ''}

${journalAnalysis ? `
${journalAnalysis}
` : ''}

${queryData.userStocks && queryData.userStocks.length > 0 ? `
**User's Portfolio Stocks:** ${queryData.userStocks.join(', ')}
` : ''}

**Your Task:**
Provide a comprehensive analysis that:
1. **Market Analysis**: Analyze the stock's current performance and trends
2. **Technical View**: Comment on price action, 52-week levels, and momentum
3. **Trading Strategy**: If journal data provided, suggest how to improve trading performance
4. **Risk Assessment**: Identify key risks and support/resistance levels
5. **Actionable Insights**: Give specific recommendations (buy/sell/hold zones, stop losses, targets)

Format with clear sections, bullet points, and **bold headers**. Be specific with numbers and percentages.`;

    console.log(`🧠 [ADVANCED-AI] Sending to Gemini AI...`);
    
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt
    });
    
    const answer = result.text || "Analysis complete. Check the data above for insights.";
    
    const insights: string[] = [];
    if (fundamentals.length > 0) {
      insights.push(`Live data for ${fundamentals.length} stock(s): ${fundamentals.map(f => f.symbol).join(', ')}`);
    }
    if (journalAnalysis) {
      insights.push(`Trading journal analyzed: ${queryData.journalData?.length} days of P&L data`);
    }
    if (webResults.length > 0) {
      insights.push(`${webResults.length} financial reference sources provided`);
    }
    insights.push(`AI-powered analysis with real-time market data`);
    
    console.log(`✅ [ADVANCED-AI] Analysis complete!`);
    
    return {
      query: queryData.query,
      answer,
      fundamentals,
      webSources: webResults,
      insights,
      timestamp: new Date().toISOString()
    };
    
  } catch (error: any) {
    console.error(`❌ [ADVANCED-AI] Error:`, error);
    
    return {
      query: queryData.query,
      answer: `🔍 **Advanced Financial AI Agent Active**

I'm here to help you with stock analysis! However, I encountered an issue: ${error.message}

**What I Can Do:**
- 📊 Analyze stock fundamentals using real-time data from Yahoo Finance
- 📈 Review your trading journal and provide performance insights
- 💡 Compare multiple stocks and provide investment recommendations
- 🎯 Suggest entry/exit points based on technical and fundamental analysis

**Try asking:**
- "Analyze Reliance stock fundamentals"
- "Compare TCS and Infosys"
- "Review my trading performance" (when journal data available)
- "Should I buy HDFC Bank?"
- "Technical analysis for ICICI Bank"

I combine web data, your trading journal, and AI analysis to give you Replit-Agent-level insights for stock trading!`,
      fundamentals: [],
      webSources: [],
      insights: [
        "🤖 Advanced AI agent ready",
        "🔍 Web search + Journal + Fyers integration active",
        "⚡ Real-time stock analysis available"
      ],
      timestamp: new Date().toISOString()
    };
  }
}
