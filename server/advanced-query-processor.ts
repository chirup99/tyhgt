import axios from 'axios';
import * as cheerio from 'cheerio';
import { intelligentAgent } from './intelligent-financial-agent';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface QueryAnalysis {
  intent: 'stock_analysis' | 'market_overview' | 'news' | 'ipo' | 'journal' | 'general' | 'technical';
  stockSymbols: string[];
  keywords: string[];
  needsWebSearch: boolean;
  needsJournalData: boolean;
  needsFyersData: boolean;
}

/**
 * Advanced Query Processor - Like Replit Agent
 * Uses web search + intelligent analysis to answer ANY question
 */
export class AdvancedQueryProcessor {
  
  /**
   * Analyze user query to understand intent
   */
  private analyzeQuery(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    
    // Extract stock symbols
    const stockSymbols: string[] = [];
    const indianStocks: Record<string, string> = {
      'reliance': 'RELIANCE',
      'tcs': 'TCS',
      'infosys': 'INFY',
      'infy': 'INFY',
      'hdfc': 'HDFCBANK',
      'icici': 'ICICIBANK',
      'sbi': 'SBIN',
      'airtel': 'BHARTIARTL',
      'itc': 'ITC',
      'wipro': 'WIPRO',
      'nifty': 'NIFTY50',
      'banknifty': 'BANKNIFTY',
      'sensex': 'SENSEX'
    };
    
    for (const [keyword, symbol] of Object.entries(indianStocks)) {
      if (lowerQuery.includes(keyword)) {
        stockSymbols.push(symbol);
      }
    }
    
    // Determine intent
    let intent: QueryAnalysis['intent'] = 'general';
    
    if (stockSymbols.length > 0 || lowerQuery.match(/\b(stock|share|equity|price)\b/)) {
      intent = 'stock_analysis';
    } else if (lowerQuery.match(/\b(market|nse|bse|indices|sensex|nifty)\b/)) {
      intent = 'market_overview';
    } else if (lowerQuery.match(/\b(news|headlines|latest|today)\b/)) {
      intent = 'news';
    } else if (lowerQuery.match(/\b(ipo|listing|new issue)\b/)) {
      intent = 'ipo';
    } else if (lowerQuery.match(/\b(journal|trade|trading|performance|profit|loss)\b/)) {
      intent = 'journal';
    } else if (lowerQuery.match(/\b(rsi|macd|ema|sma|bollinger|technical|indicator)\b/)) {
      intent = 'technical';
    }
    
    // Extract keywords
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['what', 'when', 'where', 'which', 'about', 'should', 'could', 'would'].includes(word));
    
