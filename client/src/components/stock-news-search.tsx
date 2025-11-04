import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, TrendingUp, TrendingDown, DollarSign, BarChart3, AlertTriangle, Sparkles, Copy, ThumbsUp, ExternalLink, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  message: string;
  timestamp: Date;
  stockSymbol?: string;
  suggestions?: string[];
  data?: {
    symbol?: string;
    price?: number;
    change?: number;
    changePercent?: number;
    volume?: string;
    marketCap?: string;
    pe?: number;
    news?: NewsItem[];
  };
}

interface NewsItem {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
}

export function StockNewsSearch() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Initialize with welcome message
  useEffect(() => {
    if (chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        message: `🚀 **Welcome to BATTU AI Social Feed Assistant!**

I'm powered by your platform's real-time data and can help you with:

📈 **Live Stock Analysis**
• Real-time prices from Fyers API
• Technical indicators (RSI, EMA, Volume)
• Fundamental ratios (P/E, Market Cap, ROE)
• Sentiment analysis and trade recommendations

📰 **Smart Market News**
• Latest news with AI sentiment analysis
• Stock-specific news impact assessment
• Market trend analysis and implications

💡 **Social Feed Intelligence**
• Community insights from your platform's Social Feed
• Trending discussions and analysis
• Professional trader perspectives

🎯 **Platform Integration**
• Connect with Trading Master for technical analysis
• Access Journal for performance tracking
• Leverage existing data sources for real insights

**Try these enhanced suggestions:**`,
        timestamp: new Date(),
        suggestions: [
          "📈 Live RELIANCE analysis with Fyers data",
          "📰 Today's market news with sentiment",
          "🔥 Trending stocks from Social Feed", 
          "💰 Best investment opportunities now",
          "📊 Fundamental analysis framework"
        ]
      };
      setChatMessages([welcomeMessage]);
    }
  }, []);

  // Fetch real stock data from API
  const fetchRealStockData = async (symbol: string) => {
    try {
      console.log(`🤖 AI fetching real data for ${symbol}...`);
      const response = await fetch(`/api/stock-analysis/${symbol}`);
      const data = await response.json();
      
      if (data && data.priceData) {
        console.log(`✅ AI got real data for ${symbol}:`, data.priceData);
        return {
          symbol: symbol,
          price: data.priceData.close || data.priceData.price || 0,
          change: (data.priceData.close || 0) - (data.priceData.open || 0),
          changePercent: data.sentiment?.score ? 
            ((data.priceData.close - data.priceData.open) / data.priceData.open * 100) : 0,
          volume: data.priceData.volume || 'N/A',
          marketCap: data.valuation?.marketCap || 'N/A',
          pe: data.valuation?.peRatio || 0,
          high: data.priceData.high || 0,
          low: data.priceData.low || 0,
          open: data.priceData.open || 0,
          sentiment: data.sentiment || null,
          indicators: data.indicators || null
        };
      }
      return null;
    } catch (error) {
      console.error(`❌ AI failed to fetch data for ${symbol}:`, error);
      return null;
    }
  };

  // Fetch real news data
  const fetchRealNewsData = async (query: string) => {
    try {
      console.log(`📰 AI fetching real news for ${query}...`);
      const response = await fetch(`/api/stock-news?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success && data.articles) {
        console.log(`✅ AI got ${data.articles.length} news articles for ${query}`);
        return data.articles.slice(0, 5); // Get top 5 articles
      }
      return [];
    } catch (error) {
      console.error(`❌ AI failed to fetch news for ${query}:`, error);
      return [];
    }
  };

  // Enhanced AI response generator with real data
  const generateAIResponse = async (userMessage: string): Promise<ChatMessage> => {
    const message = userMessage.toLowerCase();
    const stockSymbols = ['reliance', 'tcs', 'infy', 'infosys', 'hdfcbank', 'icicibank', 'bhartiartl', 'itc', 'kotakbank', 'lt', 'sbin', 'adaniports', 'asianpaint', 'axisbank', 'bajfinance', 'bajajfinsv', 'bpcl', 'cipla', 'coalindia', 'divislab', 'drreddy', 'eichermot', 'grasim', 'hcltech', 'heromotoco', 'hindalco', 'hindunilvr', 'hdfc', 'indusindbk', 'jswsteel', 'lti', 'maruti', 'nestleind', 'ntpc', 'ongc', 'powergrid', 'shreecem', 'sunpharma', 'tatasteel', 'techm', 'titan', 'ultracemco', 'upl', 'wipro'];
    
    const mentionedStock = stockSymbols.find(stock => message.includes(stock));
    
    // Stock analysis requests with real data
    if (message.includes('analyze') || message.includes('tell me about') || mentionedStock) {
      const stock = (mentionedStock || 'RELIANCE').toUpperCase();
      
      // Fetch real data from your APIs
      const realData = await fetchRealStockData(stock);
      
      if (realData) {
        const trend = realData.changePercent > 0 ? 'bullish' : 'bearish';
        const trendIcon = trend === 'bullish' ? '📈' : '📉';
        const sentimentEmoji = realData.sentiment?.trend === 'Bullish' ? '🟢' : realData.sentiment?.trend === 'Bearish' ? '🔴' : '🟡';
        
        const sentimentText = realData.sentiment?.trend || 'Neutral';
        const sentimentConfidence = realData.sentiment?.confidence || 'Medium';
        
        return {
          id: Date.now().toString(),
          type: 'assistant',
          message: `## ${stock} Stock Analysis ${trendIcon}

**Live Market Data:**
• **Current Price:** ₹${realData.price.toLocaleString()} (${realData.changePercent.toFixed(2)}%)
• **Open:** ₹${realData.open.toLocaleString()} | **High:** ₹${realData.high.toLocaleString()}
• **Low:** ₹${realData.low.toLocaleString()} | **Volume:** ${realData.volume}
• **Market Cap:** ${realData.marketCap}
• **P/E Ratio:** ${realData.pe || 'N/A'}

**Market Sentiment:** ${sentimentEmoji} ${sentimentText} (${sentimentConfidence} confidence)

**Technical Analysis:**
${getStockAnalysis(stock, trend, realData)}

**AI Recommendation:** ${getRecommendation(trend, realData)}

**Risk Assessment:** ${getRiskAssessment(realData)}

Would you like me to fetch the latest news for ${stock} or perform deeper technical analysis?`,
          timestamp: new Date(),
          stockSymbol: stock,
          data: {
            symbol: realData.symbol,
            price: realData.price,
            change: realData.change,
            changePercent: realData.changePercent,
            volume: realData.volume,
            marketCap: realData.marketCap,
            pe: realData.pe
          },
          suggestions: [
            `📰 Latest ${stock} news with sentiment`,
            `📊 ${stock} technical indicators from Fyers`,
            `🏢 Compare ${stock} with sector peers`,
            `💬 Social Feed discussions about ${stock}`,
            `💡 ${stock} trading strategies`
          ]
        };
      } else {
        return {
          id: Date.now().toString(),
          type: 'assistant',
          message: `I'm having trouble fetching real-time data for ${stock} right now. This could be due to:

• Market hours (Indian markets: 9:15 AM - 3:30 PM IST)
• Network connectivity issues  
• Temporary API limitations

**What I can still help with:**
• General investment guidance for ${stock}
• Market news and trends
• Portfolio strategy discussions
• Technical analysis concepts

Please try again in a moment, or ask me about market trends and investment strategies!`,
          timestamp: new Date(),
          suggestions: [
            `📰 Live market news analysis`,
            `💡 Platform-based investment strategies`, 
            `🔥 Trending sectors on Social Feed`,
            `📊 Portfolio optimization with real data`,
            `🎯 Community investment insights`
          ]
        };
      }
    }
    
    // Market news requests with real data
    if (message.includes('news') || message.includes('latest') || message.includes('market today')) {
      let specificStock = null;
      if (mentionedStock) {
        specificStock = mentionedStock.toUpperCase();
        // Fetch real news for specific stock
        const newsData = await fetchRealNewsData(specificStock);
        
        if (newsData && newsData.length > 0) {
          return {
            id: Date.now().toString(),
            type: 'assistant',
            message: `## Latest News for ${specificStock} 📰

**AI News Analysis:**
Based on the latest news, ${specificStock} appears to be ${getNewssentiment(newsData)}. Key themes include ${getNewsThemes(newsData)}.

**Investment Insight:**
${getNewsBasedRecommendation(specificStock, newsData)}

**Recent Headlines:**`,
            timestamp: new Date(),
            data: { 
              news: newsData,
              symbol: specificStock,
              price: null,
              change: null,
              changePercent: null,
              volume: null,
              marketCap: null,
              pe: null
            },
            suggestions: [
              `Analyze ${specificStock} fundamentals`,
              `Technical analysis for ${specificStock}`,
              `Compare with sector peers`,
              `Get market sentiment`
            ]
          };
        }
      }
      
      // General market news - fetch today's finance news
      const generalNewsData = await fetchRealNewsData('Indian stock market today finance news');
      
      return {
        id: Date.now().toString(),
        type: 'assistant',
        message: `## Today's Finance News 📰

**AI Market Analysis:**
Current market sentiment is ${getCurrentMarketRecommendation()}. Here are today's key financial developments:

**Market Overview:**
• **Global Cues:** International markets showing mixed signals
• **Sectoral Performance:** Banking, IT, and pharma leading movements  
• **FII/DII Activity:** Institutional flows driving sentiment
• **Economic Indicators:** Key data points in focus

**Latest Headlines:**`,
        timestamp: new Date(),
        data: { 
          news: generalNewsData,
          symbol: 'MARKET',
          price: null,
          change: null,
          changePercent: null,
          volume: null,
          marketCap: null,
          pe: null
        },
        suggestions: [
          "Analyze RELIANCE news",
          "Banking sector trends", 
          "IT stocks analysis",
          "Top gainers today"
        ]
      };
    }
    
    // Investment advice requests
    if (message.includes('invest') || message.includes('buy') || message.includes('portfolio')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        message: `## Investment Guidance 💡

**Market Outlook:**
The current market shows **moderate optimism** with selective stock picking being key.

**Recommended Strategy:**
• **Large Cap (60%):** Focus on quality stocks like HDFC Bank, TCS, Infosys
• **Mid Cap (25%):** Consider sector leaders with strong fundamentals  
• **Small Cap (15%):** High-growth potential but higher risk

**Sectors to Watch:**
📈 **Positive:** Banking, IT Services, Pharmaceuticals
⚠️ **Cautious:** Real Estate, Auto, Metals
📉 **Avoid:** High-debt companies, cyclical stocks

**Risk Management:**
• Diversify across sectors
• Maintain 10-15% cash position
• Set stop-losses at 8-10%
• Review portfolio quarterly

**Disclaimer:** This is educational content, not financial advice. Please consult with a certified financial advisor.

What's your risk appetite and investment timeline?`,
        timestamp: new Date(),
        suggestions: [
          "Conservative portfolio",
          "Aggressive growth stocks",
          "Dividend stocks",
          "SIP planning"
        ]
      };
    }
    
    // IPO requests
    if (message.includes('ipo') || message.includes('new listing')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        message: `## IPO Market Update 🚀

**Upcoming IPOs (Next 30 Days):**
• **TechCorp Limited** - ₹500-550 per share (Tech)
• **GreenEnergy Solutions** - ₹280-320 per share (Renewable)
• **FinTech Innovations** - ₹1,200-1,400 per share (Fintech)

**Recent Listings Performance:**
• **RetailMax IPO:** Listed at 15% premium ✅
• **BioPharm Ltd:** Listed at 8% discount ❌
• **AutoTech Motors:** Listed flat 📊

**IPO Investment Tips:**
• Research company fundamentals thoroughly
• Check management track record
• Analyze industry growth prospects
• Consider market conditions
• Apply through multiple family members

**Red Flags to Avoid:**
⚠️ High debt-to-equity ratio
⚠️ Declining industry trends  
⚠️ Poor management history
⚠️ Overvalued pricing

Would you like detailed analysis of any specific upcoming IPO?`,
        timestamp: new Date(),
        suggestions: [
          "TechCorp IPO analysis",
          "IPO application strategy",
          "Grey market premium",
          "IPO vs secondary market"
        ]
      };
    }
    
    // Bond market requests
    if (message.includes('bond') || message.includes('debt') || message.includes('fixed income')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        message: `## Bond Market Analysis 📊

**Government Bond Yields:**
• **10-Year G-Sec:** 7.12% (↓ 0.05% from last week)
• **5-Year G-Sec:** 6.89% (↓ 0.03%)
• **15-Year G-Sec:** 7.28% (↑ 0.02%)

**Corporate Bond Landscape:**
• **AAA-rated:** 7.8-8.2% yield range
• **AA-rated:** 8.5-9.1% yield range  
• **A-rated:** 9.2-10.5% yield range

**Market Dynamics:**
📉 **Yields trending down** due to RBI policy stance
💰 **Strong demand** from insurance and pension funds
🌐 **Global factors** supporting bond rally

**Investment Strategy:**
• **Conservative:** 60% G-Sec, 40% AAA corporate
• **Moderate:** 40% G-Sec, 50% AA+ corporate, 10% equity
• **Duration play:** Focus on 7-10 year bonds

**Tax-Free Bonds:** Currently offering 5.5-6.2% tax-free yields

Which bond category interests you most?`,
        timestamp: new Date(),
        suggestions: [
          "Tax-free bonds",
          "Corporate bond funds",
          "Government securities",
          "Bond laddering strategy"
        ]
      };
    }
    
    // Default helpful response
    return {
      id: Date.now().toString(),
      type: 'assistant',
      message: `I'm here to help with your finance questions! 🤖

I can assist you with:

📈 **Stock Market:**
- Real-time stock analysis and prices
- Technical and fundamental analysis
- Sector performance and trends

📰 **Market News:**
- Latest market updates and news
- Economic indicators and events
- Company earnings and announcements

💼 **Investment Planning:**
- Portfolio diversification strategies
- Risk assessment and management
- Long-term wealth building advice

🏢 **IPOs & New Listings:**
- Upcoming IPO analysis
- Listing performance tracking
- Investment recommendations

💰 **Fixed Income:**
- Government and corporate bonds
- Interest rate trends and analysis
- Tax-efficient investment options

Just ask me anything about stocks, markets, investments, or financial planning!`,
      timestamp: new Date(),
      suggestions: [
        "Show me market trends",
        "Analyze HDFC Bank",
        "Investment strategies",
        "Today's top gainers"
      ]
    };
  };

  // Helper functions for AI analysis
  const getStockAnalysis = (stock: string, trend: string, data: any): string => {
    const price = data.price;
    const volume = data.volume;
    const sentiment = data.sentiment;
    
    if (trend === 'bullish') {
      return `Strong upward momentum observed with ${volume} volume suggesting institutional interest. The ${sentiment?.confidence || 'medium'} confidence bullish sentiment indicates positive market perception. Current price action shows healthy buying support at ₹${price.toLocaleString()}.`;
    } else {
      return `Bearish pressure evident with current pricing at ₹${price.toLocaleString()}. Volume of ${volume} suggests ${sentiment?.confidence || 'cautious'} market sentiment. Technical indicators point to potential consolidation or further downside.`;
    }
  };

  const getRecommendation = (trend: string, data: any): string => {
    const riskLevel = data.sentiment?.confidence === 'High' ? 'moderate' : 'high';
    
    if (trend === 'bullish') {
      return `**BUY** on dips with ${riskLevel} risk tolerance. Consider position sizing based on portfolio allocation. Stop-loss recommended below ₹${(data.price * 0.95).toFixed(0)}.`;
    } else {
      return `**HOLD/WAIT** for better entry levels. Risk level: ${riskLevel}. Consider accumulating below ₹${(data.price * 0.92).toFixed(0)} with proper risk management.`;
    }
  };

  const getRiskAssessment = (data: any): string => {
    const volatility = data.changePercent > 5 ? 'High' : data.changePercent > 2 ? 'Medium' : 'Low';
    return `Volatility: ${volatility} | Sentiment Risk: ${data.sentiment?.confidence || 'Medium'} | Liquidity: ${data.volume !== 'N/A' ? 'Good' : 'Limited'}`;
  };

  const getNewssentiment = (newsData: any[]): string => {
    if (!newsData || newsData.length === 0) return 'neutral with limited news flow';
    
    const positiveWords = ['growth', 'profit', 'gain', 'rise', 'bullish', 'strong', 'beat'];
    const negativeWords = ['loss', 'decline', 'fall', 'bearish', 'weak', 'miss', 'concern'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    newsData.forEach(article => {
      const text = (article.title + ' ' + article.description).toLowerCase();
      positiveWords.forEach(word => {
        if (text.includes(word)) positiveCount++;
      });
      negativeWords.forEach(word => {
        if (text.includes(word)) negativeCount++;
      });
    });
    
    if (positiveCount > negativeCount) return 'trending positively with bullish news sentiment';
    if (negativeCount > positiveCount) return 'facing headwinds with bearish news sentiment';
    return 'neutral with mixed news sentiment';
  };

  const getNewsThemes = (newsData: any[]): string => {
    if (!newsData || newsData.length === 0) return 'limited news coverage';
    
    const themes = ['earnings', 'expansion', 'regulatory', 'market', 'technology', 'financial'];
    const detectedThemes: string[] = [];
    
    newsData.forEach(article => {
      const text = (article.title + ' ' + article.description).toLowerCase();
      themes.forEach(theme => {
        if (text.includes(theme) && !detectedThemes.includes(theme)) {
          detectedThemes.push(theme);
        }
      });
    });
    
    return detectedThemes.length > 0 ? detectedThemes.join(', ') + ' developments' : 'general market updates';
  };

  const getNewsBasedRecommendation = (stock: string, newsData: any[]): string => {
    const sentiment = getNewssentiment(newsData);
    if (sentiment.includes('positive')) {
      return `Recent news flow supports a positive outlook for ${stock}. Consider accumulating on dips with a medium-term investment horizon.`;
    } else if (sentiment.includes('bearish')) {
      return `Current news suggests caution for ${stock}. Wait for clarity on key developments before taking fresh positions.`;
    }
    return `Mixed news flow for ${stock} suggests a wait-and-watch approach. Focus on fundamental analysis over news-driven movements.`;
  };

  const getCurrentMarketRecommendation = (): string => {
    return 'selective stock picking with focus on quality names. Maintain diversified portfolio allocation across sectors.';
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: inputMessage,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    
    // Show typing indicator
    setIsTyping(true);
    
    // Simulate thinking time
    setTimeout(async () => {
      try {
        const aiResponse = await generateAIResponse(currentInput);
        setChatMessages(prev => [...prev, aiResponse]);
      } catch (error) {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          message: "I apologize, but I'm having trouble processing your request right now. Please try again or ask about stocks, market news, investments, or financial planning.",
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }, 1500 + Math.random() * 1000); // Realistic thinking time
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const copyMessage = (messageContent: string) => {
    navigator.clipboard.writeText(messageContent);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">AI Finance Assistant</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">Real-time market insights & investment guidance</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {chatMessages.map((message) => (
          <div key={message.id} className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
              message.type === 'user' 
                ? 'bg-black dark:bg-white text-white dark:text-black' 
                : 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
            }`}>
              {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            {/* Message Content */}
            <div className={`flex-1 max-w-3xl ${message.type === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block p-4 rounded-2xl shadow-sm transition-colors duration-300 ${
                message.type === 'user'
                  ? 'bg-black dark:bg-white text-white dark:text-black rounded-br-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
              }`}>
                <div className="prose prose-sm max-w-none">
                  {message.message.split('\n').map((line, index) => {
                    if (line.startsWith('##')) {
                      return <h3 key={index} className="text-lg font-bold mt-2 mb-2 text-current">{line.replace('##', '').trim()}</h3>;
                    }
                    if (line.startsWith('•')) {
                      return <div key={index} className="ml-2 mb-1 text-current">{line}</div>;
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <p key={index} className="font-semibold mb-1 text-current">{line.replace(/\*\*/g, '')}</p>;
                    }
                    return line ? <p key={index} className="mb-1 text-current">{line}</p> : <br key={index} />;
                  })}
                </div>

                {/* Stock Data Card */}
                {message.data && message.data.price && (
                  <div className="mt-4 p-3 bg-white/10 dark:bg-gray-700/50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Price: ₹{message.data.price?.toLocaleString()}</div>
                      <div className={`${(message.data.changePercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        Change: {message.data.changePercent}%
                      </div>
                      <div>Volume: {message.data.volume}</div>
                      <div>P/E: {message.data.pe}</div>
                    </div>
                  </div>
                )}

                {/* News Articles Display */}
                {message.data && message.data.news && message.data.news.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {message.data.news.slice(0, 5).map((article: NewsItem, index: number) => (
                      <div key={index} className="p-3 bg-white/10 dark:bg-gray-700/50 rounded-lg border-l-4 border-gray-400 dark:border-gray-600 hover:bg-white/20 dark:hover:bg-gray-600/50 transition-colors duration-300">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm leading-tight mb-1">
                              <a 
                                href={article.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-300"
                              >
                                {article.title}
                              </a>
                            </h4>
                            {article.description && (
                              <p className="text-xs text-gray-300 dark:text-gray-400 mb-2 line-clamp-2">
                                {article.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span className="font-medium">{article.source}</span>
                              {article.publishedAt && (
                                <>
                                  <span>•</span>
                                  <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                                </>
                              )}
                              <a 
                                href={article.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-auto text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-300"
                              >
                                Read →
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {message.data.news.length > 5 && (
                      <div className="text-center text-xs text-gray-400 mt-2">
                        Showing 5 of {message.data.news.length} articles
                      </div>
                    )}
                  </div>
                )}

                {/* Message Actions */}
                {message.type === 'assistant' && (
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyMessage(message.message)}
                      className="h-6 px-2 text-xs opacity-70 hover:opacity-100"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs opacity-70 hover:opacity-100"
                    >
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      Helpful
                    </Button>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {message.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs h-7 px-3 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}

              {/* Strategy Suggestion Buttons - Show after every AI response */}
              {message.type === 'assistant' && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <div className="w-full text-xs text-gray-500 dark:text-gray-400 mb-2">
                    💡 Generate Strategy Codes:
                  </div>
                  {[
                    "Generate Scalping Strategy",
                    "Generate Swing Trading Strategy", 
                    "Generate Options Strategy",
                    "Generate Breakout Strategy"
                  ].map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs h-7 px-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 transition-colors duration-300"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <div className={`text-xs text-gray-500 dark:text-gray-400 mt-2 ${message.type === 'user' ? 'text-right' : ''}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 flex items-center justify-center transition-colors duration-300">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm p-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about stocks, market news, investments, IPOs, bonds..."
              className="pr-12 py-3 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-gray-400 dark:focus:border-gray-500 bg-white dark:bg-gray-800 transition-colors duration-300"
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="text-center mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            AI Finance Assistant can make mistakes. Verify important information and consult financial advisors.
          </p>
        </div>
      </div>
    </div>
  );
}