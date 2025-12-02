import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { PostCreationPanel } from './post-creation-panel';
import { LiveBanner } from './live-banner';
import type { SocialPost } from '@shared/schema';
import { AudioModeProvider, useAudioMode } from '@/contexts/AudioModeContext';
import { 
  Search, Bell, Settings, MessageCircle, Repeat, Heart, 
  Share, MoreHorizontal, CheckCircle, BarChart3, Clock,
  TrendingUp, TrendingDown, Activity, Plus, Home, PenTool,
  Copy, ExternalLink, X, Send, Bot, Trash2, User, MapPin, Calendar,
  ChevronDown, ChevronUp, ArrowLeft, Check, Layers, Mic, Newspaper,
  Users, UserPlus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { SwipeableCarousel } from './swipeable-carousel';
import { AIChatWindow } from './ai-chat-window';
import { UserIdSetupDialog } from './user-id-setup-dialog';
import { UserProfileDropdown } from './user-profile-dropdown';
import { AudioMinicastCard } from './audio-minicast-card';
import { AudioSelectedPostsPreview } from './audio-selected-posts-preview';
import { auth } from '@/firebase';

interface FeedPost {
  id: string | number;
  authorUsername?: string;
  authorDisplayName?: string;
  authorAvatar?: string;
  authorVerified?: boolean;
  authorFollowers?: number;
  content: string;
  likes?: number;
  comments?: number;
  reposts?: number;
  tags?: string[];
  stockMentions?: string[];
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  hasImage?: boolean;
  imageUrl?: string;
  hasImages?: boolean;  // Support for future multi-image feature
  imageUrls?: string[];  // Support for future multi-image feature
  isAudioPost?: boolean; // Audio minicast post flag
  selectedPostIds?: (string | number)[]; // Selected posts for audio minicast
  selectedPosts?: Array<{ id: string | number; content: string }>; // Selected posts content for audio minicast
  createdAt?: string | Date;
  updatedAt?: string | Date;
  ticker?: string;
  timestamp?: string;
  // Legacy support for the old structure
  user?: {
    initial: string;
    username: string;
    handle: string;
    verified: boolean;
    online: boolean;
    avatar?: string;
  };
  metrics?: {
    comments: number;
    reposts: number;
    likes: number;
  };
  hasMedia?: boolean;
}

// Inline Comment Section Component
function InlineCommentSection({ post, isVisible, onClose }: { post: FeedPost; isVisible: boolean; onClose: () => void }) {
  const [comment, setComment] = useState('');
  const [localComments, setLocalComments] = useState<any[]>([]);
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getUserDisplayName } = useCurrentUser();

  // Fetch existing comments for this post
  const { data: existingComments, isLoading: loadingComments } = useQuery({
    queryKey: [`/api/social-posts/${post.id}/comments`],
    queryFn: async () => {
      const response = await fetch(`/api/social-posts/${post.id}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      return response.json();
    },
    enabled: isVisible,
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/social-posts/${post.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: content })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add comment');
      }
      return response.json();
    },
    onSuccess: (newComment) => {
      // Add comment immediately to local state for instant display
      const userDisplayName = getUserDisplayName();
      const immediateComment = {
        id: Date.now().toString(),
        author: userDisplayName,
        avatar: userDisplayName.charAt(0).toUpperCase(),
        content: comment,
        timestamp: 'now'
      };
      setLocalComments(prev => [...prev, immediateComment]);
      
      // Only invalidate the comments query, NOT all posts
      queryClient.invalidateQueries({ queryKey: [`/api/social-posts/${post.id}/comments`] });
      setComment('');
      toast({ description: "Comment added successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        description: error.message || "Failed to add comment", 
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      commentMutation.mutate(comment.trim());
    }
  };

  const handleDeleteComment = (commentId: string) => {
    setLocalComments(prev => prev.filter(c => c.id !== commentId));
    setShowDeleteMenu(null);
    toast({ description: "Comment deleted" });
  };

  if (!isVisible) return null;

  // Mock existing comments for demo purposes
  const mockComments = [
    {
      id: '1',
      author: 'Trading Pro',
      avatar: 'T',
      content: 'Great analysis! I agree with your bullish sentiment on this stock.',
      timestamp: '2h ago'
    },
    {
      id: '2', 
      author: 'Market Watcher',
      avatar: 'M',
      content: 'Interesting perspective. What are your thoughts on the volume patterns?',
      timestamp: '1h ago'
    },
    {
      id: '3',
      author: 'Stock Guru',
      avatar: 'S', 
      content: 'Thanks for sharing! This aligns with my technical analysis as well.',
      timestamp: '45m ago'
    }
  ];

  // Combine existing comments, mock comments, and local comments
  const baseComments = existingComments || mockComments;
  const commentsToShow = [...baseComments, ...localComments];

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 overflow-x-hidden">
      {/* Existing Comments - Scrollable */}
      {commentsToShow.length > 0 && (
        <div className="mb-6">
          <div className="max-h-60 overflow-y-auto overflow-x-hidden space-y-4">
            {commentsToShow.map((existingComment: any) => {
              const isUserComment = existingComment.author === getUserDisplayName();
              
              return (
                <div key={existingComment.id} className="relative">
                  {/* Comment Content */}
                  <div className="flex items-start gap-3 px-4 py-2">
                    <Avatar className="w-7 h-7 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-600">
                        {existingComment.avatar || existingComment.author?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900 dark:text-white">
                            {existingComment.author || 'Anonymous'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {existingComment.timestamp || 'now'}
                          </span>
                        </div>
                        {/* 3-dots menu for user comments */}
                        {isUserComment && (
                          <div className="relative">
                            <button
                              onClick={() => setShowDeleteMenu(showDeleteMenu === existingComment.id ? null : existingComment.id)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                            >
                              <MoreHorizontal className="h-4 w-4 text-gray-400" />
                            </button>
                            
                            {/* Delete dropdown menu */}
                            {showDeleteMenu === existingComment.id && (
                              <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 z-10">
                                <button
                                  onClick={() => handleDeleteComment(existingComment.id)}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                        {existingComment.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add New Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-4 px-4">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-600">
              U
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Write your comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[60px] text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 resize-none"
              disabled={commentMutation.isPending}
            />
            <div className="flex justify-end gap-3 mt-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose} 
                disabled={commentMutation.isPending}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm"
                disabled={!comment.trim() || commentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4"
              >
                {commentMutation.isPending ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// Share Modal Component
function ShareModal({ isOpen, onClose, post }: { isOpen: boolean; onClose: () => void; post: FeedPost }) {
  const { toast } = useToast();
  const postUrl = `${window.location.origin}/post/${post.id}`;

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(postUrl);
        toast({ description: "Link copied to clipboard!" });
      } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = postUrl;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast({ description: "Link copied to clipboard!" });
      }
      onClose();
    } catch (err) {
      console.error('Copy failed:', err);
      toast({ description: "Failed to copy link", variant: "destructive" });
    }
  };

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: Copy,
      action: copyToClipboard,
      description: 'Copy post link to clipboard'
    },
    {
      name: 'Open in New Tab',
      icon: ExternalLink,
      action: () => {
        window.open(postUrl, '_blank');
        onClose();
      },
      description: 'Open post in new tab'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md transition-none">
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2">
          {shareOptions.map((option) => (
            <Button
              key={option.name}
              variant="ghost"
              className="w-full justify-start gap-3 p-4 h-auto"
              onClick={option.action}
            >
              <option.icon className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">{option.name}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AnalysisData {
  priceData: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: string;
    high52W: number;
    low52W: number;
  };
  valuation: {
    marketCap: string;
    peRatio: number;
    pbRatio: number;
    psRatio: number;
    evEbitda: number;
    pegRatio: number;
  };
  financialHealth: {
    eps: number;
    bookValue: number;
    dividendYield: string;
    roe: string;
    roa: string;
    deRatio: number;
  };
  technicalIndicators?: {
    rsi: number | null;
  };
  growthMetrics?: {
    revenueGrowth: string;
    epsGrowth: string;
    profitMargin: string;
    ebitdaMargin: string;
    freeCashFlowYield: string;
  };
  additionalIndicators?: {
    beta: number;
    currentRatio: number;
    quickRatio: number;
    priceToSales: number;
    enterpriseValue: string;
  };
  marketSentiment?: {
    score: number;
    trend: string;
    volumeSpike: boolean;
    confidence: string;
  };
  news: Array<{
    title: string;
    source: string;
    time: string;
    url: string;
  }>;
}

// Price Chart Section Component
function PriceChartSection({ ticker, analysisData }: { ticker: string; analysisData: AnalysisData }) {
  const [timeframe, setTimeframe] = useState('1D');
  
  // Fetch real chart data from the API with optimized caching for faster loading
  const { data: chartData = [], isLoading: chartLoading } = useQuery({
    queryKey: ['stock-chart', ticker, timeframe],
    queryFn: () => fetch(`/api/stock-chart-data/${ticker}?timeframe=${timeframe}`).then(res => res.json()),
    refetchInterval: timeframe === '1D' ? 60000 : 300000, // Reduced frequency: 1min for 1D, 5min for others
    staleTime: timeframe === '1D' ? 30000 : 180000, // Longer cache: 30s for 1D, 3min for others
    gcTime: 600000, // Keep in cache for 10 minutes
    refetchOnMount: false, // Use cached data on mount for faster loading
    refetchOnWindowFocus: false // Reduce unnecessary refetches
  });
  // Get current price from chart data (latest point) or fallback to analysis data
  const getLatestChartPrice = () => {
    if (chartData && chartData.length > 0) {
      // Use the last data point from the chart as the current price
      return chartData[chartData.length - 1]?.price || analysisData.priceData.close || 0;
    }
    return analysisData.priceData.close || 0;
  };
  
  const currentPrice = getLatestChartPrice();
  
  // Calculate price difference based on selected timeframe
  const getTimeframeBaseline = () => {
    if (!chartData || chartData.length === 0) {
      return analysisData.priceData.open || currentPrice;
    }
    
    switch (timeframe) {
      case '1D':
        // For 1D: Use previous trading day close (first data point of the day)
        return chartData[0]?.price || analysisData.priceData.open || currentPrice;
      case '5D':
        // For 5D: Use price from 5 days ago (first data point in 5-day range)
        return chartData[0]?.price || currentPrice;
      case '1M':
        // For 1M: Use price from 1 month ago (first data point in 1-month range)
        return chartData[0]?.price || currentPrice;
      case '6M':
        // For 6M: Use price from 6 months ago (first data point in 6-month range)
        return chartData[0]?.price || currentPrice;
      case '1Y':
        // For 1Y: Use price from 1 year ago (first data point in 1-year range)
        return chartData[0]?.price || currentPrice;
      default:
        return chartData[0]?.price || currentPrice;
    }
  };
  
  const baselinePrice = getTimeframeBaseline();
  const priceChange = currentPrice - baselinePrice;
  const percentChange = baselinePrice !== 0 ? ((priceChange / baselinePrice) * 100).toFixed(2) : '0.00';
  const isPositive = priceChange >= 0;
  
  // Calculate OHLC values from actual chart data
  const getOHLCFromChart = () => {
    if (!chartData || chartData.length === 0) {
      return {
        open: analysisData.priceData.open || 0,
        high: analysisData.priceData.high || 0,
        low: analysisData.priceData.low || 0,
        volume: analysisData.priceData.volume || 'N/A'
      };
    }
    
    const prices = chartData.map((d: any) => Number(d.price) || 0);
    const volumes = chartData.map((d: any) => Number(d.volume) || 0);
    
    const openPrice = chartData[0]?.price || prices[0] || 0;
    const highPrice = Math.max(...prices);
    const lowPrice = Math.min(...prices);
    const totalVolume = volumes.reduce((a: number, b: number) => a + b, 0);
    
    return {
      open: openPrice,
      high: highPrice,
      low: lowPrice,
      volume: totalVolume > 0 ? (totalVolume / 100000).toFixed(2) + 'L' : 'N/A'
    };
  };
  
  const ohlcData = getOHLCFromChart();
  
  const timeframes = ['1D', '5D', '1M', '6M', '1Y'];
  
  return (
    <div>
      {/* Current Price Display */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-green-400 text-sm">💰</div>
          <span className="text-green-400 font-medium">Price Chart</span>
        </div>
        
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-gray-900 dark:text-white text-xl font-bold">₹{currentPrice.toFixed(2)}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">INR</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-sm font-medium ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isPositive ? '▲' : '▼'} ₹{Math.abs(priceChange).toFixed(2)} ({isPositive ? '+' : ''}{percentChange}%)
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{
              timeframe === '1D' ? 'vs prev close' :
              timeframe === '5D' ? 'vs 5 days ago' :
              timeframe === '1M' ? 'vs 1 month ago' :
              timeframe === '6M' ? 'vs 6 months ago' :
              timeframe === '1Y' ? 'vs 1 year ago' : 'today'
            }</span>
          </div>
        </div>
        
        {/* Timeframe Buttons */}
        <div className="flex gap-1 mb-3">
          {timeframes.map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs ${
                timeframe === tf 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tf}
            </Button>
          ))}
        </div>
        
        {/* Price Chart */}
        <div className="h-40 mb-4">
          {chartLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full"></div>
                Loading real {timeframe} chart data...
              </div>
            </div>
          ) : chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 1.5, bottom: 5 }}>
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickCount={8}
                />
                <YAxis 
                  domain={[(dataMin: number) => {
                    const prices = chartData.map((d: any) => Number(d.price) || 0);
                    const min = Math.min(...prices);
                    return Math.floor(min - (min * 0.01));
                  }, (dataMax: number) => {
                    const prices = chartData.map((d: any) => Number(d.price) || 0);
                    const max = Math.max(...prices);
                    return Math.ceil(max + (max * 0.01));
                  }]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  width={40}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const value = payload[0].value;
                    return (
                      <div style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        padding: '8px 16px',
                        fontSize: '13px',
                        minWidth: '140px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>
                          ₹{Number(value).toFixed(2)}
                        </span>
                        <div style={{
                          width: '1px',
                          height: '20px',
                          backgroundColor: '#475569'
                        }}></div>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {label}
                        </span>
                      </div>
                    );
                  }}
                />
                <Line 
                  type="linear" 
                  dataKey="price" 
                  stroke={isPositive ? '#10b981' : '#ef4444'}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: isPositive ? '#10b981' : '#ef4444' }}
                />
                <ReferenceLine 
                  y={baselinePrice} 
                  stroke="#64748b" 
                  strokeDasharray="2 2" 
                  strokeWidth={1}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 dark:text-gray-400 text-sm text-center">
                <div className="mb-1">📈 Real chart data</div>
             
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* OHLC Data Grid - Synced with Chart Data */}
      <div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Open</span>
            <span className="text-gray-900 dark:text-white">₹{Number(ohlcData.open).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">High</span>
            <span className="text-gray-900 dark:text-white">₹{Number(ohlcData.high).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Low</span>
            <span className="text-gray-900 dark:text-white">₹{Number(ohlcData.low).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Vol</span>
            <span className="text-gray-900 dark:text-white">{ohlcData.volume}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">52W High</span>
            <span className="text-gray-900 dark:text-white">₹{Number(analysisData.priceData.high52W).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">52W Low</span>
            <span className="text-gray-900 dark:text-white">₹{Number(analysisData.priceData.low52W).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedHeader({ onAllClick, isRefreshing, selectedFilter, onFilterChange, searchQuery, setSearchQuery, onSearch, showAppBar, onBackClick }: { onAllClick: () => void; isRefreshing: boolean; selectedFilter: string; onFilterChange: (filter: string) => void; searchQuery: string; setSearchQuery: (query: string) => void; onSearch: () => void; showAppBar: boolean; onBackClick?: () => void }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Only open AI chat if user clicks "Ask AI" button, not while typing
    // This allows search filtering to work properly
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // If search query exists, trigger feed search
      onSearch();
    } else {
      // If empty, clear search
      onSearch();
    }
  };

  const handleAskAI = () => {
    if (searchQuery.trim()) {
      setChatQuery(searchQuery);
      setIsChatOpen(true);
    }
  };

  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* App Header - Hides on mobile scroll */}
          <div className={`flex items-center justify-between mb-4 transition-all duration-300 ${
            showAppBar ? 'md:flex' : 'md:flex hidden'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600">
                <div className="text-gray-700 dark:text-gray-300 font-bold text-sm">⚡</div>
              </div>
              <div>
                <h1 className="text-gray-900 dark:text-white font-bold text-xl">NeoFeed</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">AI-Powered Trading Network</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
             
              <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                <Bell className="h-5 w-5" />
              </Button>
              <UserProfileDropdown />
            </div>
          </div>

          {/* AI-Enhanced Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4" />
            <Input
              placeholder="Ask me about stocks, market news, IPOs, trading strategies..."
              value={searchQuery}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-20 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
              data-testid="input-neo-feed-search"
            />
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {searchQuery.trim() ? (
                <>
                  <Button
                    onClick={handleSearch}
                    size="sm"
                    className="h-7 w-7 p-0 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md flex items-center justify-center"
                  >
                    <Search className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    onClick={handleAskAI}
                    size="sm"
                    className="h-7 w-7 p-0 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md flex items-center justify-center"
                  >
                    <Bot className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleAskAI}
                  size="sm"
                  className="h-7 px-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium flex items-center gap-1 text-xs"
                >
                  <Bot className="h-3 w-3" />
                  AI
                </Button>
              )}
            </div>
          </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between gap-2 pb-2">
          <div className="flex gap-2 overflow-x-auto">
            {['All', 'Bullish', 'Bearish', 'Profile'].map((filter, index) => (
              <Button
                key={filter}
                onClick={filter === 'All' ? onAllClick : () => onFilterChange(filter)}
                variant={selectedFilter === filter ? "default" : "ghost"}
                disabled={filter === 'All' && isRefreshing}
                className={`px-4 py-2 rounded-full whitespace-nowrap ${
                  selectedFilter === filter
                    ? `bg-blue-600 hover:bg-blue-700 text-white ${filter === 'All' && isRefreshing ? 'opacity-80' : ''}` 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {index === 0 && isRefreshing && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {filter}
                </div>
              </Button>
            ))}
          </div>
          
          {/* Back Button - Right Corner (Mobile Only) */}
          {onBackClick && (
            <Button
              onClick={onBackClick}
              variant="ghost"
              size="icon"
              className="lg:hidden flex-shrink-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              data-testid="button-back-to-home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      </div>

      <AIChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialQuery={chatQuery}
      />
    </>
  );
}

function ProfileHeader() {
  const currentUser = auth.currentUser;
  const [activeTab, setActiveTab] = useState('Posts');
  const [profileData, setProfileData] = useState<any>(null);
  const [postCount, setPostCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const { toast } = useToast();

  // Fetch real user profile data from Firebase
  useEffect(() => {
    const loadProfileData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setProfileData(data.profile);
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, []);

  // Get username for queries
  const currentUsername = profileData?.username || currentUser?.email?.split('@')[0] || '';

  // Fetch follower and following counts (lightweight query)
  const { data: countsData = { followers: 0, following: 0 } } = useQuery({
    queryKey: [`/api/users/${currentUsername}/followers-count`],
    queryFn: async () => {
      if (!currentUsername) return { followers: 0, following: 0 };
      const response = await fetch(`/api/users/${currentUsername}/followers-count`);
      if (!response.ok) return { followers: 0, following: 0 };
      return response.json();
    },
    enabled: !!currentUsername,
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch followers list (only when dialog opens)
  const { data: followersList = { followers: [] }, refetch: refetchFollowers } = useQuery({
    queryKey: [`/api/users/${currentUsername}/followers-list`],
    queryFn: async () => {
      if (!currentUsername) return { followers: [] };
      const response = await fetch(`/api/users/${currentUsername}/followers-list`);
      if (!response.ok) return { followers: [] };
      return response.json();
    },
    enabled: !!currentUsername && showFollowersDialog
  });

  // Fetch following list (only when dialog opens)
  const { data: followingList = { following: [] }, refetch: refetchFollowing } = useQuery({
    queryKey: [`/api/users/${currentUsername}/following-list`],
    queryFn: async () => {
      if (!currentUsername) return { following: [] };
      const response = await fetch(`/api/users/${currentUsername}/following-list`);
      if (!response.ok) return { following: [] };
      return response.json();
    },
    enabled: !!currentUsername && showFollowingDialog
  });

  // Fetch all posts
  const { data: allPosts = [], refetch: refetchPosts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['/api/social-posts'],
    queryFn: async (): Promise<SocialPost[]> => {
      try {
        const response = await fetch(`/api/social-posts?refresh=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch posts');
        const posts = await response.json();
        console.log('📥 ProfileHeader - Fetched posts:', {
          totalPosts: posts.length,
          samplePost: posts[0] ? {
            id: posts[0].id,
            authorUsername: posts[0].authorUsername,
            authorDisplayName: posts[0].authorDisplayName
          } : null
        });
        return posts;
      } catch (error) {
        console.error('❌ ProfileHeader - Error fetching posts:', error);
        throw error;
      }
    }
  });

  // Filter user's posts (works for regular users and bots)
  const userPosts = allPosts.filter(post => {
    if (!profileData) return false;
    
    const matches = (
      post.authorUsername === profileData.username || 
      post.user?.handle === profileData.username ||
      post.authorUsername === currentUser?.email?.split('@')[0] ||
      post.authorDisplayName === profileData.displayName ||
      post.user?.username === profileData.username
    );
    
    if (matches) {
      console.log('✅ ProfileHeader - Post matched user:', {
        postId: post.id,
        postAuthor: post.authorUsername,
        postDisplayName: post.authorDisplayName,
        profileUsername: profileData.username,
        profileDisplayName: profileData.displayName
      });
    }
    return matches;
  });

  useEffect(() => {
    if (profileData) {
      setPostCount(userPosts.length);
    }
  }, [userPosts.length, profileData]);

  const displayName = profileData?.displayName || currentUser?.displayName || '';
  const username = profileData?.username || currentUser?.email?.split('@')[0] || '';
  const bio = profileData?.bio || '';
  const following = countsData?.following || 0;
  const followers = countsData?.followers || 0;
  const profilePicUrl = profileData?.profilePicUrl;
  const coverPicUrl = profileData?.coverPicUrl;

  const initials = displayName ? displayName.charAt(0).toUpperCase() : username.charAt(0).toUpperCase();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mb-6 animate-pulse">
        <div className="h-48 bg-gray-300 dark:bg-gray-700"></div>
        <div className="pt-20 px-4 pb-4">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mb-6">
        {/* Cover Photo */}
        <div className={`h-48 relative ${coverPicUrl ? '' : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'}`}>
          {coverPicUrl && (
            <img src={coverPicUrl} alt="Cover" className="w-full h-full object-cover" />
          )}
          {/* Profile Picture - overlapping cover */}
          <div className="absolute -bottom-16 left-4">
            <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-800">
              {profilePicUrl ? (
                <AvatarImage src={profilePicUrl} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-4xl font-bold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-20 px-4 pb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-gray-900 dark:text-white font-bold text-2xl flex items-center gap-2">
                {displayName || username}
                {profileData?.verified && (
                  <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 fill-current" />
                )}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">@{username}</p>
            </div>
            <Button 
              variant="outline" 
              className="rounded-full px-6 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setShowEditProfile(true)}
              data-testid="button-edit-profile"
            >
              Edit profile
            </Button>
          </div>

          {bio && (
            <p className="text-gray-900 dark:text-white mb-4 text-base">{bio}</p>
          )}

          <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400 text-sm mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>India</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date().getFullYear()}</span>
            </div>
          </div>

          <div className="flex gap-4 text-sm mb-4">
            <button 
              className="hover:underline"
              onClick={() => setShowFollowingDialog(true)}
              data-testid="button-show-following"
            >
              <span className="font-bold text-gray-900 dark:text-white">{following}</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Following</span>
            </button>
            <button 
              className="hover:underline"
              onClick={() => setShowFollowersDialog(true)}
              data-testid="button-show-followers"
            >
              <span className="font-bold text-gray-900 dark:text-white">{followers}</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Followers</span>
            </button>
          </div>

          <div className="flex gap-8 border-b border-gray-200 dark:border-gray-700">
            {[`Posts ${postCount > 0 ? `(${postCount})` : ''}`, 'Media', 'Likes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.split(' ')[0])}
                className={`pb-3 px-2 font-medium transition-colors relative ${
                  activeTab === tab.split(' ')[0]
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                data-testid={`button-tab-${tab.split(' ')[0].toLowerCase()}`}
              >
                {tab}
                {activeTab === tab.split(' ')[0] && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Posts Display */}
      {activeTab === 'Posts' && (
        <div className="space-y-4 mb-6">
          {userPosts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
            </Card>
          ) : (
            userPosts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post}
                currentUserUsername={username}
              />
            ))
          )}
        </div>
      )}

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profileData={profileData}
        onSuccess={() => {
          setShowEditProfile(false);
          window.location.reload();
        }}
      />

      {/* Followers Dialog */}
      <Dialog open={showFollowersDialog} onOpenChange={setShowFollowersDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Followers
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {followersList.followers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No followers yet</p>
              </div>
            ) : (
              followersList.followers.map((follower: any) => (
                <div 
                  key={follower.id} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  data-testid={`follower-${follower.id}`}
                >
                  <Avatar className="w-10 h-10">
                    {follower.avatar ? (
                      <AvatarImage src={follower.avatar} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                        {(follower.displayName || follower.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{follower.displayName || follower.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{follower.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={showFollowingDialog} onOpenChange={setShowFollowingDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Following
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {followingList.following.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Not following anyone yet</p>
              </div>
            ) : (
              followingList.following.map((user: any) => (
                <div 
                  key={user.id} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  data-testid={`following-${user.id}`}
                >
                  <Avatar className="w-10 h-10">
                    {user.avatar ? (
                      <AvatarImage src={user.avatar} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                        {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{user.displayName || user.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditProfileDialog({ isOpen, onClose, profileData, onSuccess }: { 
  isOpen: boolean; 
  onClose: () => void; 
  profileData: any;
  onSuccess: () => void;
}) {
  const [username, setUsername] = useState(profileData?.username || '');
  const [displayName, setDisplayName] = useState(profileData?.displayName || '');
  const [bio, setBio] = useState(profileData?.bio || '');
  const [uploading, setUploading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(profileData?.profilePicUrl || '');
  const [coverPicUrl, setCoverPicUrl] = useState(profileData?.coverPicUrl || '');
  const { toast } = useToast();
  const currentUser = auth.currentUser;

  // Update state when profileData changes
  useEffect(() => {
    if (profileData) {
      setUsername(profileData.username || '');
      setDisplayName(profileData.displayName || '');
      setBio(profileData.bio || '');
      setProfilePicUrl(profileData.profilePicUrl || '');
      setCoverPicUrl(profileData.coverPicUrl || '');
    }
  }, [profileData]);

  const handleFileUpload = async (file: File, type: 'profile' | 'cover') => {
    if (!file) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const idToken = await currentUser?.getIdToken();
      const response = await fetch('/api/upload-profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const { url } = await response.json();
      
      if (type === 'profile') {
        setProfilePicUrl(url);
      } else {
        setCoverPicUrl(url);
      }
      
      toast({ description: `${type === 'profile' ? 'Profile' : 'Cover'} photo uploaded successfully!` });
    } catch (error) {
      toast({ description: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const idToken = await currentUser?.getIdToken();
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          username,
          displayName,
          bio,
          profilePicUrl,
          coverPicUrl
        })
      });

      if (!response.ok) throw new Error('Failed to update profile');

      toast({ description: "Profile updated successfully!" });
      onSuccess();
    } catch (error) {
      toast({ description: "Failed to update profile", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              data-testid="input-username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
              data-testid="input-displayname"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
              data-testid="textarea-bio"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Profile Picture</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'profile')}
              disabled={uploading}
              data-testid="input-profile-pic"
            />
            {profilePicUrl && (
              <img src={profilePicUrl} alt="Profile preview" className="mt-2 w-20 h-20 rounded-full object-cover" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cover Picture</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cover')}
              disabled={uploading}
              data-testid="input-cover-pic"
            />
            {coverPicUrl && (
              <img src={coverPicUrl} alt="Cover preview" className="mt-2 w-full h-32 rounded-lg object-cover" />
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel-profile">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={uploading} data-testid="button-save-profile">
              {uploading ? 'Uploading...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AnalysisPanel({ ticker, isOpen, onClose }: { ticker: string; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  // Mobile view toggle state (fundamentals vs news)
  const [showNewsOnMobile, setShowNewsOnMobile] = useState(false);

  // Extract stock symbol from ticker (remove $ prefix)
  const stockSymbol = ticker.replace('$', '');
  
  // Fetch real fundamental data
  const { data: fundamentalData, isLoading: loadingFundamentals } = useQuery({
    queryKey: [`/api/stock-analysis/${stockSymbol}`],
    queryFn: async () => {
      const response = await fetch(`/api/stock-analysis/${stockSymbol}`);
      if (!response.ok) throw new Error('Failed to fetch stock analysis');
      return await response.json();
    },
    enabled: isOpen,
  });

  // Fetch real news data
  const { data: newsData, isLoading: loadingNews } = useQuery({
    queryKey: [`/api/stock-news/${stockSymbol}`],
    queryFn: async () => {
      const response = await fetch(`/api/stock-news/${stockSymbol}?refresh=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch stock news');
      return await response.json();
    },
    enabled: isOpen,
    staleTime: 60000, // Consider data stale after 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when user focuses window
    refetchInterval: 300000, // Auto-refresh every 5 minutes
  });

  // Combine data for display
  const analysisData: AnalysisData = {
    priceData: fundamentalData?.priceData || {
      open: 0, high: 0, low: 0, close: 0, volume: 'N/A', high52W: 0, low52W: 0
    },
    valuation: fundamentalData?.valuation || {
      marketCap: 'N/A', peRatio: 0, pbRatio: 0, psRatio: 0, evEbitda: 0, pegRatio: 0
    },
    financialHealth: fundamentalData?.financialHealth || {
      eps: 0, bookValue: 0, dividendYield: 'N/A', roe: 'N/A', roa: 'N/A', deRatio: 0
    },
    technicalIndicators: fundamentalData?.technicalIndicators || {
      rsi: null
    },
    growthMetrics: fundamentalData?.growthMetrics || {
      revenueGrowth: 'N/A', epsGrowth: 'N/A', profitMargin: 'N/A', ebitdaMargin: 'N/A', freeCashFlowYield: 'N/A'
    },
    additionalIndicators: fundamentalData?.additionalIndicators || {
      beta: 0, currentRatio: 0, quickRatio: 0, priceToSales: 0, enterpriseValue: 'N/A'
    },
    marketSentiment: fundamentalData?.marketSentiment || {
      score: 0.5, trend: 'Neutral', volumeSpike: false, confidence: 'Medium'
    },
    news: newsData || []
  };

  return (
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Fundamental Analysis Panel */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-xl backdrop-blur-sm ">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400 " />
          <h3 className="text-gray-900 dark:text-white font-semibold flex-1 ">{showNewsOnMobile ? 'Related News' : 'Fundamental Analysis'}</h3>
          {!showNewsOnMobile && loadingFundamentals && (
            <div className="ml-2 w-4 h-4 border-2 border-gray-600 dark:border-gray-400 border-t-transparent rounded-full animate-spin "></div>
          )}
          {showNewsOnMobile && loadingNews && (
            <div className="ml-2 w-4 h-4 border-2 border-gray-600 dark:border-gray-400 border-t-transparent rounded-full animate-spin "></div>
          )}
          {/* Mobile toggle button - switch between Fundamentals and News */}
          <Button
            size="icon"
            variant="ghost"
            className="lg:hidden"
            onClick={() => setShowNewsOnMobile(!showNewsOnMobile)}
            data-testid="button-toggle-news-mobile"
          >
            <Newspaper className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Button>
        </div>

        {/* Conditional content - show news or fundamentals on mobile */}
        {showNewsOnMobile ? (
          /* Related News content for mobile */
          <div className="space-y-3 max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-700/60 rounded-xl p-4 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800 lg:hidden ">
            {analysisData.news && analysisData.news.length > 0 ? (
              analysisData.news.map((item, index) => (
                <div 
                  key={index} 
                  className="p-3 bg-gray-100 dark:bg-gray-600/60 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600/70 transition-colors backdrop-blur-sm shadow-sm cursor-pointer"
                  onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                >
                  <h4 className="text-gray-700 dark:text-gray-300 font-medium text-sm mb-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    {item.title} ↗
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400 text-xs ">{item.source}</span>
                    <span className="text-gray-500 dark:text-gray-500 text-xs ">{item.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400 ">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent news available for this stock</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 ">Check back later for updates</p>
              </div>
            )}
          </div>
        ) : (
          /* Fundamental Analysis content */
          <div className="space-y-4 max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-700/60 rounded-xl p-4 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800 ">
          {/* Price Chart & Data */}
          <PriceChartSection ticker={ticker} analysisData={analysisData} />

          {/* Valuation */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-700 dark:text-gray-400 " />
              <span className="text-gray-800 dark:text-gray-400 font-medium ">Valuation</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Market Cap</span>
                <span className="text-gray-900 dark:text-white ">{analysisData.valuation.marketCap}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">P/E Ratio</span>
                <span className="text-gray-900 dark:text-white ">{analysisData.valuation.peRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">P/B Ratio</span>
                <span className="text-gray-900 dark:text-white ">{analysisData.valuation.pbRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">EV/EBITDA</span>
                <span className="text-gray-900 dark:text-white ">{analysisData.valuation.evEbitda}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">P/S Ratio</span>
                <span className="text-gray-900 dark:text-white ">{analysisData.valuation.psRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">PEG Ratio</span>
                <span className="text-gray-900 dark:text-white ">{analysisData.valuation.pegRatio}</span>
              </div>
            </div>
          </div>

          {/* Financial Health */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-gray-700 dark:text-gray-400 " />
              <span className="text-gray-800 dark:text-gray-400 font-medium ">Financial Health</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">EPS</span>
                <span className="text-gray-900 dark:text-white ">₹{analysisData.financialHealth.eps}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Book Value</span>
                <span className="text-gray-900 dark:text-white ">₹{analysisData.financialHealth.bookValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Dividend Yield</span>
                <span className="text-gray-700 dark:text-gray-300 ">{analysisData.financialHealth.dividendYield}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">ROE</span>
                <span className="text-gray-700 dark:text-gray-300 ">{analysisData.financialHealth.roe}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">ROA</span>
                <span className="text-gray-700 dark:text-gray-300 ">{analysisData.financialHealth.roa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">D/E Ratio</span>
                <span className="text-gray-900 dark:text-white ">{analysisData.financialHealth.deRatio}</span>
              </div>
            </div>
          </div>

          {/* Technical Indicators */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-gray-700 dark:text-gray-400 " />
              <span className="text-gray-800 dark:text-gray-400 font-medium ">Technical Indicators</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">RSI (14)</span>
                <span className={`font-medium ${
                  analysisData.technicalIndicators?.rsi 
                    ? analysisData.technicalIndicators.rsi > 70 
                      ? 'text-red-400' 
                      : analysisData.technicalIndicators.rsi < 30 
                        ? 'text-green-400' 
                        : 'text-yellow-400'
                    : 'text-slate-400'
                }`}>
                  {analysisData.technicalIndicators?.rsi ? analysisData.technicalIndicators.rsi.toFixed(1) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">EMA 50</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium ">{(analysisData.technicalIndicators as any)?.ema50 || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Market Sentiment & Volume Analysis */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-gray-700 dark:text-gray-400 " />
              <span className="text-gray-800 dark:text-gray-400 font-medium ">Market Sentiment</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Sentiment Score</span>
                <span className={`font-medium ${
                  analysisData.marketSentiment?.score 
                    ? analysisData.marketSentiment.score > 0.6 
                      ? 'text-green-400' 
                      : analysisData.marketSentiment.score < 0.4 
                        ? 'text-red-400' 
                        : 'text-yellow-400'
                    : 'text-slate-400'
                }`}>
                  {analysisData.marketSentiment?.score ? `${(analysisData.marketSentiment.score * 100).toFixed(0)}%` : 'Neutral'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Trend</span>
                <span className={`font-medium ${
                  analysisData.marketSentiment?.trend === 'Bullish' 
                    ? 'text-green-400' 
                    : analysisData.marketSentiment?.trend === 'Bearish' 
                      ? 'text-red-400' 
                      : 'text-yellow-400'
                }`}>
                  {analysisData.marketSentiment?.trend || 'Neutral'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Volume Spike</span>
                <span className={`font-medium ${
                  analysisData.marketSentiment?.volumeSpike 
                    ? 'text-orange-400' 
                    : 'text-slate-400'
                }`}>
                  {analysisData.marketSentiment?.volumeSpike ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Confidence</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium ">
                  {analysisData.marketSentiment?.confidence || 'Medium'}
                </span>
              </div>
            </div>
          </div>

          {/* Growth Metrics */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-gray-700 dark:text-gray-400 " />
              <span className="text-gray-800 dark:text-gray-400 font-medium ">Growth Metrics</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Revenue Growth</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium ">{analysisData.growthMetrics?.revenueGrowth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">EPS Growth</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium ">{analysisData.growthMetrics?.epsGrowth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Profit Margin</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium ">{analysisData.growthMetrics?.profitMargin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">EBITDA Margin</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium ">{analysisData.growthMetrics?.ebitdaMargin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">FCF Yield</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium ">{analysisData.growthMetrics?.freeCashFlowYield}</span>
              </div>
            </div>
          </div>

          {/* Additional Indicators */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-gray-700 dark:text-gray-400 " />
              <span className="text-gray-800 dark:text-gray-400 font-medium ">Additional Indicators</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Beta</span>
                <span className={`font-medium ${
                  analysisData.additionalIndicators?.beta 
                    ? analysisData.additionalIndicators.beta > 1.2 
                      ? 'text-red-400' 
                      : analysisData.additionalIndicators.beta < 0.8 
                        ? 'text-green-400' 
                        : 'text-yellow-400'
                    : 'text-slate-400'
                }`}>
                  {analysisData.additionalIndicators?.beta || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Current Ratio</span>
                <span className={`font-medium ${
                  analysisData.additionalIndicators?.currentRatio 
                    ? analysisData.additionalIndicators.currentRatio > 1.5 
                      ? 'text-green-400' 
                      : analysisData.additionalIndicators.currentRatio < 1 
                        ? 'text-red-400' 
                        : 'text-yellow-400'
                    : 'text-slate-400'
                }`}>
                  {analysisData.additionalIndicators?.currentRatio || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Quick Ratio</span>
                <span className={`font-medium ${
                  analysisData.additionalIndicators?.quickRatio 
                    ? analysisData.additionalIndicators.quickRatio > 1 
                      ? 'text-green-400' 
                      : analysisData.additionalIndicators.quickRatio < 0.7 
                        ? 'text-red-400' 
                        : 'text-yellow-400'
                    : 'text-slate-400'
                }`}>
                  {analysisData.additionalIndicators?.quickRatio || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Enterprise Value</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium ">{analysisData.additionalIndicators?.enterpriseValue}</span>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Related News Panel - Hidden on mobile, visible on lg+ */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-xl backdrop-blur-sm ">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400 " />
          <h3 className="text-gray-900 dark:text-white font-semibold ">Related News</h3>
          {loadingNews && (
            <div className="ml-2 w-4 h-4 border-2 border-gray-600 dark:border-gray-400 border-t-transparent rounded-full animate-spin "></div>
          )}
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-700/60 rounded-xl p-4 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800 ">
          {analysisData.news && analysisData.news.length > 0 ? (
            analysisData.news.map((item, index) => (
              <div 
                key={index} 
                className="p-3 bg-gray-100 dark:bg-gray-600/60 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600/70 transition-colors backdrop-blur-sm shadow-sm cursor-pointer"
                onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
              >
                <h4 className="text-gray-700 dark:text-gray-300 font-medium text-sm mb-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  {item.title} ↗
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400 text-xs ">{item.source}</span>
                  <span className="text-gray-500 dark:text-gray-500 text-xs ">{item.time}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 ">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent news available for this stock</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 ">Check back later for updates</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const PostCard = memo(function PostCard({ post, currentUserUsername }: { post: FeedPost; currentUserUsername?: string }) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [showCommentSection, setShowCommentSection] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isFollowing, setIsFollowing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = auth.currentUser;
  
  // Check if this post belongs to the current user
  const isOwnPost = !!(currentUserUsername && (post.authorUsername === currentUserUsername || post.user?.handle === currentUserUsername));
  
  // Get the author username for follow functionality
  const authorUsername = post.user?.handle || post.authorUsername || 'user';
  
  // Fetch follow status for this author
  const { data: followStatus } = useQuery({
    queryKey: [`/api/users/${authorUsername}/follow-status`],
    queryFn: async () => {
      if (!currentUser || isOwnPost) return { isFollowing: false };
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`/api/users/${authorUsername}/follow-status`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) return { isFollowing: false };
      return response.json();
    },
    enabled: !!currentUser && !isOwnPost
  });
  
  // Update local state when query data changes
  useEffect(() => {
    if (followStatus) {
      setIsFollowing(followStatus.following || followStatus.isFollowing || false);
    }
  }, [followStatus]);
  
  // Audio mode text selection
  const { isAudioMode, selectedTextSnippets, addTextSnippet } = useAudioMode();
  
  // Text truncation settings
  const MAX_TEXT_LENGTH = 150;
  
  // Text selection handler - Click to select entire post
  const handleTextSelection = () => {
    if (!isAudioMode) return;
    
    if (selectedTextSnippets.length >= 5) {
      toast({ description: "Maximum 5 posts allowed", variant: "destructive" });
      return;
    }
    
    // Select the entire post content instead of just highlighted text
    const fullText = post.content;
    
    if (!fullText || fullText.trim().length === 0) return;
    
    // Keep post.id as string (Firebase IDs are strings)
    const postIdValue = typeof post.id === 'string' ? post.id : String(post.id);
    
    addTextSnippet({
      postId: postIdValue,
      text: fullText,
      authorUsername: post.user?.handle || post.authorUsername || 'Unknown',
      authorDisplayName: post.user?.username || post.authorDisplayName || 'Unknown User'
    });
  };

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const idToken = await user.getIdToken();
      const method = liked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/social-posts/${post.id}/like`, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (!response.ok) throw new Error('Failed to update like');
      return response.json();
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/social-posts'] });
      const previousPosts = queryClient.getQueryData(['/api/social-posts']);
      
      queryClient.setQueryData(['/api/social-posts'], (old: any) => {
        return old?.map((p: any) => 
          p.id === post.id 
            ? { 
                ...p, 
                likes: liked ? (p.likes || 0) - 1 : (p.likes || 0) + 1,
                metrics: p.metrics ? {
                  ...p.metrics,
                  likes: liked ? (p.metrics.likes || 0) - 1 : (p.metrics.likes || 0) + 1
                } : undefined
              }
            : p
        );
      });
      
      setLiked(!liked);
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      setLiked(!liked); // Revert on error
      queryClient.setQueryData(['/api/social-posts'], context?.previousPosts);
      toast({ description: "Failed to update like", variant: "destructive" });
    }
  });

  // Repost mutation
  const repostMutation = useMutation({
    mutationFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const idToken = await user.getIdToken();
      const method = reposted ? 'DELETE' : 'POST';
      const response = await fetch(`/api/social-posts/${post.id}/repost`, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (!response.ok) throw new Error('Failed to update repost');
      return response.json();
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/social-posts'] });
      const previousPosts = queryClient.getQueryData(['/api/social-posts']);
      
      queryClient.setQueryData(['/api/social-posts'], (old: any) => {
        return old?.map((p: any) => 
          p.id === post.id 
            ? { 
                ...p, 
                reposts: reposted ? (p.reposts || 0) - 1 : (p.reposts || 0) + 1,
                metrics: p.metrics ? {
                  ...p.metrics,
                  reposts: reposted ? (p.metrics.reposts || 0) - 1 : (p.metrics.reposts || 0) + 1
                } : undefined
              }
            : p
        );
      });
      
      setReposted(!reposted);
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      setReposted(!reposted); // Revert on error
      queryClient.setQueryData(['/api/social-posts'], context?.previousPosts);
      toast({ description: "Failed to update repost", variant: "destructive" });
    }
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentUser) throw new Error('Not authenticated');
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`/api/social-posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ content })
      });
      if (!response.ok) throw new Error('Failed to update post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
      setShowEditDialog(false);
      setShowOptionsMenu(false);
      toast({ description: "Post updated successfully!" });
    },
    onError: () => {
      toast({ description: "Failed to update post", variant: "destructive" });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error('Not authenticated');
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`/api/social-posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
      setShowDeleteDialog(false);
      setShowOptionsMenu(false);
      toast({ description: "Post deleted successfully!" });
    },
    onError: () => {
      toast({ description: "Failed to delete post", variant: "destructive" });
    }
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error('Not authenticated');
      const idToken = await currentUser.getIdToken();
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${authorUsername}/follow`, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isFollowing ? 'unfollow' : 'follow'}`);
      }
      return response.json();
    },
    onMutate: async () => {
      // Optimistic update
      setIsFollowing(!isFollowing);
      // Invalidate follow status query
      await queryClient.cancelQueries({ queryKey: [`/api/users/${authorUsername}/follow-status`] });
      return { previousFollowing: isFollowing };
    },
    onSuccess: () => {
      // Invalidate related queries to update counts
      queryClient.invalidateQueries({ queryKey: [`/api/users/${authorUsername}/follow-status`] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
      // Invalidate follower counts for both users (using partial match)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && 
                 typeof key[0] === 'string' && 
                 key[0].includes('/followers-count');
        }
      });
      // Invalidate followers/following list dialogs
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && 
                 typeof key[0] === 'string' && 
                 (key[0].includes('/followers-list') || key[0].includes('/following-list'));
        }
      });
      toast({ description: isFollowing ? "Unfollowed successfully!" : "Following!" });
    },
    onError: (err: any, variables, context) => {
      // Revert on error
      setIsFollowing(context?.previousFollowing || false);
      const errorMsg = err?.message || `Failed to ${isFollowing ? 'unfollow' : 'follow'}`;
      console.error('❌ Follow error:', errorMsg);
      toast({ description: errorMsg, variant: "destructive" });
    }
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'bearish': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  // If this is an audio minicast post, render the special card
  if (post.isAudioPost) {
    console.log('🎙️ Audio Minicast Post Detected:', {
      postId: post.id,
      selectedPostIds: post.selectedPostIds,
      hasSavedSelectedPosts: !!post.selectedPosts && post.selectedPosts.length > 0
    });
    
    // Use the saved selectedPosts if available, otherwise try to find them from cache
    let selectedPosts: Array<{ id: string | number; content: string }> = [];
    
    if (post.selectedPosts && post.selectedPosts.length > 0) {
      // Use the saved selected posts content (preferred method)
      console.log('✅ Using saved selectedPosts from post data');
      selectedPosts = post.selectedPosts.map(sp => ({
        id: sp.id,
        content: sp.content
      }));
    } else if (post.selectedPostIds && post.selectedPostIds.length > 0) {
      // Fallback: Try to find posts in cache (backward compatibility)
      console.log('⚠️ Falling back to cache lookup for selectedPosts');
      const allPosts = queryClient.getQueryData<any[]>(['/api/social-posts']) || [];
      selectedPosts = (post.selectedPostIds || [])
        .map(selectedId => {
          const selectedPost = allPosts.find(p => p.id === selectedId || p.id?.toString() === selectedId?.toString());
          if (selectedPost) {
            return {
              id: selectedPost.id,
              content: selectedPost.content || ''
            };
          }
          return null;
        })
        .filter((p): p is { id: string | number; content: string } => p !== null);
    }
    
    console.log('📊 Final selectedPosts array:', {
      count: selectedPosts.length,
      posts: selectedPosts.map(p => ({ id: p.id, contentLength: p.content.length }))
    });
    
    return (
      <AudioMinicastCard
        content={post.content}
        author={{
          displayName: post.user?.username || post.authorDisplayName || 'Unknown User',
          username: post.user?.handle || post.authorUsername || 'user'
        }}
        selectedPostIds={post.selectedPostIds}
        selectedPosts={selectedPosts}
        timestamp={post.createdAt ? new Date(post.createdAt) : new Date()}
        likes={post.likes || post.metrics?.likes || 0}
        comments={post.comments || post.metrics?.comments || 0}
        isLiked={liked}
        postId={post.id?.toString()}
        isOwner={isOwnPost}
      />
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md mb-4 transition-none">
      
      <CardContent className="p-3 xl:p-4 transition-none">
        {/* User Header */}
        <div className="flex items-start justify-between mb-2 xl:mb-4">
          <div className="flex items-center gap-2 xl:gap-3">
            <div className="relative">
              <Avatar className="w-10 h-10 border border-gray-200 dark:border-gray-600 ">
                <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-sm ">
                  {post.user?.initial || 
                   post.authorDisplayName?.charAt(0) || 
                   post.authorUsername?.charAt(0) || 
                   'U'}
                </AvatarFallback>
              </Avatar>
              {post.user?.online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-lg animate-pulse ring-1 ring-emerald-400/40"></div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const username = post.user?.handle || post.authorUsername || '';
                    if (username) {
                      window.location.href = `/user/${username}`;
                    }
                  }}
                  className="text-gray-900 dark:text-white font-bold text-lg hover:underline cursor-pointer transition-colors"
                  data-testid={`button-profile-${post.authorUsername}`}
                >
                  {post.user?.username || 
                   post.authorDisplayName || 
                   post.authorUsername || 
                   'Unknown User'}
                </button>
                {(post.user?.verified || post.authorVerified) && (
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-current" />
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm font-medium ">
                <span>@{post.user?.handle || post.authorUsername || 'user'}</span>
                {/* Hide timestamp for finance news posts (auto-generated content) */}
                {post.authorUsername !== 'finance_news' && (
                  <>
                    <span>•</span>
                    <span>
                      {post.timestamp || 
                       (post.createdAt ? new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'now')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Follow button - only show for other users if NOT following */}
            {!isOwnPost && currentUser && !isFollowing && (
              <Button
                variant="default"
                size="sm"
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className="rounded-full px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                data-testid={`button-follow-${post.id}`}
              >
                {followMutation.isPending ? '...' : 'Follow'}
              </Button>
            )}
            {/* Audio mode indicator */}
            {isAudioMode && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                <Mic className="w-3 h-3" />
                <span>Select text</span>
              </div>
            )}
            {/* 3-dot menu - only show for user's own posts */}
            {isOwnPost && (
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  data-testid={`button-options-${post.id}`}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
                
                {/* Dropdown menu */}
                {showOptionsMenu && (
                  <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 z-50 min-w-[120px]">
                    <button
                      onClick={() => {
                        setEditContent(post.content);
                        setShowEditDialog(true);
                        setShowOptionsMenu(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left transition-colors"
                      data-testid={`button-edit-${post.id}`}
                    >
                      <PenTool className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteDialog(true);
                        setShowOptionsMenu(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-colors"
                      data-testid={`button-delete-${post.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-2 xl:mb-4">
          <div className="relative">
            <p 
              className={`text-gray-900 dark:text-white leading-relaxed mb-2 xl:mb-3 text-base font-medium ${
                isAudioMode ? 'cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors rounded-lg p-2 -m-2' : ''
              }`}
              onClick={handleTextSelection}
            >
              {isExpanded || post.content.length <= MAX_TEXT_LENGTH
                ? post.content
                : `${post.content.substring(0, MAX_TEXT_LENGTH)}...`}
            </p>
            
            {/* Expand/Collapse button for long text */}
            {post.content.length > MAX_TEXT_LENGTH && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium mt-1 transition-colors"
                data-testid={`button-expand-${post.id}`}
              >
                {isExpanded ? (
                  <>
                    <span>Show less</span>
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Show more</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Ticker and Sentiment - Only show if valid ticker exists */}
          {post.ticker && (
            <div className="flex items-center gap-2 mb-2 xl:mb-3">
              <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-4 py-2 font-bold ">
                {post.ticker}
              </Badge>
              <Badge className={`px-4 py-2 border font-bold ${
                post.sentiment === 'bullish' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' :
                post.sentiment === 'bearish' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' :
                'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800'
              }`}>
                {post.sentiment === 'bullish' && <TrendingUp className="w-4 h-4 mr-1" />}
                {post.sentiment === 'bearish' && <TrendingDown className="w-4 h-4 mr-1" />}
                {post.sentiment === 'neutral' && <Activity className="w-4 h-4 mr-1" />}
                {(post.sentiment || 'neutral').charAt(0).toUpperCase() + (post.sentiment || 'neutral').slice(1)}
              </Badge>
            </div>
          )}

          {/* Multiple Images Display - Swipeable Carousel for all images */}
          {(post.hasMedia || post.imageUrl) && (
            <div className="my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
              {(() => {
                // Support both single images and JSON arrays of multiple images
                let images: string[] = [];
                if (post.imageUrl) {
                  try {
                    // Try to parse as JSON array first (for multiple images)
                    const parsed = JSON.parse(post.imageUrl);
                    images = Array.isArray(parsed) ? parsed : [post.imageUrl];
                  } catch {
                    // If not JSON, treat as single image
                    images = [post.imageUrl];
                  }
                }
                
                // Always use swipeable carousel for consistent card-like experience
                if (images.length > 0) {
                  return <SwipeableCarousel images={images} />;
                }
                return null;
              })()}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {post.tags?.map((tag, index) => (
              <span key={`${post.id}-tag-${index}-${tag}`} className="text-blue-600 dark:text-blue-400 text-sm hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer transition-colors">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-cyan-400/30 bg-gradient-to-r from-black/40 to-indigo-900/40 py-4 rounded-b-lg">
          <div className="flex items-center gap-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommentSection(!showCommentSection)}
              className="flex items-center gap-2 text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-500/20  backdrop-blur-sm px-3 py-2 rounded-lg"
              data-testid={`button-comment-${post.id}`}
            >
              <MessageCircle className="h-5 w-5" />
              <span>{post.metrics?.comments || post.comments || 0}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => repostMutation.mutate()}
              disabled={repostMutation.isPending}
              className={`flex items-center gap-2  backdrop-blur-sm hover:bg-gray-500/20 px-3 py-2 rounded-lg ${
                reposted ? 'text-black dark:text-white' : 'text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              data-testid={`button-repost-${post.id}`}
            >
              <Repeat className="h-5 w-5" />
              <span>{post.metrics?.reposts || post.reposts || 0}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
              className={`flex items-center gap-2  backdrop-blur-sm hover:bg-gray-500/20 px-3 py-2 rounded-lg ${
                liked ? 'text-black dark:text-white' : 'text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              data-testid={`button-like-${post.id}`}
            >
              <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
              <span>{post.metrics?.likes || post.likes || 0}</span>
            </Button>

            {/* Only show analysis button if valid ticker exists */}
            {post.ticker && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnalysis(!showAnalysis)}
                className={`flex items-center gap-2  backdrop-blur-sm hover:bg-gray-500/20 px-3 py-2 rounded-lg ${
                  showAnalysis ? 'text-black dark:text-white' : 'text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
            )}
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowShareModal(true)}
            className="text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-500/20  backdrop-blur-sm p-2 rounded-lg"
            data-testid={`button-share-${post.id}`}
          >
            <Share className="h-5 w-5" />
          </Button>
        </div>

        {/* Analysis Panel - Only show if valid ticker exists */}
        {showAnalysis && post.ticker && (
          <AnalysisPanel 
            ticker={post.ticker}
            isOpen={showAnalysis}
            onClose={() => setShowAnalysis(false)}
          />
        )}

        {/* Inline Comment Section */}
        <InlineCommentSection 
          post={post}
          isVisible={showCommentSection}
          onClose={() => setShowCommentSection(false)}
        />

        {/* Share Modal */}
        <ShareModal 
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          post={post}
        />

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="resize-none"
              data-testid="textarea-edit-content"
            />
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={() => editMutation.mutate(editContent)}
                disabled={editMutation.isPending || !editContent.trim()}
                data-testid="button-save-edit"
              >
                {editMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Post</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                data-testid="button-cancel-delete"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
});

function NeoFeedSocialFeedComponent({ onBackClick }: { onBackClick?: () => void }) {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [isAtTop, setIsAtTop] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [currentUserUsername, setCurrentUserUsername] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTopFilters, setShowTopFilters] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showAppBar, setShowAppBar] = useState(true);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [showMobileCreatePost, setShowMobileCreatePost] = useState(false);
  const [showMobileAudioMinicast, setShowMobileAudioMinicast] = useState(false);
  const [showMobileMessages, setShowMobileMessages] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const loaderRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Audio mode for text selection
  const { selectedTextSnippets } = useAudioMode();
  
  // Handle scroll to hide/show app bar and bottom navigation
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Stop all audio playback when scrolling
      window.speechSynthesis.cancel();
      
      // Pause YouTube video when scrolling
      if (typeof (window as any).pauseBannerYouTube === 'function') {
        (window as any).pauseBannerYouTube();
      }
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px - hide app bar and bottom nav
        setShowAppBar(false);
        setShowBottomNav(false);
      } else {
        // Scrolling up - show app bar and bottom nav
        setShowAppBar(true);
        setShowBottomNav(true);
      }
      
      // Clear existing timeout
      clearTimeout(scrollTimeout);
      
      // Show navigation after scrolling stops for 150ms
      scrollTimeout = setTimeout(() => {
        setShowAppBar(true);
        setShowBottomNav(true);
      }, 150);
      
      setLastScrollY(currentScrollY);
      setIsAtTop(currentScrollY < 50);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [lastScrollY]);
  
  const { data: posts = [], isLoading, error, isFetching } = useQuery({
    queryKey: ['/api/social-posts', pageNumber],
    queryFn: async (): Promise<SocialPost[]> => {
      const limit = 15;
      const offset = (pageNumber - 1) * limit;
      const response = await fetch(`/api/social-posts?limit=${limit}&offset=${offset}`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      return await response.json();
    },
    staleTime: 60000,
    gcTime: 300000,
    retry: 1,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    networkMode: 'always'
  });

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current) return;
    
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !isLoading && !isFetching && posts.length > 0) {
        setPageNumber(prev => prev + 1);
      }
    }, { threshold: 0.1 });
    
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [isLoading, isFetching, posts.length]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if user has profile (username) when component mounts and fetch real username from Firebase
  useEffect(() => {
    const checkUserProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.log('No user logged in');
        return;
      }

      try {
        console.log('🔍 Checking profile for Firebase user:', {
          uid: user.uid,
          email: user.email
        });

        const idToken = await user.getIdToken();
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        if (response.ok) {
          const profileData = await response.json();
          console.log('📋 Profile check response:', {
            userId: profileData.userId,
            email: profileData.email,
            hasProfile: !!profileData.profile,
            hasUsername: !!profileData.profile?.username,
            hasDOB: !!profileData.profile?.dob,
            profileData: profileData.profile
          });

          // Store real username from Firebase for Profile filter
          if (profileData.profile?.username) {
            setCurrentUserUsername(profileData.profile.username);
          }

          // Show dialog only if user doesn't have username or DOB
          if (!profileData.profile || !profileData.profile.username || !profileData.profile.dob) {
            console.log('❌ Profile incomplete (missing username or DOB), showing profile dialog');
            setShowProfileDialog(true);
          } else {
            console.log('✅ Profile complete, user can use social feed');
          }
        } else {
          console.error('❌ Profile check failed with status:', response.status);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      }
    };

    checkUserProfile();
  }, []);

  // Smart "All" button functionality
  const handleAllClick = () => {
    setSelectedFilter('All');
    setPageNumber(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter change handler
  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setPageNumber(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Search functionality
  const handleSearch = () => {
    // Search logic will filter posts in the filteredData step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Convert SocialPost to FeedPost format for compatibility and apply filtering
  const rawFeedData: FeedPost[] = posts.map(post => ({
    id: post.id.toString(),
    user: {
      initial: post.authorDisplayName?.[0]?.toUpperCase() || "U",
      username: post.authorDisplayName,
      handle: post.authorUsername,
      verified: post.authorVerified,
      online: true, // Default since we don't track online status
      avatar: post.authorAvatar || undefined,
    },
    content: post.content,
    timestamp: formatTimestamp(post.createdAt),
    tags: post.tags || [],
    sentiment: (post.sentiment || 'neutral') as 'bullish' | 'bearish' | 'neutral',
    ticker: post.stockMentions?.[0] ? `$${post.stockMentions[0]}` : "",
    metrics: {
      comments: post.comments,
      reposts: post.reposts,
      likes: post.likes,
    },
    hasMedia: post.hasImage || false,
    imageUrl: post.imageUrl || undefined,
    imageUrls: post.imageUrl ? [post.imageUrl] : [],
    stockMentions: post.stockMentions || [],
    isAudioPost: post.isAudioPost || false,
    selectedPostIds: post.selectedPostIds || [],
    authorUsername: post.authorUsername,
    authorDisplayName: post.authorDisplayName,
    createdAt: post.createdAt,
  }));

  // Enhanced content normalization function to handle source variations
  const normalizeContentForDeduplication = (content: string): string => {
    let normalized = content.trim().toLowerCase();
    
    // Remove source information patterns
    normalized = normalized
      .replace(/🔗\s*source:\s*[^,.\n]*[,.\n]?/gi, '') // Remove "🔗 Source: XYZ"
      .replace(/source:\s*[^,.\n]*[,.\n]?/gi, '') // Remove "Source: XYZ"
      .replace(/-\s*[^,.\n]*(?:today|times|watch|news|india|business)[^,.\n]*[,.\n]?/gi, '') // Remove news source names
      .replace(/\([^)]*(?:today|times|watch|news|india|business)[^)]*\)/gi, '') // Remove sources in parentheses
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Remove leading news emoji and common prefixes
    normalized = normalized
      .replace(/^📰\s*/gi, '') // Remove news emoji
      .replace(/^news:\s*/gi, '') // Remove "News:" prefix
      .replace(/^breaking:\s*/gi, '') // Remove "Breaking:" prefix
      .trim();
    
    return normalized;
  };

  // Remove duplicates: ID-based and enhanced content-based deduplication
  const seenIds = new Set<string>();
  const seenContent = new Set<string>();
  const allFeedData: FeedPost[] = rawFeedData.filter(post => {
    // ID-based deduplication
    const postId = post.id.toString();
    if (seenIds.has(postId)) {
      return false;
    }
    seenIds.add(postId);

    // Enhanced content-based deduplication that ignores source variations
    const normalizedContent = normalizeContentForDeduplication(post.content);
    if (seenContent.has(normalizedContent)) {
      console.log(`🚫 Duplicate content filtered: "${post.content.substring(0, 100)}..."`);
      return false;
    }
    seenContent.add(normalizedContent);

    return true;
  });

  // Apply search filtering first
  let searchFilteredData = allFeedData;
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    searchFilteredData = allFeedData.filter(post => 
      post.content.toLowerCase().includes(query) ||
      post.user?.username?.toLowerCase().includes(query) ||
      post.ticker?.toLowerCase().includes(query) ||
      post.stockMentions?.some(stock => stock.toLowerCase().includes(query)) ||
      post.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Apply filter tabs to search results - using real Firebase username from state
  let filteredData: FeedPost[] = selectedFilter === 'All' 
    ? searchFilteredData
    : selectedFilter === 'Symbol' 
    ? searchFilteredData.filter(post => post.stockMentions && post.stockMentions.length > 0)
    : selectedFilter === 'Bullish'
    ? searchFilteredData.filter(post => post.sentiment === 'bullish')
    : selectedFilter === 'Bearish'
    ? searchFilteredData.filter(post => post.sentiment === 'bearish')
    : selectedFilter === 'Profile'
    ? searchFilteredData.filter(post => post.authorUsername === currentUserUsername || post.user?.handle === currentUserUsername)
    : searchFilteredData.filter(post => post.tags?.some(tag => tag.toLowerCase().includes(selectedFilter.toLowerCase())));

  // Sort posts - memoized to prevent re-sorting on every render
  const feedData: FeedPost[] = useMemo(() => {
    return filteredData.sort((a, b) => {
      // Posts with symbols/stockMentions come first
      const aHasSymbols = a.stockMentions && a.stockMentions.length > 0;
      const aHasTicker = a.ticker && a.ticker.length > 0;
      const bHasSymbols = b.stockMentions && b.stockMentions.length > 0;
      const bHasTicker = b.ticker && b.ticker.length > 0;
      
      if ((aHasSymbols || aHasTicker) && !(bHasSymbols || bHasTicker)) return -1;
      if (!(aHasSymbols || aHasTicker) && (bHasSymbols || bHasTicker)) return 1;
      
      // If both have symbols or neither have symbols, sort by creation date (newest first)
      const aDate = new Date(a.timestamp || 0).getTime();
      const bDate = new Date(b.timestamp || 0).getTime();
      return bDate - aDate;
    });
  }, [filteredData]);

  function formatTimestamp(dateStr: string | Date): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    
    // Less than 1 minute
    if (diffInMinutes < 1) return 'now';
    
    // Less than 1 hour - show minutes
    if (diffInHours < 1) return `${Math.floor(diffInMinutes)}m`;
    
    // Less than 24 hours - show hours
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
    
    // Less than 7 days - show days
    if (diffInDays < 7) return `${Math.floor(diffInDays)}d`;
    
    // 7+ days - show full date in DD-MM-YYYY format
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Show skeleton loading only on initial load, not during background fetches
  if (isLoading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-foreground">
        <FeedHeader onAllClick={handleAllClick} isRefreshing={isFetching} selectedFilter={selectedFilter} onFilterChange={handleFilterChange} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch} showAppBar={showAppBar} onBackClick={onBackClick} />
        <div className="max-w-3xl mx-auto px-3 py-3">
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-pulse shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-foreground">
        <FeedHeader onAllClick={handleAllClick} isRefreshing={isFetching} selectedFilter={selectedFilter} onFilterChange={handleFilterChange} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch} showAppBar={showAppBar} onBackClick={onBackClick} />
        <div className="max-w-3xl mx-auto px-3 py-3">
          <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-red-600 dark:text-red-400">Failed to load posts. Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Use feedData directly - don't add mock data
  const defaultFeedData: FeedPost[] = feedData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" ref={containerRef}>
      {/* Back Button - Absolute positioned in top-right corner (Mobile Only) */}
      {onBackClick && (
        <Button
          onClick={onBackClick}
          variant="ghost"
          size="icon"
          className="lg:hidden absolute top-4 right-4 z-50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          data-testid="button-back-to-home-neofeed"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      )}
      
      <FeedHeader 
        onAllClick={handleAllClick} 
        isRefreshing={isFetching} 
        selectedFilter={selectedFilter} 
        onFilterChange={handleFilterChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        showAppBar={showAppBar}
        onBackClick={onBackClick}
      />
      
      {/* Live Banner - Spans full width (Hidden in Profile view) */}
      {selectedFilter !== 'Profile' && (
        <div className="px-4 py-4 max-w-7xl mx-auto">
          <LiveBanner />
        </div>
      )}
      
      {/* Main Content Area with Post Creation Panel on Right */}
      <div className="flex-1 flex gap-2 xl:gap-4 px-2 md:px-3 py-2 md:py-3 max-w-6xl mx-auto">
        {/* Social Feed Posts - Left Side */}
        <div className="flex-1 max-w-4xl">
          {/* Show Profile Header when Profile filter is selected */}
          {selectedFilter === 'Profile' && <ProfileHeader />}
          
          <div className="space-y-3 xl:space-y-6">
            {feedData.map((post) => (
              <PostCard key={post.id} post={post} currentUserUsername={currentUserUsername} />
            ))}
            
            {/* Infinite scroll loader trigger */}
            <div 
              ref={loaderRef}
              className="flex justify-center py-8"
              data-testid="loader-infinite-scroll"
            >
              {(isFetching || (isLoading && posts.length > 0)) && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              )}
            </div>
          </div>
        </div>

        {/* Post Creation Panel - Right Side (Desktop Only) */}
        <div className="hidden md:block w-80 xl:w-96 flex-shrink-0">
          <div className="sticky top-[140px] xl:top-[200px] z-30">
            <PostCreationPanel />
          </div>
        </div>
      </div>

      {/* Profile Setup Dialog - Only shows if user doesn't have username or DOB */}
      <UserIdSetupDialog 
        isOpen={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
        onSuccess={(username) => {
          localStorage.setItem('currentUsername', username);
          setShowProfileDialog(false);
          toast({
            title: "Profile Created!",
            description: "You can now post and interact on the social feed.",
          });
          // Reload page to update profile dropdown with new username
          setTimeout(() => window.location.reload(), 500);
        }}
      />

      {/* Mobile Create Post Dialog - Only shows on mobile when + button is tapped */}
      <Dialog open={showMobileCreatePost} onOpenChange={setShowMobileCreatePost}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto p-0">
          <div className="p-4">
            <PostCreationPanel hideAudioMode={true} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Audio Minicast Dialog - Only shows on mobile when Radio button is tapped */}
      <Dialog open={showMobileAudioMinicast} onOpenChange={setShowMobileAudioMinicast}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
          <PostCreationPanel 
            initialViewMode="audio" 
            onMinimize={() => setShowMobileAudioMinicast(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Mobile Messages Dialog - Only shows on mobile when Messages button is tapped */}
      <Dialog open={showMobileMessages} onOpenChange={setShowMobileMessages}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto p-0">
          <div className="p-4">
            <PostCreationPanel initialViewMode="message" hideAudioMode={true} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Selected Posts Preview - Always visible when posts are selected, independent of bottom nav */}
      <div className="md:hidden">
        <AudioSelectedPostsPreview
          snippets={selectedTextSnippets}
          onTap={() => setShowMobileAudioMinicast(true)}
        />
      </div>

      {/* Bottom Navigation Bar - Mobile Only (Hides on scroll) */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 pb-4 px-6 pointer-events-none transition-all duration-300 ${
        showBottomNav ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}>
        <div className="max-w-xs mx-auto backdrop-blur-md rounded-full shadow-lg pointer-events-auto transition-all duration-300 bg-white/90 dark:bg-gray-900/90 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-around px-1.5 py-1.5">
            {/* Home Icon */}
            <button
              onClick={() => handleFilterChange('All')}
              className="flex items-center justify-center flex-1 rounded-full px-4 py-2 transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              data-testid="button-home-mobile"
            >
              <Home className="h-5 w-5" />
            </button>

            {/* Plus Icon (Create Post) */}
            <button
              onClick={() => setShowMobileCreatePost(true)}
              className="flex items-center justify-center flex-1 rounded-full px-4 py-2 shadow-md transition-all duration-200 bg-gray-900 dark:bg-white text-white dark:text-gray-900"
              data-testid="button-create-mobile"
            >
              <Plus className="h-5 w-5" />
            </button>

            {/* MiniCast Icon - Toggles Audio MiniCast */}
            <button
              onClick={() => setShowMobileAudioMinicast(!showMobileAudioMinicast)}
              className={`flex items-center justify-center flex-1 rounded-full px-4 py-2 transition-all duration-200 ${
                showMobileAudioMinicast 
                  ? 'text-purple-600 dark:text-purple-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              data-testid="button-minicast-mobile"
            >
              <Layers className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add padding to bottom of content to prevent overlap with bottom nav on mobile */}
      <div className="md:hidden h-20"></div>
    </div>
  );
}

// Wrap with AudioModeProvider for audio minicast functionality
export default function NeoFeedSocialFeed({ onBackClick }: { onBackClick?: () => void }) {
  return (
    <AudioModeProvider>
      <NeoFeedSocialFeedComponent onBackClick={onBackClick} />
    </AudioModeProvider>
  );
}