    return {
      intent,
      stockSymbols,
      keywords,
      needsWebSearch: true, // Always use web search for fresh data
      needsJournalData: intent === 'journal',
      needsFyersData: stockSymbols.length > 0 || intent === 'stock_analysis'
    };
  }
  
  /**
   * Perform web search using DuckDuckGo or Google
   */
  private async performWebSearch(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      // Use DuckDuckGo instant answer API (no API key required)
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' india stock market')}&format=json&no_html=1`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const results: SearchResult[] = [];
      
      // Parse related topics
      if (response.data.RelatedTopics) {
        for (const topic of response.data.RelatedTopics.slice(0, limit)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.substring(0, 100),
              url: topic.FirstURL,
              snippet: topic.Text
            });
          }
        }
      }
      
      // If DuckDuckGo doesn't return results, scrape Google News
      if (results.length === 0) {
        const newsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
        const newsResponse = await axios.get(newsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        });
        
        const $ = cheerio.load(newsResponse.data, { xmlMode: true });
        
        $('item').slice(0, limit).each((i, elem) => {
          const title = $(elem).find('title').text();
          const link = $(elem).find('link').text();
          const description = $(elem).find('description').text() || title;
          
          results.push({
            title,
            url: link,
            snippet: description
          });
        });
      }
      
      return results;
    } catch (error) {
      console.error('Web search error:', error);
      return [];
    }
  }
  
  /**
   * Fetch and parse webpage content
   */
  private async fetchWebpageContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      
      // Remove scripts, styles, and navigation
      $('script, style, nav, header, footer').remove();
      
      // Extract main content
      const content = $('article, main, .content, .article-body, p')
        .text()
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 2000); // Limit to 2000 characters
      
      return content;
    } catch (error) {
      console.error(`Error fetching webpage ${url}:`, error);
      return '';
    }
  }
  
  /**
   * Generate intelligent answer from web search results
   */
  private generateAnswerFromWebResults(
    query: string,
    searchResults: SearchResult[],
    analysis: QueryAnalysis,
    additionalData?: {
      stockData?: any;
      journalInsights?: string;
      marketTrends?: any[];
      news?: any[];
    }
  ): string {
    let answer = `# 🤖 AI Agent Answer\n\n`;
    answer += `**Your Question:** ${query}\n\n`;
    
    // Add stock-specific analysis if available
    if (additionalData?.stockData && analysis.stockSymbols.length > 0) {
      const symbol = analysis.stockSymbols[0];
      const stock = additionalData.stockData;
      
      answer += `## 📊 ${symbol} Analysis\n\n`;
      answer += `**Current Price:** ₹${stock.price.toFixed(2)}\n`;
      answer += `**Change:** ${stock.change >= 0 ? '+' : ''}₹${stock.change.toFixed(2)} (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)\n`;
      answer += `**Trend:** ${stock.changePercent > 2 ? '🟢 Strong Bullish' : stock.changePercent > 0 ? '🟢 Bullish' : stock.changePercent < -2 ? '🔴 Strong Bearish' : stock.changePercent < 0 ? '🔴 Bearish' : '⚪ Neutral'}\n\n`;
    }
    
    // Add market trends
    if (additionalData?.marketTrends && additionalData.marketTrends.length > 0) {
      answer += `## 📈 Market Overview\n\n`;
      additionalData.marketTrends.forEach(trend => {
        const emoji = trend.trend === 'bullish' ? '🟢' : trend.trend === 'bearish' ? '🔴' : '⚪';
        answer += `**${emoji} ${trend.index}:** ${trend.value.toFixed(2)} (${trend.changePercent >= 0 ? '+' : ''}${trend.changePercent.toFixed(2)}%)\n`;
      });
      answer += `\n`;
    }
    
    // Add web search insights
    if (searchResults.length > 0) {
      answer += `## 🌐 Web Search Insights\n\n`;
      answer += `I found relevant information from recent sources:\n\n`;
      
      searchResults.slice(0, 3).forEach((result, index) => {
        answer += `**${index + 1}. ${result.title}**\n`;
        answer += `${result.snippet}\n\n`;
      });
    }
    
    // Add latest news
    if (additionalData?.news && additionalData.news.length > 0) {
      answer += `## 📰 Latest Market News\n\n`;
      additionalData.news.slice(0, 3).forEach((item, index) => {
        answer += `${index + 1}. **${item.title}**\n`;
        answer += `   Source: ${item.source}\n\n`;
      });
    }
    
    // Add journal insights
    if (additionalData?.journalInsights) {
      answer += `## 📔 Your Trading Journal\n\n`;
      answer += additionalData.journalInsights;
      answer += `\n\n`;
    }
    
    // Add intelligent suggestions based on intent
    answer += `## 💡 Intelligent Insights\n\n`;
    
    switch (analysis.intent) {
      case 'stock_analysis':
        answer += `• Check the **Trading Master** for detailed technical analysis and charts\n`;
        answer += `• Use **Social Feed** to see what the community is saying about this stock\n`;
        answer += `• Review **Market News** for latest company updates\n`;
        break;
      case 'market_overview':
        answer += `• Market is showing ${additionalData?.marketTrends?.[0]?.trend || 'mixed'} sentiment today\n`;
        answer += `• Check individual sectors for specific opportunities\n`;
        answer += `• Monitor key levels for potential breakouts\n`;
        break;
      case 'journal':
        answer += `• Your trading journal shows important patterns in your performance\n`;
        answer += `• Focus on your best-performing strategies\n`;
        answer += `• Consider adjusting position sizes based on win rate\n`;
        break;
      default:
        answer += `• For detailed analysis, use the Trading Master\n`;
        answer += `• Stay updated with the latest news in the Social Feed\n`;
        answer += `• Track your performance in the Trading Journal\n`;
    }
    
    answer += `\n---\n`;
    answer += `*Generated by Advanced AI Agent with Web Search*\n`;
    answer += `*Data sources: ${searchResults.length > 0 ? 'Web Search, ' : ''}Yahoo Finance, Google News, Fyers API*\n`;
    answer += `*Generated at: ${new Date().toLocaleString()}*\n`;
    
    return answer;
  }
  
  /**
   * Process ANY user query with web search + intelligent analysis
   */
  async processQuery(query: string, options?: {
    journalTrades?: any[];
    fyersData?: any;
  }): Promise<{
    answer: string;
    sources: SearchResult[];
    timestamp: string;
  }> {
    try {
      console.log(`[ADVANCED-QUERY-PROCESSOR] Processing query: "${query}"`);
      
      // Analyze query intent
      const analysis = this.analyzeQuery(query);
      console.log(`[ADVANCED-QUERY-PROCESSOR] Intent: ${analysis.intent}, Stocks: ${analysis.stockSymbols.join(', ') || 'None'}`);
      
      // Perform web search
      const searchResults = await this.performWebSearch(query, 5);
      console.log(`[ADVANCED-QUERY-PROCESSOR] Found ${searchResults.length} web results`);
      
      // Gather additional data based on intent
      const additionalData: any = {};
      
      // Get stock data if needed
      if (analysis.stockSymbols.length > 0) {
        try {
          const stockData = await intelligentAgent.getStockData(analysis.stockSymbols[0]);
          if (stockData) {
            additionalData.stockData = stockData;
            console.log(`[ADVANCED-QUERY-PROCESSOR] Fetched stock data for ${analysis.stockSymbols[0]}`);
          }
        } catch (error) {
          console.error('[ADVANCED-QUERY-PROCESSOR] Error fetching stock data:', error);
        }
      }
      
      // Get market trends
      if (analysis.intent === 'market_overview' || analysis.intent === 'general') {
        try {
          const trends = await intelligentAgent.getMarketTrends();
          if (trends.length > 0) {
            additionalData.marketTrends = trends;
            console.log(`[ADVANCED-QUERY-PROCESSOR] Fetched ${trends.length} market trends`);
          }
        } catch (error) {
          console.error('[ADVANCED-QUERY-PROCESSOR] Error fetching market trends:', error);
        }
      }
      
      // Get news
      if (analysis.intent === 'news' || analysis.intent === 'general') {
        try {
          const news = await intelligentAgent.getFinancialNews(5);
          if (news.length > 0) {
            additionalData.news = news;
            console.log(`[ADVANCED-QUERY-PROCESSOR] Fetched ${news.length} news items`);
          }
        } catch (error) {
          console.error('[ADVANCED-QUERY-PROCESSOR] Error fetching news:', error);
        }
      }
      
      // Analyze journal if requested
      if (analysis.needsJournalData && options?.journalTrades) {
        const insights = intelligentAgent.analyzeJournal(options.journalTrades);
        additionalData.journalInsights = `**Total Trades:** ${insights.totalTrades}\n**Win Rate:** ${insights.winRate}%\n**Best Stock:** ${insights.bestPerformingStock}\n**Suggestion:** ${insights.suggestion}`;
        console.log(`[ADVANCED-QUERY-PROCESSOR] Analyzed ${options.journalTrades.length} trades`);
      }
      
      // Generate intelligent answer
      const answer = this.generateAnswerFromWebResults(
        query,
        searchResults,
        analysis,
        additionalData
      );
      
      console.log(`[ADVANCED-QUERY-PROCESSOR] Generated answer (${answer.length} characters)`);
      
      return {
        answer,
        sources: searchResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('[ADVANCED-QUERY-PROCESSOR] Error processing query:', error);
      
      // Fallback answer
      return {
        answer: `# ❌ Unable to Process Query\n\nI encountered an error while processing your question: "${query}"\n\nPlease try:\n• Rephrasing your question\n• Using specific stock names\n• Checking the Trading Master for detailed analysis\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sources: [],
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const advancedQueryProcessor = new AdvancedQueryProcessor();
