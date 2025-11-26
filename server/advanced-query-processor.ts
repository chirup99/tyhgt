import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from "@google/genai";
import { intelligentAgent } from './intelligent-financial-agent';
import { enhancedFinancialScraper } from './enhanced-financial-scraper';
import { journalPortfolioAnalyzer, TradeEntry } from './journal-portfolio-analyzer';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevanceScore?: number;
}

function stripHtml(html: string): string {
  if (!html) return '';
  let text = html.replace(/<[^>]*>/g, '');
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  return text.trim();
}

interface QueryAnalysis {
  intent: 'stock_analysis' | 'market_overview' | 'news' | 'ipo' | 'journal' | 'risk_analysis' | 'portfolio' | 'performance' | 'general' | 'technical';
  stockSymbols: string[];
  keywords: string[];
  needsWebSearch: boolean;
  needsJournalData: boolean;
  needsFyersData: boolean;
  needsRiskAnalysis: boolean;
  needsPortfolioAnalysis: boolean;
  isComplexQuery: boolean;
}

export class AdvancedQueryProcessor {
  
  private analyzeQuery(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    
    const stockSymbols: string[] = [];
    const indianStocks: Record<string, string> = {
      'reliance': 'RELIANCE',
      'tcs': 'TCS',
      'tata consultancy': 'TCS',
      'infosys': 'INFY',
      'infy': 'INFY',
      'hdfc': 'HDFCBANK',
      'icici': 'ICICIBANK',
      'sbi': 'SBIN',
      'state bank': 'SBIN',
      'airtel': 'BHARTIARTL',
      'bharti': 'BHARTIARTL',
      'itc': 'ITC',
      'wipro': 'WIPRO',
      'nifty': 'NIFTY50',
      'banknifty': 'BANKNIFTY',
      'sensex': 'SENSEX',
      'adani': 'ADANIENT',
      'tata motors': 'TATAMOTORS',
      'maruti': 'MARUTI',
      'bajaj': 'BAJFINANCE',
      'axis bank': 'AXISBANK',
      'kotak': 'KOTAKBANK',
      'tech mahindra': 'TECHM',
      'hul': 'HINDUNILVR',
      'asian paints': 'ASIANPAINT',
      'titan': 'TITAN',
      'sun pharma': 'SUNPHARMA',
      'l&t': 'LT',
      'larsen': 'LT'
    };
    
    for (const [keyword, symbol] of Object.entries(indianStocks)) {
      if (lowerQuery.includes(keyword)) {
        stockSymbols.push(symbol);
      }
    }
    
    let intent: QueryAnalysis['intent'] = 'general';
    
    const journalKeywords = ['journal', 'trade', 'trading', 'my trade', 'my performance', 'my p&l', 'my profit', 'my loss', 'how am i doing', 'my win', 'how many trade'];
    const riskKeywords = ['risk', 'drawdown', 'exposure', 'var', 'volatility', 'sharpe', 'sortino', 'beta', 'max loss'];
    const portfolioKeywords = ['portfolio', 'holding', 'position', 'allocation', 'diversification', 'investment'];
    const performanceKeywords = ['performance', 'win rate', 'loss rate', 'profit factor', 'expectancy', 'streak', 'roi', 'return'];
    const technicalKeywords = ['rsi', 'macd', 'ema', 'sma', 'bollinger', 'technical', 'indicator', 'support', 'resistance', 'trend'];
    
    if (journalKeywords.some(k => lowerQuery.includes(k))) {
      intent = 'journal';
    } else if (riskKeywords.some(k => lowerQuery.includes(k))) {
      intent = 'risk_analysis';
    } else if (portfolioKeywords.some(k => lowerQuery.includes(k))) {
      intent = 'portfolio';
    } else if (performanceKeywords.some(k => lowerQuery.includes(k))) {
      intent = 'performance';
    } else if (technicalKeywords.some(k => lowerQuery.includes(k))) {
      intent = 'technical';
    } else if (stockSymbols.length > 0 || lowerQuery.match(/\b(stock|share|equity|price)\b/)) {
      intent = 'stock_analysis';
    } else if (lowerQuery.match(/\b(market|nse|bse|indices)\b/)) {
      intent = 'market_overview';
    } else if (lowerQuery.match(/\b(news|headlines|latest|today|update)\b/)) {
      intent = 'news';
    } else if (lowerQuery.match(/\b(ipo|listing|new issue)\b/)) {
      intent = 'ipo';
    }
    
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['what', 'when', 'where', 'which', 'about', 'should', 'could', 'would', 'please', 'tell', 'show', 'give'].includes(word));
    
