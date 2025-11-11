import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useLocation } from "wouter";
// User provided custom images
import charMinarImage from "@assets/image_1757005261197.png";
import cafeHyderabadImage from "@assets/image_1757005324152.png";
import robotAiImage from "@assets/image_1757005353281.png";
import bullBearImage from "@assets/image_1757005432581.png";
import { AuthButton } from "@/components/auth-button";
import { ConnectionStatus } from "@/components/connection-status";
import { MonthlyProgressTracker } from "@/components/monthly-progress-tracker";
import { SigninDataWindow } from "@/components/signin-data-window";
import { ApiStatistics } from "@/components/api-statistics";
import { ErrorPanel } from "@/components/error-panel";
import { TradingViewWidget } from "@/components/tradingview-widget";
import { AdvancedCandlestickChart } from "@/components/advanced-candlestick-chart";
import { FyersTradingViewChart } from "@/components/fyers-tradingview-chart";
import { EnhancedTradingViewWidget } from "@/components/enhanced-tradingview-widget";
import { FyersTradingViewIntegratedChart } from "@/components/fyers-tradingview-integrated-chart";
import { FyersTradingViewDatafeed } from "@/components/fyers-tradingview-datafeed";
import { TradingViewStyleChart } from "@/components/tradingview-style-chart";
import { MinimalChart } from "@/components/minimal-chart";
import {
  MultipleImageUpload,
  MultipleImageUploadRef,
} from "@/components/multiple-image-upload";
import { IndicatorCrossingsDisplay } from "@/components/indicator-crossings-display";
import { BattuScanSimulation } from "@/components/battu-scan-simulation";
import { FourCandleRuleScanner } from "@/components/four-candle-rule-scanner";
import { StockNewsSearch } from "@/components/stock-news-search";
import NeoFeedSocialFeed from "@/components/neofeed-social-feed";
import SimpleCompleteScanner from "@/components/simple-complete-scanner";
import { BattuDocumentationDisplay } from "@/components/battu-documentation-display";
import { StrategyBuilder } from "@/components/strategy-builder";
import { TradingMaster } from "@/components/trading-master";
import { WorldMap } from "@/components/world-map";
import { useTheme } from "@/components/theme-provider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { auth } from "@/firebase";
import { signOut } from "firebase/auth";
import { LogOut, ArrowLeft } from "lucide-react";

// Global window type declaration for audio control
declare global {
  interface Window {
    stopNewsAudio?: () => void;
  }
}

import ThreeCycleScanner from "@/components/three-cycle-scanner";
import HistoricalTradeSimulator from "@/components/historical-trade-simulator";
import {
  PriceChangeAnimation,
  TradeExecutionAnimation,
  VolumeSpikeAnimation,
  MarketStatusPulse,
  ProfitLossAnimation,
  CandlestickAnimation,
  MarketDataSkeleton,
} from "@/components/micro-animations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  DollarSign,
  Zap,
  Newspaper,
  Sun,
  Moon,
  GraduationCap,
  Download,
  Mic,
  MessageCircle,
  BookOpen,
  Home as HomeIcon,
  Search,
  Code,
  PenTool,
  Target,
  Grid3X3,
  Send,
  Sparkles,
  Users,
  Upload,
  Timer,
  Edit,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Tag,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Shield,
  Bot,
  User,
  SkipBack,
  SkipForward,
  Heart,
  Lightbulb,
  Star,
  FileText,
  Bell,
  Briefcase,
  PieChart,
  Lock,
  Trophy,
} from "lucide-react";
import { AIChatWindow } from "@/components/ai-chat-window";
import { BrokerImportDialog } from "@/components/broker-import-dialog";
import type { BrokerTrade } from "@shared/schema";

// Type definitions for stock data and trading
interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string | number;
  marketCap: string;
  pe: number;
  high: number;
  low: number;
  open: number;
  sentiment: {
    trend?: string;
    confidence?: string;
    score?: number;
  } | null;
  indicators: {
    rsi?: string;
    ema50?: string;
    macd?: string;
  } | null;
}

interface TradeMarker {
  candleIndex: number;
  price: number;
  type: "buy" | "sell";
  symbol: string;
  quantity: number;
  time: string;
  pnl: string;
}

// SwipeableCardStack Component
interface SwipeableCardStackProps {
  onSectorChange: (sector: string) => void;
  selectedSector: string;
  onCardIndexChange?: (index: number) => void;
  currentCardIndex?: number;
}