    const isComplexQuery = query.length > 50 || 
      query.includes('?') || 
      ['why', 'how', 'explain', 'analyze', 'compare', 'best', 'worst'].some(w => lowerQuery.includes(w));

    return {
      intent,
      stockSymbols,
      keywords,
      needsWebSearch: true,
      needsJournalData: ['journal', 'risk_analysis', 'portfolio', 'performance'].includes(intent),
      needsFyersData: stockSymbols.length > 0 || intent === 'stock_analysis' || intent === 'technical',
      needsRiskAnalysis: ['risk_analysis', 'portfolio', 'performance'].includes(intent) || riskKeywords.some(k => lowerQuery.includes(k)),
      needsPortfolioAnalysis: ['portfolio', 'performance'].includes(intent) || portfolioKeywords.some(k => lowerQuery.includes(k)),
      isComplexQuery
    };
  }
  
  private async performWebSearch(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      const webResults = await enhancedFinancialScraper.searchFinancialWeb(query, limit);
      return webResults.webResults.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
        relevanceScore: r.relevanceScore
      }));
    } catch (error) {
      console.error('Web search error:', error);
      return [];
    }
  }
  
  private async fetchWebpageContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      $('script, style, nav, header, footer').remove();
      
      const content = $('article, main, .content, .article-body, p')
        .text()
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 2000);
      
      return content;
    } catch (error) {
      console.error(`Error fetching webpage ${url}:`, error);
      return '';
    }
  }
  
  private generateSmartAnswer(
    query: string,
    searchResults: SearchResult[],
    analysis: QueryAnalysis,
    additionalData?: {
      stockData?: any;
      journalAnalysis?: any;
      marketTrends?: any[];
      news?: any[];
      riskMetrics?: any;
      performanceMetrics?: any;
    }
  ): string {
    let answer = `# AI Agent Analysis\n\n`;
    answer += `**Query:** ${query}\n\n`;
    
    if (additionalData?.journalAnalysis) {
      const ja = additionalData.journalAnalysis;
      
      answer += `## Your Trading Performance\n\n`;
      
      if (ja.performance) {
        const perf = ja.performance;
        answer += `### Key Metrics\n`;
        answer += `| Metric | Value |\n|--------|-------|\n`;
        answer += `| Total Trades | ${perf.totalTrades} |\n`;
        answer += `| Win Rate | ${perf.winRate}% |\n`;
        answer += `| Net P&L | ${perf.netPnL >= 0 ? '+' : ''}₹${perf.netPnL.toLocaleString()} |\n`;
        answer += `| Profit Factor | ${perf.profitFactor} |\n`;
        answer += `| Avg Win | ₹${perf.averageWin.toLocaleString()} |\n`;
        answer += `| Avg Loss | ₹${perf.averageLoss.toLocaleString()} |\n`;
        answer += `| Largest Win | ₹${perf.largestWin.toLocaleString()} |\n`;
        answer += `| Largest Loss | ₹${Math.abs(perf.largestLoss).toLocaleString()} |\n`;
        answer += `| Win Streak | ${perf.consecutiveWins} trades |\n`;
        answer += `| Loss Streak | ${perf.consecutiveLosses} trades |\n\n`;
      }
      
      if (ja.risk && analysis.needsRiskAnalysis) {
        const risk = ja.risk;
        answer += `### Risk Analysis\n`;
        answer += `| Risk Metric | Value |\n|-------------|-------|\n`;
        answer += `| Max Drawdown | ${risk.maxDrawdownPercent}% |\n`;
        answer += `| Current Drawdown | ₹${risk.currentDrawdown.toLocaleString()} |\n`;
        answer += `| Sharpe Ratio | ${risk.sharpeRatio} |\n`;
        answer += `| Sortino Ratio | ${risk.sortinoRatio} |\n`;
        answer += `| Volatility | ${risk.volatility}% |\n`;
        answer += `| Value at Risk (95%) | ${risk.valueAtRisk}% |\n\n`;
      }
      
      if (ja.stockBreakdown && ja.stockBreakdown.length > 0) {
        answer += `### Stock Performance\n`;
        answer += `| Stock | Trades | Win Rate | P&L |\n|-------|--------|----------|-----|\n`;
        ja.stockBreakdown.slice(0, 5).forEach((stock: any) => {
          answer += `| ${stock.symbol} | ${stock.trades} | ${stock.winRate}% | ${stock.totalPnL >= 0 ? '+' : ''}₹${stock.totalPnL.toLocaleString()} |\n`;
        });
        answer += `\n`;
      }
      
      if (ja.insights && ja.insights.length > 0) {
        answer += `### Insights\n`;
        ja.insights.forEach((insight: string) => {
          answer += `- ${insight}\n`;
        });
        answer += `\n`;
      }
      
      if (ja.recommendations && ja.recommendations.length > 0) {
        answer += `### Recommendations\n`;
        ja.recommendations.forEach((rec: string) => {
          answer += `- ${rec}\n`;
        });
        answer += `\n`;
      }
    }
    
    if (additionalData?.stockData && analysis.stockSymbols.length > 0) {
      const symbol = analysis.stockSymbols[0];
      const stock = additionalData.stockData;
      
      answer += `## ${symbol} Analysis\n\n`;
      answer += `**Current Price:** ₹${stock.price?.toFixed(2) || 'N/A'}\n`;
      if (stock.change !== undefined) {
        answer += `**Change:** ${stock.change >= 0 ? '+' : ''}₹${stock.change?.toFixed(2)} (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent?.toFixed(2)}%)\n`;
      }
      answer += `**Trend:** ${stock.changePercent > 2 ? 'Strong Bullish' : stock.changePercent > 0 ? 'Bullish' : stock.changePercent < -2 ? 'Strong Bearish' : stock.changePercent < 0 ? 'Bearish' : 'Neutral'}\n\n`;
    }
    
    if (additionalData?.marketTrends && additionalData.marketTrends.length > 0) {
      answer += `## Market Overview\n\n`;
      additionalData.marketTrends.forEach(trend => {
        const emoji = trend.trend === 'bullish' ? '↑' : trend.trend === 'bearish' ? '↓' : '→';
        answer += `**${emoji} ${trend.index}:** ${trend.value?.toFixed(2) || 'N/A'} (${trend.changePercent >= 0 ? '+' : ''}${trend.changePercent?.toFixed(2)}%)\n`;
      });
      answer += `\n`;
    }
    
    if (searchResults.length > 0) {
      answer += `## Market Intelligence\n\n`;
      answer += `Based on latest web search:\n\n`;
      
      searchResults.slice(0, 5).forEach((result, index) => {
        const cleanSnippet = stripHtml(result.snippet);
        if (cleanSnippet) {
          answer += `**${index + 1}. ${stripHtml(result.title)}**\n`;
          answer += `${cleanSnippet}\n\n`;
        }
      });
    }
    
    if (additionalData?.news && additionalData.news.length > 0) {
      answer += `## Latest News\n\n`;
      additionalData.news.slice(0, 5).forEach((item, index) => {
        const cleanTitle = stripHtml(item.title);
        const cleanSource = stripHtml(item.source);
        if (cleanTitle) {
          answer += `- **${cleanTitle}**\n`;
          answer += `  _via ${cleanSource}_\n\n`;
        }
      });
    }
    
    answer += `## Next Steps\n\n`;
    
    switch (analysis.intent) {
      case 'journal':
      case 'performance':
        answer += `- Review your trade history in the **Trading Journal**\n`;
        answer += `- Focus on your best-performing stocks and strategies\n`;
        answer += `- Set stricter stop-losses for underperforming trades\n`;
        break;
      case 'risk_analysis':
        answer += `- Monitor your position sizes to manage risk\n`;
        answer += `- Consider reducing exposure during high volatility\n`;
        answer += `- Use the **Risk Dashboard** for detailed analytics\n`;
        break;
      case 'stock_analysis':
        answer += `- Check **Trading Master** for detailed technical charts\n`;
        answer += `- Review the **Social Feed** for community insights\n`;
        answer += `- Set price alerts for key levels\n`;
        break;
      case 'market_overview':
        answer += `- Monitor sector rotations for opportunities\n`;
        answer += `- Check global market cues before trading\n`;
        answer += `- Review institutional activity in F&O segment\n`;
        break;
      default:
        answer += `- Use **Trading Master** for detailed analysis\n`;
        answer += `- Check **Social Feed** for community discussions\n`;
        answer += `- Track your trades in **Trading Journal**\n`;
    }
    
    return answer;
  }
  
  private async generateAIResponse(
    query: string,
    analysis: QueryAnalysis,
    webContext: string,
    journalContext: string,
    stockContext: string
  ): Promise<string> {
    try {
      const systemPrompt = `You are an advanced AI trading assistant integrated into a comprehensive trading platform.

Your capabilities:
- Analyze trading journal data including win rates, risk metrics, and performance
- Provide insights on stock market trends and individual stocks
- Give personalized recommendations based on user's trading history
- Explain financial concepts clearly

Current context:
${webContext ? `\n**Web Search Results:**\n${webContext}` : ''}
${journalContext ? `\n**User's Trading Data:**\n${journalContext}` : ''}
${stockContext ? `\n**Stock Data:**\n${stockContext}` : ''}

Guidelines:
1. Be specific with numbers and data when available
2. Provide actionable insights
3. Use tables for comparison data
4. Explain complex metrics simply
5. Give personalized advice based on user data
6. Format with markdown headers and bullet points`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: `${systemPrompt}\n\n**User Question:** ${query}\n\nProvide a comprehensive, detailed answer using all available data. Format with markdown.`
      });

      return response.text || '';
    } catch (error) {
      console.error('AI generation error:', error);
      return '';
    }
  }
  
  async processQuery(query: string, options?: {
    journalTrades?: any[];
    fyersData?: any;
    initialCapital?: number;
  }): Promise<{
    answer: string;
    sources: SearchResult[];
    timestamp: string;
  }> {
    try {
      console.log(`[ADVANCED-QUERY] Processing: "${query}"`);
      
      const analysis = this.analyzeQuery(query);
      console.log(`[ADVANCED-QUERY] Intent: ${analysis.intent}, Complex: ${analysis.isComplexQuery}`);
      console.log(`[ADVANCED-QUERY] Needs: Web=${analysis.needsWebSearch}, Journal=${analysis.needsJournalData}, Risk=${analysis.needsRiskAnalysis}`);
      
      const searchResults = await this.performWebSearch(query, 8);
      console.log(`[ADVANCED-QUERY] Found ${searchResults.length} web results`);
      
      const additionalData: any = {};
      
      if (analysis.needsJournalData && options?.journalTrades && options.journalTrades.length > 0) {
        console.log(`[ADVANCED-QUERY] Analyzing ${options.journalTrades.length} trades from journal`);
        
        const processedTrades: TradeEntry[] = options.journalTrades.map(trade => ({
          id: trade.id || String(Math.random()),
          date: trade.date || trade.entryTime || new Date().toISOString(),
          symbol: trade.stockName || trade.symbol || 'UNKNOWN',
          entryPrice: parseFloat(trade.entryPrice) || 0,
          exitPrice: parseFloat(trade.exitPrice) || 0,
          quantity: parseInt(trade.quantity) || 1,
          tradeType: (trade.tradeType || trade.type || 'BUY').toUpperCase() as 'BUY' | 'SELL' | 'LONG' | 'SHORT',
          pnl: parseFloat(trade.pnl) || parseFloat(trade.profitLoss) || 0,
          pnlPercentage: parseFloat(trade.pnlPercentage) || 0,
          stopLoss: parseFloat(trade.stopLoss) || undefined,
          target: parseFloat(trade.target) || undefined,
          notes: trade.notes || trade.remarks || '',
          strategy: trade.strategy || trade.pattern || '',
          status: trade.status || 'closed'
        }));

        const journalAnalysis = journalPortfolioAnalyzer.analyzeJournal(
          processedTrades, 
          options.initialCapital || 100000
        );
        
        additionalData.journalAnalysis = journalAnalysis;
        additionalData.riskMetrics = journalAnalysis.risk;
        additionalData.performanceMetrics = journalAnalysis.performance;
        
        console.log(`[ADVANCED-QUERY] Journal analysis complete - Win rate: ${journalAnalysis.performance.winRate}%`);
      }
      
      if (analysis.stockSymbols.length > 0) {
        try {
          const stockData = await intelligentAgent.getStockData(analysis.stockSymbols[0]);
          if (stockData) {
            additionalData.stockData = stockData;
            console.log(`[ADVANCED-QUERY] Got stock data for ${analysis.stockSymbols[0]}`);
          }
        } catch (error) {
          console.error('[ADVANCED-QUERY] Stock data error:', error);
        }
      }
      
      if (analysis.intent === 'market_overview' || analysis.intent === 'general') {
        try {
          const trends = await intelligentAgent.getMarketTrends();
          if (trends.length > 0) {
            additionalData.marketTrends = trends;
            console.log(`[ADVANCED-QUERY] Got ${trends.length} market trends`);
          }
        } catch (error) {
          console.error('[ADVANCED-QUERY] Market trends error:', error);
        }
      }
      
      if (analysis.intent === 'news' || analysis.intent === 'general') {
        try {
          const news = await intelligentAgent.getFinancialNews(5);
          if (news.length > 0) {
            additionalData.news = news;
            console.log(`[ADVANCED-QUERY] Got ${news.length} news items`);
          }
        } catch (error) {
          console.error('[ADVANCED-QUERY] News error:', error);
        }
      }
      
      let answer: string;
      
      if (analysis.isComplexQuery) {
        const webContext = searchResults.slice(0, 5).map(r => `${r.title}: ${r.snippet}`).join('\n\n');
        const journalContext = additionalData.journalAnalysis 
          ? journalPortfolioAnalyzer.formatAnalysisForAI(additionalData.journalAnalysis) 
          : '';
        const stockContext = additionalData.stockData 
          ? JSON.stringify(additionalData.stockData, null, 2)
          : '';
        
        const aiAnswer = await this.generateAIResponse(query, analysis, webContext, journalContext, stockContext);
        
        if (aiAnswer) {
          answer = aiAnswer;
        } else {
          answer = this.generateSmartAnswer(query, searchResults, analysis, additionalData);
        }
      } else {
        answer = this.generateSmartAnswer(query, searchResults, analysis, additionalData);
      }
      
      console.log(`[ADVANCED-QUERY] Generated answer (${answer.length} chars)`);
      
      return {
        answer,
        sources: searchResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('[ADVANCED-QUERY] Error:', error);
      
      return {
        answer: `# Unable to Process Query\n\nI encountered an error while processing your question: "${query}"\n\nPlease try:\n- Rephrasing your question\n- Using specific stock names\n- Checking the Trading Master for detailed analysis\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sources: [],
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const advancedQueryProcessor = new AdvancedQueryProcessor();