function SwipeableCardStack({
  onSectorChange,
  selectedSector,
  onCardIndexChange,
  currentCardIndex = 0,
}: SwipeableCardStackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentContent, setCurrentContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] =
    useState<SpeechSynthesisUtterance | null>(null);

  const [cards, setCards] = useState([
    {
      id: 1,
      title: "TECH NEWS",
      subtitle: "Latest in\ntechnology",
      buttonText: "Read Now",
      gradient: "from-blue-500 to-blue-600",
      buttonColor: "text-blue-600",
      icon: "💻",
      sector: "IT",
    },
    {
      id: 2,
      title: "FINANCE NEWS",
      subtitle: "Market updates\n& trends",
      buttonText: "Listen",
      gradient: "from-green-500 to-green-600",
      buttonColor: "text-green-600",
      icon: "📈",
      sector: "FINANCE",
    },
    {
      id: 3,
      title: "COMMODITY NEWS",
      subtitle: "Commodity\nmarket trends",
      buttonText: "Listen",
      gradient: "from-orange-500 to-orange-600",
      buttonColor: "text-orange-600",
      icon: "🏗️",
      sector: "COMMODITY",
    },
    {
      id: 4,
      title: "GLOBAL NEWS",
      subtitle: "World events\n& updates",
      buttonText: "Listen",
      gradient: "from-purple-500 to-purple-600",
      buttonColor: "text-purple-600",
      icon: "🌍",
      sector: "GLOBAL",
    },
    {
      id: 5,
      title: "BANKING NEWS",
      subtitle: "Banking sector\nupdates",
      buttonText: "Listen",
      gradient: "from-indigo-500 to-indigo-600",
      buttonColor: "text-indigo-600",
      icon: "🏦",
      sector: "BANKS",
    },
    {
      id: 6,
      title: "AUTO NEWS",
      subtitle: "Automotive\nindustry news",
      buttonText: "Listen",
      gradient: "from-red-500 to-red-600",
      buttonColor: "text-red-600",
      icon: "🚗",
      sector: "AUTOMOBILE",
    },
  ]);

  // News cache for faster loading - ultra-short cache for speed
  const newsCache = React.useRef<
    Record<string, { content: string; timestamp: number }>
  >({});
  const CACHE_DURATION = 10 * 1000; // 10 seconds - ultra-short for instant refresh

  // Global cleanup function to stop all audio
  const globalStopAudio = React.useCallback(() => {
    if (currentAudio) {
      speechSynthesis.cancel();
      setCurrentAudio(null);
      setIsPlaying(false);
    }
  }, [currentAudio]);

  // Fetch AI-generated news content for current card with caching
  const fetchAndPlayContent = async (cardTitle: string, sector: string) => {
    // Stop any currently playing audio immediately
    globalStopAudio();

    try {
      setIsLoading(true);

      // Check cache first
      const cacheKey = sector;
      const cachedData = newsCache.current[cacheKey];
      const now = Date.now();

      if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
        // Use cached content
        setCurrentContent(cachedData.content);
        playAudio(cachedData.content);
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/daily-news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sector: sector }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate news content");
      }

      const data = await response.json();
      const content = data.summary;

      // Cache the content
      newsCache.current[cacheKey] = {
        content,
        timestamp: now,
      };

      setCurrentContent(content);
      playAudio(content);
    } catch (error) {
      console.error("Error fetching news:", error);
      const fallbackContent = `${sector.toLowerCase()} market update. Current developments in progress. Trading activity continues.`;
      setCurrentContent(fallbackContent);
      playAudio(fallbackContent);
    } finally {
      setIsLoading(false);
    }
  };

  // Play audio using Speech Synthesis with optimized settings
  const playAudio = (text: string) => {
    // Stop current audio if playing
    if (currentAudio) {
      speechSynthesis.cancel();
    }

    // Clean the text to remove any potential greetings
    const cleanText = text
      .replace(
        /^(good morning|good afternoon|good evening|hello|hi|welcome)/gi,
        ""
      )
      .replace(/^(ladies and gentlemen|dear listeners|in today's news)/gi, "")
      .replace(/^[.,\s]+/, "") // Remove leading punctuation and spaces
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Get available voices and select neutral/direct voices
    const voices = speechSynthesis.getVoices();

    // Prioritize Moira voice specifically, then other natural voices
    const moiraVoice = voices.find(
      (voice) =>
        voice.lang.startsWith("en") &&
        voice.name.toLowerCase().includes("moira")
    );

    const otherNaturalVoices = voices.filter(
      (voice) =>
        voice.lang.startsWith("en") &&
        !voice.name.toLowerCase().includes("moira") &&
        // Other premium female voices that sound very natural
        (voice.name.toLowerCase().includes("samantha") ||
          voice.name.toLowerCase().includes("karen") ||
          voice.name.toLowerCase().includes("susan") ||
          voice.name.toLowerCase().includes("fiona") ||
          voice.name.toLowerCase().includes("serena") ||
          voice.name.toLowerCase().includes("allison") ||
          voice.name.toLowerCase().includes("ava") ||
          voice.name.toLowerCase().includes("claire") ||
          voice.name.toLowerCase().includes("aria") ||
          voice.name.toLowerCase().includes("zira") ||
          voice.name.toLowerCase().includes("hazel") ||
          // Neural/premium indicators
          voice.name.toLowerCase().includes("neural") ||
          voice.name.toLowerCase().includes("premium") ||
          voice.name.toLowerCase().includes("enhanced"))
    );

    // Use Moira first, then other natural voices, then any English voice
    if (moiraVoice) {
      utterance.voice = moiraVoice;
    } else if (otherNaturalVoices.length > 0) {
      utterance.voice = otherNaturalVoices[0];
    } else {
      const englishVoices = voices.filter(
        (voice) =>
          voice.lang.startsWith("en") &&
          !voice.name.toLowerCase().includes("novelty")
      );
      if (englishVoices.length > 0) {
        utterance.voice = englishVoices[0];
      }
    }

    // Settings for natural, human-like delivery
    utterance.rate = 0.9; // Slightly slower for more natural pacing
    utterance.pitch = 1.05; // Slight variation for more natural sound
    utterance.volume = 0.85; // Comfortable listening volume

    // Set language for neutral pronunciation
    utterance.lang = "en-US";

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentAudio(null);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setCurrentAudio(null);
    };

    setCurrentAudio(utterance);
    speechSynthesis.speak(utterance);
  };

  // Stop audio playback
  const stopAudio = () => {
    if (currentAudio) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentAudio(null);
    }
  };

  const swipeCard = (direction: "left" | "right") => {
    // Immediately stop current audio
    globalStopAudio();

    setCards((prev) => {
      const newCards = [...prev];
      let newIndex = currentCardIndex;

      if (direction === "right") {
        // Right swipe: Move to next card (current card goes to back)
        const topCard = newCards.shift();
        if (topCard) {
          newCards.push(topCard);
        }
        newIndex = (currentCardIndex + 1) % 7;
      } else {
        // Left swipe: Move to previous card (bottom card comes to front)
        const bottomCard = newCards.pop();
        if (bottomCard) {
          newCards.unshift(bottomCard);
        }
        newIndex = (currentCardIndex - 1 + 7) % 7;
      }

      // Notify parent of index change
      if (onCardIndexChange) {
        onCardIndexChange(newIndex);
      }

      // Auto-play content for the new front card (faster response)
      if (newCards.length > 0) {
        const frontCard = newCards[0];
        setTimeout(() => {
          fetchAndPlayContent(frontCard.title, frontCard.sector);
        }, 100); // Reduced delay for faster response
      }

      return newCards;
    });
  };

  // Expose global stop function to window for tab switching
  React.useEffect(() => {
    window.stopNewsAudio = globalStopAudio;

    return () => {
      delete window.stopNewsAudio;
    };
  }, [globalStopAudio]);

  // Add window focus/blur detection to stop voice when clicking away
  React.useEffect(() => {
    const handleWindowBlur = () => {
      // Stop audio when user clicks away from the window
      globalStopAudio();
    };

    const handleVisibilityChange = () => {
      // Stop audio when tab becomes hidden
      if (document.hidden) {
        globalStopAudio();
      }
    };

    // Listen for window losing focus
    window.addEventListener("blur", handleWindowBlur);
    // Listen for tab visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [globalStopAudio]);

  // Load voices on component mount
  React.useEffect(() => {
    // Ensure voices are loaded
    const loadVoices = () => {
      speechSynthesis.getVoices();
    };

    // Load voices immediately and on voiceschanged event
    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);

    // Cleanup on unmount
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      globalStopAudio(); // Stop any playing audio when component unmounts
    };
  }, [globalStopAudio]);

  // Voice functionality is now only triggered by manual clicks

  return (
    <div className="relative w-80 h-64">
      {cards.map((card, index) => {
        const isTop = index === 0;
        const isSecond = index === 1;
        const isThird = index === 2;

        return (
          <div
            key={card.id}
            data-card-index={index}
            className={`absolute inset-0 transition-all duration-300 ease-out cursor-grab active:cursor-grabbing ${
              isTop
                ? "z-40 scale-100 rotate-0"
                : isSecond
                ? "z-30 scale-95 rotate-1 translate-y-2"
                : isThird
                ? "z-20 scale-90 rotate-2 translate-y-4"
                : "z-10 scale-85 rotate-3 translate-y-6 opacity-50"
            }`}
            onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
              if (!isTop) return;

              const startX = e.clientX;
              const startY = e.clientY;
              const cardElement = e.currentTarget as HTMLElement;
              let isDragging = false;

              const handleMouseMove = (e: MouseEvent) => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                if (
                  !isDragging &&
                  (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)
                ) {
                  isDragging = true;
                }

                if (isDragging) {
                  const rotation = deltaX * 0.1;
                  cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
                  cardElement.style.opacity = String(
                    Math.max(0.3, 1 - Math.abs(deltaX) / 300)
                  );
                }
              };

              const handleMouseUp = (e: MouseEvent) => {
                if (isDragging) {
                  const deltaX = e.clientX - startX;
                  if (Math.abs(deltaX) > 100) {
                    // Determine swipe direction
                    const swipeDirection = deltaX > 0 ? "right" : "left";

                    if (swipeDirection === "right") {
                      // Right swipe: Card moves away animation
                      const direction = "150%";
                      const rotation = "30deg";
                      cardElement.style.transform = `translate(${direction}, ${
                        deltaX * 0.5
                      }px) rotate(${rotation})`;
                      cardElement.style.opacity = "0";

                      setTimeout(() => {
                        cardElement.style.transform = "";
                        cardElement.style.opacity = "";
                        swipeCard(swipeDirection);
                      }, 300);
                    } else {
                      // Left swipe: Previous card slides in from left (reverse animation)
                      cardElement.style.transform = "";
                      cardElement.style.opacity = "";

                      // Change the card order first
                      swipeCard(swipeDirection);

                      // Then animate the new top card sliding in from the right (coming back)
                      setTimeout(() => {
                        const newTopCard =
                          cardElement.parentElement?.querySelector(
                            '[data-card-index="0"]'
                          ) as HTMLElement;
                        if (newTopCard) {
                          // Start from right side with rotation (like it's coming back)
                          newTopCard.style.transform =
                            "translate(150%, 0) rotate(30deg)";
                          newTopCard.style.opacity = "0";

                          // Animate to center
                          setTimeout(() => {
                            newTopCard.style.transform = "";
                            newTopCard.style.opacity = "";
                            newTopCard.style.transition =
                              "transform 300ms ease-out, opacity 300ms ease-out";

                            // Clear transition after animation
                            setTimeout(() => {
                              newTopCard.style.transition = "";
                            }, 300);
                          }, 10);
                        }
                      }, 10);
                    }
                  } else {
                    // Snap back to center
                    cardElement.style.transform = "";
                    cardElement.style.opacity = "";
                  }
                }

                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };

              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
            onTouchStart={(e: React.TouchEvent<HTMLDivElement>) => {
              if (!isTop) return;

              const startX = e.touches[0].clientX;
              const startY = e.touches[0].clientY;
              const cardElement = e.currentTarget as HTMLElement;
              let isDragging = false;

              const handleTouchMove = (e: TouchEvent) => {
                const deltaX = e.touches[0].clientX - startX;
                const deltaY = e.touches[0].clientY - startY;

                if (
                  !isDragging &&
                  (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)
                ) {
                  isDragging = true;
                }

                if (isDragging) {
                  e.preventDefault();
                  const rotation = deltaX * 0.1;
                  cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
                  cardElement.style.opacity = String(
                    Math.max(0.3, 1 - Math.abs(deltaX) / 300)
                  );
                }
              };

              const handleTouchEnd = (e: TouchEvent) => {
                if (isDragging) {
                  const deltaX = e.changedTouches[0].clientX - startX;
                  if (Math.abs(deltaX) > 100) {
                    // Determine swipe direction
                    const swipeDirection = deltaX > 0 ? "right" : "left";

                    if (swipeDirection === "right") {
                      // Right swipe: Card moves away animation
                      const direction = "150%";
                      const rotation = "30deg";
                      cardElement.style.transform = `translate(${direction}, ${
                        deltaX * 0.5
                      }px) rotate(${rotation})`;
                      cardElement.style.opacity = "0";

                      setTimeout(() => {
                        cardElement.style.transform = "";
                        cardElement.style.opacity = "";
                        swipeCard(swipeDirection);
                      }, 300);
                    } else {
                      // Left swipe: Previous card slides in from left (reverse animation)
                      cardElement.style.transform = "";
                      cardElement.style.opacity = "";

                      // Change the card order first
                      swipeCard(swipeDirection);

                      // Then animate the new top card sliding in from the right (coming back)
                      setTimeout(() => {
                        const newTopCard =
                          cardElement.parentElement?.querySelector(
                            '[data-card-index="0"]'
                          ) as HTMLElement;
                        if (newTopCard) {
                          // Start from right side with rotation (like it's coming back)
                          newTopCard.style.transform =
                            "translate(150%, 0) rotate(30deg)";
                          newTopCard.style.opacity = "0";

                          // Animate to center
                          setTimeout(() => {
                            newTopCard.style.transform = "";
                            newTopCard.style.opacity = "";
                            newTopCard.style.transition =
                              "transform 300ms ease-out, opacity 300ms ease-out";

                            // Clear transition after animation
                            setTimeout(() => {
                              newTopCard.style.transition = "";
                            }, 300);
                          }, 10);
                        }
                      }, 10);
                    }
                  } else {
                    // Snap back to center
                    cardElement.style.transform = "";
                    cardElement.style.opacity = "";
                  }
                }

                document.removeEventListener("touchmove", handleTouchMove);
                document.removeEventListener("touchend", handleTouchEnd);
              };

              document.addEventListener("touchmove", handleTouchMove, { passive: false });
              document.addEventListener("touchend", handleTouchEnd);
            }}
            onClick={() => {
              if (isTop) {
                console.log(`Clicked on ${card.title}`);
                onSectorChange(card.sector);
              }
            }}
          >
            <div
              className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-6 h-full relative overflow-hidden shadow-xl border-2 border-white/10`}
            >
              {/* Character illustration area */}
              <div className="absolute bottom-0 right-0 w-32 h-32 opacity-30">
                <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/10 rounded-full"></div>
              </div>

              {/* Card content */}
              <div className="relative z-10">
                <div className="text-xs text-white/80 mb-2 uppercase tracking-wide font-medium">
                  {card.title}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 leading-tight">
                  {card.subtitle.split("\n").map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </h3>
                <Button
                  className={`bg-white ${card.buttonColor} hover:bg-gray-100 px-6 py-2 rounded-full text-sm font-medium shadow-lg`}
                  onClick={() => {
                    if (isTop) {
                      if (isPlaying) {
                        stopAudio();
                      } else {
                        fetchAndPlayContent(card.title, card.sector);
                      }
                    }
                  }}
                  disabled={isLoading && isTop}
                >
                  <div className="flex items-center gap-2">
                    {isTop && isLoading ? (
                      <RotateCcw className="w-4 h-4 animate-spin" />
                    ) : isTop && isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>
                      {isTop && isLoading
                        ? "Generating..."
                        : isTop && isPlaying
                        ? "Pause"
                        : card.buttonText}
                    </span>
                  </div>
                </Button>
              </div>

              {/* Icon */}
              <div className="absolute top-4 right-4 text-2xl filter drop-shadow-lg">
                {card.icon}
              </div>

              {/* Stack indicator for non-top cards */}
              {!isTop && (
                <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
              )}
            </div>
          </div>
        );
      })}

    </div>
  );
}
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

function NiftyIndex() {
  const {
    data: marketData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/market-data"],
    refetchInterval: 3000, // Refresh every 3 seconds for live data
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            NIFTY 50 Index
          </CardTitle>
          <CardDescription>Live market data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            NIFTY 50 Index
          </CardTitle>
          <CardDescription>Live market data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error loading data</div>
        </CardContent>
      </Card>
    );
  }

  // Find NIFTY50 data from the response
  const niftyData = Array.isArray(marketData)
    ? marketData.find((item: any) => item.symbol === "NIFTY50")
    : null;

  if (!niftyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            NIFTY 50 Index
          </CardTitle>
          <CardDescription>Live market data</CardDescription>
        </CardHeader>
        <CardContent>
          <div>NIFTY data not available</div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = niftyData.change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = isPositive ? "text-green-600" : "text-red-600";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {niftyData.name}
        </CardTitle>
        <CardDescription>Live streaming data from NSE</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">
              {niftyData.ltp?.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) || "N/A"}
            </div>
            <div className="text-sm text-gray-500">Last Traded Price</div>
          </div>
          <div className={`text-right ${trendColor}`}>
            <div className="flex items-center justify-end gap-1">
              <TrendIcon className="h-4 w-4" />
              <span className="text-lg font-semibold">
                {isPositive ? "+" : ""}
                {niftyData.change?.toFixed(2) || "N/A"}
              </span>
            </div>
            <div className="text-sm">
              ({isPositive ? "+" : ""}
              {niftyData.changePercent?.toFixed(2) || "N/A"}%)
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="text-xs text-gray-500">
            Last Updated: {new Date(niftyData.lastUpdate).toLocaleTimeString()}
          </div>
          <div className="text-xs text-gray-500">Code: {niftyData.code}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface HistoricalDataResponse {
  symbol: string;
  resolution: string;
  range_from: string;
  range_to: string;
  candles: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

function HistoricalDataSection() {
  // Set default dates to a few days ago to ensure data availability (avoid weekends/holidays)
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() - 3); // Go back 3 days to avoid weekend issues
  const [fromDate, setFromDate] = useState(format(defaultDate, "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(defaultDate, "yyyy-MM-dd"));
  const [timeframe, setTimeframe] = useState("1");
  const [selectedSymbol, setSelectedSymbol] = useState("NSE:INFY-EQ");
  const [sentimentAnalysis, setSentimentAnalysis] = useState<any[]>([]);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);
  const queryClient = useQueryClient();

  const { data: historicalData } = useQuery<HistoricalDataResponse>({
    queryKey: [
      "/api/historical-data",
      selectedSymbol,
      fromDate,
      toDate,
      timeframe,
    ],
    enabled: true, // Enable automatic fetching
  });

  const fetchHistoricalData = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/historical-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: selectedSymbol,
          resolution: timeframe,
          range_from: fromDate,
          range_to: toDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch historical data");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["/api/historical-data", selectedSymbol, fromDate, toDate, timeframe],
        data
      );
    },
  });

  const handleFetchData = () => {
    fetchHistoricalData.mutate();
  };

  const analyzeSentiment = async (candles: any[], symbol: string) => {
    if (!candles || candles.length === 0) return;

    setIsAnalyzingSentiment(true);
    try {
      const response = await fetch("/api/sentiment-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candles,
          symbol,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSentimentAnalysis(data.sentiment || []);
      } else {
        console.error("Failed to analyze sentiment");
        setSentimentAnalysis([]);
      }
    } catch (error) {
      console.error("Sentiment analysis error:", error);
      setSentimentAnalysis([]);
    } finally {
      setIsAnalyzingSentiment(false);
    }
  };

  // Auto-analyze sentiment when historical data changes
  React.useEffect(() => {
    if (historicalData?.candles && historicalData.candles.length > 0) {
      analyzeSentiment(historicalData.candles, selectedSymbol);
    }
  }, [historicalData, selectedSymbol]);

  const handleExportToExcel = () => {
    if (
      !historicalData ||
      !historicalData.candles ||
      historicalData.candles.length === 0
    ) {
      return;
    }

    // Prepare CSV content with sentiment data
    const headers = [
      "Date",
      "Time",
      "Open",
      "High",
      "Low",
      "Close",
      "Volume",
      "Sentiment_Signal",
      "Sentiment_Score",
      "Confidence",
    ];
    const csvContent = [
      headers.join(","),
      ...historicalData.candles.map((candle, index) => {
        const date = new Date(candle.timestamp * 1000);
        const dateStr = format(date, "d/M/yyyy");
        const timeStr = format(date, "HH:mm:ss");
        const sentiment = sentimentAnalysis[index];
        return [
          dateStr,
          timeStr,
          candle.open.toFixed(2),
          candle.high.toFixed(2),
          candle.low.toFixed(2),
          candle.close.toFixed(2),
          candle.volume.toString(),
          sentiment?.signal || "N/A",
          sentiment?.score?.toFixed(2) || "N/A",
          sentiment?.confidence?.toFixed(0) || "N/A",
        ].join(",");
      }),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);

    // Generate filename with symbol, timeframe, and date range
    const symbolName = (selectedSymbol || "UNKNOWN")
      .replace("NSE:", "")
      .replace("-EQ", "")
      .replace("-INDEX", "");
    const timeframeName = timeframe === "1" ? "1min" : `${timeframe}min`;
    const dateRange =
      fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
    const filename = `${symbolName}_${timeframeName}_${dateRange}_OHLC.csv`;

    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Historical OHLC Data
        </CardTitle>
        <CardDescription>
          Custom date range, symbol, and timeframe selection with real-time
          Fyers API data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date, Symbol, and Timeframe Selection */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from-date">From Date</Label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to-date">To Date</Label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol</Label>
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger>
                <SelectValue placeholder="Select symbol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NSE:NIFTY50-INDEX">NIFTY 50</SelectItem>
                <SelectItem value="NSE:INFY-EQ">INFOSYS</SelectItem>
                <SelectItem value="NSE:RELIANCE-EQ">RELIANCE</SelectItem>
                <SelectItem value="NSE:TCS-EQ">TCS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeframe">Timeframe</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Minute</SelectItem>
                <SelectItem value="5">5 Minutes</SelectItem>
                <SelectItem value="10">10 Minutes</SelectItem>
                <SelectItem value="15">15 Minutes</SelectItem>
                <SelectItem value="20">20 Minutes</SelectItem>
                <SelectItem value="30">30 Minutes</SelectItem>
                <SelectItem value="40">40 Minutes</SelectItem>
                <SelectItem value="60">1 Hour</SelectItem>
                <SelectItem value="80">80 Minutes</SelectItem>
                <SelectItem value="120">2 Hours</SelectItem>
                <SelectItem value="160">160 Minutes</SelectItem>
                <SelectItem value="240">4 Hours</SelectItem>
                <SelectItem value="320">320 Minutes</SelectItem>
                <SelectItem value="480">8 Hours</SelectItem>
                <SelectItem value="960">16 Hours</SelectItem>
                <SelectItem value="1D">1 Day</SelectItem>
                <SelectItem value="2D">2 Days</SelectItem>
                <SelectItem value="4D">4 Days</SelectItem>
                <SelectItem value="8D">8 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <div className="flex gap-2">
              <Button
                onClick={handleFetchData}
                disabled={fetchHistoricalData.isPending}
                className="flex-1"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {fetchHistoricalData.isPending ? "Fetching..." : "Fetch Data"}
              </Button>
              <Button
                onClick={handleExportToExcel}
                disabled={
                  !historicalData || historicalData.candles.length === 0
                }
                variant="outline"
                size="default"
                className="px-3"
                title="Export OHLC data to Excel"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Display */}
        {fetchHistoricalData.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="bg-red-100 rounded-full p-1">
                <svg
                  className="h-5 w-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-red-800 font-medium">
                  Fyers API Temporary Service Issue
                </h3>
                <div className="text-red-700 text-sm mt-1 space-y-2">
                  <p>
                    <strong>Current Status:</strong> Fyers API is experiencing
                    intermittent service issues with historical data endpoints.
                    Live market data continues working perfectly.
                  </p>
                  <div className="bg-green-100 p-3 rounded border-l-4 border-green-400">
                    <p className="font-medium text-green-800">
                      What's Still Working:
                    </p>
                    <ul className="mt-1 space-y-1 text-xs text-green-700">
                      <li>
                        • <strong>Live Market Data:</strong> Real-time prices
                        streaming every 3 seconds (Dashboard tab)
                      </li>
                      <li>
                        • <strong>Chart Tab:</strong> Professional interactive
                        candlestick chart with zoom controls
                      </li>
                      <li>
                        • <strong>Pattern Analysis:</strong> All 14 Battu API
                        endpoints for technical analysis
                      </li>
                      <li>
                        • <strong>Previously Successful:</strong> CB Tab fetched
                        375 candles earlier before API maintenance
                      </li>
                    </ul>
                  </div>
                  <div className="bg-blue-100 p-3 rounded border-l-4 border-blue-400">
                    <p className="font-medium text-blue-800">
                      Alternative Solutions:
                    </p>
                    <ul className="mt-1 space-y-1 text-xs text-blue-700">
                      <li>
                        • <strong>Use Chart Tab:</strong> Interactive
                        candlestick chart may have different data endpoints
                      </li>
                      <li>
                        • <strong>Try Later:</strong> API maintenance typically
                        resolves within 30-60 minutes
                      </li>
                      <li>
                        • <strong>Different Dates:</strong> Try various past
                        trading days as availability varies
                      </li>
                      <li>
                        • <strong>Monitor Dashboard:</strong> Live streaming
                        data remains fully functional
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {historicalData && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
              <div className="flex items-center space-x-2">
                <div className="bg-green-100 rounded-full p-1">
                  <svg
                    className="h-4 w-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-green-800 font-medium">
                  ✅ Fyers API Successfully Connected & Data Loaded!
                </div>
              </div>
              <div className="text-green-700 text-sm mt-1">
                Real-time historical OHLC data fetched successfully from Fyers
                API v3.0.0
              </div>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                OHLC Data ({historicalData?.candles?.length || 0} candles) - CB
                Tab
              </h3>
              <div className="text-sm text-gray-500 space-y-1">
                <div>
                  {fromDate} to {toDate} | {timeframe} minute timeframe
                </div>
                <div className="text-xs">
                  Total Candles: {historicalData?.candles?.length || 0}
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                    <TableHead className="text-right">High</TableHead>
                    <TableHead className="text-right">Low</TableHead>
                    <TableHead className="text-right">Close</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead className="text-center">Sentiment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicalData?.candles?.map((candle, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {new Date(candle.timestamp * 1000).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {candle.open.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {candle.high.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {candle.low.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {candle.close.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {candle.volume.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {isAnalyzingSentiment &&
                        index < sentimentAnalysis.length ? (
                          <div className="flex items-center justify-center space-x-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            <span className="text-xs text-gray-500">
                              Analyzing...
                            </span>
                          </div>
                        ) : sentimentAnalysis[index] ? (
                          <div className="space-y-1">
                            <div
                              className={`text-xs font-semibold px-2 py-1 rounded ${
                                sentimentAnalysis[index].signal === "BUY"
                                  ? "bg-green-100 text-green-800"
                                  : sentimentAnalysis[index].signal === "SELL"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {sentimentAnalysis[index].signal}
                            </div>
                            <div className="text-xs text-gray-600">
                              {sentimentAnalysis[index].confidence}%
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div
                                className={`h-1 rounded-full ${
                                  sentimentAnalysis[index].score > 0
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                                style={{
                                  width: `${
                                    Math.abs(sentimentAnalysis[index].score) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!historicalData?.candles ||
                    historicalData.candles.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-gray-500"
                      >
                        <div className="space-y-2">
                          <div>No historical data available</div>
                          <div className="text-sm">
                            Historical data access may require specific API
                            permissions or market hours. Use the "Fetch Data"
                            button above to attempt loading data.
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MicroAnimationsDemoPage() {
  const [demoPrice, setDemoPrice] = useState(1552.5);
  const [prevPrice, setPrevPrice] = useState(1552.5);
  const [isExecuting, setIsExecuting] = useState(false);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [volume, setVolume] = useState(1000000);
  const [isLive, setIsLive] = useState(true);
  const [profitLoss, setProfitLoss] = useState(0);
  const [showCandleAnimation, setShowCandleAnimation] = useState(false);

  // Demo candle data
  const demoCandleData = {
    open: 1580.0,
    high: 1585.5,
    low: 1548.2,
    close: 1552.5,
  };

  const updatePrice = (direction: "up" | "down") => {
    setPrevPrice(demoPrice);
    const change =
      direction === "up" ? Math.random() * 5 + 1 : -(Math.random() * 5 + 1);
    setDemoPrice((prev) => Math.max(prev + change, 1500));
  };

  const simulateTradeExecution = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      const change =
        tradeType === "buy"
          ? Math.random() * 10 + 5
          : -(Math.random() * 10 + 5);
      setProfitLoss(change);
    }, 3000);
  };

  const simulateVolumeSpike = () => {
    setVolume((prev) => prev * (1.5 + Math.random()));
    setTimeout(() => setVolume(1000000), 3000);
  };

  const toggleMarketStatus = () => {
    setIsLive(!isLive);
  };

  const triggerCandleAnimation = () => {
    setShowCandleAnimation(false);
    setTimeout(() => setShowCandleAnimation(true), 100);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Micro-Animations for Trading Interface
          </CardTitle>
          <CardDescription>
            Interactive demos showcasing smooth animations for trade execution
            and market movements
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Price Change Animation */}
        <Card>
          <CardHeader>
            <CardTitle>Price Change Animation</CardTitle>
            <CardDescription>
              Live price updates with directional indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <PriceChangeAnimation
                value={demoPrice}
                previousValue={prevPrice}
                className="text-lg"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => updatePrice("up")} className="flex-1">
                <TrendingUp className="h-4 w-4 mr-2" />
                Price Up
              </Button>
              <Button
                onClick={() => updatePrice("down")}
                variant="outline"
                className="flex-1"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Price Down
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trade Execution Animation */}
        <Card>
          <CardHeader>
            <CardTitle>Trade Execution Animation</CardTitle>
            <CardDescription>
              Order execution feedback with loading states
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={() => setTradeType("buy")}
                  variant={tradeType === "buy" ? "default" : "outline"}
                  size="sm"
                >
                  Buy
                </Button>
                <Button
                  onClick={() => setTradeType("sell")}
                  variant={tradeType === "sell" ? "default" : "outline"}
                  size="sm"
                >
                  Sell
                </Button>
              </div>
              <Button
                onClick={simulateTradeExecution}
                disabled={isExecuting}
                className="w-full"
              >
                {isExecuting ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute {tradeType.toUpperCase()} Order
                  </>
                )}
              </Button>
            </div>
            <TradeExecutionAnimation
              isExecuting={isExecuting}
              tradeType={tradeType}
              amount="100"
              symbol="INFY"
            />
          </CardContent>
        </Card>

        {/* Volume Spike Animation */}
        <Card>
          <CardHeader>
            <CardTitle>Volume Spike Animation</CardTitle>
            <CardDescription>
              Animated volume alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <VolumeSpikeAnimation
                volume={volume}
                averageVolume={1000000}
                className="text-sm"
              />
            </div>
            <Button onClick={simulateVolumeSpike} className="w-full">
              <Zap className="h-4 w-4 mr-2" />
              Trigger Volume Spike
            </Button>
          </CardContent>
        </Card>

        {/* Market Status Pulse */}
        <Card>
          <CardHeader>
            <CardTitle>Market Status Animation</CardTitle>
            <CardDescription>
              Live market status with pulsing indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <MarketStatusPulse isLive={isLive} />
            </div>
            <Button onClick={toggleMarketStatus} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Toggle Market Status
            </Button>
          </CardContent>
        </Card>

        {/* Profit/Loss Animation */}
        <Card>
          <CardHeader>
            <CardTitle>Profit/Loss Animation</CardTitle>
            <CardDescription>
              Animated P&L with color transitions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <ProfitLossAnimation
                value={profitLoss}
                showCurrency={true}
                className="text-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setProfitLoss(Math.random() * 100 + 10)}
                size="sm"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Profit
              </Button>
              <Button
                onClick={() => setProfitLoss(-(Math.random() * 100 + 10))}
                variant="outline"
                size="sm"
              >
                <TrendingDown className="h-3 w-3 mr-1" />
                Loss
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Candlestick Animation */}
        <Card>
          <CardHeader>
            <CardTitle>Candlestick Formation</CardTitle>
            <CardDescription>Animated candle drawing process</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              {showCandleAnimation && (
                <CandlestickAnimation candle={demoCandleData} duration={2000} />
              )}
            </div>
            <Button onClick={triggerCandleAnimation} className="w-full">
              <BarChart3 className="h-4 w-4 mr-2" />
              Animate Candle Formation
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Loading Skeleton Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Market Data Loading Animation</CardTitle>
          <CardDescription>
            Skeleton loading states for market data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <MarketDataSkeleton />
            <MarketDataSkeleton />
            <MarketDataSkeleton />
          </div>
        </CardContent>
      </Card>

      {/* Integration Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Live Market Data with Animations</CardTitle>
          <CardDescription>
            Real INFY data enhanced with micro-animations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Live Price</Label>
              <PriceChangeAnimation
                value={1552.5}
                previousValue={1574.5}
                className="p-3 border rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label>P&L Today</Label>
              <ProfitLossAnimation
                value={-22.0}
                showCurrency={true}
                className="p-3 border rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Market Status</Label>
              <div className="p-3 border rounded-lg bg-white dark:bg-gray-700">
                <MarketStatusPulse isLive={false} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Home() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("trading-home");
  const [showTutorOverlay, setShowTutorOverlay] = useState(false);
  const [swipeStartY, setSwipeStartY] = useState(0);
  const [swipeCurrentY, setSwipeCurrentY] = useState(0);
  const [isSwipingUp, setIsSwipingUp] = useState(false);
  const [showBattuAI, setShowBattuAI] = useState(false);
  const [showJournalAI, setShowJournalAI] = useState(false);
  const [journalAIData, setJournalAIData] = useState<any>(null);
  const [statisticsTab, setStatisticsTab] = useState("overview");
  // Shared timeframe state for chart and crossings display
  const [chartTimeframe, setChartTimeframe] = useState<string>("1");
  // Navigation menu state
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  // Get current user data from Firebase
  const { currentUser } = useCurrentUser();

  // AI Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Trending podcasts state
  const [selectedSector, setSelectedSector] = useState<string>("FINANCE");
  const [trendingPodcasts, setTrendingPodcasts] = useState<any[]>([]);
  const [isPodcastsLoading, setIsPodcastsLoading] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState<any>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);

  // Passcode protection state
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [authenticatedTabs, setAuthenticatedTabs] = useState<Set<string>>(
    new Set()
  );
  const [pendingTab, setPendingTab] = useState<string>("");

  // Passcode verification functions
  const protectedTabs = [
    "trading-home",
    "stock-news",
    "insights",
    "dashboard",
    "backtest",
  ]; // Protected tabs

  const handleTabClick = (tabName: string) => {
    if (protectedTabs.includes(tabName) && !authenticatedTabs.has(tabName)) {
      setPendingTab(tabName);
      setShowPasscodeModal(true);
    } else {
      setActiveTab(tabName);
    }
  };

  const handlePasscodeSubmit = () => {
    if (passcodeInput === "1302") {
      const newAuthenticatedTabs = new Set(authenticatedTabs);
      newAuthenticatedTabs.add(pendingTab);
      setAuthenticatedTabs(newAuthenticatedTabs);
      setActiveTab(pendingTab);
      setShowPasscodeModal(false);
      setPasscodeInput("");
      setPendingTab("");
    } else {
      // Reset on wrong passcode
      setPasscodeInput("");
    }
  };

  const handlePasscodeCancel = () => {
    setShowPasscodeModal(false);
    setPasscodeInput("");
    setPendingTab("");
  };

  // AI Finance Assistant Logic - Real data fetching and analysis
  const fetchRealStockData = async (
    symbol: string
  ): Promise<StockData | null> => {
    try {
      console.log(`🤖 AI Search fetching real data for ${symbol}...`);
      const response = await fetch(`/api/stock-analysis/${symbol}`);
      const data = await response.json();

      if (data && data.priceData) {
        console.log(
          `✅ AI Search got real data for ${symbol}:`,
          data.priceData
        );
        return {
          symbol: symbol,
          price: data.priceData.close || data.priceData.price || 0,
          change: (data.priceData.close || 0) - (data.priceData.open || 0),
          changePercent: data.sentiment?.score
            ? ((data.priceData.close - data.priceData.open) /
                data.priceData.open) *
              100
            : 0,
          volume: data.priceData.volume || "N/A",
          marketCap: data.valuation?.marketCap || "N/A",
          pe: data.valuation?.peRatio || 0,
          high: data.priceData.high || 0,
          low: data.priceData.low || 0,
          open: data.priceData.open || 0,
          sentiment: data.sentiment || null,
          indicators: data.indicators || null,
        };
      }
      return null;
    } catch (error) {
      console.error(`❌ AI Search failed to fetch data for ${symbol}:`, error);
      return null;
    }
  };

  // Optimized unified search with caching and performance improvements
  const handleSearch = async (queryOverride?: string) => {
    const query = queryOverride || searchQuery;
    if (!query.trim()) return;

    // Prevent concurrent searches
    if (isSearchLoading) return;

    setIsSearchLoading(true);

    try {
      const message = query.toLowerCase();
      const stockSymbols = [
        "reliance",
        "tcs",
        "infy",
        "infosys",
        "hdfcbank",
        "icicibank",
        "bhartiartl",
        "itc",
        "nifty",
        "banknifty",
        "sbin",
        "adaniports",
        "asianpaint",
        "bajfinance",
        "wipro",
        "techm",
      ];
      const mentionedStock = stockSymbols.find((stock) =>
        message.includes(stock)
      );

      // USE ADVANCED QUERY PROCESSOR FOR ALL QUERIES - Like Replit Agent
      // This handles ANY question with web search + intelligent analysis
      console.log("🤖 [FRONTEND] Triggering Advanced AI Query Processor (Web Search Enabled)...");
      
      try {
        console.log("📊 [FRONTEND] Fetching trading journal data...");
        let journalTrades: any[] = [];
        try {
          const journalResponse = await fetch("/api/journal/all-dates");
          if (journalResponse.ok) {
            const allJournalData = await journalResponse.json();
            // Flatten all trades from all dates
            Object.entries(allJournalData).forEach(([date, data]: [string, any]) => {
              if (data.tradeHistory && Array.isArray(data.tradeHistory)) {
                journalTrades.push(...data.tradeHistory.map((trade: any) => ({
                  ...trade,
                  date
                })));
              }
            });
            console.log(`✅ [FRONTEND] Loaded ${journalTrades.length} trades from journal`);
          }
        } catch (journalError) {
          console.warn("⚠️ [FRONTEND] Could not load journal data:", journalError);
        }
        
        const response = await fetch("/api/advanced-query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: query,
            journalTrades: journalTrades
          }),
        });

        if (response.ok) {
          const data = await response.json();
          
          let result = data.answer;
          
          // Add web sources if available
          if (data.sources && data.sources.length > 0) {
            result += `\n\n## 🔗 Web Sources\n\n`;
            data.sources.forEach((source: any, index: number) => {
              result += `${index + 1}. [${source.title}](${source.url})\n`;
            });
          }
          
          setSearchResults(result);
          console.log("✅ [FRONTEND] Advanced query processing complete!");
          setIsSearchLoading(false);
          return;
        } else {
          console.error("❌ [FRONTEND] Advanced query failed:", response.statusText);
          // Fall through to other handlers
        }
      } catch (error) {
        console.error("❌ [FRONTEND] Advanced query error:", error);
        // Fall through to other handlers
      }

      // Technical Indicator Search (RSI, EMA, MACD, etc.)
      if (
        message.includes("rsi") ||
        message.includes("ema") ||
        message.includes("macd") ||
        message.includes("bollinger") ||
        message.includes("moving average") ||
        message.includes("technical")
      ) {
        const stock = (mentionedStock || "RELIANCE").toUpperCase();
        const realData = await fetchRealStockData(stock);

        if (realData) {
          const technicalResult = `## 📊 Technical Analysis: ${stock}

**🎯 Technical Indicators (Live Data):**
• **RSI (14):** ${realData.indicators?.rsi || "Calculating..."} ${
            parseFloat(realData.indicators?.rsi || "50") > 70
              ? "🔴 Overbought"
              : parseFloat(realData.indicators?.rsi || "50") < 30
              ? "🟢 Oversold"
              : "🟡 Neutral"
          }
• **EMA 50:** ₹${realData.indicators?.ema50 || "Loading..."}
• **MACD:** ${realData.indicators?.macd || "Processing..."}
• **Volume:** ${realData.volume} ${
            parseInt(String(realData.volume)) > 1000000
              ? "(High Volume)"
              : "(Normal Volume)"
          }

**📈 Price Action:**
• **Current:** ₹${realData.price.toLocaleString()} (${realData.changePercent.toFixed(
            2
          )}%)
• **Support:** ₹${(realData.price * 0.98).toFixed(0)} | **Resistance:** ₹${(
            realData.price * 1.02
          ).toFixed(0)}
• **Trend:** ${
            realData.changePercent > 0 ? "Bullish momentum" : "Bearish pressure"
          }

**🔮 Trading Signals:**
${
  parseFloat(realData.indicators?.rsi || "50") > 70
    ? "• RSI suggests overbought condition - Consider profit booking"
    : parseFloat(realData.indicators?.rsi || "50") < 30
    ? "• RSI shows oversold levels - Potential buying opportunity"
    : "• RSI in neutral zone - Wait for clear signals"
}

**💡 Technical Strategy:**
Use Trading Master for detailed chart analysis with all 14 timeframes and advanced indicators.`;

          setSearchResults(technicalResult);
        } else {
          setSearchResults(
            `📊 **Technical Analysis Hub**\n\nAccess advanced technical indicators through:\n• **Trading Master:** Full charting suite with RSI, MACD, Bollinger Bands\n• **Live Options:** Greeks and technical levels\n• **Community Analysis:** Social Feed technical discussions\n\n🚀 Switch to Trading Master for comprehensive technical analysis.`
          );
        }
      }

      // Social Feed Search - Optimized with timeout and caching
      else if (
        message.includes("social") ||
        message.includes("community") ||
        message.includes("discussion") ||
        message.includes("trending") ||
        message.includes("sentiment")
      ) {
        try {
          // Fast timeout for social data to prevent slow loading
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

          const socialResponse = await fetch("/api/social-posts?limit=5", {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (socialResponse.ok) {
            const socialData = await socialResponse.json();

            // Filter relevant posts based on query
            let relevantPosts = socialData;
            if (mentionedStock) {
              relevantPosts = socialData.filter(
                (post: any) =>
                  post.content &&
                  post.content.toLowerCase().includes(mentionedStock)
              );
            }

            // Extract trending topics
            const trendingTopics = Array.from(
              new Set(
                socialData.flatMap((post: any) =>
                  (post.content?.match(/\b[A-Z]{3,}\b/g) || []).slice(0, 3)
                )
              )
            ).slice(0, 8);

            const socialResult = `## 💬 Social Feed Intelligence ${
              mentionedStock ? `- ${mentionedStock.toUpperCase()}` : ""
            }

**🔥 Trending Discussions:**
${
  trendingTopics.map((topic) => `• ${topic}`).join("\n") ||
  "• General market discussions"
}

**📊 Community Insights (${relevantPosts.length} posts):**
${relevantPosts
  .slice(0, 5)
  .map(
    (post: any, index: number) =>
      `${index + 1}. **${post.authorUsername || "Trader"}:** ${(
        post.content || ""
      ).substring(0, 120)}...`
  )
  .join("\n\n")}

**🎯 Sentiment Analysis:**
${
  relevantPosts.length > 0
    ? `Community is actively discussing ${
        mentionedStock ? mentionedStock.toUpperCase() + " with" : "market with"
      } ${
        relevantPosts.some(
          (p: any) =>
            p.content?.toLowerCase().includes("bullish") ||
            p.content?.toLowerCase().includes("buy")
        )
          ? "bullish sentiment"
          : relevantPosts.some(
              (p: any) =>
                p.content?.toLowerCase().includes("bearish") ||
                p.content?.toLowerCase().includes("sell")
            )
          ? "bearish sentiment"
          : "mixed sentiment"
      }`
    : "Limited recent discussions on this topic"
}

**🚀 Platform Integration:**
• **Full Feed:** Access complete Social Feed for detailed discussions  
• **Real-time Updates:** Live community posts and market reactions
• **Expert Analysis:** Professional trader insights and strategies

💡 **Quick Access:** Switch to Social Feed tab for complete community analysis.`;

            setSearchResults(socialResult);
          } else {
            setSearchResults(
              `💬 **Social Feed Center**\n\nAccess community insights:\n• **Live Discussions:** Real-time market conversations\n• **Expert Analysis:** Professional trader perspectives\n• **Trending Topics:** What the community is discussing\n\n🚀 Switch to Social Feed tab for full community analysis.`
            );
          }
        } catch (error) {
          setSearchResults(
            `💬 **Social Feed Access**\n\nConnect with the trading community through our Social Feed tab for:\n• Live market discussions\n• Community sentiment analysis\n• Expert trading insights\n\n💡 Navigate to Social Feed for real-time community intelligence.`
          );
        }
      }

      // Journal & Trading History Search
      else if (
        message.includes("journal") ||
        message.includes("trades") ||
        message.includes("history") ||
        message.includes("performance") ||
        message.includes("pnl")
      ) {
        const journalResult = `## 📝 Trading Journal & Performance Hub

**📊 Performance Analytics Available:**
• **Daily P&L Tracking:** Comprehensive trade-by-trade analysis
• **Strategy Performance:** Success rates and optimization insights  
• **Risk Management:** Drawdown analysis and position sizing
• **Pattern Recognition:** Identify winning and losing patterns

**💼 Journal Features:**
• **Trade Documentation:** Screenshots, notes, and market context
• **Tag System:** Categorize trades by strategy, emotion, setup
• **Performance Metrics:** Win rate, average profit/loss, Sharpe ratio
• **Calendar View:** Visual P&L heatmap and trading frequency

**🎯 Quick Journal Actions:**
• **Today's Trades:** Check current session performance
• **Weekly Review:** Analyze recent trading patterns  
• **Monthly Summary:** Comprehensive performance overview
• **Strategy Analysis:** Deep dive into specific trading approaches

**📈 Performance Insights:**
• **Best Performing Days:** Identify optimal trading conditions
• **Loss Analysis:** Understand and fix problematic patterns
• **Time Analysis:** Find your most profitable trading hours
• **Risk Metrics:** Monitor and optimize risk-adjusted returns

**🚀 Platform Integration:**
Use Journal tab for detailed performance tracking and trade analysis.`;

        setSearchResults(journalResult);
      }

      // Quick Actions (Add to watchlist, set alerts, etc.)
      else if (
        message.includes("add") ||
        message.includes("watchlist") ||
        message.includes("alert") ||
        message.includes("notification")
      ) {
        const quickResult = `## ⚡ Quick Actions Hub

**📋 Watchlist Management:**
${
  mentionedStock
    ? `• **Add ${mentionedStock.toUpperCase()}:** Monitor price movements and alerts
• **Set Price Alert:** Get notified at target levels
• **Technical Alert:** RSI/MACD signal notifications
• **News Alert:** Breaking news for ${mentionedStock.toUpperCase()}`
    : `• **Add Stocks:** Build your monitoring portfolio
• **Create Lists:** Sector-wise or strategy-based groupings
• **Bulk Actions:** Import/export watchlist data
• **Smart Alerts:** AI-powered signal notifications`
}

**🔔 Alert System:**
• **Price Targets:** Get notified at support/resistance levels
• **Technical Signals:** RSI overbought/oversold alerts
• **News Alerts:** Breaking developments on watched stocks
• **Volume Alerts:** Unusual trading activity notifications

**🎯 Quick Setup Actions:**
• **Portfolio Sync:** Connect with Trading Master for live tracking
• **Risk Alerts:** Position size and stop-loss monitoring  
• **Calendar Alerts:** Earnings, dividends, and event reminders
• **Community Alerts:** Social Feed mentions and discussions

**⚙️ Automation Features:**
• **Smart Scanning:** Auto-detect trading opportunities
• **Pattern Alerts:** Chart pattern recognition notifications
• **Sector Rotation:** Industry momentum change alerts
• **Market Regime:** Bull/bear market transition signals

**🚀 Platform Integration:**
Configure alerts through Trading Master and monitor via Social Feed updates.`;

        setSearchResults(quickResult);
      }

      // Stock price requests - Optimized with fast loading
      else if (
        message.includes("price") ||
        message.includes("stock") ||
        message.includes("nifty") ||
        message.includes("sensex") ||
        message.includes("live")
      ) {
        const stock = (mentionedStock || "RELIANCE").toUpperCase();

        // Show immediate response for better UX
        setSearchResults(
          `🔍 **Loading ${stock} Data...**\n\n⏱️ Fetching live market data...`
        );

        // Use existing stock analysis endpoint with timeout
        let realData: StockData | null = null;
        try {
          realData = await Promise.race([
            fetchRealStockData(stock),
            new Promise<StockData | null>((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 4000)
            ),
          ]);
        } catch (error) {
          console.log("Stock data timeout, using fallback");
        }

        if (realData) {
          // Get additional fundamental data from social feed
          let fundamentalData = "";
          try {
            const socialResponse = await fetch("/api/social-posts?limit=5");
            if (socialResponse.ok) {
              const socialData = await socialResponse.json();
              const relevantPosts = socialData.filter(
                (post: any) =>
                  post.content &&
                  (post.content.toLowerCase().includes(stock.toLowerCase()) ||
                    post.content.toLowerCase().includes("market") ||
                    post.content.toLowerCase().includes("analysis"))
              );

              if (relevantPosts.length > 0) {
                fundamentalData = `\n**📊 Community Analysis:**\n${relevantPosts
                  .slice(0, 2)
                  .map(
                    (post: any, index: number) =>
                      `${index + 1}. ${post.content.substring(0, 150)}...`
                  )
                  .join("\n")}\n`;
              }
            }
          } catch (e) {
            console.log("Social data not available");
          }

          const trend = realData.changePercent > 0 ? "bullish" : "bearish";
          const trendIcon = trend === "bullish" ? "📈" : "📉";
          const sentimentEmoji =
            realData.sentiment?.trend === "Bullish"
              ? "🟢"
              : realData.sentiment?.trend === "Bearish"
              ? "🔴"
              : "🟡";
          const sentimentText = realData.sentiment?.trend || "Neutral";
          const sentimentConfidence =
            realData.sentiment?.confidence || "Medium";

          const analysisResult = `## ${stock} Stock Analysis ${trendIcon}

**📈 Live Market Data (Fyers API):**
• **Current Price:** ₹${realData.price.toLocaleString()} (${realData.changePercent.toFixed(
            2
          )}%)
• **Open:** ₹${realData.open.toLocaleString()} | **High:** ₹${realData.high.toLocaleString()}
• **Low:** ₹${realData.low.toLocaleString()} | **Volume:** ${realData.volume}
• **Market Cap:** ${realData.marketCap}
• **P/E Ratio:** ${realData.pe || "N/A"}

**🎯 Market Sentiment:** ${sentimentEmoji} ${sentimentText} (${sentimentConfidence} confidence)

**📊 Technical Indicators:**
• **RSI:** ${realData.indicators?.rsi || "Calculating..."}
• **EMA 50:** ${realData.indicators?.ema50 || "Loading..."}
• **Trend:** ${trend === "bullish" ? "Upward momentum" : "Consolidation phase"}
• **Support:** ₹${(realData.price * 0.98).toFixed(0)} | **Resistance:** ₹${(
            realData.price * 1.02
          ).toFixed(0)}
${fundamentalData}
**💡 AI Trading Insight:**
${
  trend === "bullish"
    ? `Strong buying momentum with ${
        realData.volume
      } volume. Consider position entry with stop-loss below ₹${(
        realData.price * 0.95
      ).toFixed(0)}.`
    : `Cautious sentiment prevailing. Wait for confirmation above ₹${(
        realData.price * 1.02
      ).toFixed(0)} for bullish reversal.`
}

**⚖️ Risk Level:** ${
            realData.changePercent > 5
              ? "High"
              : realData.changePercent > 2
              ? "Medium"
              : "Low"
          } Volatility | ${sentimentConfidence} Confidence

🚀 **Platform Features:** Use Trading Master for advanced charts and options analysis.`;

          setSearchResults(analysisResult);
        } else {
          // Fallback with platform guidance
          setSearchResults(`📈 **${stock} Stock Analysis**

⏰ **Data Status:** Real-time data temporarily unavailable

**🔧 Alternative Data Sources:**
• **Trading Master:** Live charts, options chain, technical indicators
• **Social Feed:** Community analysis and discussions
• **Market Dashboard:** Real-time quotes and market sentiment

**📱 Platform Features Available:**
• **Live Options Chain:** Greeks calculation and analysis
• **Technical Charts:** 14 timeframes with indicators
• **Community Insights:** Social trading feed
• **Risk Management:** Journal and performance tracking

💡 **Quick Access:** Switch to Trading Master tab for live ${stock} data and analysis.`);
        }
      }

      // Market news requests using existing platform news data
      else if (
        message.includes("news") ||
        message.includes("market") ||
        message.includes("update")
      ) {
        try {
          // Use the same news API that's already working successfully
          const query = mentionedStock
            ? mentionedStock.toUpperCase()
            : "Indian stock market finance news";
          const response = await fetch(
            `/api/stock-news?query=${encodeURIComponent(query)}`
          );
          const data = await response.json();

          if (data.success && data.articles && data.articles.length > 0) {
            // Organize the news data that's already being fetched
            const newsArticles = data.articles.slice(0, 6);

            // Analyze sentiment from the news
            const getNewssentiment = (articles: any[]) => {
              const positiveWords = [
                "growth",
                "profit",
                "gain",
                "rise",
                "bullish",
                "strong",
                "beat",
                "up",
                "higher",
                "surge",
              ];
              const negativeWords = [
                "loss",
                "decline",
                "fall",
                "bearish",
                "weak",
                "miss",
                "concern",
                "down",
                "lower",
                "crash",
              ];

              let positiveCount = 0;
              let negativeCount = 0;

              articles.forEach((article) => {
                const text = (
                  article.title +
                  " " +
                  (article.description || "")
                ).toLowerCase();
                positiveWords.forEach((word) => {
                  if (text.includes(word)) positiveCount++;
                });
                negativeWords.forEach((word) => {
                  if (text.includes(word)) negativeCount++;
                });
              });

              if (positiveCount > negativeCount)
                return {
                  sentiment: "Bullish",
                  score: positiveCount - negativeCount,
                };
              if (negativeCount > positiveCount)
                return {
                  sentiment: "Bearish",
                  score: negativeCount - positiveCount,
                };
              return { sentiment: "Neutral", score: 0 };
            };

            const sentimentAnalysis = getNewssentiment(newsArticles);
            const targetSymbol = mentionedStock
              ? mentionedStock.toUpperCase()
              : "Market";

            const newsResult = `## 📰 Latest ${targetSymbol} News & Analysis

**🎯 News Sentiment Analysis:**
• **Overall Tone:** ${sentimentAnalysis.sentiment} ${
              sentimentAnalysis.sentiment === "Bullish"
                ? "🟢"
                : sentimentAnalysis.sentiment === "Bearish"
                ? "🔴"
                : "🟡"
            }
• **Confidence Score:** ${Math.abs(sentimentAnalysis.score)} signals detected
• **Market Impact:** ${
              sentimentAnalysis.sentiment === "Bullish"
                ? "Positive momentum expected"
                : sentimentAnalysis.sentiment === "Bearish"
                ? "Caution advised"
                : "Mixed signals, focus on fundamentals"
            }

**📈 Trading Implications:**
${
  sentimentAnalysis.sentiment === "Bullish"
    ? `• Positive news flow may support price appreciation\n• Consider gradual position building on dips\n• Monitor for continuation patterns`
    : sentimentAnalysis.sentiment === "Bearish"
    ? `• Negative sentiment may create selling pressure\n• Wait for news clarity before fresh positions\n• Look for oversold bounce opportunities`
    : `• Mixed news requires balanced approach\n• Focus on technical levels over news sentiment\n• Maintain risk management discipline`
}

**📋 Recent Headlines (${newsArticles.length} articles):**
${newsArticles
  .map(
    (article: any, index: number) =>
      `${index + 1}. **${article.title}**\n   ${
        article.description || "Breaking market development"
      }\n   _Source: ${article.source || "Market News"}_`
  )
  .join("\n\n")}

**💡 Platform Integration:**
• **Social Feed:** Community discussions about these developments
• **Trading Master:** Technical analysis with news correlation
• **Journal:** Track news-driven trading decisions

🚀 **Next Steps:** Use Social Feed for community insights on these news developments.`;

            setSearchResults(newsResult);
          } else {
            // Fallback when news API doesn't have data
            setSearchResults(`📰 **Market News Dashboard**

**🔧 News Sources Available:**
• **Social Feed:** Real-time community discussions and market insights
• **Trading Platform:** Live market updates and analysis
• **Community Posts:** User-generated market commentary

**📱 Platform Features:**
• **Breaking News:** Check Social Feed for latest developments
• **Market Analysis:** Community-driven insights and discussions
• **Technical Updates:** Trading Master for chart-based news correlation

**💡 Alternative Sources:**
• Switch to Social Feed tab for community market discussions
• Check Trading Master for technical news impact analysis
• Monitor Journal for news-driven trading patterns

🚀 **Quick Access:** Social Feed contains the most up-to-date market discussions.`);
          }
        } catch (error) {
          console.error("News fetch error:", error);
          setSearchResults(
            `📰 **News Center**\n\nAccess the latest market news through our platform features:\n\n• **Social Feed:** Community market discussions\n• **Trading Master:** Technical analysis and market updates\n• **Platform Dashboard:** Real-time market information\n\n💡 Use Social Feed for the most current market insights.`
          );
        }
      }

      // IPO requests using AI Finance Assistant logic
      else if (
        message.includes("ipo") ||
        message.includes("listing") ||
        message.includes("upcoming")
      ) {
        const ipoAnalysis = `🚀 **IPO Market Intelligence**

**Current IPO Landscape:**
The IPO market is experiencing selective activity with quality companies commanding premium valuations. Key focus areas:

• **Technology Sector:** Fintech and SaaS companies leading the pipeline with strong digital transformation themes
• **Green Energy:** Renewable energy firms gaining significant investor attention amid sustainability focus
• **Healthcare:** Specialty pharma and medical device companies benefiting from health sector growth
• **Financial Services:** NBFCs and insurance companies exploring listings amid credit growth cycle

**Investment Framework for IPO Analysis:**

**1. Fundamental Due Diligence:**
• Business model sustainability and competitive moats
• Revenue growth consistency and profit margins
• Management track record and corporate governance
• Industry positioning and market opportunity size

**2. Valuation Assessment:**
• Compare with listed peers in same sector
• Evaluate growth prospects vs. premium pricing
• Assess price band reasonableness
• Consider post-listing price performance patterns

**3. Risk Evaluation:**
• Market timing and overall sentiment
• Lock-in period implications for promoters
• Regulatory environment and compliance history
• Competition intensity and market share sustainability

**Professional IPO Strategy:**
• **Research Phase:** Thorough analysis of DRHP and company financials
• **Application Strategy:** Multiple family member applications for better allocation
• **Post-Listing:** Monitor for 3-6 months before major position changes
• **Portfolio Integration:** Limit IPO exposure to 5-10% of total portfolio

**Current Market Dynamics:**
• Quality companies with clear business models preferred
• Premium valuations acceptable for proven growth stories
• Retail participation remains strong but selective
• Institutional investors focusing on long-term value creation

💡 **Platform Integration:** Use our Social Feed for community IPO discussions and Trading Master for technical analysis of newly listed stocks.`;

        setSearchResults(ipoAnalysis);
      }

      // Fundamental analysis using existing social feed data
      else if (
        message.includes("fundamental") ||
        message.includes("analysis") ||
        message.includes("financials")
      ) {
        try {
          // Combine stock data with social feed fundamental insights
          const stock = mentionedStock
            ? mentionedStock.toUpperCase()
            : "MARKET";

          // Get stock data and social feed data in parallel
          const [stockData, socialResponse] = await Promise.all([
            mentionedStock ? fetchRealStockData(stock) : Promise.resolve(null),
            fetch("/api/social-posts?limit=10"),
          ]);

          let fundamentalInsights = "";
          if (socialResponse.ok) {
            const socialData = await socialResponse.json();
            // Filter for fundamental analysis posts
            const fundamentalPosts = socialData.filter(
              (post: any) =>
                post.content &&
                (post.content.toLowerCase().includes("pe ratio") ||
                  post.content.toLowerCase().includes("p/e") ||
                  post.content.toLowerCase().includes("valuation") ||
                  post.content.toLowerCase().includes("earnings") ||
                  post.content.toLowerCase().includes("fundamental") ||
                  post.content.toLowerCase().includes("financial") ||
                  post.content.toLowerCase().includes("balance sheet") ||
                  post.content.toLowerCase().includes("revenue") ||
                  post.content.toLowerCase().includes("profit margin") ||
                  (mentionedStock &&
                    post.content
                      .toLowerCase()
                      .includes(mentionedStock.toLowerCase())))
            );

            if (fundamentalPosts.length > 0) {
              fundamentalInsights = `**📈 Community Fundamental Analysis:**
${fundamentalPosts
  .slice(0, 3)
  .map(
    (post: any, index: number) =>
      `${index + 1}. ${post.content.substring(0, 200)}...`
  )
  .join("\n\n")}

`;
            }
          }

          if (stockData && mentionedStock) {
            // Specific stock fundamental analysis
            const fundamentalResult = `## ${stock} Fundamental Analysis 📊

**📋 Key Financial Metrics (Live Data):**
• **Current Price:** ₹${stockData.price.toLocaleString()}
• **Market Capitalization:** ${stockData.marketCap}
• **P/E Ratio:** ${stockData.pe || "N/A"} ${
              stockData.pe
                ? stockData.pe < 15
                  ? "(Attractive)"
                  : stockData.pe < 25
                  ? "(Fair)"
                  : "(Premium)"
                : ""
            }
• **Daily Volume:** ${stockData.volume}
• **Price Change:** ${stockData.changePercent.toFixed(2)}% (${
              stockData.changePercent > 0
                ? "Positive momentum"
                : "Under pressure"
            })

**💹 Valuation Assessment:**
${
  stockData.pe > 0
    ? `• P/E of ${stockData.pe} suggests ${
        stockData.pe < 15
          ? "**undervalued** opportunity"
          : stockData.pe < 25
          ? "**fairly valued** with reasonable premium"
          : "**premium valuation** requiring strong growth"
      }\n• Sector comparison needed for complete picture`
    : "• P/E data unavailable - focus on revenue and earnings trends\n• Check recent quarterly results for growth trajectory"
}

**🎯 Investment Framework:**
• **Growth Quality:** Consistent revenue and earnings expansion
• **Financial Health:** Strong balance sheet with manageable debt levels
• **Market Position:** Competitive advantages and market share trends
• **Management:** Track record of value creation and strategic vision

**⚠️ Risk Analysis:**
• **Volatility Level:** ${
              stockData.changePercent > 5
                ? "High"
                : stockData.changePercent > 2
                ? "Medium"
                : "Low"
            } (based on recent price movement)
• **Sentiment Risk:** ${
              stockData.sentiment?.confidence || "Medium"
            } confidence level
• **Liquidity:** ${
              stockData.volume !== "N/A"
                ? "Good trading volumes"
                : "Limited liquidity"
            }

${fundamentalInsights}**💡 Platform Resources:**
• **Trading Master:** Complete financial ratios and technical analysis
• **Social Feed:** Community fundamental discussions and insights
• **Market Dashboard:** Real-time valuation metrics

🚀 **Next Steps:** Check Social Feed for community fundamental analysis discussions.`;

            setSearchResults(fundamentalResult);
          } else {
            // General fundamental analysis framework with social insights
            const generalFundamental = `📊 **Fundamental Analysis Center**

**🔍 Platform Data Sources:**
• **Social Feed:** Community fundamental analysis and insights
• **Trading Master:** Complete financial ratios and valuation metrics
• **Market Data:** Real-time price and volume information

${fundamentalInsights}**📈 Essential Analysis Framework:**

**1. Profitability Ratios:**
• **ROE (Return on Equity):** >15% indicates efficient capital use
• **ROA (Return on Assets):** >10% shows strong asset management
• **Net Margin:** >10% suggests healthy profitability
• **EBITDA Margin:** Industry-specific operational efficiency

**2. Valuation Metrics:**
• **P/E Ratio:** Compare with sector average and growth rate
• **P/B Ratio:** <3 generally attractive for most sectors
• **EV/EBITDA:** Comprehensive valuation including debt structure
• **PEG Ratio:** <1 indicates growth at reasonable price

**3. Financial Strength:**
• **Debt-to-Equity:** <0.5 preferred for financial stability
• **Current Ratio:** >1.5 shows good short-term liquidity
• **Interest Coverage:** >5x indicates comfortable debt servicing
• **Free Cash Flow:** Positive and growing cash generation

**🎯 Sector-Wise Opportunities:**

**Banking (P/E: 12-15x)**
• Post-cycle recovery phase with improving asset quality
• Focus: Private banks with strong digital transformation

**Technology (P/E: 20-25x)**
• Premium justified by consistent growth and global exposure
• Focus: Export-oriented companies with recurring revenue models

**FMCG (P/E: 35-45x)**
• Quality premium for stable cash flows and market leadership
• Focus: Rural recovery themes and premiumization trends

**🚨 Red Flags to Avoid:**
⚠️ Declining revenue for 3+ consecutive quarters
⚠️ Rising debt without corresponding asset growth
⚠️ Frequent management changes or governance issues
⚠️ Sector headwinds without clear resolution path

**💡 Platform Integration:**
• **Social Feed:** Real-time community fundamental discussions
• **Trading Master:** Detailed financial ratio analysis
• **Journal:** Track fundamental-based investment decisions

🚀 **Quick Access:** Social Feed contains active fundamental analysis discussions.`;

            setSearchResults(generalFundamental);
          }
        } catch (error) {
          console.error("Fundamental analysis error:", error);
          setSearchResults(
            `📊 **Fundamental Analysis Hub**\n\n**📱 Available Resources:**\n• **Social Feed:** Community fundamental discussions\n• **Trading Master:** Financial ratios and analysis tools\n• **Platform Data:** Real-time market and company information\n\n💡 Check Social Feed for active fundamental analysis discussions.`
          );
        }
      }

      // Advanced AI Search - Uses Gemini AI + Web Search (like Replit Agent)
      else {
        console.log(`🤖 Using Advanced AI Agent for query: ${query}`);
        
        try {
          const response = await fetch('/api/advanced-search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query,
              includeWebSearch: true
            })
          });

          const data = await response.json();

          if (data.success && data.answer) {
            let result = `## 🤖 AI Assistant\n\n${data.answer}`;
            
            if (data.sources && data.sources.length > 0) {
              result += `\n\n**📚 Sources:**\n${data.sources.map((source: string) => `• ${source}`).join('\n')}`;
            }
            
            setSearchResults(result);
          } else {
            throw new Error('AI search failed');
          }
        } catch (error) {
          console.error('Advanced AI search error:', error);
          
          const fallbackResponse = `🤖 **AI Trading Assistant Ready!**\n\nI can help you with comprehensive trading and investment analysis:\n\n📈 **Live Stock Prices & Analysis:**\n• Real-time market data and technical indicators\n• Sector performance and trend analysis\n• Support/resistance levels and price targets\n\n📰 **Market News & Updates:**\n• Latest financial news and market movements\n• Economic indicators and policy impacts\n• Corporate earnings and sector trends\n\n🚀 **IPO Analysis & Information:**\n• Upcoming IPO calendar and subscription details\n• Post-listing performance tracking\n• Investment recommendations and risk assessment\n\n📊 **Fundamental Analysis:**\n• Company financials and valuation metrics\n• Sector comparisons and growth prospects\n• Risk analysis and investment recommendations\n\n💡 **Try asking:** "Get NIFTY price", "Latest market news", "IPO updates", or "Analyze fundamentals"`;

          setSearchResults(fallbackResponse);
        }
      }
    } catch (error) {
      console.error("AI Search error:", error);
      setSearchResults(
        "🤖 I'm here to help with all your trading and finance questions! I can assist with:\n\n• Stock analysis and live quotes\n• Market news and IPO updates\n• Trading strategies and risk management\n• Platform features (Trading Master, Journal, Social Feed)\n• Options trading and Greeks calculation\n\nWhat would you like to know more about?"
      );
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Handle suggestion button clicks
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setIsSearchActive(true);
    // Automatically trigger search with the suggestion
    handleSearch(suggestion);
  };

  // Generate Trading Journal AI Performance Report
  const generateJournalAIReport = async () => {
    setIsSearchLoading(true);
    setIsSearchActive(true);
    setSearchQuery("Trading Journal Performance Analysis");

    try {
      // Fetch all journal dates and data
      const allDatesResponse = await fetch("/api/journal/all-dates");
      const allJournalData = allDatesResponse.ok
        ? await allDatesResponse.json()
        : {};

      // Use localStorage as fallback if API fails
      const localStorageData = localStorage.getItem("tradingDataByDate");
      const fallbackData = localStorageData ? JSON.parse(localStorageData) : {};
      const journalData =
        Object.keys(allJournalData).length > 0 ? allJournalData : fallbackData;

      if (Object.keys(journalData).length === 0) {
        setSearchResults(
          "## 📝 Trading Journal Analysis\n\n❌ **No journal data found**\n\nPlease add some trading entries in the Journal tab to see your performance analysis."
        );
        setIsSearchLoading(false);
        return;
      }

      // Analyze journal data for performance metrics
      let totalTrades = 0;
      let winningTrades = 0;
      let losingTrades = 0;
      let totalProfit = 0;
      let totalLoss = 0;
      let netPnL = 0;
      let fomoTrades = 0;
      let psychologyTags: { [key: string]: number } = {};
      let dailyPnL: { date: string; pnl: number }[] = [];

      // Process each date's journal data
      Object.entries(journalData).forEach(([date, dateData]: [string, any]) => {
        if (dateData && typeof dateData === "object") {
          // Extract trades from the date data - use correct structure
          const trades = dateData.tradeHistory || dateData.trades || [];
          const notes = dateData.tradingNotes || dateData.notes || "";
          const tags = dateData.tradingTags || dateData.selectedTags || [];

          let dayPnL = 0;

          trades.forEach((trade: any) => {
            totalTrades++;

            // Parse P&L from string format like "₹506.80", "₹-826.00"
            let pnl = 0;
            if (trade.pnl && typeof trade.pnl === "string") {
              const pnlStr = trade.pnl.replace(/[₹,+\s]/g, ""); // Remove ₹, commas, + and spaces
              pnl = parseFloat(pnlStr) || 0;
            } else if (typeof trade.pnl === "number") {
              pnl = trade.pnl;
            }

            dayPnL += pnl;

            if (pnl > 0) {
              winningTrades++;
              totalProfit += pnl;
            } else if (pnl < 0) {
              losingTrades++;
              totalLoss += Math.abs(pnl);
            }
          });

          // Count psychology tags
          tags.forEach((tag: string) => {
            psychologyTags[tag] = (psychologyTags[tag] || 0) + 1;
            if (tag.toLowerCase().includes("fomo")) {
              fomoTrades++;
            }
          });

          // Track daily P&L for trend analysis
          if (dayPnL !== 0) {
            dailyPnL.push({ date, pnl: dayPnL });
          }

          netPnL += dayPnL;
        }
      });

      const winRate =
        totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100) : 0;
      const avgWin =
        winningTrades > 0 ? Math.round(totalProfit / winningTrades) : 0;
      const avgLoss =
        losingTrades > 0 ? Math.round(totalLoss / losingTrades) : 0;

      // Get top psychology patterns
      const topPsychologyPatterns = Object.entries(psychologyTags)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([tag, count]) => `${tag} (${count}x)`)
        .join(", ");

      // Generate mini performance trend (last 10 trading days)
      const recentTrend = dailyPnL.slice(-10);
      const trendData = recentTrend.map((day) => day.pnl).join(",");

      // Create performance trend visualization (simple ASCII-style)
      const maxPnL = Math.max(...recentTrend.map((d) => d.pnl));
      const minPnL = Math.min(...recentTrend.map((d) => d.pnl));
      const range = maxPnL - minPnL;

      let trendLine = "";
      if (range > 0) {
        recentTrend.forEach((day) => {
          const normalized = Math.round(((day.pnl - minPnL) / range) * 10);
          trendLine += normalized >= 5 ? "📈" : normalized >= 3 ? "📊" : "📉";
        });
      }

      // Create chart data for Performance Trend
      const chartData = recentTrend.map((day, index) => ({
        day: `Day ${index + 1}`,
        value: day.pnl,
        date: day.date,
      }));

      const performanceReport = `## 📝 Trading Journal AI Performance Report

### 📊 **Overall Performance Metrics**
**🎯 Total Trades:** ${totalTrades}
**✅ Winning Trades:** ${winningTrades} (${winRate}% Win Rate)
**❌ Losing Trades:** ${losingTrades}
**💰 Net P&L:** ₹${netPnL.toLocaleString("en-IN")} ${netPnL >= 0 ? "🟢" : "🔴"}

### 💡 **Detailed Analytics**
**📈 Total Profit:** ₹${totalProfit.toLocaleString("en-IN")}
**📉 Total Loss:** ₹${totalLoss.toLocaleString("en-IN")}
**⚡ Average Win:** ₹${avgWin.toLocaleString("en-IN")}
**⚠️ Average Loss:** ₹${avgLoss.toLocaleString("en-IN")}

### 🧠 **Psychology Analysis**
**🔥 FOMO Trades:** ${fomoTrades} trades
**🎭 Top Patterns:** ${topPsychologyPatterns || "No patterns identified"}

### 📈 **Performance Trend (Recent)**
[CHART:PERFORMANCE_TREND]
*${recentTrend.length} trading sessions tracked*

### 🎯 **AI Insights & Recommendations**
${
  winRate >= 60
    ? "🟢 **Strong Performance:** Your win rate shows good trading discipline!"
    : winRate >= 40
    ? "🟡 **Moderate Performance:** Focus on improving entry/exit timing."
    : "🔴 **Needs Improvement:** Consider reviewing your trading strategy and risk management."
}

${
  fomoTrades > totalTrades * 0.2
    ? "⚠️ **FOMO Alert:** High emotional trading detected. Consider implementing cooling-off periods."
    : "✅ **Good Discipline:** Low FOMO trading indicates strong emotional control."
}

**📚 Next Steps:**
• Review losing trades for common patterns
• Maintain detailed trade notes for better analysis
• ${
        netPnL < 0
          ? "Focus on risk management and position sizing"
          : "Continue current strategy with slight optimizations"
      }

---
*📱 Use Journal tab for detailed trade entries and analysis*`;

      // Store chart data for rendering
      (window as any).performanceTrendChartData = chartData;

      setSearchResults(performanceReport);
    } catch (error) {
      console.error("Error generating journal report:", error);
      setSearchResults(
        "## 📝 Trading Journal Analysis\n\n❌ **Error loading journal data**\n\nPlease try again or check your internet connection."
      );
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Function to fetch trending podcasts for a specific sector
  const fetchTrendingPodcasts = async (sector: string) => {
    setIsPodcastsLoading(true);
    try {
      const response = await fetch("/api/trending-podcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector }),
      });

      if (response.ok) {
        const data = await response.json();
        setTrendingPodcasts(data.podcasts || []);
      } else {
        throw new Error("Failed to fetch trending podcasts");
      }
    } catch (error) {
      console.error("Error fetching trending podcasts:", error);
      setTrendingPodcasts([]);
    } finally {
      setIsPodcastsLoading(false);
    }
  };

  // Handler for sector change
  const handleSectorChange = (sector: string) => {
    setSelectedSector(sector);
    fetchTrendingPodcasts(sector);
    setSelectedPodcast(null); // Clear selected podcast when sector changes
  };

  // Dynamic greeting based on local time
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "Hey, Good Morning! 🌅";
    } else if (hour >= 12 && hour < 17) {
      return "Hey, Good Afternoon! ☀️";
    } else if (hour >= 17 && hour < 21) {
      return "Hey, Good Evening! 🌆";
    } else {
      return "Hey, Good Night! 🌙";
    }
  };

  // Handler for podcast selection
  const handlePodcastSelect = (podcast: any) => {
    setSelectedPodcast(podcast);
  };

  // Load default podcasts on startup
  React.useEffect(() => {
    fetchTrendingPodcasts("FINANCE");
  }, []);

  // Podcasts are now only selected when manually clicked
  // Removed AI image generation - using user provided images

  // State to track slope pattern configuration from TradingMaster
  const [slopePatternConfig, setSlopePatternConfig] = useState({
    symbol: "NSE:INFY-EQ",
    timeframe: "1",
    fromDate: format(new Date(), "yyyy-MM-dd"),
    toDate: format(new Date(), "yyyy-MM-dd"),
  });

  const { theme, toggleTheme } = useTheme();

  // Event images mapping using user provided images
  const getEventImage = (eventName: string) => {
    const imageMap: Record<string, string> = {
      "Global Startup Summit | Hyderabad 2025": charMinarImage, // Charminar
      "TiE Bangalore Founders Summit": robotAiImage, // Robot/AI
      "Pharma Bio Summit Hyderabad": charMinarImage, // Charminar
      "Hyderabad Food Festival": cafeHyderabadImage, // Cafe Hyderabad
      "HITEX IT Expo Hyderabad": robotAiImage, // Robot/AI
      "Mumbai Fintech Festival": bullBearImage, // Bull & Bear
      "Nasscom Product Conclave Bangalore": robotAiImage, // Robot/AI
      "India AI Summit Mumbai": robotAiImage, // Robot/AI
    };
    return imageMap[eventName] || charMinarImage;
  };

  // Removed AI image generation effects

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState("");
  const [importError, setImportError] = useState("");
  
  // Broker Import State
  const [showBrokerImportModal, setShowBrokerImportModal] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<string>("");
  const [brokerCredentials, setBrokerCredentials] = useState({
    apiKey: "",
    apiSecret: "",
    clientId: "",
  });
  const [brokerImportLoading, setBrokerImportLoading] = useState(false);
  const [brokerImportError, setBrokerImportError] = useState("");

  // Order Modal State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderData, setOrderData] = useState({
    symbol: "",
    action: "Buy",
    orderType: "Market",
    quantity: "",
    price: "",
    stopLoss: "",
    target: "",
  });

  // Trade History Data State
  const [tradeHistoryData, setTradeHistoryData] = useState([
    {
      time: "12:41:57 PM",
      order: "BUY",
      symbol: "SENSEX AUG 81300 CE BFO",
      type: "MIS",
      qty: 40,
      price: 488.2,
      pnl: "+₹946",
      duration: "6m 27s",
    },
    {
      time: "12:48:24 PM",
      order: "SELL",
      symbol: "SENSEX AUG 81300 CE BFO",
      type: "MIS",
      qty: 40,
      price: 511.85,
      pnl: "+₹946",
      duration: "6m 27s",
    },
    {
      time: "10:15:30 AM",
      order: "BUY",
      symbol: "NIFTY 50",
      type: "LIM",
      qty: 25,
      price: 18500.5,
      pnl: "-",
      duration: "-",
    },
  ]);

  // Unified Trading Data Storage by Date
  const [tradingDataByDate, setTradingDataByDate] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tradingDataByDate");
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });

  // Demo mode state - toggle between demo data (same for all users) and user-specific data
  const [isDemoMode, setIsDemoMode] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tradingJournalDemoMode");
      return stored === "true";
    }
    return false;
  });

  // Loading state for heatmap data
  const [isLoadingHeatmapData, setIsLoadingHeatmapData] = useState(true);

  // Helper function to get or create userId from localStorage
  const getUserId = () => {
    if (typeof window === "undefined") return "default-user";
    
    let userId = localStorage.getItem("tradingJournalUserId");
    if (!userId) {
      // Generate a unique user ID if none exists
      userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("tradingJournalUserId", userId);
    }
    return userId;
  };

  // Load all heatmap data on startup
  useEffect(() => {
    const loadAllHeatmapData = async () => {
      console.log("🔄 Loading all heatmap data for color persistence...");
      try {
        setIsLoadingHeatmapData(true);

        // Fetch all journal dates from Google Cloud
        const response = await fetch("/api/journal/all-dates");

        if (response.ok) {
          const allDatesData = await response.json();
          console.log(
            "📊 Loaded all journal dates:",
            Object.keys(allDatesData).length,
            "dates"
          );

          // Update tradingDataByDate with all the loaded data
          setTradingDataByDate(allDatesData);

          // CRITICAL: Also update calendarData to ensure heatmap functions work properly
          setCalendarData(allDatesData);

          // Auto-click all available dates to populate heatmap colors - ULTRA FAST
          // This simulates clicking each date to ensure colors appear immediately
          setTimeout(async () => {
            console.log(
              "🔄 Ultra-fast auto-clicking all available dates for heatmap colors..."
            );

            // Create all fetch promises in parallel for maximum speed
            const fetchPromises = Object.keys(allDatesData).map(
              async (dateStr) => {
                try {
                  const response = await fetch(`/api/journal/${dateStr}`);
                  if (response.ok) {
                    const journalData = await response.json();
                    if (journalData && Object.keys(journalData).length > 0) {
                      return { dateStr, journalData };
                    }
                  }
                } catch (error) {
                  console.error(
                    `❌ Error auto-loading date ${dateStr}:`,
                    error
                  );
                }
                return null;
              }
            );

            // Execute all requests simultaneously
            const results = await Promise.all(fetchPromises);

            // Update all data at once
            const updatedData: any = {};
            results.forEach((result) => {
              if (result) {
                updatedData[result.dateStr] = result.journalData;
              }
            });

            // Single state update with all data
            setTradingDataByDate((prevData: any) => ({
              ...prevData,
              ...updatedData,
            }));

            console.log(
              "✅ Ultra-fast auto-click completed - all heatmap colors should now be visible"
            );
          }, 10);

          console.log("✅ Heatmap data loaded successfully");

          // Auto-select the latest date if no date is currently selected
          if (!selectedDate && Object.keys(allDatesData).length > 0) {
            const sortedDates = Object.keys(allDatesData).sort(
              (a, b) => new Date(b).getTime() - new Date(a).getTime()
            );
            const latestDateStr = sortedDates[0];
            const latestDate = new Date(latestDateStr);

            console.log("🎯 Auto-selecting latest date:", latestDateStr);
            setSelectedDate(latestDate);
            await handleDateSelect(latestDate);
          }
        } else {
          console.log(
            "📭 No journal data found or Google Cloud unavailable, using localStorage..."
          );
          // Use localStorage data as primary fallback
          const localStorageData = localStorage.getItem("tradingDataByDate");
          if (localStorageData) {
            const parsedLocalData = JSON.parse(localStorageData);
            console.log(
              "💾 Found localStorage journal data:",
              Object.keys(parsedLocalData).length,
              "entries"
            );
            setTradingDataByDate(parsedLocalData);
            setCalendarData(parsedLocalData);

            // Auto-select latest date from localStorage
            if (!selectedDate && Object.keys(parsedLocalData).length > 0) {
              const sortedDates = Object.keys(parsedLocalData).sort(
                (a, b) => new Date(b).getTime() - new Date(a).getTime()
              );
              const latestDateStr = sortedDates[0];
              const latestDate = new Date(latestDateStr);
              console.log(
                "🎯 Auto-selecting latest date from localStorage:",
                latestDateStr
              );
              setSelectedDate(latestDate);
              await handleDateSelect(latestDate);
            }
          }
        }
      } catch (error) {
        console.error("❌ Error loading heatmap data:", error);
        // Fallback to localStorage data if Google Cloud is unavailable
        console.log("🔄 Falling back to localStorage data...");
        const localStorageData = localStorage.getItem("tradingDataByDate");
        if (localStorageData) {
          const parsedLocalData = JSON.parse(localStorageData);
          console.log(
            "💾 Emergency fallback - Found localStorage journal data:",
            Object.keys(parsedLocalData).length,
            "entries"
          );
          setTradingDataByDate(parsedLocalData);
          setCalendarData(parsedLocalData);
        }
      } finally {
        setIsLoadingHeatmapData(false);
      }
    };

    loadAllHeatmapData();
  }, []);

  // Images state for saving (with proper type)
  const [tradingImages, setTradingImages] = useState<any[]>([]);
  const imageUploadRef = useRef<MultipleImageUploadRef>(null);

  // Journal chart controls state
  const [selectedJournalSymbol, setSelectedJournalSymbol] =
    useState("NSE:NIFTY50-INDEX");
  const [selectedJournalInterval, setSelectedJournalInterval] = useState("15");
  const [showStockSearch, setShowStockSearch] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [selectedJournalDate, setSelectedJournalDate] = useState("2025-09-12");
  const [journalChartData, setJournalChartData] = useState([]);
  
  // Mobile carousel state for journal panels (0=chart, 1=image, 2=notes)
  const [mobileJournalPanel, setMobileJournalPanel] = useState(2);
  
  // Mobile bottom navigation state (home, insight, ranking)
  const [mobileBottomTab, setMobileBottomTab] = useState<'home' | 'insight' | 'ranking'>('home');
  
  // Mobile trade history dropdown state
  const [showMobileTradeHistory, setShowMobileTradeHistory] = useState(false);

  // Function to fetch journal chart data
  const fetchJournalChartData = useCallback(async () => {
    try {
      const requestBody = {
        symbol: selectedJournalSymbol,
        resolution: selectedJournalInterval,
        range_from: selectedJournalDate,
        range_to: selectedJournalDate,
      };

      const response = await fetch("/api/historical-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.status}`);
      }

      const data = await response.json();
      setJournalChartData(data.candles || []);
    } catch (error) {
      console.error("Error fetching journal chart data:", error);
    }
  }, [selectedJournalSymbol, selectedJournalInterval, selectedJournalDate]);

  // Load initial chart data
  useEffect(() => {
    fetchJournalChartData();
  }, [fetchJournalChartData]);

  // Convert trade history to chart markers
  const getTradeMarkersForChart = useCallback(() => {
    if (
      !tradeHistoryData ||
      tradeHistoryData.length === 0 ||
      !journalChartData ||
      journalChartData.length === 0
    ) {
      return [];
    }

    const markers: TradeMarker[] = [];

    tradeHistoryData.forEach((trade, index) => {
      try {
        // Parse trade time (e.g., "1:16:33 PM")
        const tradeTime = trade.time;
        if (!tradeTime) return;

        // Convert 12-hour format to 24-hour format
        const [time, period] = tradeTime.split(" ");
        const [hours, minutes, seconds] = time.split(":").map(Number);
        let hour24 = hours;

        if (period === "PM" && hours !== 12) {
          hour24 = hours + 12;
        } else if (period === "AM" && hours === 12) {
          hour24 = 0;
        }

        // Create target time in minutes from 9:15 AM (market start)
        const marketStartMinutes = 9 * 60 + 15; // 9:15 AM
        const tradeMinutes = hour24 * 60 + minutes;
        const minutesFromMarketStart = tradeMinutes - marketStartMinutes;

        // Find closest candle in chart data
        let closestCandleIndex = -1;
        let minTimeDiff = Infinity;

        journalChartData.forEach((candle, candleIndex) => {
          // Convert candle timestamp to minutes from market start
          const candleTime = new Date(candle[0] * 1000);
          const candleMinutes =
            candleTime.getHours() * 60 + candleTime.getMinutes();
          const candleMinutesFromStart = candleMinutes - marketStartMinutes;

          const timeDiff = Math.abs(
            candleMinutesFromStart - minutesFromMarketStart
          );
          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestCandleIndex = candleIndex;
          }
        });

        if (closestCandleIndex !== -1 && minTimeDiff <= 15) {
          // Within 15 minutes tolerance
          const candle = journalChartData[closestCandleIndex];
          const price = trade.order === "BUY" ? candle[3] : candle[2]; // Low for BUY, High for SELL

          markers.push({
            candleIndex: closestCandleIndex,
            price: trade.price || price,
            type: trade.order.toLowerCase() as "buy" | "sell", // 'buy' or 'sell'
            symbol: trade.symbol,
            quantity: trade.qty,
            time: trade.time,
            pnl: trade.pnl,
          });
        }
      } catch (error) {
        console.error("Error parsing trade for markers:", trade, error);
      }
    });

    console.log(
      "📊 Generated trade markers:",
      markers.length,
      "markers from",
      tradeHistoryData.length,
      "trades"
    );
    return markers;
  }, [tradeHistoryData, journalChartData]);

  // Notes state for journal tab
  const [notesContent, setNotesContent] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tradingNotes") || "";
    }
    return "";
  });
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotesContent, setTempNotesContent] = useState(notesContent);

  // Trading tags state
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tradingTags");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  // Trade book window states
  const [showTradingNotesWindow, setShowTradingNotesWindow] = useState(false);
  const [showPerformanceWindow, setShowPerformanceWindow] = useState(false);
  const [showMultipleImageUpload, setShowMultipleImageUpload] = useState(false);

  // Enhanced trading tag system with categories and rules
  const tradingTagSystem = {
    psychology: {
      name: "Psychology",
      color: "red",
      maxSelections: 2,
      tags: [
        "fomo",
        "greedy",
        "overtrading",
        "hero zero",
        "fear",
        "euphoric",
        "revenge trading",
        "disciplined",
        "patient",
        "confident",
        "anxious",
        "impulsive",
      ],
    },
    strategy: {
      name: "Strategy",
      color: "blue",
      maxSelections: 2,
      tags: [
        "planned",
        "unplanned",
        "scalping",
        "swing trading",
        "intraday",
        "position",
        "btst",
        "breakout",
        "trend following",
        "counter trend",
        "momentum",
        "mean reversion",
      ],
    },
    market: {
      name: "Market Conditions",
      color: "green",
      maxSelections: 2,
      tags: [
        "trending",
        "sideways",
        "volatile",
        "low volume",
        "high volume",
        "news driven",
        "technical setup",
        "gap up",
        "gap down",
        "pre market",
        "post market",
        "expiry day",
      ],
    },
    timeframe: {
      name: "Timeframe",
      color: "purple",
      maxSelections: 1,
      tags: ["short terms", "intraday", "swing", "investment", "long term"],
    },
    setup: {
      name: "Trade Setup",
      color: "orange",
      maxSelections: 2,
      tags: [
        "no setup",
        "blind trades",
        "technical analysis",
        "fundamental analysis",
        "news based",
        "price action",
        "indicator based",
        "pattern based",
      ],
    },
  };

  // Tag validation rules
  const tagValidationRules = {
    conflictingTags: [
      ["planned", "unplanned", "no setup"],
      ["fomo", "disciplined", "patient"],
      ["patient", "impulsive"],
      ["trending", "sideways"],
      ["gap up", "gap down"],
      ["disciplined", "blind trades"],
      ["technical analysis", "blind trades", "no setup"],
    ],
    maxTotalTags: 8,
    minRequiredTags: 0,
  };

  // Get all tags as flat array for compatibility
  const getAllTags = () => {
    return Object.values(tradingTagSystem).flatMap((category) => category.tags);
  };

  // Tag validation functions
  const validateTagSelection = (newTags: string[]) => {
    const errors: string[] = [];

    // Check total tag limit
    if (newTags.length > tagValidationRules.maxTotalTags) {
      errors.push(`Maximum ${tagValidationRules.maxTotalTags} tags allowed`);
    }

    // Check minimum required tags
    if (newTags.length < tagValidationRules.minRequiredTags) {
      errors.push(
        `Minimum ${tagValidationRules.minRequiredTags} tags required`
      );
    }

    // Check category limits
    Object.entries(tradingTagSystem).forEach(([categoryKey, category]) => {
      const categoryTags = newTags.filter((tag) => category.tags.includes(tag));
      if (categoryTags.length > category.maxSelections) {
        errors.push(
          `Maximum ${
            category.maxSelections
          } ${category.name.toLowerCase()} tags allowed`
        );
      }
    });

    // Check required categories
    Object.entries(tradingTagSystem).forEach(([categoryKey, category]) => {
      if ((category as any).required) {
        const categoryTags = newTags.filter((tag) =>
          category.tags.includes(tag)
        );
        if (categoryTags.length === 0) {
          errors.push(
            `At least one ${category.name.toLowerCase()} tag is required`
          );
        }
      }
    });

    // Check conflicting tags
    tagValidationRules.conflictingTags.forEach((conflictGroup) => {
      const selectedConflicts = newTags.filter((tag) =>
        conflictGroup.includes(tag)
      );
      if (selectedConflicts.length > 1) {
        errors.push(`Conflicting tags: ${selectedConflicts.join(", ")}`);
      }
    });

    return errors;
  };

  // Enhanced toggle tag function with validation
  const toggleTagWithValidation = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    // Only check basic limits when adding tags
    if (!selectedTags.includes(tag)) {
      // Check total limit
      if (newTags.length > tagValidationRules.maxTotalTags) {
        alert(`Maximum ${tagValidationRules.maxTotalTags} tags allowed`);
        return;
      }

      // Check category limits
      const tagCategory = getTagCategory(tag);
      if (tagCategory) {
        const categoryTags = newTags.filter((t) =>
          tagCategory.tags.includes(t)
        );
        if (categoryTags.length > tagCategory.maxSelections) {
          alert(
            `Maximum ${
              tagCategory.maxSelections
            } ${tagCategory.name.toLowerCase()} tags allowed`
          );
          return;
        }
      }
    }

    setSelectedTags(newTags);
    localStorage.setItem("tradingTags", JSON.stringify(newTags));
  };

  // Get category for a tag
  const getTagCategory = (tag: string) => {
    for (const [categoryKey, category] of Object.entries(tradingTagSystem)) {
      if (category.tags.includes(tag)) {
        return { key: categoryKey, ...category };
      }
    }
    return null;
  };

  // Calendar state for PROFIT CONSISTENCY
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null as Date | null);
  const [calendarData, setCalendarData] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("calendarData");
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });

  // Date range selection state
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear());
  const [isCalendarDataFetched, setIsCalendarDataFetched] = useState(false);

  // Auto-set calendar data fetched when both dates are selected
  useEffect(() => {
    if (fromDate && toDate) {
      setIsCalendarDataFetched(true);
    } else {
      setIsCalendarDataFetched(false);
    }
  }, [fromDate, toDate]);

  // Year navigation handlers
  const handlePreviousYear = () => {
    setHeatmapYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    setHeatmapYear((prev) => prev + 1);
  };

  // Reset date range handler
  const handleResetDateRange = () => {
    setFromDate(null);
    setToDate(null);
    setIsCalendarDataFetched(false);
  };

  // Calculate total duration of all closed trades
  const calculateTotalDuration = (trades: any[]) => {
    let totalMinutes = 0;

    trades.forEach((trade) => {
      if (trade.duration && trade.duration !== "-") {
        // Parse duration like "2m 30s" or "15m 45s"
        const match = trade.duration.match(/(\d+)m\s*(\d+)s/);
        if (match) {
          const minutes = parseInt(match[1]);
          const seconds = parseInt(match[2]);
          totalMinutes += minutes + seconds / 60;
        }
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.floor(totalMinutes % 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else if (mins > 0) {
      return `${mins}m`;
    } else {
      return "0m";
    }
  };

  // Notes handling functions
  const handleEditNotes = () => {
    setTempNotesContent(notesContent);
    setIsEditingNotes(true);
  };

  const handleSaveNotesOnly = async () => {
    try {
      setNotesContent(tempNotesContent);
      setIsEditingNotes(false);

      // Simple save - only save notes to database
      const selectedDateStr = formatDateKey(selectedDate!);
      const existingData = tradingDataByDate[selectedDateStr] || {};

      const updatedData = {
        ...existingData,
        tradingNotes: tempNotesContent,
      };

      const response = await fetch(`/api/journal/${selectedDateStr}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        console.log("✅ Notes saved successfully");
        // Update local state
        setTradingDataByDate((prev: any) => ({
          ...prev,
          [selectedDateStr]: updatedData,
        }));
      } else {
        console.error("❌ Failed to save notes");
      }
    } catch (error) {
      console.error("❌ Error saving notes:", error);
    }
  };

  const handleCancelNotes = () => {
    setTempNotesContent(notesContent);
    setIsEditingNotes(false);
  };

  // Tag handling functions
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];
      return newTags;
    });
  };

  const clearAllTags = () => {
    setSelectedTags([]);
  };

  // Calendar handler functions
  const formatDateKey = (date: Date) => {
    // Use local date components to avoid timezone conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; // YYYY-MM-DD format
  };

  const saveCalendarData = (data: any) => {
    setCalendarData(data);
    localStorage.setItem("calendarData", JSON.stringify(data));
  };

  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);
    console.log(`📅 Selected date for heatmap:`, date);

    // Load trading data from appropriate source based on demo mode
    // Use formatDateKey for consistency with save function
    const dateKey = formatDateKey(date);
    console.log(
      `🔍 Loading journal data for date: ${dateKey} (original: ${date.toDateString()})`
    );

    try {
      // Choose endpoint based on demo mode
      let response;
      if (isDemoMode) {
        // Demo mode: Load from shared Google Cloud journal database
        console.log("📊 Loading from demo data (shared)");
        response = await fetch(`/api/journal/${dateKey}`);
      } else {
        // User mode: Load from Firebase (user-specific)
        const userId = getUserId();
        console.log(`👤 Loading from user-specific data (userId: ${userId})`);
        response = await fetch(`/api/user-journal/${userId}/${dateKey}`);
      }
      console.log(`📡 Load response status: ${response.status}`, response);

      if (response.ok) {
        let journalData = await response.json();
        console.log(`📊 Journal data received:`, journalData);

        // Handle Firebase response format (has tradingData wrapper)
        if (journalData && journalData.tradingData) {
          journalData = journalData.tradingData;
          console.log(`📦 Unwrapped Firebase tradingData:`, journalData);
        }

        if (journalData && Object.keys(journalData).length > 0) {
          console.log(
            "🎯 Found journal data from Google Cloud journal-database, populating UI:",
            journalData
          );

          // Clear existing data first
          setNotesContent("");
          setTempNotesContent("");
          setSelectedTags([]);
          setTradeHistoryData([]);
          setTradingImages([]);

          // Load the data into correct state variables (with field name flexibility)
          const notes =
            journalData.notes ||
            journalData.tradingNotes ||
            journalData.notesContent ||
            "";
          if (notes) {
            setNotesContent(notes);
            setTempNotesContent(notes);
            console.log("📝 Loaded notes from journal-database:", notes);
          }

          const tags =
            journalData.tags ||
            journalData.tradingTags ||
            journalData.selectedTags ||
            [];
          if (Array.isArray(tags)) {
            setSelectedTags(tags);
            console.log("🏷️ Loaded tags from journal-database:", tags);
          }

          // Handle trade history - either direct array or constructed from summary data
          if (
            journalData.tradeHistory &&
            Array.isArray(journalData.tradeHistory)
          ) {
            setTradeHistoryData(journalData.tradeHistory);
            console.log(
              "📊 Loaded trade history from journal-database:",
              journalData.tradeHistory.length,
              "trades"
            );
          } else if (journalData.totalTrades) {
            // Construct trade history from summary data
            const constructedTrades = [];
            if (journalData.winningTrades > 0) {
              for (let i = 0; i < journalData.winningTrades; i++) {
                const profitAmount =
                  journalData.totalProfit / journalData.winningTrades;
                constructedTrades.push({
                  time: "09:30:00 AM",
                  order: "SELL",
                  symbol: "NIFTY 50",
                  type: "MIS",
                  qty: 25,
                  price: 0,
                  pnl: `+₹${profitAmount.toFixed(0)}`,
                  duration: "-",
                });
              }
            }
            if (journalData.losingTrades > 0) {
              for (let i = 0; i < journalData.losingTrades; i++) {
                const lossAmount = Math.abs(
                  journalData.totalLoss / journalData.losingTrades
                );
                constructedTrades.push({
                  time: "10:15:00 AM",
                  order: "SELL",
                  symbol: "NIFTY 50",
                  type: "MIS",
                  qty: 25,
                  price: 0,
                  pnl: `-₹${lossAmount.toFixed(0)}`,
                  duration: "-",
                });
              }
            }
            setTradeHistoryData(constructedTrades);
            console.log(
              "📊 Constructed trade history from summary data:",
              constructedTrades.length,
              "trades"
            );
          }

          if (journalData.images && Array.isArray(journalData.images)) {
            setTradingImages(journalData.images);
            console.log(
              "🖼️ Loaded images from journal-database:",
              journalData.images.length,
              "images"
            );
          }

          // Show trading data windows automatically
          setShowTradingNotesWindow(true);
          setShowPerformanceWindow(true);
          setShowMultipleImageUpload(true);

          // Update calendar data to ensure heatmap colors update
          const updatedCalendarData = {
            ...calendarData,
            [dateKey]: journalData,
          };
          setCalendarData(updatedCalendarData);

          // CRITICAL: Also update tradingDataByDate for heatmap colors
          // The heatmap reads from tradingDataByDate to calculate colors
          const updatedTradingData = {
            ...tradingDataByDate,
            [dateKey]: journalData,
          };
          setTradingDataByDate(updatedTradingData);

          // Save to localStorage as backup
          localStorage.setItem(
            "tradingDataByDate",
            JSON.stringify(updatedTradingData)
          );
          localStorage.setItem(
            "calendarData",
            JSON.stringify(updatedCalendarData)
          );

          console.log(
            "✅ Successfully loaded and saved all journal data for:",
            dateKey
          );
        } else {
          console.log("📭 No journal data found for:", dateKey);
          // Clear existing data when no data found
          setNotesContent("");
          setTempNotesContent("");
          setSelectedTags([]);
          setTradeHistoryData([]);
          setTradingImages([]);

          // Still open windows to allow adding new data for this date
          setShowTradingNotesWindow(true);
          setShowPerformanceWindow(true);
          setShowMultipleImageUpload(true);
        }
      } else {
        const errorText = await response.text();
        console.error(
          `❌ Load failed with status ${response.status}:`,
          errorText
        );
      }
    } catch (error) {
      console.error("❌ Error loading journal data:", error);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentCalendarDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentCalendarDate(today);
    setSelectedDate(today);
  };

  const getCalendarDays = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);

    // Get first day of the week (0 = Sunday)
    const firstDayOfWeek = firstDay.getDay();

    // Start from the beginning of the week
    startDate.setDate(1 - firstDayOfWeek);

    // End at the end of the week
    const lastDayOfWeek = lastDay.getDay();
    endDate.setDate(lastDay.getDate() + (6 - lastDayOfWeek));

    const days: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const isDateSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentCalendarDate.getMonth();
  };

  const hasDataForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    // Check both calendarData and tradingDataByDate for comprehensive data detection
    const calData = calendarData[dateKey];
    const tradeData = tradingDataByDate[dateKey];

    return (
      (calData &&
        (calData.tradeHistory ||
          calData.notes ||
          (calData.images && calData.images.length > 0))) ||
      (tradeData &&
        (tradeData.tradeHistory ||
          tradeData.tradingNotes ||
          tradeData.notesContent ||
          (tradeData.images && tradeData.images.length > 0) ||
          (tradeData.performanceMetrics &&
            tradeData.performanceMetrics.totalTrades > 0)))
    );
  };

  const isDateInRange = (date: Date) => {
    if (!fromDate || !toDate) return false;
    const dateTime = date.getTime();
    return dateTime >= fromDate.getTime() && dateTime <= toDate.getTime();
  };

  const getDateRangeData = () => {
    if (!fromDate || !toDate) return {};

    const rangeData: Record<string, any> = {};
    const current = new Date(fromDate);

    while (current <= toDate) {
      const dateKey = formatDateKey(current);
      if (calendarData[dateKey]) {
        rangeData[dateKey] = calendarData[dateKey];
      }
      current.setDate(current.getDate() + 1);
    }

    return rangeData;
  };

  const getDateRangeSummary = () => {
    const rangeData = getDateRangeData();
    const dates = Object.keys(rangeData);

    let totalTrades = 0;
    let datesWithNotes = 0;
    let datesWithImages = 0;
    let totalNetPnL = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let datesWithTrades = 0;

    dates.forEach((dateKey) => {
      const data = rangeData[dateKey];
      let hasTradesThisDate = false;

      if (data.tradeHistory && Array.isArray(data.tradeHistory)) {
        totalTrades += data.tradeHistory.length;
        if (data.tradeHistory.length > 0) {
          hasTradesThisDate = true;
        }
      }

      if (data.performanceMetrics) {
        totalNetPnL += data.performanceMetrics.netPnL || 0;
        winningTrades += data.performanceMetrics.winningTrades || 0;
        losingTrades += data.performanceMetrics.losingTrades || 0;
        if (data.performanceMetrics.totalTrades > 0) {
          hasTradesThisDate = true;
        }
      }

      if (hasTradesThisDate) {
        datesWithTrades++;
      }

      if (data.tradingNotes || data.notesContent) datesWithNotes++;
      if (data.images && data.images.length > 0) datesWithImages++;
    });

    const winRate =
      totalTrades > 0
        ? ((winningTrades / (winningTrades + losingTrades)) * 100).toFixed(1)
        : "0.0";

    return {
      totalDates: dates.length,
      totalTrades,
      datesWithNotes,
      datesWithImages,
      datesWithTrades,
      totalNetPnL,
      winningTrades,
      losingTrades,
      winRate,
    };
  };

  // Generate full year date range for heatmap (like GitHub)
  const generateContinuousDateRange = () => {
    const currentYear = new Date().getFullYear();
    const dates = [];

    // Start from January 1st of current year
    const startOfYear = new Date(currentYear, 0, 1);
    // Find the start of the week containing Jan 1st
    const startOfWeek = new Date(startOfYear);
    startOfWeek.setDate(startOfYear.getDate() - startOfYear.getDay());

    // End at December 31st of current year
    const endOfYear = new Date(currentYear, 11, 31);
    // Find the end of the week containing Dec 31st
    const endOfWeek = new Date(endOfYear);
    endOfWeek.setDate(endOfYear.getDate() + (6 - endOfYear.getDay()));

    const currentDate = new Date(startOfWeek);
    while (currentDate <= endOfWeek) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  // Group dates by weeks for proper calendar layout - only actual month dates
  const getHeatmapWeeks = (year = heatmapYear) => {
    const months = [];

    // Generate proper calendar layout for each month
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const firstDay = new Date(year, monthIndex, 1);
      const lastDay = new Date(year, monthIndex + 1, 0);

      // Only include actual dates of the month, arranged by weeks
      const monthWeeks = [];
      const currentDate = new Date(firstDay);

      // Calculate starting position (day of week for first day)
      const startDayOfWeek = firstDay.getDay();

      let currentWeek = [];

      // Add empty slots for days before the month starts
      for (let i = 0; i < startDayOfWeek; i++) {
        currentWeek.push(null);
      }

      // Add all actual dates of the month
      while (currentDate.getMonth() === monthIndex) {
        // Create date using explicit components to avoid timezone issues
        const day = currentDate.getDate();
        const dateToAdd = new Date();
        dateToAdd.setFullYear(year, monthIndex, day);
        dateToAdd.setHours(12, 0, 0, 0); // Set to noon to avoid timezone edge cases
        currentWeek.push(dateToAdd);
        currentDate.setDate(currentDate.getDate() + 1);

        // If week is complete (7 days) or month ended, push week and start new one
        if (currentWeek.length === 7) {
          monthWeeks.push(currentWeek);
          currentWeek = [];
        }
      }

      // If there's a partial week remaining, fill it and add it
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        monthWeeks.push(currentWeek);
      }

      months.push({
        month: monthIndex,
        weeks: monthWeeks,
        name: firstDay.toLocaleDateString("en-US", { month: "short" }),
      });
    }

    return months;
  };

  // Get month labels for full year heatmap
  const getHeatmapMonthLabels = (year = heatmapYear) => {
    const months = [];

    // Always show all 12 months of the selected year
    for (let month = 0; month < 12; month++) {
      const date = new Date(year, month, 1);
      months.push({
        name: date.toLocaleDateString("en-US", { month: "short" }),
        year: year,
      });
    }

    return months;
  };

  // Color grading function for heatmap based on P&L
  const getHeatmapColor = (netPnL: number) => {
    if (netPnL === 0) return "bg-gray-100 dark:bg-gray-700"; // Neutral for no trades

    const absValue = Math.abs(netPnL);

    if (netPnL > 0) {
      // Green for profits - darker green for higher profits
      if (absValue >= 5000) return "bg-green-800 dark:bg-green-700"; // Very high profit
      if (absValue >= 3000) return "bg-green-700 dark:bg-green-600"; // High profit
      if (absValue >= 1500) return "bg-green-600 dark:bg-green-500"; // Medium profit
      if (absValue >= 500) return "bg-green-500 dark:bg-green-400"; // Low-medium profit
      return "bg-green-300 dark:bg-green-300"; // Small profit
    } else {
      // Red for losses - darker red for higher losses
      if (absValue >= 5000) return "bg-red-800 dark:bg-red-700"; // Very high loss
      if (absValue >= 3000) return "bg-red-700 dark:bg-red-600"; // High loss
      if (absValue >= 1500) return "bg-red-600 dark:bg-red-500"; // Medium loss
      if (absValue >= 500) return "bg-red-500 dark:bg-red-400"; // Low-medium loss
      return "bg-red-300 dark:bg-red-300"; // Small loss
    }
  };

  // Save all trading data for the selected date to Google Cloud journal database
  const saveAllTradingData = async () => {
    console.log("🚀 SAVE BUTTON CLICKED! Current selectedDate:", selectedDate);

    try {
      // Check if a date is selected
      if (!selectedDate) {
        console.log("❌ No date selected for save operation");
        alert("⚠️ Please select a date on the calendar first!");
        return;
      }

      console.log("✅ Date is selected, proceeding with save...");

      // Use formatDateKey for consistency with load function
      const selectedDateStr = formatDateKey(selectedDate);

      // Safe data collection with fallbacks to prevent crashes
      const safeTradeHistory = Array.isArray(tradeHistoryData)
        ? tradeHistoryData
        : [];
      const safeNotesContent =
        typeof notesContent === "string" ? notesContent : "";
      const safeTags = Array.isArray(selectedTags) ? selectedTags : [];
      // Get current images from the image upload component
      const currentImages = imageUploadRef.current?.getCurrentImages() || [];
      const safeImages = Array.isArray(currentImages) ? currentImages : [];
      const safePerformanceMetrics = performanceMetrics || {
        totalTrades: safeTradeHistory.length,
        winningTrades: 0,
        losingTrades: 0,
        totalPnL: 0,
        netPnL: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
      };

      const journalData = {
        tradeHistory: safeTradeHistory,
        tradingNotes: safeNotesContent,
        tradingTags: safeTags,
        images: safeImages,
        performanceMetrics: safePerformanceMetrics,
        timestamp: new Date().toISOString(),
      };
      console.log(
        `🔄 Attempting to save data for date: ${selectedDateStr}`,
        journalData
      );

      // Choose endpoint based on demo mode
      let response;
      if (isDemoMode) {
        // Demo mode: Save to shared Google Cloud journal database
        console.log("📊 Saving to demo data (shared)");
        response = await fetch(`/api/journal/${selectedDateStr}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(journalData),
        });
      } else {
        // User mode: Save to Firebase (user-specific)
        const userId = getUserId();
        console.log(`👤 Saving to user-specific data (userId: ${userId})`);
        response = await fetch(`/api/user-journal`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            date: selectedDateStr,
            tradingData: journalData,
          }),
        });
      }

      console.log(`📡 Save response status: ${response.status}`, response);

      if (response.ok) {
        const responseData = await response.json();
        console.log(`✅ Save response data:`, responseData);

        // Update local state
        const allData = {
          ...tradingDataByDate,
          [selectedDateStr]: journalData,
        };
        setTradingDataByDate(allData);

        console.log(
          `✅ All trading data saved to Google Cloud for ${selectedDateStr}`,
          journalData
        );

        // Automatically reload the data for this date to ensure UI updates
        console.log("🔄 Reloading data to refresh UI...");
        await handleDateSelect(selectedDate);

        // Show success message
        if (typeof window !== "undefined") {
          const formattedDate = selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          });

          alert(
            `✅ Trading data saved to Google Cloud for ${formattedDate}!\n\n📊 Saved data:\n• ${
              safeTradeHistory.length
            } trades\n• Notes: ${safeNotesContent ? "Yes" : "No"}\n• Tags: ${
              safeTags.length
            }\n• Images: ${
              safeImages.length
            }\n• Net P&L: ₹${safePerformanceMetrics.netPnL.toLocaleString(
              "en-IN"
            )}`
          );
        }
      } else {
        const errorText = await response.text();
        console.error(
          `❌ Save failed with status ${response.status}:`,
          errorText
        );
        throw new Error(
          `Failed to save to Google Cloud: ${response.status} ${errorText}`
        );
      }
    } catch (error) {
      console.error("❌ Error saving to Google Cloud journal database:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(
        `❌ Failed to save trading data to Google Cloud: ${errorMessage}. Please try again.`
      );
    }
  };

  // Calculate performance metrics from actual trade history data
  const performanceMetrics = useMemo(() => {
    if (!tradeHistoryData || tradeHistoryData.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalProfit: 0,
        totalLoss: 0,
        netPnL: 0,
        winRate: "0.0",
      };
    }

    // Parse P&L values from trade history data
    const tradesPnL = tradeHistoryData.map((trade) => {
      // Parse P&L string (e.g., "+₹2850", "-₹1200", "₹0") to number
      const pnlStr = (trade.pnl || "").replace(/[₹,+\s]/g, ""); // Remove ₹, commas, + and spaces
      const pnlValue = parseFloat(pnlStr) || 0;
      return pnlValue;
    });

    const totalTrades = tradesPnL.length;
    const winningTrades = tradesPnL.filter((pnl) => pnl > 0).length;
    const losingTrades = tradesPnL.filter((pnl) => pnl < 0).length;
    const totalProfit = tradesPnL
      .filter((pnl) => pnl > 0)
      .reduce((sum, pnl) => sum + pnl, 0);
    const totalLoss = Math.abs(
      tradesPnL.filter((pnl) => pnl < 0).reduce((sum, pnl) => sum + pnl, 0)
    );
    const netPnL = tradesPnL.reduce((sum, pnl) => sum + pnl, 0);
    const closedTrades = winningTrades + losingTrades;
    const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      totalProfit,
      totalLoss,
      netPnL,
      winRate: winRate.toFixed(1),
    };
  }, [tradeHistoryData]);

  // Import handling functions
  const calculateSimplePnL = (trades: any[]) => {
    const processedTrades = [...trades];
    const positions: {
      [symbol: string]: {
        qty: number;
        avgPrice: number;
        firstTradeTime: string;
      };
    } = {};

    for (let i = 0; i < processedTrades.length; i++) {
      const trade = processedTrades[i];
      const symbol = trade.symbol;

      // Initialize position tracking for this symbol
      if (!positions[symbol]) {
        positions[symbol] = { qty: 0, avgPrice: 0, firstTradeTime: trade.time };
      }

      if (trade.order === "BUY") {
        // Add to position
        const currentValue = positions[symbol].qty * positions[symbol].avgPrice;
        const newValue = trade.qty * trade.price;
        const totalQty = positions[symbol].qty + trade.qty;

        if (totalQty > 0) {
          positions[symbol].avgPrice = (currentValue + newValue) / totalQty;
        }
        positions[symbol].qty = totalQty;

        // If this is the first trade for this symbol, record the time
        if (positions[symbol].qty === trade.qty) {
          positions[symbol].firstTradeTime = trade.time;
        }
      } else if (trade.order === "SELL") {
        // Close position (partial or full)
        if (positions[symbol].qty > 0) {
          // Calculate P&L for the quantity being sold
          const pnlPerShare = trade.price - positions[symbol].avgPrice;
          const totalPnL = pnlPerShare * trade.qty;

          // Calculate duration from first buy to this sell
          const entryTime = new Date(
            `1970-01-01 ${positions[symbol].firstTradeTime}`
          );
          const exitTime = new Date(`1970-01-01 ${trade.time}`);
          const durationMs = exitTime.getTime() - entryTime.getTime();
          const minutes = Math.floor(durationMs / 60000);
          const seconds = Math.floor((durationMs % 60000) / 1000);
          const durationText = `${minutes}m ${seconds}s`;

          // Set P&L and duration on this SELL trade
          processedTrades[i].pnl = `₹${totalPnL.toFixed(2)}`;
          processedTrades[i].duration = durationText;

          // Reduce position
          positions[symbol].qty -= trade.qty;

          // If position is fully closed, reset
          if (positions[symbol].qty <= 0) {
            positions[symbol] = { qty: 0, avgPrice: 0, firstTradeTime: "" };
          }
        }
      }
    }

    // Sort processed trades by time (earliest first) to maintain chronological order
    processedTrades.sort((a, b) => {
      const timeA = convertTimeToComparable(a.time);
      const timeB = convertTimeToComparable(b.time);
      return timeA.localeCompare(timeB);
    });

    return processedTrades;
  };

  const parseCSVData = (csvText: string) => {
    try {
      const lines = csvText.trim().split("\n");
      const data = [];

      for (const line of lines) {
        if (line.trim()) {
          // Handle comma-separated (CSV), tab-separated, and space-separated data
          let parts = [];
          if (line.includes(",")) {
            // CSV format: split by commas and trim each part
            parts = line
              .trim()
              .split(",")
              .map((part) => part.trim())
              .filter((part) => part.length > 0);
          } else if (line.includes("\t")) {
            // Tab-separated format: split by tabs only and trim each part
            parts = line
              .trim()
              .split("\t")
              .map((part) => part.trim())
              .filter((part) => part.length > 0);
          } else {
            // Space-separated format: split by multiple spaces
            parts = line
              .trim()
              .split(/\s{2,}/)
              .map((part) => part.trim())
              .filter((part) => part.length > 0);
          }

          // Simple direct mapping approach - expect fields in order
          if (parts.length >= 4) {
            let startIndex = 0;

            // Check if first column is a date (like "10-Jun", "10/06", etc.)
            if (
              parts[0] &&
              (parts[0].includes("-") || parts[0].includes("/")) &&
              parts[1] &&
              (parts[1].includes(":") ||
                parts[1].includes("AM") ||
                parts[1].includes("PM"))
            ) {
              // Format: Date, Time, Order, Symbol, Type, Qty, Price
              startIndex = 1; // Skip the date column
            }

            // Expected format: Time, Order, Symbol, Type, Qty, Price (with optional date at start)
            let time = parts[startIndex] || "";
            let order = parts[startIndex + 1] || "";
            let symbol = parts[startIndex + 2] || "";
            let type = parts[startIndex + 3] || "MIS";
            let qtyStr = parts[startIndex + 4] || "";
            let priceStr = parts[startIndex + 5] || parts[startIndex + 4] || ""; // Price might be in position 4 or 5

            // Clean up time (handle "9:57:26 AM" format)
            if (
              time &&
              !time.includes("AM") &&
              !time.includes("PM") &&
              parts.length > startIndex + 1
            ) {
              // Check if next part is AM/PM
              if (
                parts[startIndex + 1] &&
                (parts[startIndex + 1].toUpperCase() === "AM" ||
                  parts[startIndex + 1].toUpperCase() === "PM")
              ) {
                time = `${time} ${parts[startIndex + 1]}`;
                order = parts[startIndex + 2] || "";
                symbol = parts[startIndex + 3] || "";
                type = parts[startIndex + 4] || "MIS";
                qtyStr = parts[startIndex + 5] || "";
                priceStr = parts[startIndex + 6] || parts[startIndex + 5] || "";
              }
            }

            // Extract quantity from "225 / 225" format
            let qty = 0;
            if (qtyStr) {
              const qtyMatch = qtyStr.match(/(\d+)/);
              if (qtyMatch) {
                qty = parseInt(qtyMatch[1]);
              }
            }

            // Extract price from "200.00 / 200.00 trg." format
            let price = 0;
            if (priceStr) {
              const priceMatch = priceStr.match(/(\d+\.?\d*)/);
              if (priceMatch) {
                price = parseFloat(priceMatch[1]);
              }
            }

            // Clean up order type
            order = order.toUpperCase();
            if (!["BUY", "SELL"].includes(order)) {
              // Skip invalid orders
              continue;
            }

            // Clean up type
            type = type.toUpperCase();
            if (!["MIS", "CNC", "NRML", "BFO", "LIM", "LIMIT"].includes(type)) {
              type = "MIS"; // Default
            }

            // Clean symbol - remove NFO, BFO suffixes if present
            symbol = symbol.replace(/\s+(NFO|BFO)$/i, "").trim();

            // Only add trade if we have essential fields
            if (time && order && symbol && qty > 0) {
              const trade = {
                time: time,
                order: order,
                symbol: symbol,
                type: type,
                qty: qty,
                price: price,
                pnl: "-",
                duration: "-",
              };

              data.push(trade);
            }
          }
        }
      }

      // Sort trades by time (earliest first)
      data.sort((a, b) => {
        const timeA = convertTimeToComparable(a.time);
        const timeB = convertTimeToComparable(b.time);
        return timeA.localeCompare(timeB);
      });

      return data;
    } catch (error) {
      throw new Error(
        "Failed to parse trade data. Please check the format and try again."
      );
    }
  };

  // Helper function to convert time strings to comparable format
  const convertTimeToComparable = (timeStr: string) => {
    try {
      // Handle formats like "12:13:17 PM" or "12:13:17"
      let time = timeStr.trim();

      // If no AM/PM, assume 24-hour format
      if (!time.includes("AM") && !time.includes("PM")) {
        return time.padStart(8, "0"); // Ensure consistent format like "12:13:17"
      }

      // Convert 12-hour to 24-hour format for proper sorting
      const match = time.match(/(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2];
        const seconds = match[3];
        const period = match[4].toUpperCase();

        // Convert to 24-hour format
        if (period === "AM" && hours === 12) {
          hours = 0;
        } else if (period === "PM" && hours !== 12) {
          hours += 12;
        }

        return `${hours.toString().padStart(2, "0")}:${minutes}:${seconds}`;
      }

      return time;
    } catch (error) {
      return timeStr; // Fallback to original string
    }
  };

  const calculatePnLAndDuration = (trades: any[]) => {
    const processedTrades = [...trades];
    const openTrades: { [symbol: string]: any[] } = {};

    // Process each trade and match with open positions
    for (let i = 0; i < processedTrades.length; i++) {
      const trade = processedTrades[i];
      const symbol = trade.symbol;

      if (!openTrades[symbol]) {
        openTrades[symbol] = [];
      }

      // Find matching open trade with opposite order type (partial or full match)
      let matchedIndex = -1;
      for (let j = 0; j < openTrades[symbol].length; j++) {
        const openTrade = openTrades[symbol][j];
        if (openTrade.order !== trade.order && openTrade.qty >= trade.qty) {
          matchedIndex = j;
          break;
        }
      }

      if (matchedIndex !== -1) {
        // Found a match - calculate P&L and duration
        const openTrade = openTrades[symbol][matchedIndex];

        // Calculate P&L based on first order type (using closing quantity)
        let pnlPerShare = 0;
        if (openTrade.order === "BUY") {
          // Long position: Buy first, then Sell
          pnlPerShare = trade.price - openTrade.price;
        } else {
          // Short position: Sell first, then Buy
          pnlPerShare = openTrade.price - trade.price;
        }

        // Multiply by CLOSING quantity (trade.qty) to get total P&L
        const totalPnL = pnlPerShare * trade.qty;

        // Calculate duration
        const openTime = new Date(`1970-01-01 ${openTrade.time}`);
        const closeTime = new Date(`1970-01-01 ${trade.time}`);
        const durationMs = closeTime.getTime() - openTime.getTime();
        const durationMinutes = Math.floor(durationMs / 60000);
        const durationSeconds = Math.floor((durationMs % 60000) / 1000);
        const durationText = `${durationMinutes}m ${durationSeconds}s`;

        // Only show P&L and duration on the closing trade
        // For LONG (BUY first): Show on SELL row
        // For SHORT (SELL first): Show on BUY row

        if (openTrade.order === "BUY") {
          // Long position: BUY first, show P&L on SELL (current trade)
          processedTrades[i].pnl = `₹${totalPnL.toFixed(2)}`;
          processedTrades[i].duration = durationText;
        } else {
          // Short position: SELL first, show P&L on BUY (current trade)
          processedTrades[i].pnl = `₹${totalPnL.toFixed(2)}`;
          processedTrades[i].duration = durationText;
        }

        // Handle partial vs full exit
        if (openTrade.qty === trade.qty) {
          // Full exit - remove the open trade
          openTrades[symbol].splice(matchedIndex, 1);
        } else {
          // Partial exit - reduce the open trade quantity
          openTrade.qty -= trade.qty;
        }
      } else {
        // No match found - add to open trades
        openTrades[symbol].push(trade);
      }
    }

    return processedTrades;
  };

  const handleImportData = () => {
    try {
      setImportError("");

      if (!importData.trim()) {
        setImportError("Please paste trade data");
        return;
      }

      // Parse the trade data using the new format
      const parsedData = parseCSVData(importData);

      // Simple P&L calculation without quantity modification
      const processedData = calculateSimplePnL(parsedData);

      // Final sort by time to ensure chronological order in display
      const sortedData = processedData.sort((a, b) => {
        const timeA = convertTimeToComparable(a.time);
        const timeB = convertTimeToComparable(b.time);
        return timeA.localeCompare(timeB);
      });

      setTradeHistoryData(sortedData);
      setShowImportModal(false);
      setImportData("");
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      reader.readAsText(file);
    } else {
      setImportError("Please upload a valid CSV file");
    }
  };

  const handleBrokerImport = (trades: BrokerTrade[]) => {
    const convertedTrades = trades.map((trade) => ({
      time: new Date(trade.executedAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      order: trade.action,
      symbol: trade.symbol,
      type: "MKT",
      qty: trade.quantity,
      price: trade.price,
      pnl: trade.pnl ? `₹${trade.pnl}` : "-",
      duration: "-",
    }));

    setTradeHistoryData((prev) => [...convertedTrades, ...prev]);
    setShowBrokerImportModal(false);
  };

  // Helper function to handle tab changes with audio stopping
  const handleTabChange = (newTab: string) => {
    // Stop any playing news audio when switching tabs
    if (window.stopNewsAudio) {
      window.stopNewsAudio();
    }
    setActiveTab(newTab);
  };

  // Expose tab state management to window for navigation preservation
  useEffect(() => {
    window.getActiveTab = () => {
      console.log("🔍 Getting active tab:", activeTab);
      return activeTab;
    };
    window.setActiveTab = (tab: string) => {
      console.log("🎯 Setting active tab to:", tab);
      setActiveTab(tab);
    };

    console.log("📱 Tab functions exposed, current tab:", activeTab);

    return () => {
      delete window.getActiveTab;
      delete window.setActiveTab;
    };
  }, [activeTab]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    if (
      tab &&
      [
        "strategy-build",
        "dashboard",
        "cb",
        "chart",
        "check",
        "4candle",
        "scanner",
        "complete-flexible",
        "backtest",
        "simulator",
        "documentation",
        "journal",
        "insights",
        "voice",
        "portfolio",
        "risk-management",
      ].includes(tab)
    ) {
      setActiveTab(tab);
    }
  }, [location]);

  // Render social feed with full-width layout (no sidebar)
  if (activeTab === "voice") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Full-width Social Feed - No Sidebar */}
        <main className="h-screen w-full">
          <NeoFeedSocialFeed onBackClick={() => setActiveTab("trading-home")} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overscroll-none touch-pan-y">
      {/* Vertical Sidebar - Fixed Position */}
      <div className="fixed left-0 top-0 bottom-0 w-64 chatgpt-sidebar border-r border-gray-700 flex flex-col z-40 md:bottom-0 bottom-[env(safe-area-inset-bottom)] pb-[env(safe-area-inset-bottom)] touch-none hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-semibold sidebar-text">
            Trading Platform
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <div className="space-y-1">
            <p className="text-xs font-medium sidebar-muted uppercase tracking-wide mb-3">
              Dashboard & Overview
            </p>

            <button
              onClick={() => handleTabClick("dashboard")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                activeTab === "dashboard"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Star className="h-4 w-4" />
              Market Dashboard
            </button>
          </div>

          <div className="space-y-1 pt-4">
            <p className="text-xs font-medium sidebar-muted uppercase tracking-wide mb-3">
              Core Trading Tools
            </p>

            <button
              onClick={() => handleTabClick("backtest")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "backtest"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Backtest
            </button>

            <button
              onClick={() => setActiveTab("chart")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "chart"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Trading Charts
            </button>

            <button
              onClick={() => setActiveTab("check")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "check"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              BATTU Scan
            </button>

            <button
              onClick={() => setActiveTab("4candle")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "4candle"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              4 Candle Rule
            </button>

            <button
              onClick={() => setActiveTab("scanner")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "scanner"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Complete Scanner
            </button>

            <button
              onClick={() => setActiveTab("trading-master")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "trading-master"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Trading Master
              </div>
            </button>
          </div>

          <div className="space-y-1 pt-4">
            <p className="text-xs font-medium sidebar-muted uppercase tracking-wide mb-3">
              Analysis & Monitoring
            </p>

            <button
              onClick={() => handleTabClick("backtest")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "backtest"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Backtest
            </button>

            <button
              onClick={() => setActiveTab("cb")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "cb"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Historical Data
            </button>

            <button
              onClick={() => setActiveTab("simulator")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "simulator"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Trade Simulator
            </button>

            <button
              onClick={() => setActiveTab("journal")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "journal"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Journal
              </div>
            </button>

            <button
              onClick={() => handleTabClick("insights")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "insights"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Insights
              </div>
            </button>
          </div>

          <div className="space-y-1 pt-4">
            <p className="text-xs font-medium sidebar-muted uppercase tracking-wide mb-3">
              Tools & Support
            </p>

            <button
              onClick={() => setActiveTab("tutor")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "tutor"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Tutor
              </div>
            </button>

            <button
              onClick={() => setActiveTab("voice")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "voice"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Social Feed
              </div>
            </button>

            <button
              onClick={() => setActiveTab("documentation")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "documentation"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Documentation
            </button>

            <button
              onClick={() => setActiveTab("strategy-build")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "strategy-build"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Strategy Build
            </button>

            <button
              onClick={() => handleTabClick("trading-home")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "trading-home"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-2">
                <HomeIcon className="h-4 w-4" />
                Trading Home
              </div>
            </button>

            <button
              onClick={() => handleTabClick("stock-news")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === "stock-news"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                Stock News
              </div>
            </button>
          </div>
        </nav>

        {/* Status Section */}
        <div className="p-4 border-t border-gray-700 space-y-3">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs sidebar-muted">Theme</span>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-2 py-1 rounded-md bg-accent hover:bg-accent/80 transition-colors text-xs sidebar-text border border-border"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-3 w-3" />
                  Light
                </>
              ) : (
                <>
                  <Moon className="h-3 w-3" />
                  Dark
                </>
              )}
            </button>
          </div>

          <div className="text-xs sidebar-muted text-center">
            Trading Platform v1.0
          </div>
        </div>
      </div>

      {/* Main Content Area - Full Width */}
      <div className="flex flex-col chatgpt-main-content min-h-screen md:min-h-screen min-h-[100dvh] overscroll-none">
        {/* Content */}
        <main className="flex-1 overflow-hidden">
          <div
            className={`h-full ${
              activeTab === "stock-news" ? "" : "overflow-auto"
            }`}
          >
            {/* Render content based on active tab */}

            {activeTab === "dashboard" && (
              <div className="space-y-8">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <Star className="h-6 w-6 text-yellow-400" />
                    <h2 className="text-2xl font-bold text-green-400">
                      Market Dashboard
                    </h2>
                  </div>
                  <p className="text-green-300">
                    Real-time market data and connection status
                  </p>
                </div>

                

                {/* Authentication Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AuthButton />
                  <ConnectionStatus />
                </div>

                {/* Live Market Data Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MonthlyProgressTracker />
                  <SigninDataWindow />
                  <ApiStatistics />
                </div>

                {/* Error Panel and Recent Activity - Bottom */}
                <ErrorPanel />
              </div>
            )}

            {activeTab === "trading-home" && (
              <div className="relative min-h-screen overflow-hidden">
                {/* Navigation Menu - Behind the home screen */}
                <div className="fixed inset-0 bg-gradient-to-b from-blue-800 to-blue-900 z-10">
                  <div className="pt-20 px-6 space-y-4 ml-auto md:w-80 w-64">
                    {/* User Profile Section with Firebase data */}
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <span className="text-white font-semibold text-xl">
                          {(currentUser.displayName || currentUser.username || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-base truncate">
                          {currentUser.displayName || 'User'}
                        </p>
                        <p className="text-blue-200 text-sm truncate">
                          @{currentUser.username || 'username'}
                        </p>
                      </div>
                    </div>

                    {/* Navigation Menu Items */}
                    <div className="space-y-2">
                      <button className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors" data-testid="nav-profile">
                        profile
                      </button>
                      <button className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors" data-testid="nav-saved">
                        saved
                      </button>
                      <button 
                        onClick={() => {
                          setActiveTab("dashboard");
                          setIsNavOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2" 
                        data-testid="nav-dashboard"
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span>dashboard</span>
                      </button>
                      <button className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors" data-testid="nav-settings">
                        setting & privacy
                      </button>
                      <button 
                        onClick={toggleTheme}
                        className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2" 
                        data-testid="nav-darkmode"
                      >
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        <span>dark mode</span>
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            await signOut(auth);
                            localStorage.clear();
                            window.location.href = "/";
                          } catch (error) {
                            console.error("Logout error:", error);
                          }
                        }}
                        className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2" 
                        data-testid="nav-logout"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>logout</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Home Screen - Stacks on top with card effect */}
                <div 
                  onClick={() => isNavOpen && setIsNavOpen(false)}
                  className={`min-h-screen bg-gray-900 flex flex-col transition-all duration-500 ease-out relative z-20 ${
                    isNavOpen 
                      ? 'scale-90 -translate-x-[70%] rounded-2xl shadow-2xl' 
                      : 'scale-100 translate-x-0'
                  }`}
                  style={{
                    transformOrigin: 'right center',
                  }}
                >
                  {/* Two-line Hamburger Icon - Mobile only */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsNavOpen(!isNavOpen);
                    }}
                    className="md:hidden fixed top-4 right-4 z-50 w-10 h-10 flex flex-col items-center justify-center gap-1.5 bg-transparent hover:bg-white/10 rounded-lg transition-all duration-300"
                    data-testid="button-nav-toggle"
                  >
                    <div className={`h-0.5 bg-white transition-all duration-300 ${isNavOpen ? 'w-5 rotate-45 translate-y-1' : 'w-5'}`}></div>
                    <div className={`h-0.5 bg-white transition-all duration-300 ${isNavOpen ? 'w-5 -rotate-45 -translate-y-1' : 'w-4 ml-1'}`}></div>
                  </button>

                {/* World Map Section: Takes 25% of the total height */}
                <div className="px-8 pt-1 pb-1 flex items-center justify-center h-1/4">
                  {/* World Map */}
                  <WorldMap />
                </div>
                {/* Blue Section: Takes 75% of the total height - Fixed height, not expanding */}
                <div className="md:h-3/4 h-[75vh] w-full bg-blue-900 flex flex-col items-center justify-start md:py-4 py-0 md:px-4 px-0 relative">
                  <div className="max-w-4xl w-full md:space-y-4">
                    {/* Greeting - Hidden on mobile */}
                    <div className="text-center spacey-4 md:block hidden">
                      <div className="flex items-center justify-center gap-3">
                        <Sparkles className="4-5 w-4 text-blue-400" />
                        <h1 className="text-2xl font-normal text-gray-100">
                          Welcome to Trading Platform
                        </h1>
                      </div>
                    </div>

                    {/* Search Input - Hidden on mobile */}
                    <div
                      className={`relative mx-auto transition-all duration-300 md:block hidden ${
                        isSearchActive ? "max-w-4xl" : "max-w-2xl"
                      }`}
                    >
                      <Input
                        placeholder="Search stocks, technical analysis, social feed, news, journal, alerts, or ask AI anything..."
                        value={searchQuery}
                        onFocus={() => setIsSearchActive(true)}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSearchQuery(value);
                          setIsSearchActive(value.length > 0);
                        }}
                        onKeyPress={async (e) => {
                          if (e.key === "Enter" && searchQuery.trim()) {
                            await handleSearch();
                          }
                        }}
                        className={`w-full transition-all duration-300 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 pr-12 text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isSearchActive
                            ? "h-14 rounded-xl"
                            : "h-12 rounded-2xl"
                        }`}
                      />
                      <Button
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-700 hover:bg-gray-600 text-gray-300 h-6 w-6 p-0"
                        onClick={() => handleSearch()}
                        disabled={!searchQuery.trim() || isSearchLoading}
                      >
                        {isSearchLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* AI Search Results - Desktop only */}
                    {isSearchActive && (
                      <div className="max-w-5xl mx-auto mt-4 animate-in slide-in-from-top-4 duration-300 md:block hidden">
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                          {searchResults ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 pb-3 border-b border-gray-700">
                                <Bot className="h-4 w-4 text-blue-400" />
                                <h3 className="text-lg font-medium text-gray-100">
                                  AI Assistant
                                </h3>
                              </div>
                              <div className="prose prose-invert max-w-none">
                                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                  {(() => {
                                    // Render text with inline charts
                                    if (
                                      searchResults.includes(
                                        "[CHART:PERFORMANCE_TREND]"
                                      )
                                    ) {
                                      const parts = searchResults.split(
                                        "[CHART:PERFORMANCE_TREND]"
                                      );
                                      const chartData =
                                        (window as any)
                                          .performanceTrendChartData || [];

                                      return (
                                        <>
                                          {parts[0]}
                                          {chartData.length > 0 && (
                                            <div className="my-4 bg-gray-900/50 rounded-lg p-3 border border-gray-600">
                                              <div className="h-32 w-full">
                                                <ResponsiveContainer
                                                  width="100%"
                                                  height="100%"
                                                >
                                                  <AreaChart
                                                    data={chartData}
                                                    margin={{
                                                      top: 20,
                                                      right: 20,
                                                      left: 10,
                                                      bottom: 5,
                                                    }}
                                                  >
                                                    <defs>
                                                      <linearGradient
                                                        id="aiAreaGradient"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1"
                                                      >
                                                        <stop
                                                          offset="0%"
                                                          stopColor="rgb(107, 114, 128)"
                                                          stopOpacity={0.6}
                                                        />
                                                        <stop
                                                          offset="100%"
                                                          stopColor="rgb(107, 114, 128)"
                                                          stopOpacity={0.1}
                                                        />
                                                      </linearGradient>
                                                    </defs>
                                                    <XAxis
                                                      dataKey="day"
                                                      axisLine={false}
                                                      tickLine={false}
                                                      tick={false}
                                                      className="text-slate-500 dark:text-slate-400"
                                                    />
                                                    <YAxis
                                                      axisLine={false}
                                                      tickLine={false}
                                                      tick={{
                                                        fontSize: 10,
                                                        fill: "#64748b",
                                                      }}
                                                      tickFormatter={(value) =>
                                                        `${
                                                          value >= 0 ? "" : "-"
                                                        }${(
                                                          Math.abs(value) / 1000
                                                        ).toFixed(0)}K`
                                                      }
                                                      domain={[
                                                        "dataMin - 1000",
                                                        "dataMax + 1000",
                                                      ]}
                                                      className="text-slate-500 dark:text-slate-400"
                                                    />
                                                    <Tooltip
                                                      contentStyle={{
                                                        background:
                                                          "var(--background)",
                                                        border:
                                                          "1px solid var(--border)",
                                                        borderRadius: "8px",
                                                        color:
                                                          "var(--foreground)",
                                                        fontSize: "11px",
                                                        padding: "6px 10px",
                                                      }}
                                                      formatter={(
                                                        value: any
                                                      ) => [
                                                        `${
                                                          value >= 0
                                                            ? "₹"
                                                            : "-₹"
                                                        }${Math.abs(
                                                          value
                                                        ).toLocaleString()}`,
                                                        "Daily P&L",
                                                      ]}
                                                      labelFormatter={(label) =>
                                                        `${label}`
                                                      }
                                                    />
                                                    <Area
                                                      type="monotone"
                                                      dataKey="value"
                                                      stroke="#000000"
                                                      strokeWidth={2}
                                                      fill="url(#aiAreaGradient)"
                                                      dot={false}
                                                      activeDot={{
                                                        r: 4,
                                                        stroke: "#000000",
                                                        strokeWidth: 1,
                                                        fill: "#ffffff",
                                                      }}
                                                    />
                                                  </AreaChart>
                                                </ResponsiveContainer>
                                              </div>
                                            </div>
                                          )}
                                          {parts[1] || ""}
                                        </>
                                      );
                                    }
                                    return searchResults;
                                  })()}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSearchQuery("");
                                    setIsSearchActive(false);
                                    setSearchResults("");
                                  }}
                                  className="text-gray-400 hover:text-gray-200"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Clear
                                </Button>
                              </div>
                            </div>
                          ) : searchQuery && !isSearchLoading ? (
                            <div className="text-center text-gray-400 py-8">
                              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>
                                Press Enter or click the search button to get AI
                                assistance
                              </p>
                            </div>
                          ) : isSearchLoading ? (
                            <div className="text-center text-gray-400 py-8">
                              <div className="flex items-center justify-center gap-3">
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <p>Getting AI assistance...</p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}

                    {/* Enhanced AI Suggestion Buttons - Desktop only */}
                    <div className="md:flex hidden flex-wrap items-center justify-center gap-3 max-w-6xl mx-auto">
                      {/* <Button
                        variant="secondary"
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0 h-11 px-4 rounded-full font-medium transition-all duration-200"
                        onClick={() =>
                          handleSuggestionClick(
                            "Get live stock prices and fundamentals for NIFTY, SENSEX, and top Indian stocks"
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Stock Prices</span>
                        </div>
                      </Button> */}

                      <Button
                        variant="secondary"
                        className="bg-cyan-600 hover:bg-cyan-700  text-white border-0 h-7 px-2 rounded-full text-xs font-medium transition-all duration-200"
                        onClick={() =>
                          handleSuggestionClick(
                            "RSI technical analysis for RELIANCE"
                          )
                        }
                      >
                        <div className="flex items-center justify-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          <span>Technical Analysis</span>
                        </div>
                      </Button>

                      <Button
                        variant="secondary"
                        className="bg-pink-600 hover:bg-pink-700  text-white border-0 h-7 px-2 rounded-full text-xs font-medium transition-all duration-200"
                        onClick={() =>
                          handleSuggestionClick(
                            "Social feed community discussions and trending topics"
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span>Social Feed</span>
                        </div>
                      </Button>

                      <Button
                        variant="secondary"
                        className="bg-green-600 hover:bg-green-700 text-white border-0 h-7 px-2 rounded-full text-xs font-medium transition-all duration-200"
                        onClick={() =>
                          handleSuggestionClick(
                            "What are today's top financial news and market updates?"
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          <Newspaper className="h-3 w-3" />
                          <span>Market News</span>
                        </div>
                      </Button>

                      <Button
                        variant="secondary"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 h-7 px-2 rounded-full text-xs font-medium transition-all duration-200"
                        onClick={generateJournalAIReport}
                        data-testid="button-trading-journal"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          <span>Trading Journal</span>
                        </div>
                      </Button>

                      {/* <Button
                        variant="secondary"
                        className="bg-yellow-600 hover:bg-yellow-700 text-white border-0 h-11 px-4 rounded-full font-medium transition-all duration-200"
                        onClick={() =>
                          handleSuggestionClick(
                            "Add TCS to watchlist and set alerts"
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          <span>Quick Actions</span>
                        </div>
                      </Button> */}

                      {/* <Button
                        variant="secondary"
                        className="bg-purple-600 hover:bg-purple-700 text-white border-0 h-11 px-4 rounded-full font-medium transition-all duration-200"
                        onClick={() =>
                          handleSuggestionClick(
                            "Show me upcoming IPOs and recent IPO performance in Indian markets"
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          <span>IPO Updates</span>
                        </div>
                      </Button> */}

                      <Button
                        variant="secondary"
                        className="bg-orange-600 hover:bg-orange-700  text-white border-0 h-7 px-2 rounded-full text-xs font-medium transition-all duration-200"
                        onClick={() =>
                          handleSuggestionClick(
                            "Analyze fundamentals for top stocks - P/E ratio, market cap, growth metrics"
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-3 w-3" />
                          <span>Fundamentals</span>
                        </div>
                      </Button>
                    </div>

                    {/* Mobile Welcome Text - Fixed position in blue area */}
                    <div className="md:hidden flex items-center justify-center gap-2 pt-4 pb-6 px-4 relative z-10">
                      <Sparkles className="h-4 w-4 text-blue-400" />
                      <h1 className="text-base font-normal text-gray-100">
                        Welcome to Trading Platform
                      </h1>
                    </div>

                    {/* Trading Tools Section - White container moved up with all rounded corners */}
                    <div className="bg-white md:pt-1 pt-4 pb-4 md:pb-4 md:rounded-3xl rounded-3xl relative pointer-events-auto touch-pan-y md:min-h-[250px] flex-shrink-0 md:flex-1 mt-0">
                      {/* Mobile Search Bar - Fully visible at top */}
                      <div className="md:hidden absolute -top-3 left-4 right-4 z-50">
                        <div className="relative">
                          <Input
                            placeholder="Search stocks, technical analysis, social feed..."
                            value={searchQuery}
                            onFocus={() => setIsSearchActive(true)}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSearchQuery(value);
                              setIsSearchActive(value.length > 0);
                            }}
                            onKeyPress={async (e) => {
                              if (e.key === "Enter" && searchQuery.trim()) {
                                await handleSearch();
                              }
                            }}
                            className="w-full h-12 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 pr-12 text-sm rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
                          />
                          <Button
                            size="sm"
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-700 hover:bg-gray-600 text-gray-300"
                            onClick={() => handleSearch()}
                            disabled={!searchQuery.trim() || isSearchLoading}
                          >
                            {isSearchLoading ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        
                        {/* Mobile Quick Suggestion Buttons - Horizontal scroll when search is active */}
                        {isSearchActive && (
                          <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <Button
                              variant="secondary"
                              className="bg-blue-600 hover:bg-blue-700 text-white border-0 h-7 px-3 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0"
                              onClick={() =>
                                handleSuggestionClick(
                                  "Show me live stock prices for ICICI Bank and TCS"
                                )
                              }
                            >
                              <div className="flex items-center gap-1.5">
                                <TrendingUp className="h-3 w-3" />
                                <span>Stock Prices</span>
                              </div>
                            </Button>

                            <Button
                              variant="secondary"
                              className="bg-pink-600 hover:bg-pink-700 text-white border-0 h-7 px-3 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0"
                              onClick={() =>
                                handleSuggestionClick(
                                  "Social feed community discussions and trending topics"
                                )
                              }
                            >
                              <div className="flex items-center gap-1.5">
                                <User className="h-3 w-3" />
                                <span>Social Feed</span>
                              </div>
                            </Button>

                            <Button
                              variant="secondary"
                              className="bg-green-600 hover:bg-green-700 text-white border-0 h-7 px-3 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0"
                              onClick={() =>
                                handleSuggestionClick(
                                  "What are today's top financial news and market updates?"
                                )
                              }
                            >
                              <div className="flex items-center gap-1.5">
                                <Newspaper className="h-3 w-3" />
                                <span>Market News</span>
                              </div>
                            </Button>

                            <Button
                              variant="secondary"
                              className="bg-orange-600 hover:bg-orange-700 text-white border-0 h-7 px-3 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0"
                              onClick={() =>
                                handleSuggestionClick(
                                  "Analyze fundamentals for top stocks - P/E ratio, market cap, growth metrics"
                                )
                              }
                            >
                              <div className="flex items-center gap-1.5">
                                <BarChart3 className="h-3 w-3" />
                                <span>Fundamentals</span>
                              </div>
                            </Button>
                          </div>
                        )}
                      </div>
                      {/* Trading Tools Grid - Desktop: 4 columns, Mobile: 3 horizontal cards + swipeable below */}
                      <div className="md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:px-8 md:pb-0 hidden">
                        {/* Social Feed Card */}
                        <div
                          className="bg-blue-500 rounded-2xl overflow-hidden h-48 relative cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setActiveTab("voice")}
                        >
                          <div className="absolute top-4 left-4">
                            <span className="bg-white bg-opacity-90 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                              Social Feed
                            </span>
                          </div>
                          <div className="absolute bottom-4 right-4">
                            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                              <MessageCircle className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Trading Master Card */}
                        <div
                          className="bg-indigo-500 rounded-2xl overflow-hidden h-48 relative cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setActiveTab("trading-master")}
                        >
                          <div className="absolute top-4 left-4">
                            <span className="bg-white bg-opacity-90 text-indigo-600 px-3 py-1 rounded-full text-sm font-medium">
                              Trading Master
                            </span>
                          </div>
                          <div className="absolute bottom-4 right-4">
                            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                              <Activity className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Trading Charts Card */}
                        <div
                          className="bg-emerald-500 rounded-2xl overflow-hidden h-48 relative cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setActiveTab("journal")}
                        >
                          <div className="absolute top-4 left-4">
                            <span className="bg-white bg-opacity-90 text-emerald-600 px-3 py-1 rounded-full text-sm font-medium">
                              Journal
                            </span>
                          </div>
                          <div className="absolute bottom-4 right-4">
                            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                              <BarChart3 className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Tutor Daily News Swipeable Cards - No Container */}
                        <div className="relative h-48 flex items-center justify-center">
                          <SwipeableCardStack
                            onSectorChange={handleSectorChange}
                            selectedSector={selectedSector}
                            onCardIndexChange={setCurrentCardIndex}
                            currentCardIndex={currentCardIndex}
                          />
                        </div>
                      </div>
                      {/* Mobile Layout: 3 horizontal cards + swipeable below */}
                      <div className="md:hidden mt-6">
                        {/* Three cards in a row */}
                        <div className="grid grid-cols-3 gap-3 px-4 mb-3">
                          {/* Social Feed Card */}
                          <div
                            className="bg-blue-500 rounded-xl overflow-hidden h-20 relative cursor-pointer active:scale-95 transition-transform"
                            onClick={() => setActiveTab("voice")}
                          >
                            <div className="absolute top-2 left-2">
                              <span className="bg-white bg-opacity-90 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                Social Feed
                              </span>
                            </div>
                            <div className="absolute bottom-2 right-2">
                              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <MessageCircle className="h-5 w-5 text-white" />
                              </div>
                            </div>
                          </div>

                          {/* Trading Master Card */}
                          <div
                            className="bg-purple-500 rounded-xl overflow-hidden h-20 relative cursor-pointer active:scale-95 transition-transform"
                            onClick={() => setActiveTab("trading-master")}
                          >
                            <div className="absolute top-2 left-2">
                              <span className="bg-white bg-opacity-90 text-purple-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                Trading Master
                              </span>
                            </div>
                            <div className="absolute bottom-2 right-2">
                              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <Activity className="h-5 w-5 text-white" />
                              </div>
                            </div>
                          </div>

                          {/* Journal Card */}
                          <div
                            className="bg-green-500 rounded-xl overflow-hidden h-20 relative cursor-pointer active:scale-95 transition-transform"
                            onClick={() => setActiveTab("journal")}
                          >
                            <div className="absolute top-2 left-2">
                              <span className="bg-white bg-opacity-90 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                Journal
                              </span>
                            </div>
                            <div className="absolute bottom-2 right-2">
                              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <BarChart3 className="h-5 w-5 text-white" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Swipeable News Cards Below - Properly Centered */}
                        <div className="flex items-center justify-center px-4 pb-2">
                          <SwipeableCardStack
                            onSectorChange={handleSectorChange}
                            selectedSector={selectedSector}
                            onCardIndexChange={setCurrentCardIndex}
                            currentCardIndex={currentCardIndex}
                          />
                        </div>
                      </div>

                      {/* Navigation Dots - Outside white container, in blue area */}
                      <div className="md:hidden absolute -bottom-14 left-1/2 transform -translate-x-1/2 flex gap-2 justify-center z-40">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <button
                            key={index}
                            data-testid={`nav-dot-${index}`}
                            onClick={() => {
                              // Calculate how many swipes needed to get to this card
                              const diff = index - currentCardIndex;
                              // Navigate to the selected card (this would need to be implemented in SwipeableCardStack)
                              setCurrentCardIndex(index);
                            }}
                            className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer hover:scale-110 ${
                              index === currentCardIndex ? "bg-white scale-125" : "bg-white/40"
                            }`}
                          ></button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Animated Floating Tutor Button */}
                  <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto">
                    <div className="relative">
                      {/* Background animation rings */}
                      <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-violet-600/30 to-indigo-600/30 animate-ping pointer-events-none"></div>
                      <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-violet-600/20 to-indigo-600/20 animate-pulse pointer-events-none"></div>

                      {/* Main clickable button */}
                      <Button
                        onClick={() => setActiveTab("tutor")}
                        className="relative w-16 h-16 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-2xl hover:animate-none transition-all duration-300 border-4 border-white/20 pointer-events-auto animate-bounce hover:scale-110"
                      >
                        <ChevronUp className="h-8 w-8 text-gray-400 pointer-events-none" />
                      </Button>
                    </div>
                  </div>

                  {/* Tutor Vertical Sidebar - Slides from right */}
                  {showTutorOverlay && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
                        onClick={() => setShowTutorOverlay(false)}
                      />

                      {/* Sidebar */}
                      <div
                        className="fixed top-0 right-0 h-full w-96 bg-slate-900 z-50 shadow-2xl transition-transform duration-500 ease-out"
                        style={{
                          animation: "slideInFromRight 0.5s ease-out",
                        }}
                      >
                        {/* Header with close button */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                              <GraduationCap className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-lg font-semibold text-white">
                              AI Trading Tutor
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTutorOverlay(false)}
                            className="text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>

                        {/* Scrollable content */}
                        <div className="h-full overflow-y-auto pb-20">
                          <div className="p-4 space-y-6">
                            {/* Welcome message */}
                            <div className="text-center space-y-2">
                              <h2 className="text-xl font-bold text-white">
                                Learn & Master Trading
                              </h2>
                              <p className="text-slate-300 text-sm">
                                Interactive lessons and personalized guidance
                              </p>
                            </div>

                            {/* Quick access cards - vertical stack */}
                            <div className="space-y-4">
                              <div className="bg-slate-800 rounded-xl p-4 hover:bg-slate-700 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <BookOpen className="h-5 w-5 text-white" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-white">
                                    Trading Basics
                                  </h3>
                                </div>
                                <p className="text-slate-300 text-sm">
                                  Learn fundamental concepts and strategies
                                </p>
                              </div>

                              <div className="bg-slate-800 rounded-xl p-4 hover:bg-slate-700 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="h-5 w-5 text-white" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-white">
                                    Chart Analysis
                                  </h3>
                                </div>
                                <p className="text-slate-300 text-sm">
                                  Master technical analysis and patterns
                                </p>
                              </div>

                              <div className="bg-slate-800 rounded-xl p-4 hover:bg-slate-700 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                    <Target className="h-5 w-5 text-white" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-white">
                                    Risk Management
                                  </h3>
                                </div>
                                <p className="text-slate-300 text-sm">
                                  Protect your capital with smart strategies
                                </p>
                              </div>
                            </div>

                            {/* Additional learning sections */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-white">
                                Quick Actions
                              </h3>

                              <div className="bg-slate-800 rounded-xl p-4 hover:bg-slate-700 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                    <Lightbulb className="h-4 w-4 text-white" />
                                  </div>
                                  <span className="text-white font-medium">
                                    Trading Tips
                                  </span>
                                </div>
                              </div>

                              <div className="bg-slate-800 rounded-xl p-4 hover:bg-slate-700 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                                    <AlertCircle className="h-4 w-4 text-white" />
                                  </div>
                                  <span className="text-white font-medium">
                                    Market Alerts
                                  </span>
                                </div>
                              </div>

                              <div className="bg-slate-800 rounded-xl p-4 hover:bg-slate-700 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4 text-white" />
                                  </div>
                                  <span className="text-white font-medium">
                                    Performance Insights
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Global CSS for animations */}
                  <style>{`
                  @keyframes slideUpFromBottom {
                    from {
                      transform: translateY(100%);
                    }
                    to {
                      transform: translateY(0);
                    }
                  }
                  
                  @keyframes slideInFromRight {
                    from {
                      transform: translateX(100%);
                    }
                    to {
                      transform: translateX(0);
                    }
                  }
                `}</style>
                </div>
              </div>
              </div>
            )}

            {activeTab === "trading-master" && (
              <div className="h-full relative">
                {/* Back Button */}
                <Button
                  onClick={() => setActiveTab("trading-home")}
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  data-testid="button-back-to-home-trading-master"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <TradingMaster />
              </div>
            )}

            {activeTab === "journal" && (
              <div className="space-y-6 p-6 relative">
                {/* Back Button */}
                <Button
                  onClick={() => setActiveTab("trading-home")}
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  data-testid="button-back-to-home-journal"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <h2 className="text-2xl font-bold text-foreground">
                  Trading Journal
                </h2>

                {/* Main Journal Content - Mobile: Show only in "home" tab | Desktop: Always visible */}
                <div className={`${mobileBottomTab !== 'home' ? 'hidden md:block' : 'block'}`}>
                {/* PERFORMANCE TIMELINE - Responsive Three Blocks */}
                {/* Desktop: 3-column grid | Mobile: Single panel with carousel */}
                <div className="relative">
                  {/* Desktop: Grid Layout | Mobile: Single Panel */}
                  <div className="md:grid md:grid-cols-3 gap-6">
                  {/* Left Block - Performance Chart */}
                  <div className={`h-[400px] ${mobileJournalPanel === 0 ? 'block' : 'hidden'} md:block`}>
                    {/* Professional Visual Chart with Fyers Data - Same as Trading Master */}
                    <div className="h-full relative bg-slate-900 border border-slate-700 rounded-lg">
                      <div className="p-4 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                            {/* Stock Search Button - Mobile Compact */}
                            <Popover open={showStockSearch} onOpenChange={setShowStockSearch}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-gray-800 text-white border-gray-600 hover:bg-gray-700 h-8 px-2 md:px-3 text-xs md:text-sm"
                                  data-testid="button-stock-search"
                                >
                                  <Search className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                                  <span className="hidden md:inline">
                                    {selectedJournalSymbol.replace("NSE:", "").replace("-EQ", "").replace("-INDEX", "")}
                                  </span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72 p-3" align="start">
                                <div className="space-y-2">
                                  <Input
                                    placeholder="Search stocks..."
                                    value={stockSearchQuery}
                                    onChange={(e) => setStockSearchQuery(e.target.value)}
                                    className="text-sm"
                                    data-testid="input-stock-search"
                                  />
                                  <div className="max-h-64 overflow-y-auto space-y-1">
                                    {[
                                      { value: "NSE:NIFTY50-INDEX", label: "NIFTY 50" },
                                      { value: "NSE:SENSEX-INDEX", label: "SENSEX" },
                                      { value: "NSE:BANKNIFTY-INDEX", label: "BANK NIFTY" },
                                      { value: "NSE:RELIANCE-EQ", label: "RELIANCE" },
                                      { value: "NSE:TCS-EQ", label: "TCS" },
                                      { value: "NSE:HDFCBANK-EQ", label: "HDFC BANK" },
                                      { value: "NSE:INFY-EQ", label: "INFOSYS" },
                                      { value: "NSE:ICICIBANK-EQ", label: "ICICI BANK" },
                                      { value: "NSE:SBIN-EQ", label: "SBI" },
                                      { value: "NSE:BHARTIARTL-EQ", label: "BHARTI AIRTEL" },
                                      { value: "NSE:ITC-EQ", label: "ITC" },
                                      { value: "NSE:KOTAKBANK-EQ", label: "KOTAK BANK" },
                                      { value: "NSE:LT-EQ", label: "L&T" },
                                      { value: "NSE:AXISBANK-EQ", label: "AXIS BANK" },
                                      { value: "NSE:WIPRO-EQ", label: "WIPRO" },
                                    ]
                                      .filter((stock) =>
                                        stock.label.toLowerCase().includes(stockSearchQuery.toLowerCase())
                                      )
                                      .map((stock) => (
                                        <button
                                          key={stock.value}
                                          onClick={() => {
                                            setSelectedJournalSymbol(stock.value);
                                            setShowStockSearch(false);
                                            setStockSearchQuery("");
                                          }}
                                          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                            selectedJournalSymbol === stock.value
                                              ? "bg-blue-100 dark:bg-blue-900 font-medium"
                                              : ""
                                          }`}
                                          data-testid={`stock-option-${stock.value}`}
                                        >
                                          {stock.label}
                                        </button>
                                      ))}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>

                            {/* Time Interval Selector - Compact */}
                            <select
                              className="bg-gray-800 text-white border border-gray-600 rounded h-8 px-1.5 md:px-2 text-xs md:text-sm"
                              value={selectedJournalInterval}
                              onChange={(e) =>
                                setSelectedJournalInterval(e.target.value)
                              }
                              data-testid="select-interval"
                            >
                              <option value="1">1m</option>
                              <option value="5">5m</option>
                              <option value="15">15m</option>
                              <option value="30">30m</option>
                            </select>

                            {/* Date Picker - Mobile Icon Only */}
                            <div className="relative">
                              <input
                                type="date"
                                className="bg-gray-800 text-white border border-gray-600 rounded h-8 px-1.5 md:px-2 text-xs md:text-sm w-8 md:w-auto opacity-0 md:opacity-100 absolute md:relative"
                                value={selectedJournalDate}
                                onChange={(e) =>
                                  setSelectedJournalDate(e.target.value)
                                }
                                data-testid="input-date"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="md:hidden bg-gray-800 text-white border-gray-600 hover:bg-gray-700 h-8 w-8 p-0"
                                onClick={() => {
                                  const input = document.querySelector('[data-testid="input-date"]') as HTMLInputElement;
                                  input?.showPicker?.();
                                }}
                                data-testid="button-date-picker"
                              >
                                <Calendar className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Fetch Button - Mobile Icon Only */}
                            <Button
                              size="sm"
                              onClick={fetchJournalChartData}
                              className="bg-green-600 hover:bg-green-700 text-white h-8 px-2 md:px-3"
                              data-testid="button-fetch-chart"
                            >
                              <Check className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                              <span className="hidden md:inline text-xs md:text-sm">Fetch</span>
                            </Button>
                          </div>
                        </div>

                        {/* Visual Chart Window */}
                        <div className="flex-1 relative">
                          <MinimalChart
                            height={320}
                            ohlcData={journalChartData}
                            symbol={selectedJournalSymbol
                              .replace("NSE:", "")
                              .replace("-EQ", "")
                              .replace("-INDEX", "")}
                            isInteractiveMode={false}
                            enablePointSelection={false}
                            chartType="candles"
                            indicators={{}}
                            tradeMarkers={getTradeMarkersForChart()}
                            hideControls={true}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Block - Multiple Image Upload */}
                  <div className={`h-[400px] ${mobileJournalPanel === 1 ? 'block' : 'hidden'} md:block`}>
                    <MultipleImageUpload
                      ref={imageUploadRef}
                      images={tradingImages}
                      onImagesChange={setTradingImages}
                    />
                  </div>

                  {/* Right Block - PERFORMANCE STATS (Split: 30% top, 70% bottom) */}
                  <Card className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-[400px] flex flex-col ${mobileJournalPanel === 2 ? 'block' : 'hidden'} md:block`}>
                    {/* Top 30% - Performance Insights */}
                    <div className="h-[30%] border-b border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4 h-full">
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="text-center">
                            <p className="text-gray-600 dark:text-gray-400">
                              Total Trades
                            </p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">
                              {performanceMetrics.totalTrades}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600 dark:text-gray-400">
                              Win Rate
                            </p>
                            <p className="text-xl font-bold text-green-600">
                              {performanceMetrics.winRate}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600 dark:text-gray-400">
                              Net P&L
                            </p>
                            <p
                              className={`text-xl font-bold ${
                                performanceMetrics.netPnL >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              ₹
                              {performanceMetrics.netPnL.toLocaleString(
                                "en-IN"
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">
                                Winning Trades:
                              </span>
                              <span className="text-green-600 font-medium">
                                {performanceMetrics.winningTrades}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">
                                Total Profit:
                              </span>
                              <span className="text-green-600 font-medium">
                                ₹
                                {performanceMetrics.totalProfit.toLocaleString(
                                  "en-IN"
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">
                                Losing Trades:
                              </span>
                              <span className="text-red-600 font-medium">
                                {performanceMetrics.losingTrades}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">
                                Total Loss:
                              </span>
                              <span className="text-red-600 font-medium">
                                ₹
                                {performanceMetrics.totalLoss.toLocaleString(
                                  "en-IN"
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </div>

                    {/* Bottom 70% - Notes Section */}
                    <div className="h-[70%] flex flex-col">
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            TRADING NOTES
                          </h3>
                          <div className="flex items-center gap-2">
                            {/* Tag Dropdown */}
                            <Popover
                              open={isTagDropdownOpen}
                              onOpenChange={setIsTagDropdownOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs border-indigo-300 dark:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900"
                                  data-testid="button-tags-dropdown"
                                >
                                  <Tag className="w-3 h-3 mr-1" />
                                  Tags ({selectedTags.length})
                                  <ChevronDown className="w-3 h-3 ml-1" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-3">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm">
                                      Trading Psychology & Strategy Tags
                                    </h4>
                                    {selectedTags.length > 0 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearAllTags}
                                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                        data-testid="button-clear-tags"
                                      >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Clear All
                                      </Button>
                                    )}
                                  </div>

                                  {/* Selected Tags Display */}
                                  {selectedTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                                      {selectedTags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                                          onClick={() => toggleTag(tag)}
                                          data-testid={`selected-tag-${tag}`}
                                        >
                                          {tag}
                                          <X className="w-3 h-3 ml-1" />
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Available Tags by Category */}
                                  <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {Object.entries(tradingTagSystem).map(
                                      ([categoryKey, category]) => (
                                        <div
                                          key={categoryKey}
                                          className="space-y-2"
                                        >
                                          <div className="flex items-center justify-between">
                                            <h5
                                              className={`text-xs font-semibold text-${category.color}-600 dark:text-${category.color}-400`}
                                            >
                                              {category.name}
                                              {(category as any).required && (
                                                <span className="text-red-500 ml-1">
                                                  *
                                                </span>
                                              )}
                                            </h5>
                                            <span className="text-xs text-gray-500">
                                              {
                                                selectedTags.filter((tag) =>
                                                  category.tags.includes(tag)
                                                ).length
                                              }
                                              /{category.maxSelections}
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-1">
                                            {category.tags.map((tag) => {
                                              const isSelected =
                                                selectedTags.includes(tag);
                                              const categoryCount =
                                                selectedTags.filter((t) =>
                                                  category.tags.includes(t)
                                                ).length;
                                              const isDisabled =
                                                !isSelected &&
                                                categoryCount >=
                                                  category.maxSelections;

                                              return (
                                                <button
                                                  key={tag}
                                                  onClick={() =>
                                                    toggleTagWithValidation(tag)
                                                  }
                                                  disabled={isDisabled}
                                                  className={`
                                                  px-2 py-1.5 text-xs rounded-md border transition-all duration-200 text-left
                                                  ${
                                                    isSelected
                                                      ? `bg-${category.color}-500 text-white border-${category.color}-500 hover:bg-${category.color}-600`
                                                      : isDisabled
                                                      ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed"
                                                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                  }
                                                `}
                                                  data-testid={`tag-option-${tag}`}
                                                >
                                                  {tag}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                            {isEditingNotes ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelNotes}
                                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                                  data-testid="button-cancel-notes"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleSaveNotesOnly}
                                  className="text-xs bg-green-600 hover:bg-green-700 text-white"
                                  data-testid="button-save-notes"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Save
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleEditNotes}
                                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                                data-testid="button-edit-notes"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>
                        </div>

                        {isEditingNotes ? (
                          <textarea
                            value={tempNotesContent}
                            onChange={(e) =>
                              setTempNotesContent(e.target.value)
                            }
                            placeholder="Write your trading notes, strategies, observations..."
                            className="flex-1 w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            data-testid="textarea-notes"
                          />
                        ) : (
                          <div className="flex-1 w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white overflow-y-auto">
                            {/* Display tags inline when they exist */}
                            {selectedTags.length > 0 && (
                              <div className="mb-3 pb-3 border-b border-gray-300 dark:border-gray-600">
                                <div className="flex flex-wrap gap-1">
                                  {selectedTags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 rounded-full cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-colors group"
                                      onClick={() => toggleTag(tag)}
                                      title="Click to remove tag"
                                      data-testid={`inline-tag-${tag}`}
                                    >
                                      {tag}
                                      <X className="w-3 h-3 ml-1 opacity-60 group-hover:opacity-100" />
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Notes content */}
                            {notesContent ? (
                              <pre className="whitespace-pre-wrap font-sans">
                                {notesContent}
                              </pre>
                            ) : (
                              <p className="text-gray-500 dark:text-gray-400 italic">
                                No trading notes yet. Click Edit to add your
                                first note.
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </div>
                  </Card>
                  </div>
                  
                  {/* Mobile Navigation Arrows - Bottom of panels */}
                  <div className="md:hidden flex items-center justify-between mt-4 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setMobileJournalPanel((prev) => (prev === 0 ? 2 : prev - 1))}
                      className="flex-1 h-12"
                      data-testid="button-journal-prev"
                    >
                      <ChevronLeft className="h-5 w-5 mr-2" />
                      <span className="text-sm font-medium">
                        {mobileJournalPanel === 0 ? "Notes" : mobileJournalPanel === 1 ? "Chart" : "Upload"}
                      </span>
                    </Button>
                    <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Current</div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {mobileJournalPanel === 0 ? "Chart" : mobileJournalPanel === 1 ? "Upload" : "Notes"}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setMobileJournalPanel((prev) => (prev === 2 ? 0 : prev + 1))}
                      className="flex-1 h-12"
                      data-testid="button-journal-next"
                    >
                      <span className="text-sm font-medium">
                        {mobileJournalPanel === 0 ? "Upload" : mobileJournalPanel === 1 ? "Notes" : "Chart"}
                      </span>
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </div>

                {/* Two Column Layout: TRADE HISTORY SUMMARY (Left) and PROFIT CONSISTENCY (Right) */}
                {/* Desktop: 2-column grid | Mobile: Show Trade Book with collapsible Trade History */}
                <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 gap-6">
                  
                  {/* Mobile: Collapsible Trade History Summary Header (shows above calendar) */}
                  <div className="md:hidden">
                    <div 
                      onClick={() => setShowMobileTradeHistory(!showMobileTradeHistory)}
                      className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      data-testid="button-toggle-trade-history"
                    >
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-white">
                          TRADE HISTORY SUMMARY
                        </span>
                      </div>
                      {showMobileTradeHistory ? (
                        <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                    
                    {/* Mobile: Trade History Summary Content (Dropdown) */}
                    {showMobileTradeHistory && (
                      <Card className="mt-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-end gap-2 mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowOrderModal(true)}
                              className="h-8 px-3"
                              data-testid="button-place-order"
                            >
                              <Target className="h-4 w-4 mr-2" />
                              Order
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowImportModal(true)}
                              className="h-8 px-3"
                              data-testid="button-import-pnl"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Import
                            </Button>
                          </div>
                          <div className="max-h-80 overflow-auto border rounded-lg border-gray-200 dark:border-gray-700">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white sticky top-0">
                            <tr>
                              <th className="p-1 text-left">Time</th>
                              <th className="p-1 text-left">Order</th>
                              <th className="p-1 text-left">Symbol</th>
                              <th className="p-1 text-left">Type</th>
                              <th className="p-1 text-left">Qty</th>
                              <th className="p-1 text-left">Price</th>
                              <th className="p-1 text-left">P&L</th>
                              <th className="p-1 text-left">%</th>
                              <th className="p-1 text-left">Duration</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {tradeHistoryData.map((trade, index) => (
                              <tr
                                key={index}
                                className="border-b border-gray-200 dark:border-gray-700"
                              >
                                <td className="p-1">{trade.time}</td>
                                <td className="p-1">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      trade.order === "BUY"
                                        ? "bg-green-600 text-white"
                                        : "bg-red-600 text-white"
                                    }`}
                                  >
                                    {trade.order}
                                  </span>
                                </td>
                                <td className="p-1">{trade.symbol}</td>
                                <td className="p-1">{trade.type}</td>
                                <td className="p-1">{trade.qty}</td>
                                <td className="p-1">₹{trade.price}</td>
                                <td
                                  className={`p-2 ${
                                    (trade.pnl || "").includes("+")
                                      ? "text-green-600"
                                      : (trade.pnl || "").includes("-")
                                      ? "text-red-600"
                                      : ""
                                  }`}
                                >
                                  {trade.pnl}
                                </td>
                                <td
                                  className={`p-2 font-medium ${(() => {
                                    if (!trade.pnl || trade.pnl === "-")
                                      return "";
                                    const pnlStr = (trade.pnl || "").replace(
                                      /[₹,+\s]/g,
                                      ""
                                    );
                                    const pnlValue = parseFloat(pnlStr) || 0;
                                    const openPrice = trade.price;
                                    const totalInvestment =
                                      openPrice * trade.qty || 1;
                                    const percentage =
                                      (pnlValue / totalInvestment) * 100;
                                    return percentage > 0
                                      ? "text-green-600"
                                      : percentage < 0
                                      ? "text-red-600"
                                      : "text-gray-500";
                                  })()}`}
                                >
                                  {(() => {
                                    if (!trade.pnl || trade.pnl === "-")
                                      return "-";
                                    const pnlStr = (trade.pnl || "").replace(
                                      /[₹,+\s]/g,
                                      ""
                                    );
                                    const pnlValue = parseFloat(pnlStr) || 0;
                                    const openPrice = trade.price;
                                    const totalInvestment =
                                      openPrice * trade.qty || 1;
                                    const percentage =
                                      (pnlValue / totalInvestment) * 100;
                                    return `${
                                      percentage >= 0 ? "+" : ""
                                    }${percentage.toFixed(2)}%`;
                                  })()}
                                </td>
                                <td className="p-1">{trade.duration}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  {/* Desktop: TRADE HISTORY SUMMARY - Left Side */}
                  <Card className="hidden md:block bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-[420px]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                          TRADE HISTORY SUMMARY
                        </h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowOrderModal(true)}
                            className="h-8 px-3"
                            data-testid="button-place-order"
                          >
                            <Target className="h-4 w-4 mr-2" />
                            Order
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowImportModal(true)}
                            className="h-8 px-3"
                            data-testid="button-import-pnl"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Import
                          </Button>
                          <div className="h-8 px-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-md flex items-center justify-center text-xs font-medium text-indigo-700 dark:text-indigo-300 min-w-[80px]">
                            <Timer className="h-4 w-4 mr-2" />
                            {calculateTotalDuration(tradeHistoryData)}
                          </div>
                        </div>
                      </div>

                      <div className="max-h-80 overflow-auto border rounded-lg border-gray-200 dark:border-gray-700">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white sticky top-0">
                            <tr>
                              <th className="p-1 text-left">Time</th>
                              <th className="p-1 text-left">Order</th>
                              <th className="p-1 text-left">Symbol</th>
                              <th className="p-1 text-left">Type</th>
                              <th className="p-1 text-left">Qty</th>
                              <th className="p-1 text-left">Price</th>
                              <th className="p-1 text-left">P&L</th>
                              <th className="p-1 text-left">%</th>
                              <th className="p-1 text-left">Duration</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {tradeHistoryData.map((trade, index) => (
                              <tr
                                key={index}
                                className="border-b border-gray-200 dark:border-gray-700"
                              >
                                <td className="p-1">{trade.time}</td>
                                <td className="p-1">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      trade.order === "BUY"
                                        ? "bg-green-600 text-white"
                                        : "bg-red-600 text-white"
                                    }`}
                                  >
                                    {trade.order}
                                  </span>
                                </td>
                                <td className="p-1">{trade.symbol}</td>
                                <td className="p-1">{trade.type}</td>
                                <td className="p-1">{trade.qty}</td>
                                <td className="p-1">₹{trade.price}</td>
                                <td
                                  className={`p-2 ${
                                    (trade.pnl || "").includes("+")
                                      ? "text-green-600"
                                      : (trade.pnl || "").includes("-")
                                      ? "text-red-600"
                                      : ""
                                  }`}
                                >
                                  {trade.pnl}
                                </td>
                                <td
                                  className={`p-2 font-medium ${(() => {
                                    if (!trade.pnl || trade.pnl === "-")
                                      return "";
                                    const pnlStr = (trade.pnl || "").replace(
                                      /[₹,+\s]/g,
                                      ""
                                    );
                                    const pnlValue = parseFloat(pnlStr) || 0;
                                    const openPrice = trade.price;
                                    const totalInvestment =
                                      openPrice * trade.qty || 1;
                                    const percentage =
                                      (pnlValue / totalInvestment) * 100;
                                    return percentage > 0
                                      ? "text-green-600"
                                      : percentage < 0
                                      ? "text-red-600"
                                      : "text-gray-500";
                                  })()}`}
                                >
                                  {(() => {
                                    if (!trade.pnl || trade.pnl === "-")
                                      return "-";
                                    const pnlStr = (trade.pnl || "").replace(
                                      /[₹,+\s]/g,
                                      ""
                                    );
                                    const pnlValue = parseFloat(pnlStr) || 0;
                                    const openPrice = trade.price;
                                    const totalInvestment =
                                      openPrice * trade.qty || 1;
                                    const percentage =
                                      (pnlValue / totalInvestment) * 100;
                                    return `${
                                      percentage >= 0 ? "+" : ""
                                    }${percentage.toFixed(2)}%`;
                                  })()}
                                </td>
                                <td className="p-1">{trade.duration}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trade Book - Right Side (Functional Calendar) */}
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-[420px]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            trade book
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 mr-2">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Demo
                            </span>
                            <Switch
                              checked={isDemoMode}
                              onCheckedChange={(checked) => {
                                setIsDemoMode(checked);
                                localStorage.setItem("tradingJournalDemoMode", String(checked));
                                if (!checked) {
                                  setTradingDataByDate({});
                                  localStorage.removeItem("tradingDataByDate");
                                }
                              }}
                              data-testid="switch-demo-mode"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={saveAllTradingData}
                            className="h-8 px-3 bg-black dark:bg-black border-black dark:border-black hover:bg-gray-800 dark:hover:bg-gray-800 text-white dark:text-white"
                            data-testid="button-save-trade-book"
                          >
                            Save
                          </Button>
                        </div>
                      </div>

                      {/* Calendar Grid - Heatmap Default View */}
                      <div className="mb-1">
                        {/* Optimized Full Calendar Heatmap */}
                        <div className="space-y-2 pt-4 pb-1">
                          {/* Unified Scrollable Container */}
                          <div className="overflow-x-auto overflow-y-hidden custom-thin-scrollbar">
                            <div className="min-w-max flex justify-center">
                              {/* Calendar Layout */}
                              <div className="flex gap-4">
                                {/* Day Headers (Vertical) */}
                                <div className="flex flex-col gap-1">
                                  <div className="h-5 mb-2"></div>{" "}
                                  {/* Spacer for month headers */}
                                  {["S", "M", "T", "W", "T", "F", "S"].map(
                                    (day, index) => (
                                      <div
                                        key={index}
                                        className="w-3 h-3 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400"
                                      >
                                        {day}
                                      </div>
                                    )
                                  )}
                                </div>

                                {/* Months */}
                                {getHeatmapWeeks().map((month, monthIndex) => (
                                  <div
                                    key={monthIndex}
                                    className="flex flex-col"
                                  >
                                    {/* Month Header */}
                                    <div className="h-5 mb-2 flex items-center justify-center">
                                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        {month.name}
                                      </div>
                                    </div>

                                    {/* Month Grid */}
                                    <div className="flex gap-1">
                                      {month.weeks.map((week, weekIndex) => (
                                        <div
                                          key={weekIndex}
                                          className="flex flex-col gap-1"
                                        >
                                          {week.map((date, dateIndex) => {
                                            // Return empty space for null dates (empty calendar slots)
                                            if (date === null) {
                                              return (
                                                <div
                                                  key={dateIndex}
                                                  className="w-3 h-3"
                                                ></div>
                                              );
                                            }

                                            const currentYear =
                                              new Date().getFullYear();
                                            const isCurrentYear =
                                              date.getFullYear() ===
                                              currentYear;
                                            const isHeatmapYear =
                                              date.getFullYear() ===
                                              heatmapYear;
                                            const isInSelectedRange =
                                              isCalendarDataFetched &&
                                              fromDate &&
                                              toDate &&
                                              date >= fromDate &&
                                              date <= toDate;
                                            const isStartDate =
                                              isCalendarDataFetched &&
                                              fromDate &&
                                              date.toDateString() ===
                                                fromDate.toDateString();
                                            const isEndDate =
                                              isCalendarDataFetched &&
                                              toDate &&
                                              date.toDateString() ===
                                                toDate.toDateString();
                                            const hasData =
                                              isInSelectedRange &&
                                              hasDataForDate(date);
                                            const isToday =
                                              date.toDateString() ===
                                              new Date().toDateString();

                                            // Get saved trading data for this date
                                            const dateStr = date
                                              .toISOString()
                                              .split("T")[0];
                                            const savedData =
                                              tradingDataByDate[dateStr];
                                            const netPnL =
                                              savedData?.performanceMetrics
                                                ?.netPnL || 0;

                                            // Determine cell color based on P&L
                                            let cellColor =
                                              "bg-gray-100 dark:bg-gray-700"; // Default - grey background
                                            let hasTradeData = false;

                                            // Check for any trading data (always check, but only show if no range selected OR date is in range)
                                            const hasActualTradeData =
                                              savedData &&
                                              ((savedData.tradeHistory &&
                                                savedData.tradeHistory.length >
                                                  0) ||
                                                (savedData.performanceMetrics &&
                                                  savedData.performanceMetrics
                                                    .totalTrades > 0) ||
                                                savedData.tradingNotes ||
                                                savedData.notesContent ||
                                                savedData.content || // Alternative format
                                                savedData.tradeNotes || // Alternative format
                                                savedData.tradeResult || // Alternative format
                                                savedData.mood || // Alternative format
                                                (savedData.images &&
                                                  savedData.images.length > 0));

                                            // Only show trade data colors if no date range selected OR date is in selected range
                                            const shouldShowTradeColors =
                                              !fromDate ||
                                              !toDate ||
                                              isInSelectedRange;

                                            if (
                                              hasActualTradeData &&
                                              shouldShowTradeColors
                                            ) {
                                              hasTradeData = true;
                                              // Use P&L if available, otherwise use green for any trading activity
                                              if (netPnL !== 0) {
                                                cellColor =
                                                  getHeatmapColor(netPnL);
                                              } else if (
                                                savedData.tradeResult ===
                                                "profit"
                                              ) {
                                                cellColor =
                                                  "bg-green-300 dark:bg-green-600";
                                              } else if (
                                                savedData.tradeResult === "loss"
                                              ) {
                                                cellColor =
                                                  "bg-red-300 dark:bg-red-600";
                                              } else {
                                                // Default to light green for any trading activity
                                                cellColor =
                                                  "bg-green-200 dark:bg-green-700";
                                              }
                                            }

                                            // Special highlighting for selected dates
                                            if (isStartDate || isEndDate) {
                                              cellColor =
                                                "bg-blue-600 dark:bg-blue-500 ring-1 ring-blue-400 dark:ring-blue-300";
                                            } else if (
                                              isToday &&
                                              isCurrentYear &&
                                              !hasTradeData
                                            ) {
                                              cellColor =
                                                "bg-teal-300 dark:bg-teal-600";
                                            }

                                            return (
                                              <div
                                                key={dateIndex}
                                                className={`
                                                    w-3 h-3 rounded-sm cursor-pointer transition-all duration-200 relative
                                                    ${cellColor}
                                                    hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600
                                                    flex items-center justify-center
                                                  `}
                                                onClick={() =>
                                                  handleDateSelect(date)
                                                }
                                                title={`${date.toDateString()}${
                                                  hasTradeData
                                                    ? ` - P&L: ₹${netPnL.toLocaleString(
                                                        "en-IN"
                                                      )}`
                                                    : ""
                                                }`}
                                                data-testid={`calendar-day-${date.getDate()}-${date.getMonth()}`}
                                              >
                                                {hasTradeData && (
                                                  <div className="absolute inset-0 bg-white dark:bg-black opacity-10 rounded-sm"></div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* P&L Color Legend */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Loss
                              </span>
                              <div className="flex gap-0.5">
                                <div
                                  className="w-2 h-2 bg-red-800 dark:bg-red-700 rounded-sm"
                                  title="High Loss (₹5000+)"
                                ></div>
                                <div
                                  className="w-2 h-2 bg-red-600 dark:bg-red-500 rounded-sm"
                                  title="Medium Loss (₹1500+)"
                                ></div>
                                <div
                                  className="w-2 h-2 bg-red-300 dark:bg-red-300 rounded-sm"
                                  title="Small Loss"
                                ></div>
                              </div>
                            </div>
                            <div
                              className="w-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-sm"
                              title="No trades"
                            ></div>
                            <div className="flex items-center gap-1">
                              <div className="flex gap-0.5">
                                <div
                                  className="w-2 h-2 bg-green-300 dark:bg-green-300 rounded-sm"
                                  title="Small Profit"
                                ></div>
                                <div
                                  className="w-2 h-2 bg-green-600 dark:bg-green-500 rounded-sm"
                                  title="Medium Profit (₹1500+)"
                                ></div>
                                <div
                                  className="w-2 h-2 bg-green-800 dark:bg-green-700 rounded-sm"
                                  title="High Profit (₹5000+)"
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Profit
                              </span>
                            </div>
                          </div>

                          {/* Date Range Display Below Heatmap */}
                          {fromDate && toDate && (
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                  <h6 className="text-sm font-semibold text-gray-800 dark:text-white">
                                    Selected Date Range: {heatmapYear}
                                  </h6>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleResetDateRange}
                                    className="p-1 h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    data-testid="button-reset-date-range"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {fromDate.toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}{" "}
                                  -{" "}
                                  {toDate.toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </div>
                                <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                                  Showing trade data within selected range
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selected Date Info */}
                      {selectedDate && !(fromDate && toDate) && (
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="mb-3">
                            <div className="flex items-center gap-2">
                              <Popover>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handlePreviousYear}
                                    className="p-1 h-6 w-6 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                                    data-testid="button-prev-year"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </Button>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="p-0 h-auto hover:bg-transparent"
                                      data-testid="button-date-range-picker"
                                    >
                                      <h5 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                                        <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        {fromDate && toDate
                                          ? `${fromDate.toLocaleDateString(
                                              "en-US",
                                              { month: "short", day: "numeric" }
                                            )} - ${toDate.toLocaleDateString(
                                              "en-US",
                                              {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                              }
                                            )}`
                                          : selectedDate
                                              .toLocaleDateString("en-US", {
                                                weekday: "long",
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                              })
                                              .replace(
                                                /\d{4}/,
                                                heatmapYear.toString()
                                              )}
                                      </h5>
                                    </Button>
                                  </PopoverTrigger>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleNextYear}
                                    className="p-1 h-6 w-6 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                                    data-testid="button-next-year"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </Button>
                                </div>
                                <PopoverContent
                                  className="w-auto p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                  align="start"
                                >
                                  <div className="space-y-3">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Select Date Range
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                          From Date
                                        </label>
                                        <input
                                          type="date"
                                          value={
                                            fromDate
                                              ? fromDate
                                                  .toISOString()
                                                  .split("T")[0]
                                              : ""
                                          }
                                          onChange={(e) =>
                                            setFromDate(
                                              e.target.value
                                                ? new Date(e.target.value)
                                                : null
                                            )
                                          }
                                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                          data-testid="input-from-date"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                          To Date
                                        </label>
                                        <input
                                          type="date"
                                          value={
                                            toDate
                                              ? toDate
                                                  .toISOString()
                                                  .split("T")[0]
                                              : ""
                                          }
                                          onChange={(e) =>
                                            setToDate(
                                              e.target.value
                                                ? new Date(e.target.value)
                                                : null
                                            )
                                          }
                                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                          data-testid="input-to-date"
                                        />
                                      </div>
                                    </div>
                                    {fromDate && toDate && (
                                      <Button
                                        onClick={() => {
                                          console.log(
                                            "📊 Fetching calendar data from",
                                            fromDate,
                                            "to",
                                            toDate
                                          );
                                          setIsCalendarDataFetched(true);
                                        }}
                                        size="sm"
                                        className="w-full bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-7"
                                        data-testid="button-fetch-calendar-data"
                                      >
                                        Fetch Range Data
                                      </Button>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                </div>
                {/* End of Main Journal Content */}

                {/* Ranking Tab Content - Mobile only, shown when ranking tab is active */}
                {mobileBottomTab === 'ranking' && (
                  <div className="md:hidden mt-6 space-y-6">
                    <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-amber-200 dark:border-amber-800">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">Trader Rankings</CardTitle>
                            <CardDescription>Coming soon: Compare your performance with other traders</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <Trophy className="h-16 w-16 mx-auto mb-4 opacity-40" />
                            <p className="text-sm">Ranking feature coming soon...</p>
                            <p className="text-xs mt-2">Track your position among top traders</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ============== MODERN TRADING ANALYTICS DASHBOARD ============== */}
                {/* Mobile: Show only in "insight" tab | Desktop: Always visible */}
                <div className={`mt-8 space-y-6 ${mobileBottomTab !== 'insight' ? 'hidden md:block' : 'block'}`}>

                  {(() => {
                    // Calculate comprehensive insights from all trading data
                    const calculateTradingInsights = () => {
                      const allData = Object.values(tradingDataByDate).filter(
                        (data: any) =>
                          data &&
                          data.tradeHistory &&
                          Array.isArray(data.tradeHistory) &&
                          data.tradeHistory.length > 0
                      );

                      if (allData.length === 0) {
                        return {
                          tagAnalysis: [],
                          overallStats: {
                            totalTrades: 0,
                            winRate: 0,
                            totalPnL: 0,
                          },
                          topPerformers: [],
                          worstPerformers: [],
                          tradingDayAnalysis: [],
                        };
                      }

                      // Tag-based performance analysis
                      const tagStats: any = {};
                      const dailyStats: any[] = [];

                      allData.forEach((dayData: any, index: number) => {
                        const trades = dayData.tradeHistory || [];
                        const tags = dayData.tradingTags || [];
                        const metrics = dayData.performanceMetrics;

                        // Calculate day statistics
                        if (metrics) {
                          dailyStats.push({
                            day: index + 1,
                            trades: metrics.totalTrades || trades.length,
                            winRate: parseFloat(metrics.winRate) || 0,
                            netPnL: metrics.netPnL || 0,
                            tags: tags,
                          });
                        }

                        // Analyze each tag's performance
                        tags.forEach((tag: string) => {
                          if (!tagStats[tag]) {
                            tagStats[tag] = {
                              tag,
                              tradingDays: 0,
                              totalTrades: 0,
                              wins: 0,
                              losses: 0,
                              totalPnL: 0,
                              winRate: 0,
                              avgPnL: 0,
                              bestDay: 0,
                              worstDay: 0,
                            };
                          }

                          const stats = tagStats[tag];
                          stats.tradingDays++;

                          if (metrics) {
                            stats.totalTrades += metrics.totalTrades || 0;
                            stats.wins += metrics.winningTrades || 0;
                            stats.losses += metrics.losingTrades || 0;
                            stats.totalPnL += metrics.netPnL || 0;
                            stats.bestDay = Math.max(
                              stats.bestDay,
                              metrics.netPnL || 0
                            );
                            stats.worstDay = Math.min(
                              stats.worstDay,
                              metrics.netPnL || 0
                            );
                          }
                        });
                      });

                      // Calculate final stats for each tag
                      Object.values(tagStats).forEach((stats: any) => {
                        stats.winRate =
                          stats.totalTrades > 0
                            ? (stats.wins / stats.totalTrades) * 100
                            : 0;
                        stats.avgPnL =
                          stats.tradingDays > 0
                            ? stats.totalPnL / stats.tradingDays
                            : 0;
                      });

                      const tagAnalysis = Object.values(tagStats).sort(
                        (a: any, b: any) => b.totalPnL - a.totalPnL
                      );

                      // Overall statistics
                      const totalTrades = tagAnalysis.reduce(
                        (sum: number, tag: any) => sum + tag.totalTrades,
                        0
                      );
                      const totalPnL = tagAnalysis.reduce(
                        (sum: number, tag: any) => sum + tag.totalPnL,
                        0
                      );
                      const totalWins = tagAnalysis.reduce(
                        (sum: number, tag: any) => sum + tag.wins,
                        0
                      );
                      const overallWinRate =
                        totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

                      const overallStats = {
                        totalTrades,
                        winRate: overallWinRate,
                        totalPnL,
                      };
                      const topPerformers = tagAnalysis.slice(0, 5);
                      const worstPerformers = tagAnalysis.slice(-3).reverse();

                      return {
                        tagAnalysis,
                        overallStats,
                        topPerformers,
                        worstPerformers,
                        tradingDayAnalysis: dailyStats,
                      };
                    };

                    const insights = calculateTradingInsights();
                    const totalPnL = insights.overallStats.totalPnL || 0;
                    const isProfitable = totalPnL >= 0;

                    return (
                      <div className="space-y-6">
                        {/* Performance Trend Chart - Full Width on Top */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 md:p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                              Performance Trend
                            </h3>
                            {(() => {
                              // Calculate total P&L across all trading days
                              const allDates = Object.keys(tradingDataByDate);
                              const totalPnL = allDates.reduce(
                                (sum, dateStr) => {
                                  const dayData = tradingDataByDate[dateStr];
                                  const netPnL =
                                    dayData?.performanceMetrics?.netPnL || 0;
                                  return sum + netPnL;
                                },
                                0
                              );

                              const isProfitable = totalPnL > 0;

                              return (
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-3 h-3 ${
                                      isProfitable
                                        ? "bg-emerald-400"
                                        : "bg-red-400"
                                    } rounded-full`}
                                  ></div>
                                  <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {isProfitable
                                      ? "Profitable"
                                      : "Not Profitable"}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>

                          {insights.tradingDayAnalysis.length > 0 ? (
                            <div className="h-64 w-full">
                              {(() => {
                                // Get ALL trading data and prepare daily chart data
                                const allDates =
                                  Object.keys(tradingDataByDate).sort();

                                // Convert to daily chart data format
                                const chartData = allDates.map(
                                  (dateStr, idx) => {
                                    const date = new Date(dateStr);
                                    const dayData =
                                      insights.tradingDayAnalysis.find(
                                        (day: any) => day.date === dateStr
                                      ) || tradingDataByDate[dateStr];

                                    const netPnL =
                                      dayData?.performanceMetrics?.netPnL ||
                                      dayData?.netPnL ||
                                      0;
                                    const totalTrades =
                                      dayData?.performanceMetrics
                                        ?.totalTrades || 0;

                                    return {
                                      day: `${date.getDate()}/${
                                        date.getMonth() + 1
                                      }`,
                                      value: netPnL,
                                      pnl: netPnL,
                                      date: dateStr,
                                      trades: totalTrades,
                                      formattedDate: date.toLocaleDateString(
                                        "en-IN",
                                        {
                                          day: "numeric",
                                          month: "short",
                                        }
                                      ),
                                    };
                                  }
                                );

                                // Find peak value for indicator
                                const peakData = chartData.reduce(
                                  (max, current) =>
                                    current.value > max.value ? current : max,
                                  chartData[0] || { value: 0, day: "", pnl: 0 }
                                );

                                return (
                                  <div className="relative h-full">
                                    <ResponsiveContainer
                                      width="100%"
                                      height="100%"
                                    >
                                      <AreaChart
                                        data={chartData}
                                        margin={{
                                          top: 40,
                                          right: 30,
                                          left: 0,
                                          bottom: 5,
                                        }}
                                      >
                                        <defs>
                                          <linearGradient
                                            id="areaGradientPositive"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                          >
                                            <stop
                                              offset="0%"
                                              stopColor="rgb(107, 114, 128)"
                                              stopOpacity={0.6}
                                            />
                                            <stop
                                              offset="100%"
                                              stopColor="rgb(107, 114, 128)"
                                              stopOpacity={0.1}
                                            />
                                          </linearGradient>
                                        </defs>
                                        <XAxis
                                          dataKey="day"
                                          axisLine={false}
                                          tickLine={false}
                                          tick={false}
                                          className="text-slate-500 dark:text-slate-400"
                                        />
                                        <YAxis
                                          axisLine={false}
                                          tickLine={false}
                                          tick={{
                                            fontSize: 12,
                                            fill: "#64748b",
                                          }}
                                          tickFormatter={(value) =>
                                            `${value >= 0 ? "" : "-"}${(
                                              Math.abs(value) / 1000
                                            ).toFixed(0)}K`
                                          }
                                          domain={[
                                            "dataMin - 1000",
                                            "dataMax + 1000",
                                          ]}
                                          className="text-slate-500 dark:text-slate-400"
                                        />
                                        <Tooltip
                                          contentStyle={{
                                            background: "var(--background)",
                                            border: "1px solid var(--border)",
                                            borderRadius: "12px",
                                            color: "var(--foreground)",
                                            fontSize: "12px",
                                            padding: "8px 12px",
                                          }}
                                          formatter={(
                                            value: any,
                                            name: any,
                                            props: any
                                          ) => [
                                            `${
                                              value >= 0 ? "₹" : "-₹"
                                            }${Math.abs(
                                              value
                                            ).toLocaleString()}`,
                                            "Daily P&L",
                                          ]}
                                          labelFormatter={(label, payload) => {
                                            if (
                                              payload &&
                                              payload[0] &&
                                              payload[0].payload
                                            ) {
                                              const data = payload[0].payload;
                                              return `${data.formattedDate} • ${data.trades} trades`;
                                            }
                                            return label;
                                          }}
                                        />
                                        <Area
                                          type="monotone"
                                          dataKey="value"
                                          stroke="#000000"
                                          strokeWidth={3}
                                          fill="url(#areaGradientPositive)"
                                          dot={false}
                                          activeDot={{
                                            r: 6,
                                            fill: "#000000",
                                            stroke: "white",
                                            strokeWidth: 2,
                                          }}
                                        />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-48 text-slate-400">
                              <div className="text-center">
                                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No trend data available</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bottom Section: Total P&L + Tags */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Total Performance Card - Dynamic Color Based on P&L */}
                          <div className={`rounded-3xl p-6 md:p-8 text-white shadow-2xl ${isProfitable ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
                            <div className="flex items-center justify-between mb-6">
                              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Target className="w-6 h-6" />
                              </div>
                              <div className="text-right">
                                <div className="text-sm opacity-80">
                                  Total P&L
                                </div>
                                <div className="text-2xl md:text-3xl font-bold">
                                  {totalPnL >= 0 ? '+' : '-'}₹
                                  {Math.abs(totalPnL).toLocaleString("en-IN")}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-sm opacity-80">
                                  Total Trades
                                </span>
                                <span className="font-semibold">
                                  {insights.overallStats.totalTrades}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm opacity-80">
                                  Success Rate
                                </span>
                                <span className="font-semibold">
                                  {insights.overallStats.winRate.toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-white/20 rounded-full h-2">
                                <div
                                  className="bg-white rounded-full h-2 transition-all duration-1000"
                                  style={{
                                    width: `${Math.min(
                                      insights.overallStats.winRate,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          {/* Tag Performance Distribution */}
                          <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                              <Tag className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-800 dark:text-white">
                                Top Tags
                              </h3>
                              <p className="text-xs text-slate-500">
                                Strategy Performance
                              </p>
                            </div>
                          </div>

                          {insights.topPerformers.length > 0 ? (
                            <div className="space-y-4">
                              {insights.topPerformers
                                .slice(0, 4)
                                .map((tag: any, idx: number) => (
                                  <div key={tag.tag} className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {tag.tag}
                                      </span>
                                      <span
                                        className={`text-sm font-semibold ${
                                          tag.totalPnL >= 0
                                            ? "text-emerald-600"
                                            : "text-red-500"
                                        }`}
                                      >
                                        {tag.totalPnL >= 0 ? "+" : ""}₹
                                        {Math.abs(
                                          tag.totalPnL
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                                      <div
                                        className={`h-2 rounded-full transition-all duration-1000 ${
                                          tag.totalPnL >= 0
                                            ? "bg-gradient-to-r from-emerald-400 to-green-500"
                                            : "bg-gradient-to-r from-red-400 to-rose-500"
                                        }`}
                                        style={{
                                          width: `${Math.min(
                                            tag.winRate,
                                            100
                                          )}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                      {tag.winRate.toFixed(1)}% success rate
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-32 text-slate-400">
                              <div className="text-center">
                                <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No tag data</p>
                              </div>
                            </div>
                          )}
                          </div>
                        </div>

                        {/* Strategy Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {(() => {
                            const allData = Object.values(
                              tradingDataByDate
                            ).filter(
                              (data: any) => data && data.performanceMetrics
                            );

                            if (allData.length === 0) return null;

                            const totalDays = allData.length;
                            const profitableDays = allData.filter(
                              (d: any) => d.performanceMetrics.netPnL > 0
                            ).length;
                            const avgDailyPnL =
                              allData.reduce(
                                (sum: number, d: any) =>
                                  sum + d.performanceMetrics.netPnL,
                                0
                              ) / totalDays;
                            const maxProfit = Math.max(
                              ...allData.map(
                                (d: any) => d.performanceMetrics.netPnL
                              )
                            );

                            const metrics = [
                              {
                                label: "Trading Days",
                                value: totalDays,
                                icon: Calendar,
                                color: "from-blue-500 to-indigo-600",
                                textColor: "text-blue-600",
                              },
                              {
                                label: "Best Day",
                                value: `₹${maxProfit.toLocaleString()}`,
                                icon: TrendingUp,
                                color: "from-emerald-500 to-green-600",
                                textColor: "text-emerald-600",
                              },
                              {
                                label: "Profitable Days",
                                value: profitableDays,
                                icon: Target,
                                color: "from-violet-500 to-purple-600",
                                textColor: "text-violet-600",
                              },
                              {
                                label: "Avg Daily P&L",
                                value: `₹${Math.abs(
                                  avgDailyPnL
                                ).toLocaleString()}`,
                                icon: BarChart3,
                                color:
                                  avgDailyPnL >= 0
                                    ? "from-emerald-500 to-green-600"
                                    : "from-red-500 to-rose-600",
                                textColor:
                                  avgDailyPnL >= 0
                                    ? "text-emerald-600"
                                    : "text-red-600",
                              },
                            ];

                            return metrics.map((metric) => (
                              <div
                                key={metric.label}
                                className="bg-white dark:bg-slate-800 rounded-2xl p-3 md:p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300"
                              >
                                <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-0">
                                  <div
                                    className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center md:mb-4 shadow-lg flex-shrink-0`}
                                  >
                                    <metric.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                  </div>
                                  <div className="flex-1 md:space-y-1">
                                    <div
                                      className={`text-xl md:text-2xl font-bold ${metric.textColor}`}
                                    >
                                      {metric.value}
                                    </div>
                                    <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                                      {metric.label}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>

                        {/* Loss Making Tags Analysis */}
                        <div className="col-span-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-8 text-white shadow-2xl mt-6">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                              <TrendingDown className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold">
                                Loss Making Analysis
                              </h3>
                              <p className="opacity-80">
                                Identify and fix problematic patterns
                              </p>
                            </div>
                          </div>

                          {(() => {
                            const allData = Object.values(
                              tradingDataByDate
                            ).filter(
                              (data: any) =>
                                data &&
                                data.tradingTags &&
                                Array.isArray(data.tradingTags) &&
                                data.performanceMetrics
                            );

                            if (allData.length === 0) {
                              return (
                                <div className="bg-white/10 rounded-2xl p-6 text-center">
                                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="w-8 h-8" />
                                  </div>
                                  <p className="text-lg font-medium mb-2">
                                    No Data Available
                                  </p>
                                  <p className="opacity-80">
                                    Start trading and tagging to identify loss
                                    patterns!
                                  </p>
                                </div>
                              );
                            }

                            // Analyze loss-making patterns
                            const tagLossAnalysis: any = {};
                            const riskMetrics: any = {
                              consecutiveLosses: 0,
                              maxConsecutiveLosses: 0,
                              emotionalTradingDays: 0,
                              impulsiveTrades: 0,
                              totalLossingDays: 0,
                            };

                            allData.forEach((data: any) => {
                              const tags = data.tradingTags;
                              const pnl = data.performanceMetrics.netPnL;
                              const trades =
                                data.performanceMetrics.totalTrades;

                              if (pnl < 0) {
                                riskMetrics.totalLossingDays++;

                                // Check for emotional trading patterns
                                const emotionalTags = [
                                  "fomo",
                                  "fear",
                                  "greedy",
                                  "revenge",
                                  "impatient",
                                ];
                                if (
                                  tags.some((tag: string) =>
                                    emotionalTags.includes(tag.toLowerCase())
                                  )
                                ) {
                                  riskMetrics.emotionalTradingDays++;
                                }

                                // Check for impulsive trading (high number of trades with losses)
                                if (trades > 5 && pnl < 0) {
                                  riskMetrics.impulsiveTrades += trades;
                                }
                              }

                              tags.forEach((tag: string) => {
                                if (!tagLossAnalysis[tag]) {
                                  tagLossAnalysis[tag] = {
                                    tag,
                                    totalPnL: 0,
                                    lossDays: 0,
                                    totalDays: 0,
                                    avgLoss: 0,
                                    lossFrequency: 0,
                                  };
                                }

                                const analysis = tagLossAnalysis[tag];
                                analysis.totalPnL += pnl;
                                analysis.totalDays++;

                                if (pnl < 0) {
                                  analysis.lossDays++;
                                }
                              });
                            });

                            // Calculate loss metrics
                            Object.values(tagLossAnalysis).forEach(
                              (analysis: any) => {
                                analysis.lossFrequency =
                                  (analysis.lossDays / analysis.totalDays) *
                                  100;
                                analysis.avgLoss =
                                  analysis.totalPnL / analysis.totalDays;
                              }
                            );

                            // Get worst performing tags
                            const worstTags = Object.values(tagLossAnalysis)
                              .filter((tag: any) => tag.totalPnL < 0)
                              .sort((a: any, b: any) => a.totalPnL - b.totalPnL)
                              .slice(0, 4);

                            return (
                              <div className="space-y-4 md:space-y-6">
                                {/* Risk Metrics Summary */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4">
                                    <div className="text-lg md:text-2xl font-bold">
                                      {riskMetrics.totalLossingDays}
                                    </div>
                                    <div className="text-xs md:text-sm opacity-80">
                                      Losing Days
                                    </div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4">
                                    <div className="text-lg md:text-2xl font-bold">
                                      {riskMetrics.emotionalTradingDays}
                                    </div>
                                    <div className="text-xs md:text-sm opacity-80">
                                      Emotional Trading Days
                                    </div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4">
                                    <div className="text-lg md:text-2xl font-bold">
                                      {riskMetrics.impulsiveTrades}
                                    </div>
                                    <div className="text-xs md:text-sm opacity-80">
                                      Impulsive Trades
                                    </div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4">
                                    <div className="text-lg md:text-2xl font-bold">
                                      {allData.length > 0
                                        ? (
                                            (riskMetrics.totalLossingDays /
                                              allData.length) *
                                            100
                                          ).toFixed(0)
                                        : 0}
                                      %
                                    </div>
                                    <div className="text-xs md:text-sm opacity-80">
                                      Loss Rate
                                    </div>
                                  </div>
                                </div>

                                {/* Worst Performing Tags */}
                                <div>
                                  <h4 className="text-lg font-semibold mb-4">
                                    🚨 Most Problematic Tags
                                  </h4>
                                  <div className="grid md:grid-cols-2 gap-4">
                                    {worstTags.length > 0 ? (
                                      worstTags.map((tag: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
                                        >
                                          <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                              <AlertTriangle className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                              <div className="font-semibold text-lg">
                                                {tag.tag.toUpperCase()}
                                              </div>
                                              <div className="text-sm opacity-90 mb-2">
                                                Avg Loss: ₹
                                                {Math.abs(tag.avgLoss).toFixed(
                                                  0
                                                )}{" "}
                                                • {tag.lossFrequency.toFixed(0)}
                                                % loss rate
                                              </div>
                                              <div className="text-xs bg-red-500/30 rounded-lg p-2">
                                                Total Loss: ₹
                                                {Math.abs(
                                                  tag.totalPnL
                                                ).toLocaleString("en-IN")}{" "}
                                                across {tag.totalDays} days
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="col-span-2 text-center py-8">
                                        <div className="text-4xl mb-2">🎉</div>
                                        <p className="font-medium">
                                          No consistent loss-making patterns
                                          detected!
                                        </p>
                                        <p className="text-sm opacity-80">
                                          Your trading discipline is on track.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Disciplined Trading Insights */}
                        <div className="col-span-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl mt-6">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                              <Shield className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold">
                                Discipline & Risk Management
                              </h3>
                              <p className="opacity-80">
                                Build consistent, profitable trading habits
                              </p>
                            </div>
                          </div>

                          {(() => {
                            const allData = Object.values(
                              tradingDataByDate
                            ).filter(
                              (data: any) =>
                                data &&
                                data.tradingTags &&
                                Array.isArray(data.tradingTags) &&
                                data.performanceMetrics
                            );

                            if (allData.length === 0) {
                              return (
                                <div className="bg-white/10 rounded-2xl p-6 text-center">
                                  <div className="text-4xl mb-3">📊</div>
                                  <p className="font-medium">
                                    Ready for Discipline Analysis
                                  </p>
                                  <p className="opacity-80 text-sm">
                                    Start building your trading history!
                                  </p>
                                </div>
                              );
                            }

                            // Calculate discipline metrics
                            const disciplineMetrics = {
                              plannedTrades: 0,
                              emotionalTrades: 0,
                              consistentDays: 0,
                              riskManagedTrades: 0,
                              totalDays: allData.length,
                              avgTradesPerDay: 0,
                              winStreaks: 0,
                              lossStreaks: 0,
                            };

                            const disciplineInsights: any[] = [];
                            let totalTrades = 0;
                            let consecutiveWins = 0;
                            let consecutiveLosses = 0;
                            let maxWinStreak = 0;
                            let maxLossStreak = 0;

                            allData.forEach((data: any, idx: number) => {
                              const tags = data.tradingTags;
                              const pnl = data.performanceMetrics.netPnL;
                              const trades =
                                data.performanceMetrics.totalTrades;
                              totalTrades += trades;

                              // Check for planned trading
                              if (
                                tags.includes("planned") ||
                                tags.includes("setup") ||
                                tags.includes("strategy")
                              ) {
                                disciplineMetrics.plannedTrades++;
                              }

                              // Check for emotional trading
                              const emotionalTags = [
                                "fomo",
                                "fear",
                                "greedy",
                                "revenge",
                                "impatient",
                                "unplanned",
                              ];
                              if (
                                tags.some((tag: string) =>
                                  emotionalTags.includes(tag.toLowerCase())
                                )
                              ) {
                                disciplineMetrics.emotionalTrades++;
                              }

                              // Track win/loss streaks
                              if (pnl > 0) {
                                consecutiveWins++;
                                consecutiveLosses = 0;
                                maxWinStreak = Math.max(
                                  maxWinStreak,
                                  consecutiveWins
                                );
                              } else if (pnl < 0) {
                                consecutiveLosses++;
                                consecutiveWins = 0;
                                maxLossStreak = Math.max(
                                  maxLossStreak,
                                  consecutiveLosses
                                );
                              }

                              // Check for consistent trade size (discipline indicator)
                              if (trades <= 5) {
                                // Not overtrading
                                disciplineMetrics.consistentDays++;
                              }
                            });

                            disciplineMetrics.avgTradesPerDay =
                              totalTrades / disciplineMetrics.totalDays;
                            disciplineMetrics.winStreaks = maxWinStreak;
                            disciplineMetrics.lossStreaks = maxLossStreak;

                            // Generate discipline insights
                            const plannedRatio =
                              (disciplineMetrics.plannedTrades /
                                disciplineMetrics.totalDays) *
                              100;
                            const emotionalRatio =
                              (disciplineMetrics.emotionalTrades /
                                disciplineMetrics.totalDays) *
                              100;
                            const consistencyRatio =
                              (disciplineMetrics.consistentDays /
                                disciplineMetrics.totalDays) *
                              100;

                            if (plannedRatio > 70) {
                              disciplineInsights.push({
                                type: "success",
                                icon: "🎯",
                                title: "Excellent Planning",
                                message: `${plannedRatio.toFixed(
                                  0
                                )}% of your trades are well-planned. Keep this discipline!`,
                              });
                            } else if (plannedRatio < 30) {
                              disciplineInsights.push({
                                type: "warning",
                                icon: "⚠️",
                                title: "Planning Needed",
                                message: `Only ${plannedRatio.toFixed(
                                  0
                                )}% planned trades. Create setups before trading.`,
                              });
                            }

                            if (emotionalRatio > 40) {
                              disciplineInsights.push({
                                type: "danger",
                                icon: "🚨",
                                title: "Emotional Trading Alert",
                                message: `${emotionalRatio.toFixed(
                                  0
                                )}% emotional trades detected. Practice mindfulness.`,
                              });
                            }

                            if (disciplineMetrics.avgTradesPerDay > 8) {
                              disciplineInsights.push({
                                type: "warning",
                                icon: "⚡",
                                title: "Overtrading Risk",
                                message: `Avg ${disciplineMetrics.avgTradesPerDay.toFixed(
                                  1
                                )} trades/day. Consider quality over quantity.`,
                              });
                            }

                            if (maxLossStreak > 3) {
                              disciplineInsights.push({
                                type: "danger",
                                icon: "🛑",
                                title: "Loss Streak Warning",
                                message: `Max loss streak: ${maxLossStreak} days. Implement strict stop-loss rules.`,
                              });
                            }

                            if (consistencyRatio > 80) {
                              disciplineInsights.push({
                                type: "success",
                                icon: "⭐",
                                title: "Great Consistency",
                                message: `${consistencyRatio.toFixed(
                                  0
                                )}% consistent trading days. Excellent discipline!`,
                              });
                            }

                            // Add professional recommendations
                            const recommendations = [
                              {
                                icon: "📝",
                                title: "Pre-Market Planning",
                                tip: "Plan 3 trades max before market open with clear entry/exit rules",
                              },
                              {
                                icon: "💰",
                                title: "Risk Management",
                                tip: "Never risk more than 2% of capital per trade",
                              },
                              {
                                icon: "⏰",
                                title: "Trading Hours",
                                tip: "Trade only during high-volume hours (9:30-11:30 AM, 2:00-3:15 PM)",
                              },
                              {
                                icon: "📊",
                                title: "Position Sizing",
                                tip: "Use consistent position sizes based on account balance",
                              },
                            ];

                            return (
                              <div className="space-y-4 md:space-y-6">
                                {/* Discipline Metrics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center">
                                    <div className="text-lg md:text-2xl font-bold">
                                      {plannedRatio.toFixed(0)}%
                                    </div>
                                    <div className="text-xs md:text-sm opacity-80">
                                      Planned Trades
                                    </div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center">
                                    <div className="text-lg md:text-2xl font-bold">
                                      {disciplineMetrics.avgTradesPerDay.toFixed(
                                        1
                                      )}
                                    </div>
                                    <div className="text-xs md:text-sm opacity-80">
                                      Avg Trades/Day
                                    </div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center">
                                    <div className="text-lg md:text-2xl font-bold">
                                      {maxWinStreak}
                                    </div>
                                    <div className="text-xs md:text-sm opacity-80">
                                      Max Win Streak
                                    </div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center">
                                    <div className="text-lg md:text-2xl font-bold">
                                      {consistencyRatio.toFixed(0)}%
                                    </div>
                                    <div className="text-xs md:text-sm opacity-80">
                                      Consistent Days
                                    </div>
                                  </div>
                                </div>

                                {/* Discipline Insights */}
                                <div className="grid md:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="text-lg font-semibold mb-4">
                                      📈 Performance Insights
                                    </h4>
                                    <div className="space-y-3">
                                      {disciplineInsights.length > 0 ? (
                                        disciplineInsights
                                          .slice(0, 4)
                                          .map((insight, idx) => (
                                            <div
                                              key={idx}
                                              className={`p-4 rounded-xl border ${
                                                insight.type === "success"
                                                  ? "bg-emerald-500/20 border-emerald-400/30"
                                                  : insight.type === "warning"
                                                  ? "bg-amber-500/20 border-amber-400/30"
                                                  : "bg-red-500/20 border-red-400/30"
                                              }`}
                                            >
                                              <div className="flex items-start gap-3">
                                                <div className="text-xl">
                                                  {insight.icon}
                                                </div>
                                                <div>
                                                  <div className="font-medium">
                                                    {insight.title}
                                                  </div>
                                                  <div className="text-sm opacity-90">
                                                    {insight.message}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ))
                                      ) : (
                                        <div className="text-center py-6">
                                          <div className="text-3xl mb-2">
                                            📊
                                          </div>
                                          <p className="opacity-80">
                                            Insights will appear as you build
                                            trading history
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-lg font-semibold mb-4">
                                      🎯 Professional Tips
                                    </h4>
                                    <div className="space-y-3">
                                      {recommendations.map((rec, idx) => (
                                        <div
                                          key={idx}
                                          className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                                        >
                                          <div className="flex items-start gap-3">
                                            <div className="text-xl">
                                              {rec.icon}
                                            </div>
                                            <div>
                                              <div className="font-medium text-sm">
                                                {rec.title}
                                              </div>
                                              <div className="text-xs opacity-90 mt-1">
                                                {rec.tip}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {activeTab === "insights" && (
              <div className="min-h-screen bg-gray-900 text-white p-6 space-y-6">
                {/* Tools Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                      Tools
                    </h3>
                    <span className="text-sm text-blue-400 cursor-pointer hover:underline">
                      View all
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-4">
                    {/* Screeners */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer">
                      <div className="flex flex-col space-y-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center transform rotate-12">
                          <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white text-sm">
                            Screeners
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            Find anything within our universe
                          </p>
                        </div>
                        <div className="text-blue-400 text-xs">→</div>
                      </div>
                    </div>

                    {/* Supercharts */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer">
                      <div className="flex flex-col space-y-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center transform rotate-12">
                          <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white text-sm">
                            Supercharts
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            Our terminal to chart everything
                          </p>
                        </div>
                        <div className="text-blue-400 text-xs">→</div>
                      </div>
                    </div>

                    {/* Calendars */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer">
                      <div className="flex flex-col space-y-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center transform rotate-12">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white text-sm">
                            Calendars
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            Browse all upcoming financial events
                          </p>
                        </div>
                        <div className="text-blue-400 text-xs">→</div>
                      </div>
                    </div>

                    {/* News Flow */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer">
                      <div className="flex flex-col space-y-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center transform rotate-12">
                          <Newspaper className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white text-sm">
                            News Flow
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            Real-time financial news coverage right now
                          </p>
                        </div>
                        <div className="text-blue-400 text-xs">→</div>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer">
                      <div className="flex flex-col space-y-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center transform rotate-12">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white text-sm">
                            Options
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            Build your best options strategy
                          </p>
                        </div>
                        <div className="text-blue-400 text-xs">→</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-3 gap-6">
                  {/* Crypto Coin Screener */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white text-sm">
                          Crypto Coin Screener
                        </h4>
                        <span className="text-sm text-blue-400 cursor-pointer hover:underline">
                          View
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="text-xs text-gray-400 mb-2">
                          Company →
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm font-medium text-white">
                              TSLA
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-white">
                              $367
                            </div>
                            <div className="text-xs text-red-400">$2943</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-white">
                              AMD
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-white">
                              $660
                            </div>
                            <div className="text-xs text-green-400">$3605</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-sm font-medium text-white">
                              SKYLINE
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-white">
                              $357
                            </div>
                            <div className="text-xs text-green-400">$2943</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-white">
                              NVDA
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-white">
                              $357
                            </div>
                            <div className="text-xs text-green-400">$2943</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-center pt-2">
                          <button className="text-xs text-blue-400 flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />
                            Refresh
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Earning Calculator */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white text-sm">
                          Earning Calculator
                        </h4>
                        <span className="text-sm text-blue-400 cursor-pointer hover:underline">
                          View
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            Invested
                          </span>
                          <span className="text-xs text-gray-400">Current</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-gray-400">NVDA</span>
                        </div>

                        <div className="bg-gray-900 p-3 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-bold text-green-400">
                              $21.42
                            </span>
                            <span className="text-xs text-green-400">+5%</span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Today's Low</span>
                              <span className="text-gray-400">
                                Today's High
                              </span>
                            </div>

                            <div className="text-center">
                              <div className="text-sm font-medium text-white">
                                1403.24
                              </div>
                              <div className="text-sm font-medium text-white">
                                1454.35
                              </div>
                            </div>

                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">52W Low</span>
                              <span className="text-gray-400">52W High</span>
                            </div>

                            <div className="text-center">
                              <div className="text-sm font-medium text-white">
                                1223.24
                              </div>
                              <div className="text-sm font-medium text-white">
                                1754.35
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-center pt-2">
                          <button className="text-xs text-blue-400 flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />
                            Refresh
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tutorials */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white text-sm">
                          Tutorials
                        </h4>
                        <span className="text-sm text-blue-400 cursor-pointer hover:underline">
                          View all
                        </span>
                      </div>

                      <div className="space-y-4">
                        {/* First Tutorial */}
                        <div>
                          <div className="text-xs text-gray-400 mb-2">
                            🎯 Ethan R & 3 others
                          </div>
                          <div className="text-sm font-medium text-white mb-1">
                            The AI Revolution in Fintech: Smarter, Faster,
                            Riskier?
                          </div>
                          <div className="text-xs text-blue-400 mb-3">
                            #AI #MachineLearning #FinancialTech
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-1">
                              <div className="w-5 h-5 bg-orange-500 rounded-full border border-gray-800 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                  E
                                </span>
                              </div>
                              <div className="w-5 h-5 bg-blue-500 rounded-full border border-gray-800"></div>
                              <div className="w-5 h-5 bg-green-500 rounded-full border border-gray-800"></div>
                            </div>
                            <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                              <span className="text-xs text-gray-400">🔇</span>
                            </div>
                            <div className="flex-1 flex items-center gap-1">
                              {Array.from({ length: 8 }, (_, i) => (
                                <div
                                  key={i}
                                  className={`w-1 ${
                                    i < 5
                                      ? "h-3 bg-blue-500"
                                      : "h-2 bg-gray-600"
                                  } rounded-sm`}
                                ></div>
                              ))}
                            </div>
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <Play className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Second Tutorial */}
                        <div>
                          <div className="text-xs text-gray-400 mb-2">
                            🎯 Jordan M & 3 others
                          </div>
                          <div className="text-sm font-medium text-white mb-1">
                            The Dark Side of Fintech: Unmasking Hidden Risks
                          </div>
                          <div className="text-xs text-blue-400 mb-3">
                            #Fintech #DigitalBanking #CryptoRegulations
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-1">
                              <div className="w-5 h-5 bg-green-500 rounded-full border border-gray-800 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                  J
                                </span>
                              </div>
                              <div className="w-5 h-5 bg-purple-500 rounded-full border border-gray-800"></div>
                              <div className="w-5 h-5 bg-orange-500 rounded-full border border-gray-800"></div>
                            </div>
                            <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                              <span className="text-xs text-gray-400">🔇</span>
                            </div>
                            <div className="flex-1 flex items-center gap-1">
                              {Array.from({ length: 8 }, (_, i) => (
                                <div
                                  key={i}
                                  className={`w-1 ${
                                    i < 6
                                      ? "h-4 bg-purple-500"
                                      : "h-2 bg-gray-600"
                                  } rounded-sm`}
                                ></div>
                              ))}
                            </div>
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                              <Play className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Third Tutorial */}
                        <div>
                          <div className="text-xs text-gray-400 mb-2">
                            🎯 Sophia L & 3 others
                          </div>
                          <div className="text-sm font-medium text-white mb-1">
                            Decoding DeFi: The Future of Decentralized Finance
                          </div>
                          <div className="text-xs text-blue-400 mb-3">
                            #DeFi #Crypto #Blockchain
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-1">
                              <div className="w-5 h-5 bg-pink-500 rounded-full border border-gray-800 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                  S
                                </span>
                              </div>
                              <div className="w-5 h-5 bg-blue-500 rounded-full border border-gray-800"></div>
                              <div className="w-5 h-5 bg-red-500 rounded-full border border-gray-800"></div>
                            </div>
                            <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                              <span className="text-xs text-gray-400">🔇</span>
                            </div>
                            <div className="flex-1 flex items-center gap-1">
                              {Array.from({ length: 8 }, (_, i) => (
                                <div
                                  key={i}
                                  className={`w-1 ${
                                    i < 7
                                      ? "h-3 bg-green-500"
                                      : "h-2 bg-gray-600"
                                  } rounded-sm`}
                                ></div>
                              ))}
                            </div>
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                              <Play className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Peer Comparison */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-white text-sm">
                        Peer Comparison
                      </h4>
                      <span className="text-sm text-blue-400 cursor-pointer hover:underline">
                        View
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-4 text-xs text-gray-400">
                        <span>Company</span>
                        <span>52 Week →</span>
                        <span>Market Price</span>
                        <span>P/E Ratio</span>
                      </div>

                      <div className="space-y-3">
                        {/* EUR to USD */}
                        <div className="grid grid-cols-4 gap-4 items-center">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white">
                                🇪🇺
                              </div>
                              <div className="w-4 h-4 bg-blue-700 rounded-full flex items-center justify-center text-xs text-white ml-1">
                                🇺🇸
                              </div>
                            </div>
                            <span className="text-sm text-white">
                              EUR to USD
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1">
                            <div className="w-3/4 bg-gradient-to-r from-red-500 to-green-500 h-1 rounded-full"></div>
                          </div>
                          <span className="text-sm text-white">
                            892.56 (-0.33%)
                          </span>
                          <span className="text-sm text-white">12.56</span>
                        </div>

                        {/* JPY to USD */}
                        <div className="grid grid-cols-4 gap-4 items-center">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-xs text-white">
                                🇯🇵
                              </div>
                              <div className="w-4 h-4 bg-blue-700 rounded-full flex items-center justify-center text-xs text-white ml-1">
                                🇺🇸
                              </div>
                            </div>
                            <span className="text-sm text-white">
                              JPY to USD
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1">
                            <div className="w-2/3 bg-gradient-to-r from-red-500 to-green-500 h-1 rounded-full"></div>
                          </div>
                          <span className="text-sm text-white">
                            892.56 (-0.33%)
                          </span>
                          <span className="text-sm text-white">12.56</span>
                        </div>

                        {/* GBP to USD */}
                        <div className="grid grid-cols-4 gap-4 items-center">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-blue-800 rounded-full flex items-center justify-center text-xs text-white">
                                🇬🇧
                              </div>
                              <div className="w-4 h-4 bg-blue-700 rounded-full flex items-center justify-center text-xs text-white ml-1">
                                🇺🇸
                              </div>
                            </div>
                            <span className="text-sm text-white">
                              GBP to USD
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1">
                            <div className="w-1/2 bg-gradient-to-r from-red-500 to-green-500 h-1 rounded-full"></div>
                          </div>
                          <span className="text-sm text-white">
                            892.56 (-0.33%)
                          </span>
                          <span className="text-sm text-white">12.56</span>
                        </div>

                        {/* CHF to USD */}
                        <div className="grid grid-cols-4 gap-4 items-center">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-red-700 rounded-full flex items-center justify-center text-xs text-white">
                                🇨🇭
                              </div>
                              <div className="w-4 h-4 bg-blue-700 rounded-full flex items-center justify-center text-xs text-white ml-1">
                                🇺🇸
                              </div>
                            </div>
                            <span className="text-sm text-white">
                              CHF to USD
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1">
                            <div className="w-4/5 bg-gradient-to-r from-red-500 to-green-500 h-1 rounded-full"></div>
                          </div>
                          <span className="text-sm text-white">
                            892.56 (-0.33%)
                          </span>
                          <span className="text-sm text-white">12.56</span>
                        </div>

                        {/* CNY to USD */}
                        <div className="grid grid-cols-4 gap-4 items-center">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-xs text-white">
                                🇨🇳
                              </div>
                              <div className="w-4 h-4 bg-blue-700 rounded-full flex items-center justify-center text-xs text-white ml-1">
                                🇺🇸
                              </div>
                            </div>
                            <span className="text-sm text-white">
                              CNY to USD
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1">
                            <div className="w-full bg-gradient-to-r from-red-500 to-green-500 h-1 rounded-full"></div>
                          </div>
                          <span className="text-sm text-white">
                            892.56 (-0.33%)
                          </span>
                          <span className="text-sm text-white">12.56</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Trade History Modal */}
        <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Imported Trade History</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium">Time</th>
                      <th className="px-2 py-2 text-left font-medium">Order</th>
                      <th className="px-2 py-2 text-left font-medium">
                        Symbol
                      </th>
                      <th className="px-2 py-2 text-left font-medium">Type</th>
                      <th className="px-2 py-2 text-left font-medium">Qty</th>
                      <th className="px-2 py-2 text-left font-medium">Price</th>
                      <th className="px-2 py-2 text-left font-medium">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeHistoryData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-2 py-4 text-center text-gray-500"
                        >
                          No trade history imported
                        </td>
                      </tr>
                    ) : (
                      tradeHistoryData.map((trade, index) => {
                        return (
                          <tr
                            key={index}
                            className="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-2 py-2 font-medium">
                              {trade.time}
                            </td>
                            <td className="px-2 py-2">
                              <span
                                className={`px-1 py-0.5 rounded text-xs ${
                                  trade.order === "BUY"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                }`}
                              >
                                {trade.order}
                              </span>
                            </td>
                            <td className="px-2 py-2 font-medium">
                              {trade.symbol}
                            </td>
                            <td className="px-2 py-2">{trade.type}</td>
                            <td className="px-2 py-2">{trade.qty}</td>
                            <td className="px-2 py-2">₹{trade.price}</td>
                            <td className="px-2 py-2 font-medium">
                              <span
                                className={
                                  trade.pnl === "-"
                                    ? "text-gray-500"
                                    : trade.pnl &&
                                      parseFloat(
                                        (trade.pnl || "").replace(/[₹,]/g, "")
                                      ) > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {trade.pnl}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-gray-500">
                              {trade.duration}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Broker Import Dialog */}
        <BrokerImportDialog
          open={showBrokerImportModal}
          onOpenChange={setShowBrokerImportModal}
          onSuccess={handleBrokerImport}
        />

        {/* Import Modal */}
        <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import P&L Data</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="csv-upload" className="text-sm font-medium">
                  Upload CSV File
                </Label>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="mt-2"
                  data-testid="input-csv-upload"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Expected columns:
                  date,symbol,action,qty,entry,exit,pnl,duration
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Fetch from Broker
                </Label>
                <Button
                  variant="outline"
                  className="w-full mt-2 justify-start"
                  onClick={() => {
                    setShowImportModal(false);
                    setShowBrokerImportModal(true);
                  }}
                  data-testid="button-broker-import"
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  Connect to Kite, Fyers, or Dhan
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Import trades directly from your broker account
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="paste-data" className="text-sm font-medium">
                  Paste P&L Values or CSV Data
                </Label>
                <Textarea
                  id="paste-data"
                  placeholder="Paste P&L Values or CSV Data&#10;&#10;Use this format:&#10;10:51:21 AM   BUY     SENSEX 10th w JUN 82900 PE BFO  NRML    320     477.96&#10;10:51:39 AM  SELL    SENSEX 10th w JUN 82900 PE BFO  NRML    320     551.26"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="mt-2 min-h-32"
                  data-testid="textarea-paste-data"
                />
              </div>

              {importError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{importError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportData("");
                    setImportError("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleImportData}>Import Data</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Passcode Modal */}
        <Dialog open={showPasscodeModal} onOpenChange={setShowPasscodeModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center">Enter Passcode</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                This section is protected. Please enter the passcode to
                continue.
              </div>
              <div className="flex justify-center">
                <Input
                  type="password"
                  placeholder="Enter 4-digit passcode"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  className="w-40 text-center text-lg tracking-widest"
                  maxLength={4}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handlePasscodeSubmit();
                    }
                  }}
                  autoFocus
                  data-testid="input-passcode"
                />
              </div>
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={handlePasscodeCancel}
                  data-testid="button-cancel-passcode"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasscodeSubmit}
                  data-testid="button-submit-passcode"
                >
                  Submit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* BATTU AI Dialog */}
        <Dialog open={showBattuAI} onOpenChange={setShowBattuAI}>
          <DialogContent className="max-w-4xl h-[80vh] p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="flex items-center gap-3">
                <Bot className="h-6 w-6 text-purple-600" />
                <span>BATTU AI Finance Assistant</span>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 h-full px-6 pb-6">
              <StockNewsSearch />
            </div>
          </DialogContent>
        </Dialog>

        {/* Journal AI Dialog */}
        <Dialog open={showJournalAI} onOpenChange={setShowJournalAI}>
          <DialogContent className="max-w-5xl h-[85vh] p-0">
            <DialogHeader className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <DialogTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                  Trading Journal AI Assistant
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 h-full overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
                {/* Performance Report */}
                <div className="lg:col-span-2 p-6 overflow-y-auto">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {journalAIData?.report ? (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {journalAIData.report}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">
                          Loading journal analysis...
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance Trend Chart */}
                <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-800 p-6 border-l border-gray-200 dark:border-gray-700">
                  <div className="h-full flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Performance Trend
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span>Not Profitable</span>
                      </div>
                    </div>

                    <div className="flex-1 min-h-[250px]">
                      {journalAIData?.performanceData &&
                      journalAIData.performanceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={journalAIData.performanceData}
                            margin={{
                              top: 20,
                              right: 20,
                              left: 20,
                              bottom: 20,
                            }}
                          >
                            <defs>
                              <linearGradient
                                id="performanceGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor="rgb(107, 114, 128)"
                                  stopOpacity={0.4}
                                />
                                <stop
                                  offset="100%"
                                  stopColor="rgb(107, 114, 128)"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="day"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fill: "#6B7280" }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fill: "#6B7280" }}
                              tickFormatter={(value) => `₹${value}`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(17, 24, 39, 0.95)",
                                border: "none",
                                borderRadius: "8px",
                                color: "white",
                                fontSize: "12px",
                              }}
                              formatter={(value: any, name: string) => [
                                `₹${parseFloat(value).toFixed(2)}`,
                                "P&L",
                              ]}
                              labelFormatter={(label) => `Day: ${label}`}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="rgb(107, 114, 128)"
                              strokeWidth={2}
                              fill="url(#performanceGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                          <div className="text-center">
                            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">
                              No performance data available
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Mobile Bottom Navigation - Fixed at bottom, only visible on mobile */}
        {activeTab === "journal" && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-bottom">
            <div className="flex items-center justify-around px-4 py-3">
              {/* Home Tab */}
              <button
                onClick={() => setMobileBottomTab('home')}
                className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${
                  mobileBottomTab === 'home'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
                data-testid="mobile-tab-home"
              >
                <HomeIcon className={`h-6 w-6 ${mobileBottomTab === 'home' ? 'fill-current' : ''}`} />
                <span className="text-xs font-medium">Home</span>
              </button>

              {/* Insight Tab */}
              <button
                onClick={() => setMobileBottomTab('insight')}
                className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${
                  mobileBottomTab === 'insight'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
                data-testid="mobile-tab-insight"
              >
                <TrendingUp className={`h-6 w-6 ${mobileBottomTab === 'insight' ? 'stroke-2' : ''}`} />
                <span className="text-xs font-medium">Insight</span>
              </button>

              {/* Ranking Tab */}
              <button
                onClick={() => setMobileBottomTab('ranking')}
                className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${
                  mobileBottomTab === 'ranking'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
                data-testid="mobile-tab-ranking"
              >
                <Trophy className={`h-6 w-6 ${mobileBottomTab === 'ranking' ? 'fill-current' : ''}`} />
                <span className="text-xs font-medium">Ranking</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
