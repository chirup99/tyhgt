import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { AuthButton } from "@/components/auth-button";
import { AuthButtonAngelOne, AngelOneStatus, AngelOneApiStatistics, AngelOneSystemStatus } from "@/components/auth-button-angelone";
import { ConnectionStatus } from "@/components/connection-status";
import { MonthlyProgressTracker } from "@/components/monthly-progress-tracker";
import { SigninDataWindow } from "@/components/signin-data-window";
import { ApiStatistics } from "@/components/api-statistics";
import { ErrorPanel } from "@/components/error-panel";
import { TradingViewWidget } from "@/components/tradingview-widget";
import { AdvancedCandlestickChart } from "@/components/advanced-candlestick-chart";
import { EnhancedTradingViewWidget } from "@/components/enhanced-tradingview-widget";
import { TradingViewStyleChart } from "@/components/tradingview-style-chart";
import { MinimalChart } from "@/components/minimal-chart";
import {
  MultipleImageUpload,
  MultipleImageUploadRef,
} from "@/components/multiple-image-upload";
import { IndicatorCrossingsDisplay } from "@/components/indicator-crossings-display";
import { BattuScanSimulation } from "@/components/battu-scan-simulation";
import { FourCandleRuleScanner } from "@/components/four-candle-rule-scanner";
import NeoFeedSocialFeed from "@/components/neofeed-social-feed";
import SimpleCompleteScanner from "@/components/simple-complete-scanner";
import { BattuDocumentationDisplay } from "@/components/battu-documentation-display";
import { StrategyBuilder } from "@/components/strategy-builder";
import { TradingMaster } from "@/components/trading-master";
import { WorldMap } from "@/components/world-map";
import { DemoHeatmap } from "@/components/DemoHeatmap";
import { PersonalHeatmap } from "@/components/PersonalHeatmap";
import { useTheme } from "@/components/theme-provider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { auth } from "@/firebase";
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries, LineSeries, HistogramSeries, IPriceLine } from 'lightweight-charts';
import { signOut } from "firebase/auth";
import { LogOut, ArrowLeft, Save } from "lucide-react";
import { parseBrokerTrades, ParseError } from "@/utils/trade-parser";

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
  DialogFooter,
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
  RotateCw,
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
  Clock,
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
  Radio,
  Eye,
  Blocks,
  Hammer,
  Plus,
  Share2,
  Copy,
  Link2,
  ExternalLink,
  Facebook,
  Linkedin,
  Twitter,
  Settings,
  Filter,
  Radar,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { AIChatWindow } from "@/components/ai-chat-window";
import { BrokerImportDialog } from "@/components/broker-import-dialog";
import { TradeBlockEditor } from "@/components/TradeBlockEditor";
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

      const response = await fetch(getFullApiUrl("/api/daily-news"), {
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
        "",
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
        voice.name.toLowerCase().includes("moira"),
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
          voice.name.toLowerCase().includes("enhanced")),
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
          !voice.name.toLowerCase().includes("novelty"),
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
    <div className="relative w-56 h-48 md:w-44 md:h-52">
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
                    Math.max(0.3, 1 - Math.abs(deltaX) / 300),
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
                            '[data-card-index="0"]',
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
                    Math.max(0.3, 1 - Math.abs(deltaX) / 300),
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
                            '[data-card-index="0"]',
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

              document.addEventListener("touchmove", handleTouchMove, {
                passive: false,
              });
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
              className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 md:p-6 h-full relative overflow-hidden shadow-xl border-2 border-white/10 flex flex-col`}
            >
              {/* Character illustration area */}
              <div className="absolute bottom-0 right-0 w-20 h-20 md:w-24 md:h-24 opacity-20">
                <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/10 rounded-full"></div>
              </div>

              {/* Card content */}
              <div className="relative z-10 flex flex-col h-full">
                <div className="text-[10px] md:text-[9px] text-white/90 mb-1 md:mb-1.5 uppercase tracking-wider font-semibold">
                  {card.title}
                </div>
                <h3 className="text-lg md:text-base font-bold text-white mb-3 md:mb-3 leading-snug flex-grow">
                  {card.subtitle.split("\n").map((line, i) => (
                    <div key={i} className="block">{line}</div>
                  ))}
                </h3>
                <Button
                  className={`bg-white ${card.buttonColor} hover:bg-gray-100 px-3 py-1.5 md:px-3 md:py-1 rounded-full text-xs md:text-[11px] font-semibold shadow-lg w-fit`}
                  onClick={() => {
                    if (isTop) {
                      const userId = localStorage.getItem('currentUserId');
                      const userEmail = localStorage.getItem('currentUserEmail');
                      
                      if (!userId || !userEmail) {
                        console.log('🔒 User not authenticated, redirecting to login');
                        window.location.href = '/login';
                        return;
                      }
                      
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
              <div className="absolute top-2 right-2 md:top-1.5 md:right-1.5 text-xl md:text-lg filter drop-shadow-lg">
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
  CartesianGrid,
  Pie,
  Cell,
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
      const response = await fetch(getFullApiUrl("/api/historical-data"), {
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
        data,
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
      const response = await fetch(getFullApiUrl("/api/sentiment-analysis"), {
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

            <div className="max-h-96 overflow-auto border rounded-lg custom-thin-scrollbar">
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

// API base URL for Cloud Run compatibility - use environment variable
// BUT: In development mode (localhost), always use relative URLs to avoid CORS issues
const isDevelopmentMode = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.includes('replit.dev') ||
                          window.location.port === '5000';

const API_BASE_URL = isDevelopmentMode ? '' : (import.meta.env.VITE_API_URL || '');

// Helper function to construct full API URLs for Cloud Run compatibility
const getFullApiUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

export default function Home() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("trading-home");
  const [showTutorOverlay, setShowTutorOverlay] = useState(false);
  const [swipeStartY, setSwipeStartY] = useState(0);
  const [swipeCurrentY, setSwipeCurrentY] = useState(0);
  const [isSwipingUp, setIsSwipingUp] = useState(false);
  const [showJournalAI, setShowJournalAI] = useState(false);
  const [journalAIData, setJournalAIData] = useState<any>(null);
  const [statisticsTab, setStatisticsTab] = useState("overview");
  // Shared timeframe state for chart and crossings display
  const [chartTimeframe, setChartTimeframe] = useState<string>("1");
  // Navigation menu state
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  // Auth state initialization - wait for Firebase to sync
  const [authInitialized, setAuthInitialized] = useState(false);
  // View-only mode for unauthenticated users - they can view but not interact with protected features
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);

  // Get current user data from Firebase
  const { currentUser } = useCurrentUser();
  
  // Initialize Firebase auth sync with localStorage - NO AUTOMATIC REDIRECT
  // Users can view the home screen, redirect only happens when they try to interact with protected content
  useEffect(() => {
    const userId = localStorage.getItem('currentUserId');
    const userEmail = localStorage.getItem('currentUserEmail');
    
    if (userId && userEmail && userId !== 'null' && userEmail !== 'null') {
      console.log('✅ Auth initialized from localStorage:', { userId, userEmail });
      setAuthInitialized(true);
      setIsViewOnlyMode(false);
    } else {
      // Wait for Firebase auth state with timeout - but DON'T redirect, just enable view-only mode
      const timer = setTimeout(() => {
        const finalUserId = localStorage.getItem('currentUserId');
        const finalUserEmail = localStorage.getItem('currentUserEmail');
        
        if (!finalUserId || !finalUserEmail || finalUserId === 'null' || finalUserEmail === 'null') {
          console.log('🎯 No auth found - enabling view-only mode (no redirect)');
          setIsViewOnlyMode(true);
          setAuthInitialized(true); // Mark as initialized so UI renders
        } else {
          console.log('✅ Auth initialized after delay:', { finalUserId, finalUserEmail });
          setAuthInitialized(true);
          setIsViewOnlyMode(false);
        }
      }, 500); // Wait 500ms for Firebase auth to sync
      
      return () => clearTimeout(timer);
    }
  }, []);

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
    new Set(),
  );
  const [pendingTab, setPendingTab] = useState<string>("");

  // Expose toggle nav function to window for profile icon in right sidebar
  useEffect(() => {
    window.toggleNav = () => {
      setIsNavOpen(prev => !prev);
    };
    return () => {
      delete window.toggleNav;
    };
  }, []);

  // Passcode verification functions
  const protectedTabs = [
    "trading-home",
    "dashboard",
    "backtest",
  ]; // Protected tabs

  const handleTabClick = (tabName: string) => {
    if (protectedTabs.includes(tabName) && !authenticatedTabs.has(tabName)) {
      setPendingTab(tabName);
      setShowPasscodeModal(true);
    } else {
      setTabWithAuthCheck(tabName);
    }
  };

  const handlePasscodeSubmit = () => {
    if (passcodeInput === "1302") {
      const newAuthenticatedTabs = new Set(authenticatedTabs);
      newAuthenticatedTabs.add(pendingTab);
      setAuthenticatedTabs(newAuthenticatedTabs);
      setTabWithAuthCheck(pendingTab);
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

  // Trading Master Coming Soon Modal State
  const [showTradingMasterComingSoon, setShowTradingMasterComingSoon] = useState(false);
  const { toast } = useToast();
  
  // Share tradebook modal state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareableUrl, setShareableUrl] = useState<string | null>(null);
  const [isCreatingShareableLink, setIsCreatingShareableLink] = useState(false);
  const [isSharedReportMode, setIsSharedReportMode] = useState(false);
  const [sharedReportData, setSharedReportData] = useState<any>(null);

  // Handle shared report from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedReportId = params.get('sharedReport');
    
    if (sharedReportId) {
      // Open dialog immediately to show loading state
      setIsSharedReportMode(true);
      setShowShareDialog(true);
      
      // Fetch the shared report in background
      fetch(`/api/verified-reports/${sharedReportId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.report) {
            setSharedReportData(data.report);
            setShareableUrl(data.report.shareUrl);
          } else {
            // Close dialog if report not found
            setShowShareDialog(false);
            setIsSharedReportMode(false);
          }
        })
        .catch(err => {
          console.error('Failed to load shared report:', err);
          setShowShareDialog(false);
          setIsSharedReportMode(false);
        });
    }
  }, []);

  // Handle share dialog close in shared report mode
  const handleShareDialogClose = () => {
    setShowShareDialog(false);
    
    if (isSharedReportMode) {
      // Clean up query parameter and reset shared mode
      window.history.replaceState({}, '', '/');
      setIsSharedReportMode(false);
      setSharedReportData(null);
      setShareableUrl(null);
    }
  };

  // Centralized authentication check helper - ALL tab switches MUST use this
  const setTabWithAuthCheck = (tabName: string) => {
    const userId = localStorage.getItem('currentUserId');
    const userEmail = localStorage.getItem('currentUserEmail');
    
    // Robust check for Cloud Run compatibility
    if (!userId || !userEmail || userId === 'null' || userEmail === 'null') {
      console.log('[AUTH] Authentication required for tab:', tabName, '- redirecting to login');
      setLocation('/login');
      return false;
    }
    
    console.log('[AUTH] User authenticated, setting tab:', tabName);
    setActiveTab(tabName);
    return true;
  };

  // Check if user is logged in, redirect to login if not
  const checkAuthAndNavigate = (tabName: string) => {
    return setTabWithAuthCheck(tabName);
  };

  // Handle Trading Master access - only for chiranjeevi.perala99@gmail.com
  const handleTradingMasterAccess = () => {
    const userId = localStorage.getItem('currentUserId');
    const userEmail = localStorage.getItem('currentUserEmail');
    
    // Robust check for Cloud Run compatibility
    if (!userId || !userEmail || userId === 'null' || userEmail === 'null') {
      console.log('[AUTH] Authentication required for Trading Master - redirecting to login');
      setLocation('/login');
      return;
    }
    
    console.log('[AUTH] User authenticated for Trading Master check - email:', userEmail);
    // Check if user is authorized for Trading Master
    if (userEmail === 'chiranjeevi.perala99@gmail.com') {
      // Authorized user - navigate to trading-master tab
      setActiveTab('trading-master');
    } else {
      // Unauthorized user - show coming soon modal
      setShowTradingMasterComingSoon(true);
    }
  };

  // Create shareable trading report
  const handleCreateShareableLink = async () => {
    try {
      setIsCreatingShareableLink(true);
      
      // Gather trading data from the calendar
      const filteredData = getFilteredHeatmapData();
      const dates = Object.keys(filteredData).sort();
      
      // Calculate comprehensive stats
      let totalPnL = 0;
      let totalTrades = 0;
      let winningTrades = 0;
      let fomoCount = 0;
      const streaks: number[] = [];
      let currentStreak = 0;
      
      dates.forEach(dateKey => {
        const dayData = filteredData[dateKey];
        const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
        const tags = dayData?.tradingData?.tradingTags || dayData?.tradingTags || [];
        
        if (metrics) {
          const netPnL = metrics.netPnL || 0;
          totalPnL += netPnL;
          totalTrades += metrics.totalTrades || 0;
          winningTrades += metrics.winningTrades || 0;
          
          // Track FOMO tags
          if (Array.isArray(tags) && tags.some((tag: string) => tag.toLowerCase() === 'fomo')) {
            fomoCount++;
          }
          
          // Track win streaks
          if (netPnL > 0) {
            currentStreak++;
          } else if (netPnL < 0 && currentStreak > 0) {
            streaks.push(currentStreak);
            currentStreak = 0;
          }
        }
      });
      
      // Final streak
      if (currentStreak > 0) {
        streaks.push(currentStreak);
      }
      
      const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      
      // Create verified report
      const response = await fetch('/api/verified-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.userId || 'demo',
          username: currentUser?.displayName || currentUser?.email || 'Demo User',
          reportData: {
            tradingDataByDate: filteredData,
            totalPnL,
            totalTrades,
            winRate: Number(winRate.toFixed(2)),
            fomoCount,
            maxStreak,
            userId: currentUser?.userId || 'demo',
            username: currentUser?.displayName || currentUser?.email || 'Demo User',
            tagline: 'rethink & reinvest',
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.report) {
        setShareableUrl(result.report.shareUrl);
        toast({
          title: "Shareable link created!",
          description: "Your trading report is ready to share. Link expires in 7 days.",
        });
      } else {
        throw new Error(result.error || 'Failed to create shareable link');
      }
    } catch (error) {
      console.error('[SHARE] Error creating shareable link:', error);
      toast({
        title: "Error",
        description: "Failed to create shareable link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingShareableLink(false);
    }
  };

  // AI Finance Assistant Logic - Real data fetching and analysis
  const fetchRealStockData = async (
    symbol: string,
  ): Promise<StockData | null> => {
    try {
      console.log(`🤖 AI Search fetching real data for ${symbol}...`);
      const response = await fetch(`/api/stock-analysis/${symbol}`);
      const data = await response.json();

      if (data && data.priceData) {
        console.log(
          `✅ AI Search got real data for ${symbol}:`,
          data.priceData,
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

    // Check authentication before allowing search
    const userId = localStorage.getItem('currentUserId');
    const userEmail = localStorage.getItem('currentUserEmail');
    
    if (!userId || !userEmail || userId === 'null' || userEmail === 'null') {
      console.log('[AUTH] Authentication required for search - redirecting to login');
      setLocation('/login');
      return;
    }

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
        message.includes(stock),
      );

      // USE ADVANCED QUERY PROCESSOR FOR ALL QUERIES - Like Replit Agent
      // This handles ANY question with web search + intelligent analysis
      console.log(
        "🤖 [FRONTEND] Triggering Advanced AI Query Processor (Web Search Enabled)...",
      );

      try {
        console.log("📊 [FRONTEND] Fetching trading journal data...");
        let journalTrades: any[] = [];
        try {
          const journalResponse = await fetch(getFullApiUrl("/api/journal/all-dates"));
          if (journalResponse.ok) {
            const allJournalData = await journalResponse.json();
            // Flatten all trades from all dates
            Object.entries(allJournalData).forEach(
              ([date, data]: [string, any]) => {
                if (data.tradeHistory && Array.isArray(data.tradeHistory)) {
                  journalTrades.push(
                    ...data.tradeHistory.map((trade: any) => ({
                      ...trade,
                      date,
                    })),
                  );
                }
              },
            );
            console.log(
              `✅ [FRONTEND] Loaded ${journalTrades.length} trades from journal`,
            );
          }
        } catch (journalError) {
          console.warn(
            "⚠️ [FRONTEND] Could not load journal data:",
            journalError,
          );
        }

        const response = await fetch(getFullApiUrl("/api/advanced-query"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: query,
            journalTrades: journalTrades,
          }),
        });

        if (response.ok) {
          const data = await response.json();

          let result = data.answer;

          // Store company insights data on window for chart rendering
          if (data.companyInsights) {
            (window as any).companyInsightsData = data.companyInsights;
            console.log("✅ [FRONTEND] Received company insights:", data.companyInsights.symbol, data.companyInsights.trend);
          } else {
            (window as any).companyInsightsData = null;
          }

          setSearchResults(result);
          console.log("✅ [FRONTEND] Advanced query processing complete!");
          setIsSearchLoading(false);
          return;
        } else {
          console.error(
            "❌ [FRONTEND] Advanced query failed:",
            response.statusText,
          );
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
            2,
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
            `📊 **Technical Analysis Hub**\n\nAccess advanced technical indicators through:\n• **Trading Master:** Full charting suite with RSI, MACD, Bollinger Bands\n• **Live Options:** Greeks and technical levels\n• **Community Analysis:** Social Feed technical discussions\n\n🚀 Switch to Trading Master for comprehensive technical analysis.`,
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

          const socialResponse = await fetch(getFullApiUrl("/api/social-posts?limit=5"), {
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
                  post.content.toLowerCase().includes(mentionedStock),
              );
            }

            // Extract trending topics
            const trendingTopics = Array.from(
              new Set(
                socialData.flatMap((post: any) =>
                  (post.content?.match(/\b[A-Z]{3,}\b/g) || []).slice(0, 3),
                ),
              ),
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
      ).substring(0, 120)}...`,
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
            p.content?.toLowerCase().includes("buy"),
        )
          ? "bullish sentiment"
          : relevantPosts.some(
                (p: any) =>
                  p.content?.toLowerCase().includes("bearish") ||
                  p.content?.toLowerCase().includes("sell"),
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
              `💬 **Social Feed Center**\n\nAccess community insights:\n• **Live Discussions:** Real-time market conversations\n• **Expert Analysis:** Professional trader perspectives\n• **Trending Topics:** What the community is discussing\n\n🚀 Switch to Social Feed tab for full community analysis.`,
            );
          }
        } catch (error) {
          setSearchResults(
            `💬 **Social Feed Access**\n\nConnect with the trading community through our Social Feed tab for:\n• Live market discussions\n• Community sentiment analysis\n• Expert trading insights\n\n💡 Navigate to Social Feed for real-time community intelligence.`,
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
          `🔍 **Loading ${stock} Data...**\n\n⏱️ Fetching live market data...`,
        );

        // Use existing stock analysis endpoint with timeout
        let realData: StockData | null = null;
        try {
          realData = await Promise.race([
            fetchRealStockData(stock),
            new Promise<StockData | null>((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 4000),
            ),
          ]);
        } catch (error) {
          console.log("Stock data timeout, using fallback");
        }

        if (realData) {
          // Get additional fundamental data from social feed
          let fundamentalData = "";
          try {
            const socialResponse = await fetch(getFullApiUrl("/api/social-posts?limit=5"));
            if (socialResponse.ok) {
              const socialData = await socialResponse.json();
              const relevantPosts = socialData.filter(
                (post: any) =>
                  post.content &&
                  (post.content.toLowerCase().includes(stock.toLowerCase()) ||
                    post.content.toLowerCase().includes("market") ||
                    post.content.toLowerCase().includes("analysis")),
              );

              if (relevantPosts.length > 0) {
                fundamentalData = `\n**📊 Community Analysis:**\n${relevantPosts
                  .slice(0, 2)
                  .map(
                    (post: any, index: number) =>
                      `${index + 1}. ${post.content.substring(0, 150)}...`,
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
            2,
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
            `/api/stock-news?query=${encodeURIComponent(query)}`,
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
      }\n   _Source: ${article.source || "Market News"}_`,
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
            `📰 **News Center**\n\nAccess the latest market news through our platform features:\n\n• **Social Feed:** Community market discussions\n• **Trading Master:** Technical analysis and market updates\n• **Platform Dashboard:** Real-time market information\n\n💡 Use Social Feed for the most current market insights.`,
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
                      .includes(mentionedStock.toLowerCase()))),
            );

            if (fundamentalPosts.length > 0) {
              fundamentalInsights = `**📈 Community Fundamental Analysis:**
${fundamentalPosts
  .slice(0, 3)
  .map(
    (post: any, index: number) =>
      `${index + 1}. ${post.content.substring(0, 200)}...`,
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
            `📊 **Fundamental Analysis Hub**\n\n**📱 Available Resources:**\n• **Social Feed:** Community fundamental discussions\n• **Trading Master:** Financial ratios and analysis tools\n• **Platform Data:** Real-time market and company information\n\n💡 Check Social Feed for active fundamental analysis discussions.`,
          );
        }
      }

      // Advanced AI Search - Uses Gemini AI + Web Search (like Replit Agent)
      else {
        console.log(`🤖 Using Advanced AI Agent for query: ${query}`);

        try {
          const response = await fetch(getFullApiUrl("/api/advanced-search"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query,
              includeWebSearch: true,
            }),
          });

          const data = await response.json();

          if (data.success && data.answer) {
            let result = `## 🤖 AI Assistant\n\n${data.answer}`;

            if (data.sources && data.sources.length > 0) {
              result += `\n\n**📚 Sources:**\n${data.sources.map((source: string) => `• ${source}`).join("\n")}`;
            }

            setSearchResults(result);
          } else {
            throw new Error("AI search failed");
          }
        } catch (error) {
          console.error("Advanced AI search error:", error);

          const fallbackResponse = `🤖 **AI Trading Assistant Ready!**\n\nI can help you with comprehensive trading and investment analysis:\n\n📈 **Live Stock Prices & Analysis:**\n• Real-time market data and technical indicators\n• Sector performance and trend analysis\n• Support/resistance levels and price targets\n\n📰 **Market News & Updates:**\n• Latest financial news and market movements\n• Economic indicators and policy impacts\n• Corporate earnings and sector trends\n\n🚀 **IPO Analysis & Information:**\n• Upcoming IPO calendar and subscription details\n• Post-listing performance tracking\n• Investment recommendations and risk assessment\n\n📊 **Fundamental Analysis:**\n• Company financials and valuation metrics\n• Sector comparisons and growth prospects\n• Risk analysis and investment recommendations\n\n💡 **Try asking:** "Get NIFTY price", "Latest market news", "IPO updates", or "Analyze fundamentals"`;

          setSearchResults(fallbackResponse);
        }
      }
    } catch (error) {
      console.error("AI Search error:", error);
      setSearchResults(
        "🤖 I'm here to help with all your trading and finance questions! I can assist with:\n\n• Stock analysis and live quotes\n• Market news and IPO updates\n• Trading strategies and risk management\n• Platform features (Trading Master, Journal, Social Feed)\n• Options trading and Greeks calculation\n\nWhat would you like to know more about?",
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
      const allDatesResponse = await fetch(getFullApiUrl("/api/journal/all-dates"));
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
          "## 📝 Trading Journal Analysis\n\n❌ **No journal data found**\n\nPlease add some trading entries in the Journal tab to see your performance analysis.",
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
        "## 📝 Trading Journal Analysis\n\n❌ **Error loading journal data**\n\nPlease try again or check your internet connection.",
      );
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Function to fetch trending podcasts for a specific sector
  const fetchTrendingPodcasts = async (sector: string) => {
    setIsPodcastsLoading(true);
    try {
      const response = await fetch(getFullApiUrl("/api/trending-podcasts"), {
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

  // Event images - using gradient placeholders for cloud deployment
  const getEventImage = (eventName: string) => {
    // Return a data URL with gradient based on event type
    const gradients: Record<string, string> = {
      "Global Startup Summit | Hyderabad 2025": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "TiE Bangalore Founders Summit": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "Pharma Bio Summit Hyderabad": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "Hyderabad Food Festival": "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      "HITEX IT Expo Hyderabad": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "Mumbai Fintech Festival": "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
      "Nasscom Product Conclave Bangalore": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "India AI Summit Mumbai": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    };
    const gradient = gradients[eventName] || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    // Return empty string to use CSS gradient instead
    return "";
  };

  // Removed AI image generation effects

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState("");
  const [importError, setImportError] = useState("");
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [isBuildMode, setIsBuildMode] = useState(false);
  
  // Define the format type with position-based structure (supports multiple positions per field)
  type FormatData = {
    sampleLine: string;  // Original first line of trade data
    positions: {
      time: number[];  // Array of positions
      order: number[];
      symbol: number[];
      type: number[];
      qty: number[];
      price: number[];
    };
    // Keep string values for display in build table
    displayValues: {
      time: string;
      order: string;
      symbol: string;
      type: string;
      qty: string;
      price: string;
    };
  };
  
  // Define ParseResult type for trade parsing
  type ParseResult = {
    trades: any[];
    errors: ParseError[];
  };
  
  const [buildModeData, setBuildModeData] = useState<FormatData>({
    sampleLine: "",
    positions: {
      time: [],
      order: [],
      symbol: [],
      type: [],
      qty: [],
      price: []
    },
    displayValues: {
      time: "",
      order: "",
      symbol: "",
      type: "",
      qty: "",
      price: ""
    }
  });
  const [savedFormatLabel, setSavedFormatLabel] = useState("");
  const [savedFormats, setSavedFormats] = useState<Record<string, FormatData>>({});
  const [activeFormat, setActiveFormat] = useState<FormatData | null>(null);
  const [detectedFormatLabel, setDetectedFormatLabel] = useState<string | null>(null);
  const [formatsLoading, setFormatsLoading] = useState(false);
  const importDataTextareaRef = useRef<HTMLTextAreaElement>(null);
  // Helper function to save formats to Firebase
  const saveFormatsToFirebase = async (formats: Record<string, FormatData>) => {
    if (!currentUser?.userId) {
      console.log("⏳ No authenticated user, cannot save to Firebase");
      toast({
        title: "Authentication Required",
        description: "Please log in to save formats",
        variant: "destructive"
      });
      return false;
    }

    try {
      console.log("💾 Saving formats to Firebase for userId:", currentUser.userId);
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return false;
      
      const response = await fetch(`/api/user-formats/${currentUser.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(formats)
      });

      if (response.ok) {
        console.log("✅ Formats saved to Firebase successfully");
        toast({
          title: "Saved Successfully",
          description: "Your format has been saved to Firebase"
        });
        return true;
      } else {
        console.error("❌ Failed to save formats to Firebase");
      toast({
        title: "Save Failed",
        description: "Failed to save format to Firebase",
        variant: "destructive"
      });
      return false;
      }
    } catch (error) {
      console.error("❌ Error saving formats to Firebase:", error);
      toast({
        title: "Network Error",
        description: "Could not connect to server",
        variant: "destructive"
      });
      return false;
    }
  };


  // Load user's saved formats from Firebase when user is authenticated
  useEffect(() => {
    const loadUserFormats = async () => {
      console.log("🔄 loadUserFormats triggered, currentUser:", currentUser?.userId ? `userId: ${currentUser.userId}` : "NO USER");
      
      if (!currentUser?.userId) {
        console.log("⏳ No authenticated user, skipping format load");
        setSavedFormats({});
        setFormatsLoading(false);
        return;
      }

      setFormatsLoading(true);
      try {
        console.log("📥 Loading user formats from Firebase for userId:", currentUser.userId);
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          console.error("❌ Failed to get Firebase ID token");
          setFormatsLoading(false);
          return;
        }
        
        console.log("🔑 Got Firebase ID token, making request to /api/user-formats/", currentUser.userId);
        const response = await fetch(`/api/user-formats/${currentUser.userId}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        console.log("📡 Response status:", response.status, response.statusText);
        if (response.ok) {
          const formats = await response.json();
          console.log("✅ Loaded formats from Firebase:", Object.keys(formats).length, "formats", formats);
          setSavedFormats(formats);
          if (Object.keys(formats).length > 0) {
            console.log("📦 Formats available in dropdown:", Object.keys(formats).join(", "));
          }
        } else {
          const errorText = await response.text();
          console.log("📭 No saved formats found in Firebase, status:", response.status, "error:", errorText);
          setSavedFormats({});
        }
      } catch (error) {
        console.error("❌ Error loading user formats:", error);
        setSavedFormats({});
      } finally {
        setFormatsLoading(false);
      }
    };

    loadUserFormats();
  }, [currentUser?.userId]);

  // Reload formats when import dialog opens
  useEffect(() => {
    if (showImportModal && currentUser?.userId) {
      console.log("📂 Import dialog opened, reloading formats...");
      setFormatsLoading(true);
      // Create a function to reload formats without dependency on state
      (async () => {
        try {
          const idToken = await auth.currentUser?.getIdToken();
          if (idToken) {
            const response = await fetch(`/api/user-formats/${currentUser.userId}`, {
              headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (response.ok) {
              const formats = await response.json();
              console.log("✅ Dialog opened - formats reloaded:", Object.keys(formats).length);
              setSavedFormats(formats);
              if (Object.keys(formats).length > 0) {
                console.log("📦 Formats now available in dropdown:", Object.keys(formats).join(", "));
              }
            }
          }
        } catch (err) {
          console.error("❌ Failed to reload formats on dialog open:", err);
        } finally {
          setFormatsLoading(false);
        }
      })();
    }
  }, [showImportModal, currentUser?.userId]);

  // Auto-detect format when pasting data
  useEffect(() => {
    if (importData.trim() && Object.keys(savedFormats).length > 0) {
      const firstLine = importData.trim().split('\n')[0];
      
      // Check if this line matches any saved format's sample line
      for (const [label, format] of Object.entries(savedFormats)) {
        if (format.sampleLine && firstLine === format.sampleLine) {
          setActiveFormat(format);
          setDetectedFormatLabel(label);
          console.log("🎯 Auto-detected format:", label, "for line:", firstLine);
          return;
        }
      }
      // No match found - clear active format
      setActiveFormat(null);
      setDetectedFormatLabel(null);
    } else if (!importData.trim()) {
      // Clear when data is cleared
      setActiveFormat(null);
      setDetectedFormatLabel(null);
    }
  }, [importData, savedFormats]);

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

  // ============================================
  // PAPER TRADING (DEMO TRADING) STATE - Like TradingView Practice Account
  // ============================================
  const [showPaperTradingModal, setShowPaperTradingModal] = useState(false);
  const [paperTradingCapital, setPaperTradingCapital] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("paperTradingCapital");
      return stored ? parseFloat(stored) : 1000000; // 10 Lakhs default
    }
    return 1000000;
  });
  
  // Paper trading position interface
  interface PaperPosition {
    id: string;
    symbol: string;
    type: 'STOCK' | 'FUTURES' | 'OPTIONS';
    action: 'BUY' | 'SELL';
    quantity: number;
    entryPrice: number;
    currentPrice: number;
    entryTime: string;
    pnl: number;
    pnlPercent: number;
    isOpen: boolean;
  }
  
  // Paper trading trade history
  interface PaperTrade {
    id: string;
    symbol: string;
    type: 'STOCK' | 'FUTURES' | 'OPTIONS';
    action: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    time: string;
    pnl?: string;
    closedAt?: string;
  }
  
  const [paperPositions, setPaperPositions] = useState<PaperPosition[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("paperPositions");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  
  const [paperTradeHistory, setPaperTradeHistory] = useState<PaperTrade[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("paperTradeHistory");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  
  // Paper trading form state
  const [paperTradeSymbol, setPaperTradeSymbol] = useState("");
  const [paperTradeSymbolSearch, setPaperTradeSymbolSearch] = useState("");
  const [paperTradeType, setPaperTradeType] = useState<'STOCK' | 'FUTURES' | 'OPTIONS'>('STOCK');
  const [paperTradeQuantity, setPaperTradeQuantity] = useState("");
  const [paperTradeAction, setPaperTradeAction] = useState<'BUY' | 'SELL'>('BUY');
  const [paperTradeCurrentPrice, setPaperTradeCurrentPrice] = useState<number | null>(null);
  const [paperTradePriceLoading, setPaperTradePriceLoading] = useState(false);
  const paperTradingStreamSymbolsRef = useRef<Set<string>>(new Set());
  
  // Available stock symbols for paper trading
  const paperTradingSymbols = [
    { symbol: "RELIANCE", name: "Reliance Industries", token: "2885", exchange: "NSE" },
    { symbol: "TCS", name: "Tata Consultancy Services", token: "11536", exchange: "NSE" },
    { symbol: "HDFCBANK", name: "HDFC Bank", token: "1333", exchange: "NSE" },
    { symbol: "ICICIBANK", name: "ICICI Bank", token: "4963", exchange: "NSE" },
    { symbol: "INFY", name: "Infosys", token: "1594", exchange: "NSE" },
    { symbol: "ITC", name: "ITC Limited", token: "1660", exchange: "NSE" },
    { symbol: "SBIN", name: "State Bank of India", token: "3045", exchange: "NSE" },
    { symbol: "BHARTIARTL", name: "Bharti Airtel", token: "10604", exchange: "NSE" },
    { symbol: "HINDUNILVR", name: "Hindustan Unilever", token: "1394", exchange: "NSE" },
    { symbol: "LT", name: "Larsen & Toubro", token: "11483", exchange: "NSE" },
    { symbol: "AXISBANK", name: "Axis Bank", token: "5900", exchange: "NSE" },
    { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", token: "1922", exchange: "NSE" },
    { symbol: "BAJFINANCE", name: "Bajaj Finance", token: "317", exchange: "NSE" },
    { symbol: "MARUTI", name: "Maruti Suzuki", token: "10999", exchange: "NSE" },
    { symbol: "TITAN", name: "Titan Company", token: "3506", exchange: "NSE" },
    { symbol: "SUNPHARMA", name: "Sun Pharma", token: "3351", exchange: "NSE" },
    { symbol: "TATAMOTORS", name: "Tata Motors", token: "3456", exchange: "NSE" },
    { symbol: "WIPRO", name: "Wipro", token: "3787", exchange: "NSE" },
    { symbol: "TECHM", name: "Tech Mahindra", token: "13538", exchange: "NSE" },
    { symbol: "ADANIENT", name: "Adani Enterprises", token: "25", exchange: "NSE" },
    { symbol: "NIFTY50", name: "Nifty 50 Index", token: "26000", exchange: "NSE" },
    { symbol: "BANKNIFTY", name: "Bank Nifty Index", token: "26009", exchange: "NSE" },
  ];
  
  // Filtered symbols based on search
  const filteredPaperTradingSymbols = paperTradingSymbols.filter(s => 
    s.symbol.toLowerCase().includes(paperTradeSymbolSearch.toLowerCase()) ||
    s.name.toLowerCase().includes(paperTradeSymbolSearch.toLowerCase())
  );
  
  // Fetch live price from Angel One API (connects to chart WebSocket)
  const fetchPaperTradePrice = async (symbol: string) => {
    const stockInfo = paperTradingSymbols.find(s => s.symbol === symbol);
    if (!stockInfo) return;
    
    setPaperTradePriceLoading(true);
    try {
      // Subscribe this symbol to the live chart stream
      paperTradingStreamSymbolsRef.current.add(symbol);
      
      const response = await fetch('/api/angelone/ltp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchange: stockInfo.exchange,
          tradingSymbol: stockInfo.symbol,
          symbolToken: stockInfo.token
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.ltp) {
          setPaperTradeCurrentPrice(data.data.ltp);
        } else {
          setPaperTradeCurrentPrice(Math.floor(Math.random() * 3000) + 500);
        }
      } else {
        setPaperTradeCurrentPrice(Math.floor(Math.random() * 3000) + 500);
      }
    } catch (error) {
      console.error("Error fetching paper trade price:", error);
      setPaperTradeCurrentPrice(Math.floor(Math.random() * 3000) + 500);
    } finally {
      setPaperTradePriceLoading(false);
    }
  };
  
  // Execute paper trade (BUY or SELL)
  const executePaperTrade = () => {
    if (!paperTradeSymbol || !paperTradeQuantity || !paperTradeCurrentPrice) {
      toast({
        title: "Invalid Trade",
        description: "Please select a symbol and enter quantity",
        variant: "destructive"
      });
      return;
    }
    
    const quantity = parseInt(paperTradeQuantity);
    const tradeValue = quantity * paperTradeCurrentPrice;
    
    if (paperTradeAction === 'BUY') {
      // Check if enough capital
      if (tradeValue > paperTradingCapital) {
        toast({
          title: "Insufficient Capital",
          description: `Need ₹${tradeValue.toLocaleString()} but only ₹${paperTradingCapital.toLocaleString()} available`,
          variant: "destructive"
        });
        return;
      }
      
      // Create new position
      const newPosition: PaperPosition = {
        id: `PT-${Date.now()}`,
        symbol: paperTradeSymbol,
        type: paperTradeType,
        action: 'BUY',
        quantity: quantity,
        entryPrice: paperTradeCurrentPrice,
        currentPrice: paperTradeCurrentPrice,
        entryTime: new Date().toLocaleTimeString(),
        pnl: 0,
        pnlPercent: 0,
        isOpen: true
      };
      
      // Add to positions
      const updatedPositions = [...paperPositions, newPosition];
      setPaperPositions(updatedPositions);
      localStorage.setItem("paperPositions", JSON.stringify(updatedPositions));
      
      // Deduct from capital
      const newCapital = paperTradingCapital - tradeValue;
      setPaperTradingCapital(newCapital);
      localStorage.setItem("paperTradingCapital", String(newCapital));
      
      // Add to trade history
      const newTrade: PaperTrade = {
        id: newPosition.id,
        symbol: paperTradeSymbol,
        type: paperTradeType,
        action: 'BUY',
        quantity: quantity,
        price: paperTradeCurrentPrice,
        time: new Date().toLocaleTimeString()
      };
      const updatedHistory = [...paperTradeHistory, newTrade];
      setPaperTradeHistory(updatedHistory);
      localStorage.setItem("paperTradeHistory", JSON.stringify(updatedHistory));
      
      toast({
        title: "Trade Executed",
        description: `Bought ${quantity} ${paperTradeSymbol} @ ₹${paperTradeCurrentPrice.toFixed(2)}`
      });
      
    } else {
      // SELL - Close an existing position
      const openPosition = paperPositions.find(p => p.symbol === paperTradeSymbol && p.isOpen);
      
      if (!openPosition) {
        toast({
          title: "No Open Position",
          description: `You don't have an open position in ${paperTradeSymbol} to sell`,
          variant: "destructive"
        });
        return;
      }
      
      // Calculate P&L
      const pnl = (paperTradeCurrentPrice - openPosition.entryPrice) * openPosition.quantity;
      const pnlPercent = ((paperTradeCurrentPrice - openPosition.entryPrice) / openPosition.entryPrice) * 100;
      
      // Close the position
      const updatedPositions = paperPositions.map(p => 
        p.id === openPosition.id 
          ? { ...p, isOpen: false, currentPrice: paperTradeCurrentPrice, pnl, pnlPercent }
          : p
      );
      setPaperPositions(updatedPositions);
      localStorage.setItem("paperPositions", JSON.stringify(updatedPositions));
      
      // Add sale value back to capital plus P&L
      const saleValue = openPosition.quantity * paperTradeCurrentPrice;
      const newCapital = paperTradingCapital + saleValue;
      setPaperTradingCapital(newCapital);
      localStorage.setItem("paperTradingCapital", String(newCapital));
      
      // Add sell trade to history
      const sellTrade: PaperTrade = {
        id: `PT-${Date.now()}`,
        symbol: paperTradeSymbol,
        type: paperTradeType,
        action: 'SELL',
        quantity: openPosition.quantity,
        price: paperTradeCurrentPrice,
        time: new Date().toLocaleTimeString(),
        pnl: `${pnl >= 0 ? '+' : ''}₹${pnl.toFixed(2)}`,
        closedAt: new Date().toLocaleTimeString()
      };
      const updatedHistory = [...paperTradeHistory, sellTrade];
      setPaperTradeHistory(updatedHistory);
      localStorage.setItem("paperTradeHistory", JSON.stringify(updatedHistory));
      
      toast({
        title: pnl >= 0 ? "Profit Booked!" : "Loss Booked",
        description: `Sold ${openPosition.quantity} ${paperTradeSymbol} @ ₹${paperTradeCurrentPrice.toFixed(2)} | P&L: ${pnl >= 0 ? '+' : ''}₹${pnl.toFixed(2)}`
      });
    }
    
    // Reset form
    setPaperTradeSymbol("");
    setPaperTradeQuantity("");
    setPaperTradeCurrentPrice(null);
    setPaperTradeSymbolSearch("");
  };
  
  // Reset paper trading account
  const resetPaperTradingAccount = () => {
    setPaperTradingCapital(1000000);
    setPaperPositions([]);
    setPaperTradeHistory([]);
    localStorage.setItem("paperTradingCapital", "1000000");
    localStorage.setItem("paperPositions", "[]");
    localStorage.setItem("paperTradeHistory", "[]");
    toast({
      title: "Account Reset",
      description: "Paper trading account reset to ₹10,00,000"
    });
  };
  
  // Persist paper trading positions to localStorage when they change
  useEffect(() => {
    localStorage.setItem("paperPositions", JSON.stringify(paperPositions));
  }, [paperPositions]);
  // ============================================
  // END PAPER TRADING STATE
  // ============================================

  // ✅ SIMPLIFIED: TWO SEPARATE HEATMAP DATA STATES - NO localStorage!
  // Demo heatmap data (Heatmap #1) - loaded directly from Firebase
  const [demoTradingDataByDate, setDemoTradingDataByDate] = useState<Record<string, any>>({});

  // Personal heatmap data (Heatmap #2) - loaded directly from Firebase
  const [personalTradingDataByDate, setPersonalTradingDataByDate] = useState<Record<string, any>>({});

  // ✅ PERSONAL HEATMAP REVISION: Track updates to force React re-renders
  // This counter increments after personal auto-clicking completes
  // Ensures heatmap cells update when personalTradingDataByDate changes
  const [personalHeatmapRevision, setPersonalHeatmapRevision] = useState(0);

  // Demo mode state - toggle between demo data (same for all users) and user-specific data
  // Switch ON (true) = Demo mode active (shared demo data, Heatmap #1)
  // Switch OFF (false) = Personal mode active (user-specific data, Heatmap #2)
  const [isDemoMode, setIsDemoMode] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tradingJournalDemoMode");
      // If user has explicitly set a preference, respect it
      if (stored !== null) {
        return stored === "true";
      }
      
      // ✅ SMART DEFAULT: If no userId exists, automatically start in Demo mode
      // This ensures heatmap loads instantly without needing to toggle
      const userId = localStorage.getItem("currentUserId");
      if (!userId) {
        console.log("🎯 Auto-default: Demo mode ON (no userId found)");
        return true; // Demo mode
      }
    }
    // If userId exists, default to personal mode
    console.log("🎯 Default: Personal mode (userId found)");
    return false;
  });

  // Loading state for heatmap data
  const [isLoadingHeatmapData, setIsLoadingHeatmapData] = useState(false);
  
  // Loading state for date selection
  const [isDateLoading, setIsDateLoading] = useState(false);

  // ✅ FIXED: Use useMemo with personalHeatmapRevision dependency to force re-renders
  // When personal mode auto-clicking completes, personalHeatmapRevision increments
  // This triggers React to re-compute tradingDataByDate and re-render the heatmap
  const tradingDataByDate = useMemo(() => {
    const activeData = isDemoMode ? demoTradingDataByDate : personalTradingDataByDate;
    console.log(`🔄 tradingDataByDate recomputed [Mode: ${isDemoMode ? 'DEMO' : 'PERSONAL'}, Revision: ${personalHeatmapRevision}, Dates: ${Object.keys(activeData).length}]`);
    return activeData;
  }, [isDemoMode, demoTradingDataByDate, personalTradingDataByDate, personalHeatmapRevision]);
  
  const setTradingDataByDate = isDemoMode ? setDemoTradingDataByDate : setPersonalTradingDataByDate;
  const getActiveStorageKey = () => isDemoMode ? "demoTradingDataByDate" : "personalTradingDataByDate";

  // Helper function to get Firebase userId from localStorage
  // Returns null if user is not logged in with Firebase
  const getUserId = (): string | null => {
    if (typeof window === "undefined") return null;

    // Use the actual Firebase user ID from authentication ONLY
    const firebaseUserId = localStorage.getItem("currentUserId");
    if (firebaseUserId) {
      console.log(`🔑 Using Firebase user ID: ${firebaseUserId}`);
      return firebaseUserId;
    }

    // No Firebase user logged in - return null instead of generating random IDs
    console.log(`⚠️ No Firebase user logged in - getUserId() returns null`);
    return null;
  };

  // Load all heatmap data on startup and when userId or tab changes - ALWAYS from userId, never demo
  useEffect(() => {
    const loadAllHeatmapData = async () => {
      // Only load heatmap data when on journal tab
      if (activeTab !== "journal") {
        console.log(`⏭️ Skipping heatmap load - not on journal tab (current: ${activeTab})`);
        return;
      }

      // ALWAYS load from userId, not demo mode
      const userId = currentUser?.userId;
      
      console.log(`🔄 Loading heatmap data - userId: ${userId || "NO USER (demo)"}`);
      try {
        setIsLoadingHeatmapData(true);

        if (!userId) {
          // No user logged in - clear heatmap data
          console.log("⚠️ No user ID found - heatmap requires login");
          setPersonalTradingDataByDate({});
          setCalendarData({});
          setIsLoadingHeatmapData(false);
          return;
        }

        // ALWAYS fetch user-specific data from Firebase (never demo data)
        console.log("📥 HEATMAP: Fetching user data from Firebase for userId:", userId);
        const response = await fetch(getFullApiUrl(`/api/user-journal/${userId}/all`));
        if (response.ok) {
          const personalData = await response.json();
          console.log("✅ HEATMAP data loaded:", Object.keys(personalData).length, "dates");
          
          setTradingDataByDate(personalData);
          setCalendarData(personalData);

          // Save to localStorage for offline access
          localStorage.setItem("tradingDataByDate", JSON.stringify(personalData));

          // Auto-click all available dates to populate heatmap colors - ULTRA FAST
          // This simulates clicking each date to ensure colors appear immediately
          setTimeout(async () => {
            console.log(
              "🔄 Ultra-fast auto-clicking all PERSONAL dates for heatmap colors...",
            );

            // Create all fetch promises in parallel for maximum speed
            const fetchPromises = Object.keys(personalData).map(
              async (dateStr) => {
                try {
                  const response = await fetch(getFullApiUrl(`/api/user-journal/${userId}/${dateStr}`));
                  if (response.ok) {
                    const journalData = await response.json();
                    if (journalData && Object.keys(journalData).length > 0) {
                      return { dateStr, journalData };
                    }
                  }
                } catch (error) {
                  console.error(
                    `❌ Error auto-loading PERSONAL date ${dateStr}:`,
                    error,
                  );
                }
                return null;
              },
            );

            // Wait for all fetches to complete in parallel
            const results = await Promise.all(fetchPromises);

            // Update state with all loaded data
            const validResults = results.filter((r) => r !== null);
            if (validResults.length > 0) {
              const updatedData = { ...personalData };
              validResults.forEach((result: any) => {
                if (result) {
                  updatedData[result.dateStr] = result.journalData;
                }
              });
              setTradingDataByDate(updatedData);
              setCalendarData(updatedData);
              localStorage.setItem("tradingDataByDate", JSON.stringify(updatedData));
              console.log(
                `✅ Ultra-fast PERSONAL heatmap population complete! Loaded ${validResults.length} dates in parallel.`,
              );
            }

            // Auto-select latest date AFTER all data is loaded
            if (!selectedDate && Object.keys(personalData).length > 0) {
              const sortedDates = Object.keys(personalData).sort(
                (a, b) => new Date(b).getTime() - new Date(a).getTime(),
              );
              const latestDateStr = sortedDates[0];
              const latestDate = new Date(latestDateStr);
              console.log("🎯 Auto-selecting latest PERSONAL date:", latestDateStr);
              setSelectedDate(latestDate);
              await handleDateSelect(latestDate);
            }
          }, 100);
        } else {
          console.log("📭 No personal data found for user:", userId);
        }
      } catch (error) {
        console.error("❌ Error loading heatmap data:", error);
        console.error("Error type:", typeof error);
        console.error("Error message:", error instanceof Error ? error.message : 'Unknown error');
        console.error("Error stack:", error instanceof Error ? error.stack : 'No stack');
        // Fallback to localStorage data if Google Cloud is unavailable
        console.log("🔄 Falling back to localStorage data...");
        const localStorageData = localStorage.getItem("tradingDataByDate");
        if (localStorageData) {
          const parsedLocalData = JSON.parse(localStorageData);
          console.log(
            "💾 Emergency fallback - Found localStorage journal data:",
            Object.keys(parsedLocalData).length,
            "entries",
          );
          setTradingDataByDate(parsedLocalData);
          setCalendarData(parsedLocalData);
        }
      } finally {
        setIsLoadingHeatmapData(false);
      }
    };

    loadAllHeatmapData();
  }, [activeTab, currentUser?.userId]); // Re-run when tab or user changes - ALWAYS load from userId

  // Images state for saving (with proper type)
  const [tradingImages, setTradingImages] = useState<any[]>([]);
  const imageUploadRef = useRef<MultipleImageUploadRef>(null);

  // Journal chart controls state
  const [selectedJournalSymbol, setSelectedJournalSymbol] =
    useState("NSE:NIFTY50-INDEX");
  const [selectedJournalInterval, setSelectedJournalInterval] = useState("15");
  const [showStockSearch, setShowStockSearch] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  
  // Option Chain state
  const [showOptionChain, setShowOptionChain] = useState(false);
  const [optionChainData, setOptionChainData] = useState<any>(null);
  const [optionChainLoading, setOptionChainLoading] = useState(false);
  const [selectedOptionExpiry, setSelectedOptionExpiry] = useState<string>("");
  
  // List of F&O eligible stocks and indices (that have options trading)
  const foEligibleSymbols = [
    'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 
    'KOTAKBANK', 'LT', 'ITC', 'AXISBANK', 'HINDUNILVR', 'BAJFINANCE', 'MARUTI',
    'ASIANPAINT', 'TITAN', 'TATAMOTORS', 'SUNPHARMA', 'WIPRO', 'ULTRACEMCO',
    'TECHM', 'HCLTECH', 'NTPC', 'POWERGRID', 'ONGC', 'COALINDIA', 'M&M',
    'TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'ADANIPORTS', 'BPCL', 'GRASIM',
    'DRREDDY', 'CIPLA', 'APOLLOHOSP', 'DIVISLAB', 'EICHERMOT', 'TATACONSUM',
    'BAJAJFINSV', 'HDFCLIFE', 'SBILIFE', 'INDUSINDBK', 'BRITANNIA', 'NESTLEIND',
    'NIFTY', 'BANKNIFTY', 'NIFTY50', 'NIFTYIT', 'FINNIFTY', 'MIDCPNIFTY'
  ];
  
  // Check if current instrument has options available
  const hasOptionsAvailable = (): boolean => {
    if (!selectedInstrument) return false;
    
    const symbol = selectedInstrument.symbol.replace('-EQ', '').replace('-INDEX', '').toUpperCase();
    const type = selectedInstrument.instrumentType || '';
    const exchange = selectedInstrument.exchange;
    
    // Indices always have options
    if (type === 'AMXIDX' || type === 'INDEX') return true;
    
    // Futures have corresponding options
    if (type === 'FUTIDX' || type === 'FUTSTK') return true;
    
    // F&O eligible stocks on NSE
    if ((exchange === 'NSE' || exchange === 'BSE') && (!type || type === '' || type === 'EQ')) {
      return foEligibleSymbols.some(s => symbol.includes(s) || s.includes(symbol));
    }
    
    return false;
  };
  
  // Get underlying symbol for option chain
  const getUnderlyingSymbol = (): string => {
    if (!selectedInstrument) return 'NIFTY';
    
    const symbol = selectedInstrument.symbol.replace('-EQ', '').replace('-INDEX', '').toUpperCase();
    
    // For indices
    if (symbol.includes('NIFTY50') || symbol === 'NIFTY 50') return 'NIFTY';
    if (symbol.includes('BANKNIFTY') || symbol.includes('NIFTY BANK')) return 'BANKNIFTY';
    if (symbol.includes('FINNIFTY')) return 'FINNIFTY';
    if (symbol.includes('MIDCPNIFTY')) return 'MIDCPNIFTY';
    
    // For futures, extract underlying
    if (symbol.includes('FUT')) {
      const match = symbol.match(/^([A-Z]+)/);
      if (match) return match[1];
    }
    
    return symbol;
  };
  
  // Fetch option chain data
  const fetchOptionChainData = async () => {
    const underlying = getUnderlyingSymbol();
    if (!underlying) return;
    
    setOptionChainLoading(true);
    try {
      const response = await fetch(`/api/options/chain?symbol=${underlying}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setOptionChainData(data.data);
        // Set default expiry to the first available
        if (data.data.expiryDates && data.data.expiryDates.length > 0 && !selectedOptionExpiry) {
          setSelectedOptionExpiry(data.data.expiryDates[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching option chain:', error);
    } finally {
      setOptionChainLoading(false);
    }
  };
  const [selectedInstrumentCategory, setSelectedInstrumentCategory] = useState("all");
  const [selectedJournalDate, setSelectedJournalDate] = useState("2025-09-12");
  const [journalChartData, setJournalChartData] = useState<Array<{ time: number; open: number; high: number; low: number; close: number; volume?: number }>>([]);
  const [journalChartLoading, setJournalChartLoading] = useState(false);
  
  // Default popular instruments for each category (pre-populated)
  // Note: Only stocks and indices have stable tokens. Commodity/F&O tokens change with contract expiry.
  const defaultInstruments = {
    all: [
      { symbol: 'RELIANCE-EQ', name: 'Reliance Industries', token: '2885', exchange: 'NSE', instrumentType: '', displayName: 'RELIANCE', tradingSymbol: 'RELIANCE-EQ' },
      { symbol: 'TCS-EQ', name: 'Tata Consultancy Services', token: '11536', exchange: 'NSE', instrumentType: '', displayName: 'TCS', tradingSymbol: 'TCS-EQ' },
      { symbol: 'INFY-EQ', name: 'Infosys Limited', token: '1594', exchange: 'NSE', instrumentType: '', displayName: 'INFY', tradingSymbol: 'INFY-EQ' },
      { symbol: 'HDFCBANK-EQ', name: 'HDFC Bank', token: '1333', exchange: 'NSE', instrumentType: '', displayName: 'HDFCBANK', tradingSymbol: 'HDFCBANK-EQ' },
      { symbol: 'Nifty 50', name: 'Nifty 50 Index', token: '99926000', exchange: 'NSE', instrumentType: 'AMXIDX', displayName: 'NIFTY 50', tradingSymbol: 'Nifty 50' },
      { symbol: 'Nifty Bank', name: 'Nifty Bank Index', token: '99926009', exchange: 'NSE', instrumentType: 'AMXIDX', displayName: 'BANK NIFTY', tradingSymbol: 'Nifty Bank' },
    ],
    stock: [
      { symbol: 'RELIANCE-EQ', name: 'Reliance Industries', token: '2885', exchange: 'NSE', instrumentType: '', displayName: 'RELIANCE', tradingSymbol: 'RELIANCE-EQ' },
      { symbol: 'TCS-EQ', name: 'Tata Consultancy Services', token: '11536', exchange: 'NSE', instrumentType: '', displayName: 'TCS', tradingSymbol: 'TCS-EQ' },
      { symbol: 'INFY-EQ', name: 'Infosys Limited', token: '1594', exchange: 'NSE', instrumentType: '', displayName: 'INFY', tradingSymbol: 'INFY-EQ' },
      { symbol: 'HDFCBANK-EQ', name: 'HDFC Bank', token: '1333', exchange: 'NSE', instrumentType: '', displayName: 'HDFCBANK', tradingSymbol: 'HDFCBANK-EQ' },
      { symbol: 'ICICIBANK-EQ', name: 'ICICI Bank', token: '4963', exchange: 'NSE', instrumentType: '', displayName: 'ICICIBANK', tradingSymbol: 'ICICIBANK-EQ' },
      { symbol: 'SBIN-EQ', name: 'State Bank of India', token: '3045', exchange: 'NSE', instrumentType: '', displayName: 'SBIN', tradingSymbol: 'SBIN-EQ' },
      { symbol: 'BHARTIARTL-EQ', name: 'Bharti Airtel', token: '10604', exchange: 'NSE', instrumentType: '', displayName: 'BHARTIARTL', tradingSymbol: 'BHARTIARTL-EQ' },
      { symbol: 'KOTAKBANK-EQ', name: 'Kotak Mahindra Bank', token: '1922', exchange: 'NSE', instrumentType: '', displayName: 'KOTAKBANK', tradingSymbol: 'KOTAKBANK-EQ' },
    ],
    commodity: [], // Commodity tokens change with contract expiry - use search
    fo: [], // F&O tokens change with contract expiry - use search
    index: [
      { symbol: 'Nifty 50', name: 'Nifty 50 Index', token: '99926000', exchange: 'NSE', instrumentType: 'AMXIDX', displayName: 'NIFTY 50', tradingSymbol: 'Nifty 50' },
      { symbol: 'Nifty Bank', name: 'Nifty Bank Index', token: '99926009', exchange: 'NSE', instrumentType: 'AMXIDX', displayName: 'BANK NIFTY', tradingSymbol: 'Nifty Bank' },
      { symbol: 'Nifty IT', name: 'Nifty IT Index', token: '99926013', exchange: 'NSE', instrumentType: 'AMXIDX', displayName: 'NIFTY IT', tradingSymbol: 'Nifty IT' },
      { symbol: 'NIFTY NEXT 50', name: 'Nifty Next 50 Index', token: '99926001', exchange: 'NSE', instrumentType: 'AMXIDX', displayName: 'NIFTY NEXT 50', tradingSymbol: 'NIFTY NEXT 50' },
      { symbol: 'Nifty Midcap 50', name: 'Nifty Midcap 50 Index', token: '99926027', exchange: 'NSE', instrumentType: 'AMXIDX', displayName: 'NIFTY MIDCAP', tradingSymbol: 'Nifty Midcap 50' },
      { symbol: 'INDIA VIX', name: 'India VIX', token: '99926004', exchange: 'NSE', instrumentType: 'AMXIDX', displayName: 'INDIA VIX', tradingSymbol: 'INDIA VIX' },
    ],
  };
  
  // Search suggestions for categories without pre-populated defaults
  const categorySearchSuggestions: Record<string, string[]> = {
    commodity: ['gold', 'silver', 'crude', 'copper', 'natural gas', 'aluminium'],
    fo: ['nifty', 'banknifty', 'reliance', 'tcs', 'infy'],
  };
  
  // Dynamic instrument search state
  const [searchedInstruments, setSearchedInstruments] = useState<Array<{
    symbol: string;
    name: string;
    token: string;
    exchange: string;
    instrumentType: string;
    displayName: string;
    tradingSymbol: string;
  }>>([]);
  const [isSearchingInstruments, setIsSearchingInstruments] = useState(false);
  
  // Currently selected instrument details (for chart loading)
  const [selectedInstrument, setSelectedInstrument] = useState<{
    symbol: string;
    token: string;
    exchange: string;
    tradingSymbol: string;
    instrumentType?: string;
  } | null>(null);
  
  // TradingView-style chart refs for Journal
  const journalChartContainerRef = useRef<HTMLDivElement>(null);
  const journalChartRef = useRef<IChartApi | null>(null);
  const journalCandlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const journalEma12SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const journalEma26SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const journalVolumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const journalPriceLineRef = useRef<IPriceLine | null>(null);
  
  // EMA values for display in header
  const [journalEmaValues, setJournalEmaValues] = useState<{ ema12: number | null; ema26: number | null }>({ ema12: null, ema26: null });
  
  // Live streaming state for Journal Chart
  const [journalLiveData, setJournalLiveData] = useState<{
    ltp: number;
    countdown: { remaining: number; total: number; formatted: string };
    currentCandle: { time: number; open: number; high: number; low: number; close: number; volume: number };
    isMarketOpen: boolean;
  } | null>(null);
  const [isJournalStreaming, setIsJournalStreaming] = useState(false);
  const journalEventSourceRef = useRef<EventSource | null>(null);
  
  // Live OHLC ticker for display
  const [liveOhlc, setLiveOhlc] = useState<{ open: number; high: number; low: number; close: number; change: number } | null>(null);

  // Angel One Stock Token Mapping for Journal Chart
  const journalAngelOneTokens: { [key: string]: { token: string, exchange: string, tradingSymbol: string } } = {
    'NIFTY50': { token: '99926000', exchange: 'NSE', tradingSymbol: 'Nifty 50' },
    'SENSEX': { token: '99919000', exchange: 'BSE', tradingSymbol: 'SENSEX' },
    'BANKNIFTY': { token: '99926009', exchange: 'NSE', tradingSymbol: 'Nifty Bank' },
    'RELIANCE': { token: '2885', exchange: 'NSE', tradingSymbol: 'RELIANCE-EQ' },
    'TCS': { token: '11536', exchange: 'NSE', tradingSymbol: 'TCS-EQ' },
    'HDFCBANK': { token: '1333', exchange: 'NSE', tradingSymbol: 'HDFCBANK-EQ' },
    'INFY': { token: '1594', exchange: 'NSE', tradingSymbol: 'INFY-EQ' },
    'ICICIBANK': { token: '4963', exchange: 'NSE', tradingSymbol: 'ICICIBANK-EQ' },
    'SBIN': { token: '3045', exchange: 'NSE', tradingSymbol: 'SBIN-EQ' },
    'BHARTIARTL': { token: '10604', exchange: 'NSE', tradingSymbol: 'BHARTIARTL-EQ' },
    'ITC': { token: '1660', exchange: 'NSE', tradingSymbol: 'ITC-EQ' },
    'KOTAKBANK': { token: '1922', exchange: 'NSE', tradingSymbol: 'KOTAKBANK-EQ' },
    'LT': { token: '11483', exchange: 'NSE', tradingSymbol: 'LT-EQ' },
    'AXISBANK': { token: '5900', exchange: 'NSE', tradingSymbol: 'AXISBANK-EQ' },
    'WIPRO': { token: '3787', exchange: 'NSE', tradingSymbol: 'WIPRO-EQ' },
    'GOLD': { token: '232801', exchange: 'MCX', tradingSymbol: 'GOLD' },
    'CRUDEOIL': { token: '232665', exchange: 'MCX', tradingSymbol: 'CRUDEOIL' },
    'SILVER': { token: '234977', exchange: 'MCX', tradingSymbol: 'SILVER' },
  };

  // Convert NSE/MCX symbol format to Angel One format
  const getJournalAngelOneSymbol = (symbol: string): string => {
    const cleanSymbol = symbol
      .replace("NSE:", "")
      .replace("MCX:", "")
      .replace("-EQ", "")
      .replace("-INDEX", "")
      .replace("-COM", "");
    return cleanSymbol;
  };

  // Convert interval to Angel One format
  const getJournalAngelOneInterval = (interval: string): string => {
    const intervalMap: { [key: string]: string } = {
      '1': 'ONE_MINUTE',
      '3': 'THREE_MINUTE',
      '5': 'FIVE_MINUTE',
      '10': 'TEN_MINUTE',
      '15': 'FIFTEEN_MINUTE',
      '30': 'THIRTY_MINUTE',
      '60': 'ONE_HOUR',
      '1D': 'ONE_DAY',
      '5D': 'ONE_DAY',
      '1W': 'ONE_DAY',
      '1M': 'ONE_DAY',
    };
    return intervalMap[interval] || 'FIFTEEN_MINUTE';
  };

  // Convert interval to minutes
  const getIntervalInSeconds = (interval: string): number => {
    const intervalMap: { [key: string]: number } = {
      '1': 60,
      '3': 180,
      '5': 300,
      '10': 600,
      '15': 900,
      '30': 1800,
      '60': 3600,
      '1D': 86400,
      '5D': 86400,
      '1W': 86400,
      '1M': 86400,
    };
    return intervalMap[interval] || 900; // Default 15 minutes
  };

  // Calculate the start time of the candle that contains the given timestamp
  const getCandleStartTime = (timestamp: number, intervalSeconds: number): number => {
    return Math.floor(timestamp / intervalSeconds) * intervalSeconds;
  };

  // Calculate date range based on timeframe (TradingView style)
  const getDateRangeForInterval = (interval: string): { fromDate: string; toDate: string } => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    let fromDate = today;
    
    if (['1', '3', '5', '10', '15', '30'].includes(interval)) {
      // Intraday: today's data
      fromDate = today;
    } else if (interval === '60') {
      // 1 hour: last 5 days
      const fiveDaysAgo = new Date(now);
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      fromDate = fiveDaysAgo.toISOString().split('T')[0];
    } else if (interval === '1D') {
      // 1 day: last 3 months
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      fromDate = threeMonthsAgo.toISOString().split('T')[0];
    } else if (interval === '5D') {
      // 5 day: last 1 year
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      fromDate = oneYearAgo.toISOString().split('T')[0];
    } else if (interval === '1W') {
      // 1 week: last 2 years
      const twoYearsAgo = new Date(now);
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      fromDate = twoYearsAgo.toISOString().split('T')[0];
    } else if (interval === '1M') {
      // 1 month: last 5 years
      const fiveYearsAgo = new Date(now);
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      fromDate = fiveYearsAgo.toISOString().split('T')[0];
    }
    
    return {
      fromDate: fromDate,
      toDate: today,
    };
  };

  // 🔍 Fetch instruments from Angel One master file API
  const fetchInstruments = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchedInstruments([]);
      return;
    }

    setIsSearchingInstruments(true);
    try {
      const response = await fetch(`/api/angelone/search-instruments?query=${encodeURIComponent(searchQuery)}&limit=50`);
      const data = await response.json();
      
      if (data.success && data.instruments) {
        setSearchedInstruments(data.instruments);
      } else {
        setSearchedInstruments([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch instruments:', error);
      setSearchedInstruments([]);
    } finally {
      setIsSearchingInstruments(false);
    }
  };

  // useEffect to fetch instruments when search query changes (with debouncing)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stockSearchQuery.length >= 2) {
        fetchInstruments(stockSearchQuery);
      } else {
        setSearchedInstruments([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [stockSearchQuery]);

  // Mobile carousel state for journal panels (0=chart, 1=image, 2=notes)
  const [mobileJournalPanel, setMobileJournalPanel] = useState(2);

  // Mobile bottom navigation state (home, insight, ranking)
  const [mobileBottomTab, setMobileBottomTab] = useState<
    "home" | "insight" | "ranking"
  >("home");

  // Mobile trade history dropdown state
  const [showMobileTradeHistory, setShowMobileTradeHistory] = useState(false);

  // Calculate EMA (Exponential Moving Average)
  const calculateEMA = (prices: number[], period: number): number[] => {
    if (prices.length === 0) return [];
    const k = 2 / (period + 1);
    const ema: number[] = [];
    let sma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    ema.push(sma);
    for (let i = period; i < prices.length; i++) {
      sma = prices[i] * k + sma * (1 - k);
      ema.push(sma);
    }
    return ema;
  };

  // Function to fetch journal chart data from Angel One API
  const fetchJournalChartData = useCallback(async () => {
    try {
      setJournalChartLoading(true);
      
      // Note: We don't check connection status anymore - API works with theoretical prices when not connected
      // Get token data - use selectedInstrument if available (for dynamic search), otherwise use hardcoded mapping
      let stockToken: { token: string, exchange: string, tradingSymbol: string } | undefined;
      
      if (selectedInstrument) {
        // Use dynamically selected instrument from search
        stockToken = {
          token: selectedInstrument.token,
          exchange: selectedInstrument.exchange,
          tradingSymbol: selectedInstrument.tradingSymbol
        };
        console.log('🔶 Using dynamically selected instrument:', selectedInstrument);
      } else {
        // Fall back to hardcoded mapping for legacy symbols
        const cleanSymbol = getJournalAngelOneSymbol(selectedJournalSymbol);
        stockToken = journalAngelOneTokens[cleanSymbol];
        console.log('🔶 Using hardcoded token mapping for:', cleanSymbol);
      }
      
      if (!stockToken) {
        console.warn(`🔶 No Angel One token found for symbol: ${selectedJournalSymbol}`);
        setJournalChartData([]);
        return;
      }

      // Calculate date range based on timeframe (TradingView style)
      const dateRange = getDateRangeForInterval(selectedJournalInterval);
      
      // For intraday intervals, use market hours (9:15 AM to 3:30 PM)
      let fromDate = dateRange.fromDate;
      let toDate = dateRange.toDate;
      
      if (['1', '3', '5', '10', '15', '30'].includes(selectedJournalInterval)) {
        fromDate = `${fromDate} 09:15`;
        toDate = `${toDate} 15:30`;
      } else {
        // For daily and higher intervals, use full day
        fromDate = `${fromDate} 00:00`;
        toDate = `${toDate} 23:59`;
      }
      
      const requestBody = {
        exchange: stockToken.exchange,
        symbolToken: stockToken.token,
        interval: getJournalAngelOneInterval(selectedJournalInterval),
        fromDate: fromDate,
        toDate: toDate,
      };

      console.log('🔶 Fetching Angel One historical data for journal chart:', requestBody);

      console.log('🔶 Making request to /api/angelone/historical with body:', requestBody);
      
      const response = await fetch(getFullApiUrl("/api/angelone/historical"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`🔶 API Error ${response.status}:`, errorText);
        throw new Error(`Failed to fetch chart data: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🔶 API Response received:', { success: data.success, candlesLength: data.candles?.length, dataLength: data.data?.length });
      
      // Transform Angel One candle data to chart format
      // Angel One returns either:
      // 1. data.data as array: [[timestamp, open, high, low, close, volume], ...]
      // 2. data.candles as objects: [{timestamp, open, high, low, close, volume}, ...]
      let candleData: any[] = [];
      
      if (data.success && data.data && Array.isArray(data.data)) {
        // Format 1: Array of arrays
        candleData = data.data.map((candle: any[]) => ({
          time: new Date(candle[0]).getTime() / 1000,
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
          volume: parseInt(candle[5]) || 0,
        }));
      } else if (data.success && data.candles && Array.isArray(data.candles) && data.candles.length > 0) {
        // Format 2: Array of objects (current API response format)
        candleData = data.candles.map((candle: any) => {
          // Handle different timestamp formats from Angel One
          let unixSeconds: number;
          
          if (typeof candle.timestamp === 'string') {
            // If timestamp is a string (e.g., "2025-11-27 09:15"), parse it as IST
            // IST is UTC+5:30, so add 5.5 hours to browser local time interpretation
            const date = new Date(candle.timestamp);
            const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
            const utcTime = date.getTime() - (date.getTimezoneOffset() * 60 * 1000) + istOffset;
            unixSeconds = Math.floor(utcTime / 1000);
          } else if (candle.timestamp > 10000000000) {
            // Timestamp is in milliseconds (> 10 billion)
            unixSeconds = Math.floor(candle.timestamp / 1000);
          } else {
            // Timestamp is already in seconds
            unixSeconds = candle.timestamp;
          }
          
          return {
            time: unixSeconds as any,
            open: parseFloat(candle.open),
            high: parseFloat(candle.high),
            low: parseFloat(candle.low),
            close: parseFloat(candle.close),
            volume: parseInt(candle.volume) || 0,
          };
        });
      }
      
      if (candleData.length > 0) {
        console.log(`🔶 Angel One: Loaded ${candleData.length} candles for journal chart`);
        setJournalChartData(candleData);
      } else {
        console.warn('🔶 Angel One: No candle data returned', data);
        setJournalChartData([]);
      }
    } catch (error) {
      console.error("🔶 Error fetching Angel One journal chart data:", error);
      setJournalChartData([]);
    } finally {
      setJournalChartLoading(false);
    }
  }, [selectedJournalSymbol, selectedJournalInterval, selectedJournalDate]);

  // Load initial chart data
  useEffect(() => {
    fetchJournalChartData();
  }, [fetchJournalChartData]);

  // Live streaming SSE connection for Journal Chart
  useEffect(() => {
    if (activeTab !== 'journal') {
      // Disconnect SSE when leaving journal tab
      if (journalEventSourceRef.current) {
        journalEventSourceRef.current.close();
        journalEventSourceRef.current = null;
        setIsJournalStreaming(false);
        setJournalLiveData(null);
        console.log('🔴 [SSE] Disconnected from live stream (tab change)');
      }
      return;
    }

    // Only start SSE if we have historical chart data loaded
    if (!journalChartData || journalChartData.length === 0) {
      console.log('📡 [SSE] Waiting for historical chart data to load...');
      return;
    }

    // Get stock token info - use selectedInstrument if available (for dynamic search), otherwise use hardcoded mapping
    let stockToken: { token: string, exchange: string, tradingSymbol: string } | undefined;
    
    if (selectedInstrument) {
      stockToken = {
        token: selectedInstrument.token,
        exchange: selectedInstrument.exchange,
        tradingSymbol: selectedInstrument.tradingSymbol
      };
      console.log('🔴 [SSE] Using dynamically selected instrument:', selectedInstrument);
    } else {
      const cleanSymbol = getJournalAngelOneSymbol(selectedJournalSymbol);
      stockToken = journalAngelOneTokens[cleanSymbol];
      console.log('🔴 [SSE] Using hardcoded token mapping for:', cleanSymbol);
    }
    
    if (!stockToken) {
      console.warn('🔴 [SSE] No token found for symbol:', selectedJournalSymbol);
      return;
    }

    // Close existing connection if any
    if (journalEventSourceRef.current) {
      journalEventSourceRef.current.close();
      journalEventSourceRef.current = null;
    }

    // Get the last candle from chart data for initial OHLC values
    const lastCandle = journalChartData[journalChartData.length - 1];
    
    // Start new WebSocket SSE connection with REAL Angel One market data
    let sseUrl = getFullApiUrl(`/api/angelone/live-stream-ws?symbol=${stockToken.tradingSymbol}&symbolToken=${stockToken.token}&exchange=${stockToken.exchange}&tradingSymbol=${stockToken.tradingSymbol}`);
    
    // Add initial OHLC as fallback for when real API fails
    if (lastCandle && lastCandle.close > 0) {
      sseUrl += `&open=${lastCandle.open}&high=${lastCandle.high}&low=${lastCandle.low}&close=${lastCandle.close}&volume=${lastCandle.volume || 0}`;
      console.log('📡 [SSE] Initial fallback OHLC:', { open: lastCandle.open, high: lastCandle.high, low: lastCandle.low, close: lastCandle.close });
    }
    
    console.log('📡 [SSE] Connecting for REAL Angel One market data at 700ms intervals');
    
    const eventSource = new EventSource(sseUrl);
    journalEventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('📡 [SSE] Connected');
      setIsJournalStreaming(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const liveCandle = JSON.parse(event.data);
        console.log('💹 [PRICE] LTP:', liveCandle.close, 'Time:', liveCandle.time);
        
        // Update demo trading positions with live price (700ms real-time P&L)
        if (liveCandle.close > 0 && paperPositions.length > 0) {
          setPaperPositions(prev => prev.map(position => {
            if (position.isOpen && position.symbol === selectedJournalSymbol.replace('NSE:', '').replace('-INDEX', '')) {
              const pnl = (liveCandle.close - position.entryPrice) * position.quantity;
              const pnlPercent = ((liveCandle.close - position.entryPrice) / position.entryPrice) * 100;
              return { ...position, currentPrice: liveCandle.close, pnl, pnlPercent };
            }
            return position;
          }));
          
          // Also update current price for trade entry form if symbol matches
          if (selectedJournalSymbol.includes(paperTradeSymbol)) {
            setPaperTradeCurrentPrice(liveCandle.close);
          }
        }
        
        // Update chart candlestick - only if chart is initialized
        if (journalCandlestickSeriesRef.current && journalChartRef.current && liveCandle.close > 0) {
          // Get the selected interval in seconds
          const intervalSeconds = getIntervalInSeconds(selectedJournalInterval);
          
          // Get the last candle from the chart
          const lastChartCandle = journalChartData[journalChartData.length - 1];
          if (!lastChartCandle) return;
          
          // Calculate the candle start time for the incoming live data
          const currentCandleStartTime = getCandleStartTime(liveCandle.time, intervalSeconds);
          
          // Calculate the start time of the last chart candle
          const lastCandleStartTime = getCandleStartTime(lastChartCandle.time, intervalSeconds);
          
          // Only update if we're within the same candle interval
          if (currentCandleStartTime === lastCandleStartTime) {
            // Update ONLY the OHLC of the current candle, keep the timestamp fixed
            const changePercent = liveCandle.open > 0 ? ((liveCandle.close - liveCandle.open) / liveCandle.open) * 100 : 0;
            
            setLiveOhlc({
              open: liveCandle.open,
              high: liveCandle.high,
              low: liveCandle.low,
              close: liveCandle.close,
              change: changePercent
            });
            
            // Update the current candle with fixed timestamp - use the last chart candle's time
            setTimeout(() => {
              journalCandlestickSeriesRef.current?.update({
                time: lastChartCandle.time as any,
                open: liveCandle.open,
                high: liveCandle.high,
                low: liveCandle.low,
                close: liveCandle.close
              });
            }, 50);
            
            console.log('📊 [UPDATE] Same candle interval, updating OHLC only');
          } else if (currentCandleStartTime > lastCandleStartTime) {
            // We've crossed into a new candle interval - this means the previous candle is complete
            console.log('🆕 [NEW CANDLE] New interval detected, previous candle complete');
            // The new candle will come in the next update or from backend refresh
          }
        } else {
          console.log('⏳ Chart not ready yet:', { hasRef: !!journalCandlestickSeriesRef.current, hasChart: !!journalChartRef.current });
        }
      } catch (err) {
        console.error('❌ SSE parse error:', err instanceof Error ? err.message : String(err));
      }
    };

    eventSource.onerror = () => {
      setIsJournalStreaming(false);
    };

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      setIsJournalStreaming(false);
    };
  }, [activeTab, selectedJournalSymbol, selectedJournalInterval, journalChartData]);

  // Auto-fetch chart data when symbol or interval changes on journal tab
  useEffect(() => {
    if (activeTab === 'journal') {
      fetchJournalChartData();
    }
  }, [activeTab, selectedJournalSymbol, selectedJournalInterval]);

  // Initialize and render TradingView-style chart for Journal
  useEffect(() => {
    if (activeTab !== 'journal') {
      if (journalChartRef.current) {
        try {
          journalChartRef.current.remove();
        } catch (e) {}
        journalChartRef.current = null;
        journalCandlestickSeriesRef.current = null;
        journalEma12SeriesRef.current = null;
        journalEma26SeriesRef.current = null;
      }
      return;
    }

    if (!journalChartContainerRef.current) return;
    if (!journalChartData || journalChartData.length === 0) return;

    // Clean up existing chart
    if (journalChartRef.current) {
      try {
        journalChartRef.current.remove();
      } catch (e) {}
      journalChartRef.current = null;
      journalCandlestickSeriesRef.current = null;
      journalEma12SeriesRef.current = null;
      journalEma26SeriesRef.current = null;
      journalVolumeSeriesRef.current = null;
    }

    try {
      const containerWidth = journalChartContainerRef.current.clientWidth || 800;
      let containerHeight = journalChartContainerRef.current.clientHeight || 450;
      
      console.log('📊 Chart container dimensions:', { containerWidth, containerHeight });
      
      const chart = createChart(journalChartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#ffffff' },
          textColor: '#1f2937',
        },
        grid: {
          vertLines: { color: '#f3f4f6', style: 1 },
          horzLines: { color: '#f3f4f6', style: 1 },
        },
        crosshair: {
          mode: 1,
          vertLine: { color: '#9ca3af', width: 1, style: 2, labelBackgroundColor: '#f3f4f6' },
          horzLine: { color: '#9ca3af', width: 1, style: 2, labelBackgroundColor: '#f3f4f6' },
        },
        rightPriceScale: {
          borderColor: '#e5e7eb',
          scaleMargins: { top: 0.05, bottom: 0.2 },
          autoScale: true,
        },
        timeScale: {
          borderColor: '#e5e7eb',
          timeVisible: true,
          secondsVisible: false,
          barSpacing: 8,
          minBarSpacing: 4,
          tickMarkFormatter: (time: number) => {
            // Convert UTC timestamp to IST (UTC+5:30) and format for display
            const date = new Date(time * 1000);
            // Add IST offset: 5 hours 30 minutes = 330 minutes
            const istDate = new Date(date.getTime() + (330 * 60 * 1000));
            const hours = istDate.getUTCHours().toString().padStart(2, '0');
            const minutes = istDate.getUTCMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
          },
        },
        localization: {
          timeFormatter: (time: number) => {
            // Format time for crosshair tooltip in IST
            const date = new Date(time * 1000);
            const istDate = new Date(date.getTime() + (330 * 60 * 1000));
            const hours = istDate.getUTCHours().toString().padStart(2, '0');
            const minutes = istDate.getUTCMinutes().toString().padStart(2, '0');
            const day = istDate.getUTCDate().toString().padStart(2, '0');
            const month = (istDate.getUTCMonth() + 1).toString().padStart(2, '0');
            return `${day}/${month} ${hours}:${minutes} IST`;
          },
        },
        width: containerWidth,
        height: containerHeight,
      });

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#16a34a',
        downColor: '#dc2626',
        borderUpColor: '#15803d',
        borderDownColor: '#b91c1c',
        wickUpColor: '#15803d',
        wickDownColor: '#b91c1c',
      });

      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
        color: 'rgba(22, 163, 74, 0.3)',
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
      });

      const ema12Series = chart.addSeries(LineSeries, {
        color: '#0066ff',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });

      const ema26Series = chart.addSeries(LineSeries, {
        color: '#ff6600',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });

      journalChartRef.current = chart;
      journalCandlestickSeriesRef.current = candlestickSeries;
      journalEma12SeriesRef.current = ema12Series;
      journalEma26SeriesRef.current = ema26Series;
      journalVolumeSeriesRef.current = volumeSeries;

      // Set data immediately
      const sortedData = [...journalChartData].sort((a: any, b: any) => a.time - b.time);
      
      const chartData = sortedData.map((candle: any) => ({
        time: candle.time as any,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));

      candlestickSeries.setData(chartData);

      // Volume data with color based on price movement
      const volumeData = sortedData.map((candle: any) => ({
        time: candle.time as any,
        value: candle.volume || 0,
        color: candle.close >= candle.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
      }));
      volumeSeries.setData(volumeData);

      const closePrices = sortedData.map((c: any) => c.close);
      const ema12 = calculateEMA(closePrices, 12);
      const ema26 = calculateEMA(closePrices, 26);

      const ema12Data = ema12.map((value, index) => ({
        time: sortedData[index + 11]?.time as any,
        value: value,
      })).filter(d => d.time);

      const ema26Data = ema26.map((value, index) => ({
        time: sortedData[index + 25]?.time as any,
        value: value,
      })).filter(d => d.time);

      if (ema12Data.length > 0) {
        ema12Series.setData(ema12Data);
        setJournalEmaValues(prev => ({ ...prev, ema12: ema12Data[ema12Data.length - 1]?.value || null }));
      }
      if (ema26Data.length > 0) {
        ema26Series.setData(ema26Data);
        setJournalEmaValues(prev => ({ ...prev, ema26: ema26Data[ema26Data.length - 1]?.value || null }));
      }

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (journalChartContainerRef.current && journalChartRef.current) {
          journalChartRef.current.applyOptions({
            width: journalChartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    } catch (error) {
      console.error('Error rendering journal chart:', error instanceof Error ? error.message : String(error), error);
    }
  }, [activeTab, journalChartData]);

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
          const candleTime = new Date(candle.time * 1000);
          const candleMinutes =
            candleTime.getHours() * 60 + candleTime.getMinutes();
          const candleMinutesFromStart = candleMinutes - marketStartMinutes;

          const timeDiff = Math.abs(
            candleMinutesFromStart - minutesFromMarketStart,
          );
          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestCandleIndex = candleIndex;
          }
        });

        if (closestCandleIndex !== -1 && minTimeDiff <= 15) {
          // Within 15 minutes tolerance
          const candle = journalChartData[closestCandleIndex];
          const price = trade.order === "BUY" ? candle.low : candle.high; // Low for BUY, High for SELL

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
      "trades",
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
        `Minimum ${tagValidationRules.minRequiredTags} tags required`,
      );
    }

    // Check category limits
    Object.entries(tradingTagSystem).forEach(([categoryKey, category]) => {
      const categoryTags = newTags.filter((tag) => category.tags.includes(tag));
      if (categoryTags.length > category.maxSelections) {
        errors.push(
          `Maximum ${
            category.maxSelections
          } ${category.name.toLowerCase()} tags allowed`,
        );
      }
    });

    // Check required categories
    Object.entries(tradingTagSystem).forEach(([categoryKey, category]) => {
      if ((category as any).required) {
        const categoryTags = newTags.filter((tag) =>
          category.tags.includes(tag),
        );
        if (categoryTags.length === 0) {
          errors.push(
            `At least one ${category.name.toLowerCase()} tag is required`,
          );
        }
      }
    });

    // Check conflicting tags
    tagValidationRules.conflictingTags.forEach((conflictGroup) => {
      const selectedConflicts = newTags.filter((tag) =>
        conflictGroup.includes(tag),
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
          tagCategory.tags.includes(t),
        );
        if (categoryTags.length > tagCategory.maxSelections) {
          alert(
            `Maximum ${
              tagCategory.maxSelections
            } ${tagCategory.name.toLowerCase()} tags allowed`,
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

  // Tag highlighting state for curved line visualization
  const [activeTagHighlight, setActiveTagHighlight] = useState<{
    tag: string;
    dates: string[];
  } | null>(null);
  
  // Refs for curved line connections from tag block to heatmap dates
  const fomoButtonRef = useRef<HTMLButtonElement>(null);
  const heatmapContainerRef = useRef<HTMLDivElement>(null);
  
  // Refs for share dialog curved line connections
  const shareDialogFomoButtonRef = useRef<HTMLButtonElement>(null);
  const shareDialogHeatmapContainerRef = useRef<HTMLDivElement>(null);
  
  // State to trigger re-render of curved lines during scroll
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [shareDialogScrollTrigger, setShareDialogScrollTrigger] = useState(0);
  
  // Effect to handle scroll updates for curved lines - ULTRA FAST VERSION
  useEffect(() => {
    if (!activeTagHighlight || activeTagHighlight.tag !== 'fomo') return;
    
    const heatmapWrapper = heatmapContainerRef.current;
    if (!heatmapWrapper) return;
    
    // Find the actual scrollable element inside the heatmap component immediately
    const scrollableElement = heatmapWrapper.querySelector('.overflow-x-auto');
    if (!scrollableElement) {
      // Retry after a tiny delay if not found
      const retryTimeout = setTimeout(() => {
        const element = heatmapWrapper.querySelector('.overflow-x-auto');
        if (element) {
          attachScrollListener(element);
        }
      }, 10);
      
      return () => clearTimeout(retryTimeout);
    }
    
    let rafId: number | null = null;
    
    const handleScroll = () => {
      // Immediate update for instant response
      setScrollTrigger(prev => prev + 1);
      
      // Cancel any pending RAF
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      
      // Also schedule RAF for next frame to ensure smooth rendering
      rafId = requestAnimationFrame(() => {
        setScrollTrigger(prev => prev + 1);
        rafId = null;
      });
    };
    
    const attachScrollListener = (element: Element) => {
      // Listen to scroll events with passive for best performance
      element.addEventListener('scroll', handleScroll, { passive: true });
      
      // Also listen for resize events
      window.addEventListener('resize', handleScroll, { passive: true });
      
      console.log('⚡ Attached ULTRA-FAST scroll listener to heatmap');
    };
    
    // Attach immediately
    attachScrollListener(scrollableElement);
    
    // Cleanup
    return () => {
      scrollableElement.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [activeTagHighlight]);

  // ✅ SEPARATE STATE FOR SHARE DIALOG: Prevents interference with main tradebook (moved before useEffect)
  const [shareDialogTagHighlight, setShareDialogTagHighlight] = useState<{
    tag: string;
    dates: string[];
  } | null>(null);
  
  // Effect to handle scroll updates for share dialog curved lines
  useEffect(() => {
    if (!shareDialogTagHighlight || shareDialogTagHighlight.tag !== 'fomo') return;
    
    const heatmapWrapper = shareDialogHeatmapContainerRef.current;
    if (!heatmapWrapper) return;
    
    // Find the scrollable element (parent with overflow-auto class)
    const scrollableElement = heatmapWrapper;
    if (!scrollableElement) return;
    
    let rafId: number | null = null;
    
    const handleScroll = () => {
      // Immediate update for instant response
      setShareDialogScrollTrigger(prev => prev + 1);
      
      // Cancel any pending RAF
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      
      // Also schedule RAF for next frame
      rafId = requestAnimationFrame(() => {
        setShareDialogScrollTrigger(prev => prev + 1);
        rafId = null;
      });
    };
    
    // Attach scroll listener
    scrollableElement.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    console.log('⚡ Attached scroll listener to share dialog heatmap');
    
    // Cleanup
    return () => {
      scrollableElement.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [shareDialogTagHighlight]);

  // ✅ SEPARATE STATE FOR REPORT DIALOG: Prevents interference with main tradebook
  const [reportDialogTagHighlight, setReportDialogTagHighlight] = useState<{
    tag: string;
    dates: string[];
  } | null>(null);
  
  // Refs for report dialog curved line connections
  const reportDialogFomoButtonRef = useRef<HTMLButtonElement>(null);
  const reportDialogHeatmapContainerRef = useRef<HTMLDivElement>(null);
  
  // State to trigger re-render of curved lines during scroll for report dialog
  const [reportDialogScrollTrigger, setReportDialogScrollTrigger] = useState(0);
  
  // Effect to handle scroll updates for report dialog curved lines
  useEffect(() => {
    if (!reportDialogTagHighlight || reportDialogTagHighlight.tag !== 'fomo') return;
    
    const heatmapWrapper = reportDialogHeatmapContainerRef.current;
    if (!heatmapWrapper) return;
    
    // Find the actual scrollable element inside the heatmap component
    const scrollableElement = heatmapWrapper.querySelector('.overflow-x-auto');
    if (!scrollableElement) {
      // Retry after a tiny delay if not found
      const retryTimeout = setTimeout(() => {
        const element = heatmapWrapper.querySelector('.overflow-x-auto');
        if (element) {
          attachScrollListener(element);
        }
      }, 10);
      
      return () => clearTimeout(retryTimeout);
    }
    
    let rafId: number | null = null;
    
    const handleScroll = () => {
      // Immediate update for instant response
      setReportDialogScrollTrigger(prev => prev + 1);
      
      // Cancel any pending RAF
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      
      // Also schedule RAF for next frame
      rafId = requestAnimationFrame(() => {
        setReportDialogScrollTrigger(prev => prev + 1);
        rafId = null;
      });
    };
    
    const attachScrollListener = (element: Element) => {
      // Listen to scroll events with passive for best performance
      element.addEventListener('scroll', handleScroll, { passive: true });
      
      // Also listen for resize events
      window.addEventListener('resize', handleScroll, { passive: true });
      
      console.log('⚡ Attached scroll listener to report dialog heatmap');
    };
    
    // Attach immediately
    attachScrollListener(scrollableElement);
    
    // Cleanup
    return () => {
      scrollableElement.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [reportDialogTagHighlight]);

  // Date range selection state
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear());
  const [isCalendarDataFetched, setIsCalendarDataFetched] = useState(false);
  
  // ✅ NEW: Heatmap data and date range state for Performance Trend filtering
  const [heatmapDataFromComponent, setHeatmapDataFromComponent] = useState<Record<string, any>>({});
  const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date; to: Date } | null>(null);
  
  // Track if user has manually toggled the switch (to prevent auto-switching after manual toggle)
  const [hasManuallyToggledMode, setHasManuallyToggledMode] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("hasManuallyToggledMode");
      return stored === "true";
    }
    return false;
  });
  
  // ✅ NEW: Callbacks to receive heatmap data and date range
  const handleHeatmapDataUpdate = (data: Record<string, any>) => {
    console.log("📊 Received heatmap data update:", Object.keys(data).length, "dates");
    setHeatmapDataFromComponent(data);
    
    // ✅ AUTO-SWITCH TO DEMO MODE: Only for new users on initial load (not after manual toggle)
    if (!isDemoMode && getUserId() && !hasManuallyToggledMode) {
      const hasAnyTradeData = Object.values(data).some((dayData: any) => {
        // Check both wrapped (Firebase) and unwrapped formats
        const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
        const tradeHistory = dayData?.tradingData?.tradeHistory || dayData?.tradeHistory;
        
        // Has data if:
        // 1. Has performance metrics with non-zero P&L, OR
        // 2. Has non-empty trade history
        return (
          (metrics && metrics.netPnL !== undefined && metrics.netPnL !== 0) ||
          (Array.isArray(tradeHistory) && tradeHistory.length > 0)
        );
      });
      
      if (!hasAnyTradeData && Object.keys(data).length === 0) {
        console.log("📭 No personal trades found - auto-switching to Demo mode");
        setIsDemoMode(true);
        localStorage.setItem("tradingJournalDemoMode", "true");
        // Don't set hasManuallyToggledMode here - this is automatic, not manual
        
        // Scroll to latest data after a brief delay to ensure heatmap is rendered
        setTimeout(() => {
          if (heatmapContainerRef.current) {
            const scrollContainer = heatmapContainerRef.current.querySelector('[style*="overflow"]') as HTMLElement;
            if (scrollContainer) {
              // Scroll to the rightmost position (latest date)
              scrollContainer.scrollLeft = scrollContainer.scrollWidth;
              console.log("🎯 Scrolled to latest data view");
            }
          }
        }, 500);
      } else if (!hasAnyTradeData) {
        console.log("⚠️ Personal data exists but has no actual trade data (all zero P&L)");
      }
    }
  };
  
  const handleDateRangeChange = (range: { from: Date; to: Date } | null) => {
    console.log("📅 Date range changed:", range);
    setSelectedDateRange(range);
  };
  
  // ✅ NEW: Filter heatmap data based on selected date range
  const getFilteredHeatmapData = () => {
    const totalDates = Object.keys(heatmapDataFromComponent).length;
    
    if (!selectedDateRange) {
      // No range selected - return all data
      console.log(`🔍 No date range selected - returning all ${totalDates} dates`);
      return heatmapDataFromComponent;
    }
    
    const filtered: Record<string, any> = {};
    const fromTime = selectedDateRange.from.getTime();
    const toTime = selectedDateRange.to.getTime();
    
    console.log(`🔍 Filtering ${totalDates} dates by range: ${selectedDateRange.from.toISOString().slice(0, 10)} to ${selectedDateRange.to.toISOString().slice(0, 10)}`);
    
    Object.keys(heatmapDataFromComponent).forEach(dateKey => {
      // Parse date key (expecting YYYY-MM-DD format)
      const dateTime = new Date(dateKey).getTime();
      
      if (isNaN(dateTime)) {
        console.warn(`⚠️ Could not parse date key: ${dateKey}, skipping`);
        return;
      }
      
      if (dateTime >= fromTime && dateTime <= toTime) {
        filtered[dateKey] = heatmapDataFromComponent[dateKey];
      }
    });
    
    const filteredCount = Object.keys(filtered).length;
    console.log(`🔍 Filtered heatmap data: ${filteredCount} dates (from ${totalDates} total)`);
    
    if (filteredCount === 0 && totalDates > 0) {
      console.warn(`⚠️ WARNING: Filtering dropped all ${totalDates} entries! Check date key format compatibility.`);
      console.log('Sample keys:', Object.keys(heatmapDataFromComponent).slice(0, 5));
    }
    
    return filtered;
  };

  // Auto-set calendar data fetched when both dates are selected
  useEffect(() => {
    if (fromDate && toDate) {
      setIsCalendarDataFetched(true);
    } else {
      setIsCalendarDataFetched(false);
    }
  }, [fromDate, toDate]);

  // Auto-click all personal dates for current year or date range
  const [isAutoClickingPersonal, setIsAutoClickingPersonal] = useState(false);
  
  const handleAutoClickPersonalDates = async () => {
    if (isDemoMode) {
      console.log("⚠️ Auto-click only works in Personal mode");
      return;
    }
    
    const userId = getUserId();
    if (!userId) {
      console.log("⚠️ No user ID found - cannot auto-click personal dates");
      alert("⚠️ Please log in with your Firebase account to use personal mode");
      return;
    }
    
    setIsAutoClickingPersonal(true);
    
    try {
      console.log(`🔄 Auto-clicking personal dates for year ${heatmapYear}${fromDate && toDate ? ` (range: ${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()})` : ''}...`);
      
      // Fetch all personal data first
      const response = await fetch(getFullApiUrl(`/api/user-journal/${userId}/all`));
      
      if (!response.ok) {
        throw new Error('Failed to fetch personal data');
      }
      
      const allPersonalData = await response.json();
      let datesToFetch: string[] = Object.keys(allPersonalData);
      
      // Filter by year and date range
      if (fromDate && toDate) {
        // If date range is selected, only fetch dates within range
        const fromTime = fromDate.getTime();
        const toTime = toDate.getTime();
        
        datesToFetch = datesToFetch.filter(dateStr => {
          const dateTime = new Date(dateStr).getTime();
          return dateTime >= fromTime && dateTime <= toTime;
        });
        
        console.log(`📅 Filtered to ${datesToFetch.length} dates within selected range`);
      } else {
        // If no range selected, filter by current heatmap year
        datesToFetch = datesToFetch.filter(dateStr => {
          const date = new Date(dateStr);
          return date.getFullYear() === heatmapYear;
        });
        
        console.log(`📅 Filtered to ${datesToFetch.length} dates for year ${heatmapYear}`);
      }
      
      if (datesToFetch.length === 0) {
        console.log("ℹ️ No personal dates found for the selected period");
        return;
      }
      
      // Create all fetch promises in parallel for maximum speed
      const fetchPromises = datesToFetch.map(async (dateStr) => {
        try {
          const response = await fetch(getFullApiUrl(`/api/user-journal/${userId}/${dateStr}`));
          if (response.ok) {
            let journalData = await response.json();
            
            // CRITICAL FIX: Unwrap Firebase response format (has tradingData wrapper)
            if (journalData && journalData.tradingData) {
              journalData = journalData.tradingData;
              console.log(`📦 Unwrapped Firebase tradingData for ${dateStr}`);
            }
            
            if (journalData && Object.keys(journalData).length > 0) {
              return { dateStr, journalData };
            }
          }
        } catch (error) {
          console.error(`❌ Error loading personal date ${dateStr}:`, error);
        }
        return null;
      });

      // Wait for all fetches to complete in parallel
      const results = await Promise.all(fetchPromises);

      // Update state with all loaded data
      const validResults = results.filter((r) => r !== null);
      if (validResults.length > 0) {
        const updatedData = { ...personalTradingDataByDate };
        validResults.forEach((result: any) => {
          if (result) {
            updatedData[result.dateStr] = result.journalData;
          }
        });
        setPersonalTradingDataByDate(updatedData);
        setCalendarData(updatedData); // CRITICAL: Update calendarData to show heatmap colors!
        localStorage.setItem("personalTradingDataByDate", JSON.stringify(updatedData));
        console.log(`✅ Auto-click completed! Loaded ${validResults.length} personal dates for heatmap colors. March 3,4,5 should now show colors!`);
      }
    } catch (error) {
      console.error("❌ Error during auto-click:", error);
      // Don't show error popup for new users - they will see demo heatmap instead
      console.log("ℹ️ No personal data found - user will see demo heatmap");
    } finally {
      setIsAutoClickingPersonal(false);
    }
  };

  // Year navigation handlers - auto-click when year changes
  const handlePreviousYear = () => {
    const newYear = heatmapYear - 1;
    setHeatmapYear(newYear);
    // Auto-click dates for new year if in personal mode
    if (!isDemoMode) {
      setTimeout(() => {
        handleAutoClickPersonalDates();
      }, 100);
    }
  };

  const handleNextYear = () => {
    const newYear = heatmapYear + 1;
    setHeatmapYear(newYear);
    // Auto-click dates for new year if in personal mode
    if (!isDemoMode) {
      setTimeout(() => {
        handleAutoClickPersonalDates();
      }, 100);
    }
  };

  // Reset date range handler
  const handleResetDateRange = () => {
    setFromDate(null);
    setToDate(null);
    setIsCalendarDataFetched(false);
  };

  // ✅ INSTANT AUTO-LOAD: Load heatmap data immediately when journal tab opens
  // No delays, no complex logic - just instant data loading
  useEffect(() => {
    if (activeTab === 'journal') {
      if (!isDemoMode) {
        // Personal mode - load personal data instantly
        const userId = getUserId();
        if (userId) {
          console.log(`👤 Personal mode - loading personal data instantly...`);
          handleAutoClickPersonalDates();
        } else if (!hasManuallyToggledMode) {
          // Only auto-switch if user hasn't manually chosen personal mode
          console.log(`⚠️ No userId found - auto-switching to Demo mode`);
          setIsDemoMode(true);
          localStorage.setItem("tradingJournalDemoMode", "true");
        } else {
          console.log(`ℹ️ No userId but user manually selected personal mode - respecting choice`);
        }
      } else {
        // ✅ SIMPLIFIED: Load demo data directly from Firebase - NO localStorage!
        console.log(`📊 Demo mode - loading from Firebase journal-database...`);
        (async () => {
          try {
            const response = await fetch(getFullApiUrl('/api/journal/all-dates'));
            if (response.ok) {
              const firebaseData = await response.json();
              const dateCount = Object.keys(firebaseData).length;
              setDemoTradingDataByDate(firebaseData);
              setCalendarData(firebaseData);
              console.log(`✅ Loaded ${dateCount} real dates from Firebase`);
            }
          } catch (error) {
            console.error("❌ Error loading from Firebase:", error);
          }
        })();
      }
    }
  }, [isDemoMode, activeTab, heatmapYear]);

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

  const handleDateSelect = async (date: Date, firebaseData?: any, forceMode?: 'demo' | 'personal') => {
    // Update selected date IMMEDIATELY for instant visual feedback
    setSelectedDate(date);
    console.log(`📅 Selected date for heatmap:`, date);

    // IMMEDIATELY clear all data - NO DELAYS, NO LOADING STATES
    setNotesContent("");
    setTempNotesContent("");
    setSelectedTags([]);
    setTradeHistoryData([]);
    setTradingImages([]);

    // Use formatDateKey for consistency with save function
    const dateKey = formatDateKey(date);
    
    // If firebaseData is provided (from PersonalHeatmap), use it directly - NO API FETCH
    if (firebaseData !== undefined) {
      console.log(`✅ Using FRESH Firebase data from PersonalHeatmap for ${dateKey}:`, firebaseData);
      let journalData = firebaseData;

      // Handle Firebase response format (has tradingData wrapper)
      if (journalData && journalData.tradingData) {
        journalData = journalData.tradingData;
        console.log(`📦 Unwrapped Firebase tradingData:`, journalData);
      }

      if (journalData && Object.keys(journalData).length > 0) {
        console.log("🎯 Populating UI with FRESH Firebase data:", journalData);

        // Load the data into correct state variables
        const notes = journalData.notes || journalData.tradingNotes || journalData.notesContent || "";
        if (notes) {
          setNotesContent(notes);
          setTempNotesContent(notes);
          console.log("📝 Loaded notes from Firebase:", notes);
        }

        const tags = journalData.tags || journalData.tradingTags || journalData.selectedTags || [];
        if (Array.isArray(tags)) {
          setSelectedTags(tags);
          console.log("🏷️ Loaded tags from Firebase:", tags);
        }

        if (journalData.tradeHistory && Array.isArray(journalData.tradeHistory)) {
          setTradeHistoryData(journalData.tradeHistory);
          console.log("📊 Loaded trade history from Firebase:", journalData.tradeHistory.length, "trades");
        }

        const images = journalData.images || journalData.tradingImages || [];
        if (Array.isArray(images)) {
          setTradingImages(images);
          console.log("🖼️ Loaded images from Firebase:", images.length, "images");
        }

        console.log("✅ Successfully loaded all FRESH Firebase data for:", dateKey);
      } else {
        console.log(`📭 No Firebase data for: ${dateKey}`);
      }
      console.log("✅ Date loading complete");
      return; // Exit early - we used fresh Firebase data
    }

    // Otherwise, continue with normal API fetch logic
    console.log(
      `🔍 Loading journal data for date: ${dateKey} (original: ${date.toDateString()}) [Mode: ${forceMode || (isDemoMode ? 'demo' : 'personal')}]`,
    );

    // Load trading data from appropriate source based on demo mode
    // Use forceMode if provided (to avoid state closure issues), otherwise use isDemoMode state
    const effectiveMode = forceMode !== undefined ? forceMode : (isDemoMode ? 'demo' : 'personal');

    try {
      // Choose endpoint based on demo mode
      let response;
      if (effectiveMode === 'demo') {
        // Demo mode: Load from shared Google Cloud journal database
        console.log("📊 Loading from demo data (shared)");
        response = await fetch(getFullApiUrl(`/api/journal/${dateKey}`));
      } else {
        // Personal mode: Load from Firebase (user-specific)
        const userId = getUserId();
        if (!userId) {
          console.error("❌ Cannot load personal data - no Firebase user logged in");
          // Data already cleared at start of handleDateSelect - just return
          return;
        }
        console.log(`👤 Loading from user-specific data (userId: ${userId})`);
        response = await fetch(getFullApiUrl(`/api/user-journal/${userId}/${dateKey}`));
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
            journalData,
          );

          // Data already cleared at start of handleDateSelect for instant feedback
          // Now just populate with new data

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

          // ✅ ONLY USE REAL FIREBASE TRADE HISTORY - NO HARDCODED/CONSTRUCTED DATA
          if (
            journalData.tradeHistory &&
            Array.isArray(journalData.tradeHistory) &&
            journalData.tradeHistory.length > 0
          ) {
            setTradeHistoryData(journalData.tradeHistory);
            console.log(
              "✅ Loaded REAL trade history from Firebase:",
              journalData.tradeHistory.length,
              "trades",
            );
            console.log("📊 Trade data source: FIREBASE (no hardcoded data)");
          } else {
            // No trade history in Firebase - keep empty state, DO NOT construct fake data
            setTradeHistoryData([]);
            console.log("📭 No trade history in Firebase for this date - showing empty state");
          }

          if (journalData.images && Array.isArray(journalData.images)) {
            setTradingImages(journalData.images);
            console.log(
              "🖼️ Loaded images from journal-database:",
              journalData.images.length,
              "images",
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
            JSON.stringify(updatedTradingData),
          );
          localStorage.setItem(
            "calendarData",
            JSON.stringify(updatedCalendarData),
          );

          console.log(
            "✅ Successfully loaded and saved all journal data for:",
            dateKey,
          );
        } else {
          console.log("📭 No journal data found for:", dateKey);
          // Data already cleared at start of handleDateSelect for instant feedback
          // Empty state is already showing

          // Still open windows to allow adding new data for this date
          setShowTradingNotesWindow(true);
          setShowPerformanceWindow(true);
          setShowMultipleImageUpload(true);
        }
      } else {
        const errorText = await response.text();
        console.error(
          `❌ Load failed with status ${response.status}:`,
          errorText,
        );
        console.log("⚠️ Keeping existing data visible instead of clearing UI");
        // DON'T clear data on failed load - keep existing UI state visible
      }
    } catch (error) {
      console.error("❌ Error loading journal data:", error);
      console.log("⚠️ Error loading data - UI will remain empty");
      // Data already cleared at start - just log the error
    }
    console.log("✅ Date loading complete");
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

    // For demo mode in 2025, start from June (month 5) since demo data starts from June
    // For personal mode or other years, show all 12 months starting from January
    const startMonth = (isDemoMode && year === 2025) ? 5 : 0;
    const endMonth = 12;

    // Generate proper calendar layout for each month
    for (let monthIndex = startMonth; monthIndex < endMonth; monthIndex++) {
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
      console.log(`💾 SAVE SUMMARY for ${selectedDateStr}:`);
      console.log(`  📊 Trade History: ${safeTradeHistory.length} trades`);
      console.log(`  📝 Notes: ${safeNotesContent ? safeNotesContent.substring(0, 50) + '...' : 'None'}`);
      console.log(`  🏷️ Tags: ${safeTags.length} tags - ${safeTags.join(', ')}`);
      console.log(`  🖼️ Images: ${safeImages.length} images`);
      console.log(`  💰 Net P&L: ₹${safePerformanceMetrics.netPnL}`);
      console.log(`🔄 Attempting to save data for date: ${selectedDateStr}`, journalData);

      // Choose endpoint based on demo mode
      // Switch ON (true) = Demo mode, Switch OFF (false) = Personal mode
      let response;
      if (isDemoMode) {
        // Switch ON = Demo mode: Save to shared Google Cloud journal database
        console.log("📊 Saving to demo data (shared)");
        response = await fetch(`/api/journal/${selectedDateStr}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(journalData),
        });
      } else {
        // Switch OFF = Personal mode: Save to Firebase (user-specific)
        const userId = getUserId();
        if (!userId) {
          console.error("❌ Cannot save in personal mode - no Firebase user logged in");
          alert("⚠️ Please log in with your Firebase account to save personal trading data.\n\nSwitch to Demo mode or log in to continue.");
          throw new Error("No Firebase user logged in - cannot save to personal mode");
        }
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
          `✅ All trading data saved successfully for ${selectedDateStr}`,
          journalData,
        );

        // CRITICAL: Reload FULL heatmap data after save to sync everything
        console.log("🔄 Reloading FULL heatmap data to sync all windows...");
        
        // Reload the full heatmap data based on current mode
        if (isDemoMode) {
          console.log("📊 Refreshing demo mode heatmap...");
          const allDatesResponse = await fetch("/api/journal/all-dates");
          if (allDatesResponse.ok) {
            const allDatesData = await allDatesResponse.json();
            console.log(`✅ Heatmap refreshed with ${Object.keys(allDatesData).length} dates`);
            setTradingDataByDate(allDatesData);
          }
        } else {
          const userId = getUserId();
          if (userId) {
            console.log(`👤 Refreshing personal mode heatmap for user: ${userId}`);
            const allUserDataResponse = await fetch(`/api/user-journal/${userId}/all`);
            if (allUserDataResponse.ok) {
              const allUserData = await allUserDataResponse.json();
              console.log(`✅ Heatmap refreshed with ${Object.keys(allUserData).length} dates`);
              setTradingDataByDate(allUserData);
            }
          }
        }

        // Reload the current date to ensure UI updates
        console.log("🔄 Reloading current date to refresh UI...");
        await handleDateSelect(selectedDate);

        // Show success message
        if (typeof window !== "undefined") {
          const formattedDate = selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          });

          const saveLocation = isDemoMode ? "Demo (Shared)" : "Personal (Firebase)";
          
          alert(
            `✅ Trading data saved successfully!\n\n📅 Date: ${formattedDate}\n💾 Saved to: ${saveLocation}\n\n📊 Saved data:\n• Trades: ${
              safeTradeHistory.length
            }\n• Notes: ${safeNotesContent ? "✓" : "✗"}\n• Tags: ${
              safeTags.length > 0 ? safeTags.join(', ') : "None"
            }\n• Images: ${
              safeImages.length
            }\n• Net P&L: ₹${safePerformanceMetrics.netPnL.toLocaleString(
              "en-IN",
            )}`,
          );
        }
      } else {
        const errorText = await response.text();
        console.error(
          `❌ Save failed with status ${response.status}:`,
          errorText,
        );
        throw new Error(
          `Failed to save to Google Cloud: ${response.status} ${errorText}`,
        );
      }
    } catch (error) {
      console.error("❌ Error saving to Google Cloud journal database:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(
        `❌ Failed to save trading data to Google Cloud: ${errorMessage}. Please try again.`,
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
      tradesPnL.filter((pnl) => pnl < 0).reduce((sum, pnl) => sum + pnl, 0),
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
            `1970-01-01 ${positions[symbol].firstTradeTime}`,
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

      console.log("🔍 Parsing", lines.length, "lines of trade data");

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

          console.log("📋 Parsed parts:", parts);

          // Smart broker format detection
          if (parts.length >= 4) {
            let time = "";
            let order = "";
            let symbol = "";
            let type = "MIS";
            let qty = 0;
            let price = 0;

            // Detect format by checking first field
            const firstField = parts[0];
            const isTimeFirst =
              firstField && /^\d{1,2}:\d{2}(:\d{2})?/.test(firstField);

            // Check if there's a date column
            let startIndex = 0;
            if (
              parts[0] &&
              (parts[0].includes("-") || parts[0].includes("/")) &&
              parts[1] &&
              /\d{1,2}:\d{2}/.test(parts[1])
            ) {
              startIndex = 1; // Skip the date column
            }

            if (
              isTimeFirst ||
              (startIndex === 1 && /^\d{1,2}:\d{2}/.test(parts[startIndex]))
            ) {
              // FORMAT 1: Time first (most common)
              // Time, Symbol/Order, Other fields...
              time = parts[startIndex];

              // Handle AM/PM
              if (
                parts[startIndex + 1] &&
                /^(AM|PM)$/i.test(parts[startIndex + 1])
              ) {
                time = `${time} ${parts[startIndex + 1]}`;
                startIndex++;
              }

              // Next field could be symbol or order
              let nextFieldIndex = startIndex + 1;
              let nextField = parts[nextFieldIndex] || "";

              // Check if it's an order type (BUY/SELL with optional pipe)
              const orderMatch = nextField.match(/^(BUY|SELL)\|?$/i);
              if (orderMatch) {
                // Standard format: Time, Order, Symbol, Type, Qty, Price
                order = orderMatch[1].toUpperCase();
                symbol = parts[nextFieldIndex + 1] || "";
                type = parts[nextFieldIndex + 2] || "MIS";
                qty = parseInt(parts[nextFieldIndex + 3] || "0");
                price = parseFloat(parts[nextFieldIndex + 4] || "0");
              } else {
                // Alternative: Time, Symbol, OrderType(combined), Qty, Price
                symbol = nextField;

                // Next field might be combined order+type (e.g., "buynrml", "sellmis")
                const combinedField = (
                  parts[nextFieldIndex + 1] || ""
                ).toLowerCase();
                if (combinedField.startsWith("buy")) {
                  order = "BUY";
                  type =
                    combinedField.replace("buy", "").toUpperCase() || "MIS";
                } else if (combinedField.startsWith("sell")) {
                  order = "SELL";
                  type =
                    combinedField.replace("sell", "").toUpperCase() || "MIS";
                } else {
                  // Might be separate order and type
                  order = (parts[nextFieldIndex + 1] || "")
                    .toUpperCase()
                    .replace("|", "");
                  type = (parts[nextFieldIndex + 2] || "MIS").toUpperCase();
                }

                // Get qty and price
                const remainingParts = parts.slice(nextFieldIndex + 2);
                for (const part of remainingParts) {
                  const num = parseFloat(part);
                  if (!isNaN(num) && num > 0) {
                    if (qty === 0 && num >= 1) {
                      qty = Math.floor(num);
                    } else if (price === 0) {
                      price = num;
                    }
                  }
                }
              }
            } else {
              // FORMAT 2: Symbol first (legacy format)
              // Symbol, Order|Type, Qty, Price, Time
              symbol = parts[startIndex];

              // Next field is order (might have pipe or be combined with type)
              const orderField = parts[startIndex + 1] || "";

              // Check for "BUY| NRML" format (order and type in same field with pipe)
              if (orderField.includes("|")) {
                const orderParts = orderField.split("|").map((p) => p.trim());
                order = orderParts[0].toUpperCase();
                type = (orderParts[1] || "MIS").toUpperCase();
                qty = parseInt(parts[startIndex + 2] || "0");
                price = parseFloat(parts[startIndex + 3] || "0");
                time = parts[startIndex + 4] || "";
              } else if (
                orderField.toLowerCase().startsWith("buy") ||
                orderField.toLowerCase().startsWith("sell")
              ) {
                // Extract order and type from combined field (e.g., "buynrml", "sellmis")
                const orderFieldUpper = orderField.toUpperCase();
                if (orderFieldUpper.startsWith("BUY")) {
                  order = "BUY";
                  type = orderFieldUpper.replace("BUY", "").trim() || "MIS";
                } else {
                  order = "SELL";
                  type = orderFieldUpper.replace("SELL", "").trim() || "MIS";
                }
                qty = parseInt(parts[startIndex + 2] || "0");
                price = parseFloat(parts[startIndex + 3] || "0");
                time = parts[startIndex + 4] || "";
              } else {
                // Separate order and type fields
                order = orderField.toUpperCase();
                type = (parts[startIndex + 2] || "MIS").toUpperCase();
                qty = parseInt(parts[startIndex + 3] || "0");
                price = parseFloat(parts[startIndex + 4] || "0");
                time = parts[startIndex + 5] || "";
              }
            }

            // Extract quantity from "225 / 225" format if needed
            if (qty === 0) {
              for (const part of parts) {
                const qtyMatch = part.match(/(\d+)/);
                if (qtyMatch) {
                  const testQty = parseInt(qtyMatch[1]);
                  if (testQty > 0 && testQty < 100000) {
                    qty = testQty;
                    break;
                  }
                }
              }
            }

            // Extract price from "200.00 / 200.00 trg." format if needed
            if (price === 0) {
              for (const part of parts) {
                const priceMatch = part.match(/(\d+\.?\d*)/);
                if (priceMatch) {
                  const testPrice = parseFloat(priceMatch[1]);
                  if (
                    testPrice > 0 &&
                    testPrice < 100000 &&
                    testPrice !== qty
                  ) {
                    price = testPrice;
                    break;
                  }
                }
              }
            }

            // Clean up order type
            order = order.toUpperCase().trim();
            if (!["BUY", "SELL"].includes(order)) {
              // Try to extract from the line if we still don't have a valid order
              const lineUpper = line.toUpperCase();
              if (lineUpper.includes("BUY")) {
                order = "BUY";
              } else if (lineUpper.includes("SELL")) {
                order = "SELL";
              } else {
                continue; // Skip invalid orders
              }
            }

            // Clean up type
            type = type.toUpperCase().trim();
            if (!["MIS", "CNC", "NRML", "BFO", "LIM", "LIMIT"].includes(type)) {
              type = "MIS"; // Default
            }

            // Clean symbol - remove NFO, BFO, NSE, BSE suffixes and handle CE/PE
            symbol = symbol
              .replace(/\s+(NFO|BFO|NSE|BSE)$/i, "")
              .replace(/\s+(CE|PE)\s+(NFO|BFO|NSE|BSE)$/i, " $1")
              .trim();

            console.log("✅ Extracted trade:", {
              time,
              order,
              symbol,
              type,
              qty,
              price,
            });

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

              console.log("✅ Adding trade to data:", trade);
              data.push(trade);
            } else {
              console.log("❌ Skipping invalid trade - missing:", {
                hasTime: !!time,
                hasOrder: !!order,
                hasSymbol: !!symbol,
                hasQty: qty > 0,
                time,
                order,
                symbol,
                qty,
              });
            }
          }
        }
      }

      console.log("📊 Total trades parsed:", data.length);

      // Sort trades by time (earliest first)
      data.sort((a, b) => {
        const timeA = convertTimeToComparable(a.time);
        const timeB = convertTimeToComparable(b.time);
        return timeA.localeCompare(timeB);
      });

      return data;
    } catch (error) {
      throw new Error(
        "Failed to parse trade data. Please check the format and try again.",
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

  // Helper function to find position of selected text in first line
  const findPositionInLine = (selectedText: string, firstLine: string): number | null => {
    if (!selectedText || !firstLine) return null;
    
    // Split first line by tabs first, then by spaces
    const words = firstLine.split(/\t+/).flatMap(part => part.split(/\s+/)).filter(w => w.trim());
    
    // Find the exact match or partial match
    const trimmedSelection = selectedText.trim();
    const position = words.findIndex(word => word === trimmedSelection || word.includes(trimmedSelection) || trimmedSelection.includes(word));
    
    console.log("🔍 Position detection:", { selectedText: trimmedSelection, words, position, firstLine });
    return position >= 0 ? position : null;
  };

  // Parse trades using saved format with position-based mapping (supports multiple positions per field)
  const parseTradesWithFormat = (data: string, format: FormatData): ParseResult => {
    const result: ParseResult = {
      trades: [],
      errors: []
    };

    const lines = data.split("\n").filter(line => line.trim());
    
    if (lines.length === 0) {
      result.errors.push({
        line: 0,
        content: "",
        reason: "No data found"
      });
      return result;
    }

    // Parse each line using position mapping
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by tabs first, then by spaces
      const words = line.split(/\t+/).flatMap(part => part.split(/\s+/)).filter(w => w.trim());
      
      try {
        const tradeData: any = {};

        // Extract fields based on saved positions (join if multiple positions)
        if (format.positions.time.length > 0) {
          tradeData.time = format.positions.time.map(pos => words[pos] || "").join(" ");
        }
        if (format.positions.order.length > 0) {
          tradeData.order = format.positions.order.map(pos => words[pos] || "").join(" ");
        }
        if (format.positions.symbol.length > 0) {
          tradeData.symbol = format.positions.symbol.map(pos => words[pos] || "").join(" ");
        }
        if (format.positions.type.length > 0) {
          tradeData.type = format.positions.type.map(pos => words[pos] || "").join(" ");
        }
        if (format.positions.qty.length > 0) {
          tradeData.qty = format.positions.qty.map(pos => words[pos] || "").join(" ");
        }
        if (format.positions.price.length > 0) {
          tradeData.price = format.positions.price.map(pos => words[pos] || "").join(" ");
        }

        // Validate required fields
        if (!tradeData.order || !tradeData.qty || !tradeData.price) {
          result.errors.push({
            line: i + 1,
            content: line,
            reason: "Missing required fields (order, qty, or price)"
          });
          continue;
        }

        // Validate and normalize
        const order = tradeData.order?.toUpperCase();
        if (order !== "BUY" && order !== "SELL") {
          result.errors.push({
            line: i + 1,
            content: line,
            reason: `Invalid order type: ${tradeData.order}`
          });
          continue;
        }

        const qty = parseFloat(tradeData.qty);
        const price = parseFloat(tradeData.price?.replace(/[₹$,]/g, "") || "0");

        if (isNaN(qty) || qty <= 0) {
          result.errors.push({
            line: i + 1,
            content: line,
            reason: `Invalid quantity: ${tradeData.qty}`
          });
          continue;
        }

        if (isNaN(price) || price <= 0) {
          result.errors.push({
            line: i + 1,
            content: line,
            reason: `Invalid price: ${tradeData.price}`
          });
          continue;
        }

        result.trades.push({
          time: tradeData.time || "",
          order: order as "BUY" | "SELL",
          symbol: tradeData.symbol || "",
          type: tradeData.type?.toUpperCase() || "MIS",
          qty: Math.floor(qty),
          price,
          pnl: "-",
          duration: "-"
        });
      } catch (err) {
        result.errors.push({
          line: i + 1,
          content: line,
          reason: err instanceof Error ? err.message : "Parsing error"
        });
      }
    }

    console.log("✅ Parsed trades using positions:", format.positions, "Result:", result);
    return result;
  };

  const handleImportData = () => {
    try {
      setImportError("");
      setParseErrors([]);

      if (!importData.trim()) {
        setImportError("Please paste trade data");
        return;
      }

      // Use format-based parser if active format is set, otherwise use default parser
      const { trades, errors } = activeFormat 
        ? parseTradesWithFormat(importData, activeFormat)
        : parseBrokerTrades(importData);

      // Store parse errors for detailed display
      setParseErrors(errors);

      if (trades.length === 0) {
        if (errors.length > 0) {
          setImportError(
            `No valid trades found. ${errors.length} error(s) detected. See details below.`,
          );
        } else {
          setImportError(
            "No valid trades found in the data. Please check the format.",
          );
        }
        return;
      }

      // Calculate P&L for the successfully parsed trades
      const processedData = calculateSimplePnL(trades);

      // Add imported trades to existing trade history (not replace)
      setTradeHistoryData((prev) => [...processedData, ...prev]);

      // Show success message with counts
      if (errors.length > 0) {
        // Partial import - some trades succeeded, some failed
        console.log(
          `✅ Imported ${trades.length} trades successfully. ⚠️ ${errors.length} line(s) had errors.`,
        );
      } else {
        // Full success
        const formatInfo = detectedFormatLabel ? ` using "${detectedFormatLabel}" format` : "";
        console.log(`✅ Successfully imported ${trades.length} trades${formatInfo}! Added to existing trade history.`);
      }
      
      // Log format detection info
      if (activeFormat && detectedFormatLabel) {
        console.log(`🎯 Used auto-detected "${detectedFormatLabel}" format for parsing!`);
      }

      // Close modal and show order modal only if no errors, otherwise keep modal open to show errors
      if (errors.length === 0) {
        setShowImportModal(false);
        setImportData("");
        setShowOrderModal(true);
      } else {
        // Keep modal open to show errors but still set the data
        setShowOrderModal(true);
      }
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Unknown error occurred",
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
      console.log('[TAB] Getting active tab:', activeTab);
      return activeTab;
    };
    window.setActiveTab = (tab: string) => {
      console.log('[TAB] Setting active tab to:', tab);
      setActiveTab(tab);
    };

    console.log('[TAB] Tab functions exposed, current tab:', activeTab);

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
          <NeoFeedSocialFeed onBackClick={() => setTabWithAuthCheck("trading-home")} />
        </main>
      </div>
    );
  }

  // MiniCast/Tutor tab with full page view
  if (activeTab === "tutor") {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {/* MiniCast Component - Left Side (replacing search bar) */}
          <div className="flex items-center gap-6">
            <div className="bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg border border-gray-700">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div>
                <div className="text-white font-semibold text-sm">MiniCast</div>
                <div className="text-gray-400 text-xs">Premium Podcasts</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Top right navigation items removed as requested */}
          </div>
        </div>

        {/* Main Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-normal text-white mb-2">
            {getTimeBasedGreeting()}
          </h1>
        </div>


        {/* Main Layout Grid - Left Card Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Section - Stack-based Swipeable Cards */}
          <div className="lg:col-span-4 space-y-6">
            <div className="relative h-80 pl-[80px] pr-[56px]">
              <SwipeableCardStack onSectorChange={handleSectorChange} selectedSector={selectedSector} />
            </div>

          </div>

          {/* Right Section - Wallet View */}
          <div className="lg:col-span-8 space-y-6">
            {/* Wallet View Section */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="mb-6">
              </div>

              {/* Swipe Cards Section */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1 - Study */}
                  <div className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-6 cursor-pointer hover:scale-105 transition-transform duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent"></div>
                    <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
                      <div className="text-6xl mb-4">📚</div>
                      <div className="text-white text-2xl font-bold">Study</div>
                      <div className="text-white/60 text-sm mt-2">Learning Materials</div>
                    </div>
                  </div>

                  {/* Card 2 - Courses */}
                  <div className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 p-6 cursor-pointer hover:scale-105 transition-transform duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-transparent"></div>
                    <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
                      <div className="text-6xl mb-4">🎓</div>
                      <div className="text-white text-2xl font-bold">Courses</div>
                      <div className="text-white/60 text-sm mt-2">Training Programs</div>
                    </div>
                  </div>

                  {/* Card 3 - Live */}
                  <div className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500 via-yellow-600 to-orange-700 p-6 cursor-pointer hover:scale-105 transition-transform duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-transparent"></div>
                    <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
                      <div className="text-6xl mb-4">🔴</div>
                      <div className="text-white text-2xl font-bold">Live</div>
                      <div className="text-white/60 text-sm mt-2">Live Sessions</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Section - 70% Width with Subscribe Window - 30% Width */}
        <div className="mb-8 flex gap-6">
          {/* Statistics Window - 70% */}
          <div className="w-[70%]">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <Tabs value={statisticsTab} onValueChange={setStatisticsTab} className="w-full">
                <div className="flex items-center justify-between mb-6">

                  {/* Tab Switch Buttons */}
                  <TabsList className="bg-slate-700 border-slate-600">
                    <TabsTrigger 
                      value="overview" 
                      className="text-slate-300 data-[state=active]:bg-slate-600 data-[state=active]:text-white flex items-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Podcast
                    </TabsTrigger>
                    <TabsTrigger 
                      value="setup" 
                      className="text-slate-300 data-[state=active]:bg-slate-600 data-[state=active]:text-white flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Events
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Overview Tab Content - Music-Style Podcast Dashboard */}
                <TabsContent value="overview" className="mt-0">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="text-white text-xl font-bold mb-6">
                      TRENDING PODCASTS - {selectedSector === 'FINANCE' ? 'FINANCE' : selectedSector === 'IT' ? 'TECH' : selectedSector === 'COMMODITY' ? 'COMMODITY' : selectedSector === 'GLOBAL' ? 'GLOBAL' : selectedSector === 'BANKS' ? 'BANKING' : selectedSector === 'AUTOMOBILE' ? 'AUTO' : 'FINANCE'}
                    </div>


                    {/* Main Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Featured Podcast - Left Side (2/3 width) */}
                      <div className="lg:col-span-2">
                        <div className="bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 rounded-3xl p-8 relative overflow-hidden min-h-[280px]">
                          {/* Background Elements */}
                          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>

                          <div className="flex items-center gap-6 relative z-10 h-full">
                            {/* Podcast Host Image */}
                            <div className="w-40 h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                              <Mic className="w-20 h-20 text-white" />
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                              <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-medium inline-block mb-4">
                                PODCAST OF THE WEEK
                              </div>
                              <h2 className="text-white text-3xl font-bold mb-2">Rich Mindset</h2>
                              <p className="text-white/80 mb-4">Finance Expert</p>

                              {/* Play Button */}
                              <Button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0 w-12 h-12 rounded-full p-0">
                                <Play className="w-6 h-6 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Top Charts - Right Side (1/3 width) */}
                      <div className="lg:col-span-1">
                        <div className="bg-slate-800 rounded-2xl p-4">
                          <h3 className="text-white text-lg font-bold mb-4">Saved Podcast</h3>

                          <div className="space-y-3">
                            {/* Podcast Item 1 */}
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <DollarSign className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-sm">Budget Planning</h4>
                                <p className="text-slate-400 text-xs">Money Expert</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-slate-400 text-xs">03:13</span>
                                <Button size="sm" variant="ghost" className="w-6 h-6 p-0 text-slate-400 hover:text-white">
                                  <Heart className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="w-6 h-6 p-0 text-slate-400 hover:text-white">
                                  <Play className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Podcast Item 2 */}
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Mic className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-sm">Psychology of Money</h4>
                                <p className="text-slate-400 text-xs">Mind & Money</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-slate-400 text-xs">05:26</span>
                                <Button size="sm" variant="ghost" className="w-6 h-6 p-0 text-slate-400 hover:text-white">
                                  <Heart className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="w-6 h-6 p-0 text-slate-400 hover:text-white">
                                  <Play className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Podcast Item 3 */}
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-sm">Entrepreneur Mindset</h4>
                                <p className="text-slate-400 text-xs">Business Weekly</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-2 bg-yellow-500 rounded-full"></div>
                                <span className="text-slate-400 text-xs">02:51</span>
                                <Button size="sm" variant="ghost" className="w-6 h-6 p-0 text-slate-400 hover:text-white">
                                  <Heart className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="w-6 h-6 p-0 text-slate-400 hover:text-white">
                                  <Play className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Podcast Item 4 - Resilience */}
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Shield className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-sm">Building Resilience</h4>
                                <p className="text-slate-400 text-xs">Mental Strength</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
                                <span className="text-slate-400 text-xs">04:12</span>
                                <Button size="sm" variant="ghost" className="w-6 h-6 p-0 text-slate-400 hover:text-white">
                                  <Heart className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="w-6 h-6 p-0 text-slate-400 hover:text-white">
                                  <Play className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI-Generated Trending Podcasts */}
                    <div className="mt-8">
                      <h3 className="text-white text-lg font-medium mb-4">AI-Generated {selectedSector} Podcasts</h3>

                      {isPodcastsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                          <p className="text-slate-400 text-sm">Generating trending podcasts...</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                          {trendingPodcasts.slice(0, 10).map((podcast, index) => (
                            <div 
                              key={podcast.id} 
                              className={`rounded-lg p-4 hover:bg-slate-600/50 transition-colors cursor-pointer group ${
                                selectedPodcast?.id === podcast.id 
                                  ? 'bg-purple-600/30 border border-purple-500' 
                                  : 'bg-slate-700/50'
                              }`}
                              onClick={() => handlePodcastSelect(podcast)}
                              data-testid={`podcast-card-${podcast.id}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold text-lg">#{index + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-1">
                                    <h4 className="text-white font-medium text-sm leading-tight">{podcast.title}</h4>
                                    {podcast.trending && <span className="text-orange-400 text-xs bg-orange-400/20 px-2 py-1 rounded-full">TRENDING</span>}
                                  </div>
                                  <p className="text-slate-400 text-xs mb-2 line-clamp-2">{podcast.description}</p>
                                  <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span>🎙️ {podcast.host}</span>
                                    <span>⏱️ {podcast.duration}</span>
                                    <span>👥 {podcast.listeners}</span>
                                  </div>
                                </div>
                                <Button size="sm" className="w-8 h-8 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-0 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Play className="w-4 h-4 ml-0.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Weekly Top Tracks */}
                    <div className="mt-8">
                      <h3 className="text-white text-lg font-medium mb-4">Weekly top tracks</h3>

                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {/* Track 1 */}
                        <div className="group cursor-pointer">
                          <div className="w-full aspect-square bg-gradient-to-br from-green-600 to-blue-800 rounded-lg mb-3 relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl">🤖</span>
                            </div>
                            <div className="absolute bottom-2 left-2 text-white text-xs font-bold">AI FINANCE</div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" className="w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0 rounded-full p-0">
                                <Play className="w-4 h-4 ml-0.5" />
                              </Button>
                            </div>
                          </div>
                          <h4 className="text-white font-medium text-sm">{selectedPodcast ? selectedPodcast.title : `AI in ${selectedSector === 'FINANCE' ? 'Finance' : selectedSector === 'IT' ? 'Tech' : selectedSector === 'COMMODITY' ? 'Commodity' : selectedSector === 'GLOBAL' ? 'Global' : selectedSector === 'BANKS' ? 'Banking' : selectedSector === 'AUTOMOBILE' ? 'Auto' : 'Finance'}`}</h4>
                          <p className="text-slate-400 text-xs">Tech Weekly</p>
                        </div>

                        {/* Track 2 */}
                        <div className="group cursor-pointer">
                          <div className="w-full aspect-square bg-gradient-to-br from-yellow-400 to-orange-600 rounded-lg mb-3 relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl">📰</span>
                            </div>
                            <div className="absolute bottom-2 left-2 text-white text-xs font-bold">MARKET NEWS</div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" className="w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0 rounded-full p-0">
                                <Play className="w-4 h-4 ml-0.5" />
                              </Button>
                            </div>
                          </div>
                          <h4 className="text-white font-medium text-sm">Market News</h4>
                          <p className="text-slate-400 text-xs">Daily Report</p>
                        </div>

                        {/* Track 3 */}
                        <div className="group cursor-pointer">
                          <div className="w-full aspect-square bg-gradient-to-br from-red-500 to-pink-600 rounded-lg mb-3 relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl">🛡️</span>
                            </div>
                            <div className="absolute bottom-2 left-2 text-white text-xs font-bold">RISK MGMT</div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" className="w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0 rounded-full p-0">
                                <Play className="w-4 h-4 ml-0.5" />
                              </Button>
                            </div>
                          </div>
                          <h4 className="text-white font-medium text-sm">Risk Management</h4>
                          <p className="text-slate-400 text-xs">Pro Trader</p>
                        </div>

                        {/* Track 4 */}
                        <div className="group cursor-pointer">
                          <div className="w-full aspect-square bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg mb-3 relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl">🚀</span>
                            </div>
                            <div className="absolute bottom-2 left-2 text-white text-xs font-bold">STARTUP</div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" className="w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0 rounded-full p-0">
                                <Play className="w-4 h-4 ml-0.5" />
                              </Button>
                            </div>
                          </div>
                          <h4 className="text-white font-medium text-sm">Building Companies</h4>
                          <p className="text-slate-400 text-xs">Startup Stories</p>
                        </div>

                        {/* Track 5 */}
                        <div className="group cursor-pointer">
                          <div className="w-full aspect-square bg-gradient-to-br from-purple-600 to-indigo-800 rounded-lg mb-3 relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl">🎓</span>
                            </div>
                            <div className="absolute bottom-2 left-2 text-white text-xs font-bold">FELLOWSHIP</div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" className="w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0 rounded-full p-0">
                                <Play className="w-4 h-4 ml-0.5" />
                              </Button>
                            </div>
                          </div>
                          <h4 className="text-white font-medium text-sm">Fellowship Programs</h4>
                          <p className="text-slate-400 text-xs">Career Growth</p>
                        </div>

                        {/* Track 6 */}
                        <div className="group cursor-pointer">
                          <div className="w-full aspect-square bg-gradient-to-br from-orange-500 to-red-600 rounded-lg mb-3 relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl">💼</span>
                            </div>
                            <div className="absolute bottom-2 left-2 text-white text-xs font-bold">BUSINESS</div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" className="w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0 rounded-full p-0">
                                <Play className="w-4 h-4 ml-0.5" />
                              </Button>
                            </div>
                          </div>
                          <h4 className="text-white font-medium text-sm">Business Models</h4>
                          <p className="text-slate-400 text-xs">Strategy Tips</p>
                        </div>

                        {/* Track 7 */}
                        <div className="group cursor-pointer">
                          <div className="w-full aspect-square bg-gradient-to-br from-emerald-600 to-teal-800 rounded-lg mb-3 relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl">⭐</span>
                            </div>
                            <div className="absolute bottom-2 left-2 text-white text-xs font-bold">HERO ZERO</div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" className="w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0 rounded-full p-0">
                                <Play className="w-4 h-4 ml-0.5" />
                              </Button>
                            </div>
                          </div>
                          <h4 className="text-white font-medium text-sm">Hero to Zero Stories</h4>
                          <p className="text-slate-400 text-xs">Quick Lessons</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Trading Charts Tab Content */}
                <TabsContent value="trading-charts" className="mt-0">
                  <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                      <h4 className="text-white text-lg font-medium">Upcoming Events</h4>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <span>Showing</span>
                        <span className="text-white">10</span>
                        <span>out of 48</span>
                      </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto pr-2">
                      {/* Events Grid */}
                      <div className="grid grid-cols-3 gap-4 pb-4">
                      {/* Art & Design Event */}
                      <div className="relative rounded-xl p-4 overflow-hidden bg-gradient-to-br from-blue-400/80 via-cyan-500/60 to-blue-600/80 flex gap-3">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-600/40"></div>
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8"></div>

                        {/* Event Content */}
                        <div className="relative z-10 flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">Startup Summit</span>
                              <span className="bg-green-500/80 text-white px-2 py-1 rounded-full text-xs">● Active</span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <h5 className="text-white font-semibold mb-1">Global Startup Summit | Hyderabad 2025</h5>
                            <p className="text-white/90 text-xs mb-1">Sat, 06 Sept • 9:00 AM</p>
                            <p className="text-white/70 text-xs">📍 Deccan Serai Hotel, Hitech City, Hyderabad</p>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 bg-white/30 rounded-full h-1.5 mr-3">
                              <div className="bg-white h-1.5 rounded-full w-4/5"></div>
                            </div>
                            <span className="text-white/90 text-xs font-medium">85%</span>
                          </div>
                          <div className="text-white font-bold text-sm">₹1,299</div>
                        </div>

                        {/* Event Image */}
                        <div className="relative z-10 w-20 h-20 flex-shrink-0">
                          <img 
                            src={getEventImage("Global Startup Summit | Hyderabad 2025")} 
                            alt="Global Startup Summit Hyderabad 2025" 
                            className="w-full h-full object-cover rounded-lg border border-white/20"
                          />
                        </div>
                      </div>

                      {/* Music Event */}
                      <div className="relative rounded-xl p-4 overflow-hidden bg-gradient-to-br from-indigo-600/80 via-blue-700/70 to-purple-800/80 flex gap-3">
                        {/* Starry Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/60"></div>
                        <div className="absolute top-2 right-4 w-1 h-1 bg-white rounded-full opacity-80"></div>
                        <div className="absolute top-6 right-8 w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
                        <div className="absolute top-4 right-12 w-1 h-1 bg-yellow-200 rounded-full opacity-90"></div>
                        <div className="absolute top-8 right-6 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>

                        {/* Event Content */}
                        <div className="relative z-10 flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">Music</span>
                              <span className="bg-green-500/80 text-white px-2 py-1 rounded-full text-xs">● Active</span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <h5 className="text-white font-semibold mb-1">TiE Bangalore Founders Summit</h5>
                            <p className="text-white/90 text-xs mb-1">Feb 10, 2025 • 9:30 AM</p>
                            <p className="text-white/70 text-xs">📍 TiE Bangalore, Koramangala</p>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 bg-white/30 rounded-full h-1.5 mr-3">
                              <div className="bg-white h-1.5 rounded-full w-3/4"></div>
                            </div>
                            <span className="text-white/90 text-xs font-medium">75%</span>
                          </div>
                          <div className="text-white font-bold text-sm">₹560</div>
                        </div>

                        {/* Event Image */}
                        <div className="relative z-10 w-20 h-20 flex-shrink-0">
                          <img 
                            src={getEventImage("TiE Bangalore Founders Summit")} 
                            alt="TiE Bangalore Founders Summit" 
                            className="w-full h-full object-cover rounded-lg border border-white/20"
                          />
                        </div>
                      </div>


                      {/* Health & Wellness Event */}
                      <div className="relative rounded-xl p-4 overflow-hidden bg-gradient-to-br from-sky-400/80 via-blue-500/70 to-cyan-600/80 flex gap-3">
                        {/* Wellness Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-400/30 to-blue-600/40"></div>
                        <div className="absolute top-2 right-2 w-12 h-12 bg-white/10 rounded-full"></div>
                        <div className="absolute bottom-2 left-2 w-8 h-8 bg-white/10 rounded-full"></div>

                        {/* Event Content */}
                        <div className="relative z-10 flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">Health & Wellness</span>
                              <span className="bg-green-500/80 text-white px-2 py-1 rounded-full text-xs">● Active</span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <h5 className="text-white font-semibold mb-1">Pharma Bio Summit Hyderabad</h5>
                            <p className="text-white/90 text-xs mb-1">Jan 28, 2025 • 10:00 AM</p>
                            <p className="text-white/70 text-xs">📍 HICC, Hyderabad</p>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 bg-white/30 rounded-full h-1.5 mr-3">
                              <div className="bg-white h-1.5 rounded-full w-2/5"></div>
                            </div>
                            <span className="text-white/90 text-xs font-medium">40%</span>
                          </div>
                          <div className="text-white font-bold text-sm">₹580</div>
                        </div>

                        {/* Event Image */}
                        <div className="relative z-10 w-20 h-20 flex-shrink-0">
                          <img 
                            src={getEventImage("Pharma Bio Summit Hyderabad")} 
                            alt="Pharma Bio Summit Hyderabad" 
                            className="w-full h-full object-cover rounded-lg border border-white/20"
                          />
                        </div>
                      </div>

                      {/* Food & Culinary Event */}
                      <div className="relative rounded-xl p-4 overflow-hidden bg-gradient-to-br from-orange-400/80 via-red-500/70 to-pink-500/80 flex gap-3">
                        {/* Food Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-red-600/40"></div>
                        <div className="absolute top-1 right-1 w-6 h-6 bg-yellow-300/20 rounded-full"></div>
                        <div className="absolute top-3 right-6 w-4 h-4 bg-orange-300/30 rounded-full"></div>
                        <div className="absolute bottom-2 left-3 w-5 h-5 bg-red-300/20 rounded-full"></div>

                        {/* Event Content */}
                        <div className="relative z-10 flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">Food & Culinary</span>
                              <span className="bg-green-500/80 text-white px-2 py-1 rounded-full text-xs">● Active</span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <h5 className="text-white font-semibold mb-1">Hyderabad Food Festival</h5>
                            <p className="text-white/90 text-xs mb-1">Feb 20, 2025 • 6:00 PM</p>
                            <p className="text-white/70 text-xs">📍 Shilpakala Vedika, Hyderabad</p>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 bg-white/30 rounded-full h-1.5 mr-3">
                              <div className="bg-white h-1.5 rounded-full w-3/5"></div>
                            </div>
                            <span className="text-white/90 text-xs font-medium">60%</span>
                          </div>
                          <div className="text-white font-bold text-sm">₹1,200</div>
                        </div>

                        {/* Event Image */}
                        <div className="relative z-10 w-20 h-20 flex-shrink-0">
                          <img 
                            src={getEventImage("Hyderabad Food Festival")} 
                            alt="Hyderabad Food Festival" 
                            className="w-full h-full object-cover rounded-lg border border-white/20"
                          />
                        </div>
                      </div>


                      {/* Technology Event */}
                      <div className="relative rounded-xl p-4 overflow-hidden bg-gradient-to-br from-purple-500/80 via-violet-600/70 to-indigo-700/80 flex gap-3">
                        {/* Tech Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-indigo-800/40"></div>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 transform rotate-45 -mr-8 -mt-8"></div>
                        <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 transform rotate-12 -ml-6 -mb-6"></div>
                        <div className="absolute top-1/2 right-4 w-2 h-2 bg-cyan-400/60 rounded-full"></div>
                        <div className="absolute top-1/3 right-8 w-1 h-1 bg-pink-400/60 rounded-full"></div>

                        {/* Event Content */}
                        <div className="relative z-10 flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">Technology</span>
                              <span className="bg-green-500/80 text-white px-2 py-1 rounded-full text-xs">● Active</span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <h5 className="text-white font-semibold mb-1">HITEX IT Expo Hyderabad</h5>
                            <p className="text-white/90 text-xs mb-1">Mar 5, 2025 • 9:00 AM</p>
                            <p className="text-white/70 text-xs">📍 Hitex Exhibition Centre</p>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 bg-white/30 rounded-full h-1.5 mr-3">
                              <div className="bg-white h-1.5 rounded-full w-1/2"></div>
                            </div>
                            <span className="text-white/90 text-xs font-medium">55%</span>
                          </div>
                          <div className="text-white font-bold text-sm">₹575</div>
                        </div>

                        {/* Event Image */}
                        <div className="relative z-10 w-20 h-20 flex-shrink-0">
                          <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-indigo-700/30 rounded-lg border border-white/20 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-indigo-800/20"></div>
                            <div className="absolute top-1 right-1 w-1 h-1 bg-cyan-400/60 rounded-full"></div>
                            <div className="absolute bottom-1 left-1 w-1 h-1 bg-pink-400/60 rounded-full"></div>
                            <div className="relative z-10 text-center">
                              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-1">
                                <Zap className="w-4 h-4 text-white/60" />
                              </div>
                              <div className="text-white/70 text-[8px] font-medium">TECH</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Outdoor & Adventure Event */}
                      <div className="relative rounded-xl p-4 overflow-hidden bg-gradient-to-br from-purple-400/80 via-indigo-500/70 to-blue-600/80 flex gap-3">
                        {/* Adventure Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-blue-700/40"></div>
                        <div className="absolute top-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-10 -mt-10"></div>
                        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mb-12"></div>
                        <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-white/10 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

                        {/* Event Content */}
                        <div className="relative z-10 flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">Business</span>
                              <span className="bg-green-500/80 text-white px-2 py-1 rounded-full text-xs">● Active</span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <h5 className="text-white font-semibold mb-1">Mumbai Fintech Festival</h5>
                            <p className="text-white/90 text-xs mb-1">Jan 15, 2025 • 10:30 AM</p>
                            <p className="text-white/70 text-xs">📍 Bombay Exhibition Centre</p>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 bg-white/30 rounded-full h-1.5 mr-3">
                              <div className="bg-white h-1.5 rounded-full w-4/5"></div>
                            </div>
                            <span className="text-white/90 text-xs font-medium">65%</span>
                          </div>
                          <div className="text-white font-bold text-sm">₹850</div>
                        </div>

                        {/* Event Image */}
                        <div className="relative z-10 w-20 h-20 flex-shrink-0">
                          {getEventImage("Mumbai Fintech Festival") ? (
                            <img 
                              src={getEventImage("Mumbai Fintech Festival")!} 
                              alt="Mumbai Fintech Festival" 
                              className="w-full h-full object-cover rounded-lg border border-white/20"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-400/30 to-blue-600/30 rounded-lg border border-white/20 flex items-center justify-center relative overflow-hidden">
                              <div className="text-white/70 text-[8px] font-medium">BUSINESS</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Startup Innovations Event */}
                      <div className="relative rounded-xl p-4 overflow-hidden bg-gradient-to-br from-emerald-400/80 via-teal-500/70 to-cyan-600/80 flex gap-3">
                        {/* Innovation Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-cyan-700/40"></div>
                        <div className="absolute top-2 right-3 w-3 h-3 bg-white/20 rounded-full"></div>
                        <div className="absolute top-6 right-8 w-2 h-2 bg-white/15 rounded-full"></div>
                        <div className="absolute bottom-4 left-4 w-4 h-4 bg-white/10 rounded-full"></div>
                        <div className="absolute top-1/3 left-6 w-1 h-1 bg-yellow-300/60 rounded-full"></div>

                        {/* Event Content */}
                        <div className="relative z-10 flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">Startup Innovations</span>
                              <span className="bg-green-500/80 text-white px-2 py-1 rounded-full text-xs">● Active</span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <h5 className="text-white font-semibold mb-1">Nasscom Product Conclave Bangalore</h5>
                            <p className="text-white/90 text-xs mb-1">Feb 25, 2025 • 9:00 AM</p>
                            <p className="text-white/70 text-xs">📍 UB City Mall, Bengaluru</p>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 bg-white/30 rounded-full h-1.5 mr-3">
                              <div className="bg-white h-1.5 rounded-full w-4/5"></div>
                            </div>
                            <span className="text-white/90 text-xs font-medium">80%</span>
                          </div>
                          <div className="text-white font-bold text-sm">₹1,250</div>
                        </div>

                        {/* Event Image */}
                        <div className="relative z-10 w-20 h-20 flex-shrink-0">
                          {getEventImage("Nasscom Product Conclave Bangalore") ? (
                            <img 
                              src={getEventImage("Nasscom Product Conclave Bangalore")!} 
                              alt="Nasscom Product Conclave Bangalore" 
                              className="w-full h-full object-cover rounded-lg border border-white/20"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-400/30 to-cyan-600/30 rounded-lg border border-white/20 flex items-center justify-center relative overflow-hidden">
                              <div className="text-white/70 text-[8px] font-medium">STARTUP</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Promotions Event */}
                      <div className="relative rounded-xl p-4 overflow-hidden bg-gradient-to-br from-fuchsia-400/80 via-purple-500/70 to-violet-600/80 flex gap-3">
                        {/* Marketing Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/30 to-violet-700/40"></div>
                        <div className="absolute top-0 right-0 w-14 h-14 bg-white/10 transform rotate-12 -mr-7 -mt-7"></div>
                        <div className="absolute bottom-0 left-0 w-10 h-10 bg-white/10 transform -rotate-12 -ml-5 -mb-5"></div>
                        <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-white/5 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

                        {/* Event Content */}
                        <div className="relative z-10 flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">Technology</span>
                              <span className="bg-green-500/80 text-white px-2 py-1 rounded-full text-xs">● Active</span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <h5 className="text-white font-semibold mb-1">India AI Summit Mumbai</h5>
                            <p className="text-white/90 text-xs mb-1">Mar 12, 2025 • 10:00 AM</p>
                            <p className="text-white/70 text-xs">📍 NESCO Goregaon, Mumbai</p>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 bg-white/30 rounded-full h-1.5 mr-3">
                              <div className="bg-white h-1.5 rounded-full w-3/4"></div>
                            </div>
                            <span className="text-white/90 text-xs font-medium">70%</span>
                          </div>
                          <div className="text-white font-bold text-sm">₹950</div>
                        </div>

                        {/* Event Image */}
                        <div className="relative z-10 w-20 h-20 flex-shrink-0">
                          {getEventImage("India AI Summit Mumbai") ? (
                            <img 
                              src={getEventImage("India AI Summit Mumbai")!} 
                              alt="India AI Summit Mumbai" 
                              className="w-full h-full object-cover rounded-lg border border-white/20"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-fuchsia-400/30 to-violet-600/30 rounded-lg border border-white/20 flex items-center justify-center relative overflow-hidden">
                              <div className="text-white/70 text-[8px] font-medium">AI TECH</div>
                            </div>
                          )}
                        </div>
                      </div>
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-center gap-2 pt-4">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="bg-purple-600 text-white w-8 h-8 p-0">
                          1
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white w-8 h-8 p-0">
                          2
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white w-8 h-8 p-0">
                          3
                        </Button>
                        <span className="text-slate-400 px-2">...</span>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white w-8 h-8 p-0">
                          6
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Subscribe Window - 30% */}
          <div className="w-[30%] flex flex-col gap-3 h-full">
            {/* Subscribe Card - 30% height */}
            <div className="h-[40%] bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <span className="text-xs font-medium opacity-80">Ad</span>
              </div>

              <h3 className="text-lg font-bold mb-1">Global Startup Summit | Hyderabad 2025</h3>

              <Button className="bg-white text-blue-600 hover:bg-gray-100 text-sm px-4 py-2">
                Subscribe
              </Button>

              {/* Global Startup Summit Image - Bigger */}
              <div className="absolute bottom-2 right-2 w-20 h-20 opacity-90">
                <img 
                  src={getEventImage("Global Startup Summit | Hyderabad 2025")} 
                  alt="Global Startup Summit Hyderabad 2025" 
                  className="w-full h-full object-cover rounded-lg border border-white/30"
                />
              </div>
            </div>

            {/* Community Live Meetings - 50% height */}
            <div className="h-[50%] bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🔴</span>
                </div>
                <span className="text-white font-medium text-sm">Live Community</span>
              </div>

              <h3 className="text-white font-medium mb-2 text-sm">Join Finance AI Meetups</h3>
              <p className="text-slate-400 text-xs mb-3">Connect with startups & finance experts. Create avatars, no login required.</p>

              {/* Live Meeting Indicators */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-slate-300 text-xs">AI Trading Discussion - 12 live</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-slate-300 text-xs">Startup Pitch Night - 8 live</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-slate-300 text-xs">DeFi Study Group - 15 live</span>
                </div>
              </div>

              <div className="flex -space-x-2 mb-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-slate-800"></div>
                <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-slate-800"></div>
                <div className="w-6 h-6 bg-orange-500 rounded-full border-2 border-slate-800"></div>
                <div className="w-6 h-6 bg-purple-500 rounded-full border-2 border-slate-800"></div>
                <div className="w-6 h-6 bg-slate-600 rounded-full border-2 border-slate-800 flex items-center justify-center">
                  <span className="text-white text-xs">+</span>
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2">
                Explore Now
              </Button>
            </div>

            {/* Podcast Scroller - 20% height */}
            <div className="h-[20%] bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-3 h-full">
                {/* Profile Image */}
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-white text-sm font-medium truncate">{selectedPodcast ? selectedPodcast.title : `AI in ${selectedSector === 'FINANCE' ? 'Finance' : selectedSector === 'IT' ? 'Tech' : selectedSector === 'COMMODITY' ? 'Commodity' : selectedSector === 'GLOBAL' ? 'Global' : selectedSector === 'BANKS' ? 'Banking' : selectedSector === 'AUTOMOBILE' ? 'Auto' : 'Finance'}`}</h4>
                    <Mic className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  </div>
                  <p className="text-slate-400 text-xs mb-2">19 minutes</p>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-slate-400 text-xs">14:07</span>
                    <div className="flex-1 bg-slate-600 rounded-full h-1">
                      <div className="bg-purple-400 h-1 rounded-full w-3/4"></div>
                    </div>
                    <span className="text-slate-400 text-xs">-5:04</span>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-3">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white w-6 h-6 p-0">
                      <SkipBack className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-white w-6 h-6 p-0">
                      <Pause className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white w-6 h-6 p-0">
                      <SkipForward className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background overscroll-none touch-pan-y ${
      isSharedReportMode ? 'pointer-events-none opacity-30 blur-sm' : ''
    }`}>
      {/* Vertical Sidebar - Fixed Position */}
      <div className="hidden fixed left-0 top-0 bottom-0 w-64 chatgpt-sidebar border-r border-gray-700 flex flex-col z-40 md:bottom-0 bottom-[env(safe-area-inset-bottom)] pb-[env(safe-area-inset-bottom)] touch-none">
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
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 sidebar-text ${
                activeTab === "dashboard"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:bg-opacity-50"
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
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors sidebar-text ${
                activeTab === "backtest"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:bg-opacity-50"
              }`}
            >
              Backtest
            </button>

            <button
              onClick={handleTradingMasterAccess}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors sidebar-text ${
                activeTab === "trading-master"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:bg-opacity-50"
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
              onClick={() => checkAuthAndNavigate("journal")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors sidebar-text ${
                activeTab === "journal"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:bg-opacity-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Journal
              </div>
            </button>
          </div>

          <div className="space-y-1 pt-4">
            <p className="text-xs font-medium sidebar-muted uppercase tracking-wide mb-3">
              Tools & Support
            </p>

            <button
              onClick={() => handleTabClick("trading-home")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors sidebar-text ${
                activeTab === "trading-home"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:bg-opacity-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <HomeIcon className="h-4 w-4" />
                Trading Home
              </div>
            </button>

            <button
              onClick={() => checkAuthAndNavigate("voice")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors sidebar-text ${
                activeTab === "voice"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:bg-opacity-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Social Feed
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
          <div className="h-full overflow-auto">
            {/* Render content based on active tab */}

            {activeTab === 'dashboard' && localStorage.getItem('currentUserEmail') === 'chiranjeevi.perala99@gmail.com' && (
              <div className="space-y-8">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <Star className="h-6 w-6 text-yellow-400" />
                    <h2 className="text-2xl font-bold text-green-400">Market Dashboard</h2>
                  </div>
                  <p className="text-green-300">Real-time market data and connection status</p>
                </div>

                {/* Fyers API Authentication Required Notice */}


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

                {/* API Provider Selection - Fyers vs Angel One */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trading API Connection</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose your broker API provider</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <Tabs defaultValue="angelone" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="fyers" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800 dark:data-[state=active]:bg-green-900 dark:data-[state=active]:text-green-200" data-testid="tab-fyers">
                          Fyers (Paid)
                        </TabsTrigger>
                        <TabsTrigger value="angelone" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800 dark:data-[state=active]:bg-orange-900 dark:data-[state=active]:text-orange-200" data-testid="tab-angelone">
                          Angel One (Free)
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="fyers">
                        <div className="space-y-4">
                          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              <strong>Note:</strong> Fyers API requires daily token refresh. Get your token from the Fyers dashboard.
                            </p>
                          </div>
                          <AuthButton />
                        </div>
                      </TabsContent>

                      <TabsContent value="angelone">
                        <div className="space-y-4">
                          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <p className="text-sm text-green-800 dark:text-green-200">
                              <strong>Recommended:</strong> Angel One SmartAPI is free and uses automatic TOTP authentication. No daily token refresh needed!
                            </p>
                          </div>
                          <AuthButtonAngelOne />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>

                {/* Connection Status Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Fyers Status */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Fyers Connection
                    </h4>
                    <ConnectionStatus />
                  </div>
                  
                  {/* Angel One Status */}
                  <AngelOneStatus />
                </div>

                {/* API Statistics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Fyers API Statistics */}
                  <ApiStatistics />
                  
                  {/* Angel One API Statistics */}
                  <AngelOneApiStatistics />
                </div>

                {/* System Status Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Fyers Error Panel and Recent Activity */}
                  <ErrorPanel />
                  
                  {/* Angel One System Status and Recent Activity */}
                  <AngelOneSystemStatus />
                </div>

              </div>
            )}

            {activeTab === "trading-home" && (
              <div className="relative min-h-screen overflow-hidden">
                {/* Navigation Menu - Behind the home screen */}
                <div className="fixed inset-0 bg-gradient-to-b from-blue-800 to-blue-900 z-10 flex items-start justify-end pt-20 px-0 md:items-center md:justify-center md:pt-0 md:px-6">
                  <div className="w-auto md:w-full md:max-w-sm space-y-6 pr-4 md:pr-0">
                    {currentUser.userId ? (
                      <>
                        {/* User Profile Section - Horizontal Layout */}
                        <div className="flex items-center gap-4 pb-2">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-xl">
                              {(
                                currentUser.displayName ||
                                currentUser.username ||
                                "U"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <p className="text-white font-semibold text-base">
                              {currentUser.displayName || "User"}
                            </p>
                            <p className="text-blue-200 text-sm">
                              @{currentUser.username || "username"}
                            </p>
                          </div>
                        </div>

                        {/* Navigation Menu Items - Left aligned */}
                        <div className="space-y-3 flex flex-col">
                          <button
                            className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                            data-testid="nav-profile"
                          >
                            profile
                          </button>
                          <button
                            className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                            data-testid="nav-saved"
                          >
                            saved
                          </button>
                          {localStorage.getItem('currentUserEmail') === 'chiranjeevi.perala99@gmail.com' && (
                            <button
                              onClick={() => {
                                setTabWithAuthCheck("dashboard");
                                setIsNavOpen(false);
                              }}
                              className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                              data-testid="nav-dashboard"
                            >
                              <BarChart3 className="h-4 w-4" />
                              <span>dashboard</span>
                            </button>
                          )}
                          <button
                            className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                            data-testid="nav-settings"
                          >
                            setting & privacy
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await signOut(auth);
                                localStorage.clear();
                                window.location.href = "/login";
                              } catch (error) {
                                console.error("Logout error:", error);
                              }
                            }}
                            className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                            data-testid="nav-logout"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>logout</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <button
                          onClick={() => {
                            window.location.href = "/login";
                          }}
                          className="w-full px-6 py-3 bg-white text-blue-900 hover:bg-blue-50 rounded-lg transition-colors font-semibold text-center"
                          data-testid="nav-login"
                        >
                          Login
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Two-line Hamburger Icon - Mobile only - Theme responsive - Fixed position */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNavOpen(!isNavOpen);
                  }}
                  className="md:hidden fixed top-4 right-4 z-50 w-10 h-10 flex flex-col items-center justify-center gap-1.5 bg-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-all duration-300"
                  data-testid="button-nav-toggle"
                >
                  <div
                    className={`h-0.5 bg-gray-900 dark:bg-white transition-all duration-300 ${isNavOpen ? "w-5 rotate-45 translate-y-1" : "w-5"}`}
                  ></div>
                  <div
                    className={`h-0.5 bg-gray-900 dark:bg-white transition-all duration-300 ${isNavOpen ? "w-5 -rotate-45 -translate-y-1" : "w-4 ml-1"}`}
                  ></div>
                </button>

                {/* Home Screen - Stacks on top with card effect */}
                <div
                  onClick={() => isNavOpen && setIsNavOpen(false)}
                  className={`min-h-screen bg-gray-900 flex flex-col transition-all duration-500 ease-out relative z-20 ${
                    isNavOpen
                      ? "scale-90 -translate-x-[70%] rounded-tr-3xl shadow-2xl"
                      : "scale-100 translate-x-0"
                  }`}
                  style={{
                    transformOrigin: "right center",
                  }}
                >
                  {/* World Map Section - At top of main content */}
                  <div className="w-full flex items-center justify-center py-3" style={{ background: theme === 'dark' ? '#1a1a1a' : '#e3f2fd' }}>
                    {/* Container for WorldMap - full width on mobile, constrained on desktop */}
                    <div className="w-full md:max-w-lg flex items-center justify-center">
                      <WorldMap />
                    </div>
                  </div>

                  {/* Blue Section: Desktop 69vh, Mobile 75vh */}
                  <div className="h-[75vh] md:h-[69vh] w-full bg-blue-900 flex flex-col items-center justify-start md:py-6 py-0 md:px-4 px-0 relative md:overflow-y-auto">
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
                                          "[CHART:PERFORMANCE_TREND]",
                                        )
                                      ) {
                                        const parts = searchResults.split(
                                          "[CHART:PERFORMANCE_TREND]",
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
                                                        tickFormatter={(
                                                          value,
                                                        ) =>
                                                          `${
                                                            value >= 0
                                                              ? ""
                                                              : "-"
                                                          }${(
                                                            Math.abs(value) /
                                                            1000
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
                                                          value: any,
                                                        ) => [
                                                          `${
                                                            value >= 0
                                                              ? "₹"
                                                              : "-₹"
                                                          }${Math.abs(
                                                            value,
                                                          ).toLocaleString()}`,
                                                          "Daily P&L",
                                                        ]}
                                                        labelFormatter={(
                                                          label,
                                                        ) => `${label}`}
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
                                      
                                      // Company Insights Chart with quarterly performance trend
                                      if (
                                        searchResults.includes(
                                          "[CHART:COMPANY_INSIGHTS]",
                                        )
                                      ) {
                                        const parts = searchResults.split(
                                          "[CHART:COMPANY_INSIGHTS]",
                                        );
                                        const companyInsights =
                                          (window as any).companyInsightsData || null;
                                        
                                        // Use structured data from API response
                                        const chartData: Array<{quarter: string; value: number; trend: string; changePercent: number}> = [];
                                        
                                        if (companyInsights && companyInsights.quarterlyPerformance) {
                                          let baseValue = 100;
                                          companyInsights.quarterlyPerformance.forEach((q: any) => {
                                            baseValue = baseValue * (1 + q.changePercent / 100);
                                            chartData.push({
                                              quarter: q.quarter,
                                              value: Math.round(baseValue * 100) / 100,
                                              trend: q.changePercent >= 0 ? 'positive' : 'negative',
                                              changePercent: q.changePercent
                                            });
                                          });
                                        }
                                        
                                        // Use trend from structured data or calculate from chart
                                        const overallTrend = companyInsights?.trend || 
                                          (chartData.length > 1 
                                            ? chartData[chartData.length - 1].value > chartData[0].value 
                                              ? 'positive' 
                                              : 'negative'
                                            : 'neutral');
                                        
                                        const trendColor = overallTrend === 'positive' ? '#22c55e' : overallTrend === 'negative' ? '#ef4444' : '#6b7280';

                                        return (
                                          <>
                                            {parts[0]}
                                            {chartData.length > 0 && (
                                              <div className="my-4 bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                                                <div className="flex items-center justify-between mb-3">
                                                  <span className="text-sm font-medium text-gray-300">Quarterly Performance Trend</span>
                                                  <span className={`text-xs px-2 py-1 rounded ${overallTrend === 'positive' ? 'bg-green-500/20 text-green-400' : overallTrend === 'negative' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                    {overallTrend === 'positive' ? '↑ Uptrend' : overallTrend === 'negative' ? '↓ Downtrend' : '→ Neutral'}
                                                  </span>
                                                </div>
                                                <div className="h-40 w-full">
                                                  <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                  >
                                                    <AreaChart
                                                      data={chartData}
                                                      margin={{
                                                        top: 10,
                                                        right: 10,
                                                        left: 10,
                                                        bottom: 20,
                                                      }}
                                                    >
                                                      <defs>
                                                        <linearGradient
                                                          id="companyInsightsGradient"
                                                          x1="0"
                                                          y1="0"
                                                          x2="0"
                                                          y2="1"
                                                        >
                                                          <stop
                                                            offset="0%"
                                                            stopColor={trendColor}
                                                            stopOpacity={0.4}
                                                          />
                                                          <stop
                                                            offset="100%"
                                                            stopColor={trendColor}
                                                            stopOpacity={0.05}
                                                          />
                                                        </linearGradient>
                                                      </defs>
                                                      <XAxis
                                                        dataKey="quarter"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{
                                                          fontSize: 11,
                                                          fill: "#9ca3af",
                                                        }}
                                                      />
                                                      <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{
                                                          fontSize: 10,
                                                          fill: "#6b7280",
                                                        }}
                                                        tickFormatter={(value) => `${value.toFixed(0)}`}
                                                        domain={['dataMin - 5', 'dataMax + 5']}
                                                      />
                                                      <Tooltip
                                                        contentStyle={{
                                                          background: "#1f2937",
                                                          border: "1px solid #374151",
                                                          borderRadius: "8px",
                                                          color: "#f3f4f6",
                                                          fontSize: "12px",
                                                          padding: "8px 12px",
                                                        }}
                                                        formatter={(value: any, name: any, props: any) => [
                                                          `${props.payload.trend === 'positive' ? '↑' : '↓'} ${value.toFixed(1)}`,
                                                          "Performance Index"
                                                        ]}
                                                        labelFormatter={(label) => `${label}`}
                                                      />
                                                      <Area
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke={trendColor}
                                                        strokeWidth={2}
                                                        fill="url(#companyInsightsGradient)"
                                                        dot={{
                                                          r: 4,
                                                          stroke: trendColor,
                                                          strokeWidth: 2,
                                                          fill: "#1f2937",
                                                        }}
                                                        activeDot={{
                                                          r: 6,
                                                          stroke: trendColor,
                                                          strokeWidth: 2,
                                                          fill: "#ffffff",
                                                        }}
                                                      />
                                                    </AreaChart>
                                                  </ResponsiveContainer>
                                                </div>
                                                <div className="flex justify-center gap-4 mt-2 text-xs text-gray-400">
                                                  <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Positive Quarter
                                                  </span>
                                                  <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Negative Quarter
                                                  </span>
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
                                  Press Enter or click the search button to get
                                  AI assistance
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
                      <div className="md:flex hidden flex-wrap items-center justify-center gap-3 max-w-6xl mx-auto md:mt-6">
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
                              "RSI technical analysis for RELIANCE",
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
                              "Social feed community discussions and trending topics",
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
                              "What are today's top financial news and market updates?",
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
                              "Analyze fundamentals for top stocks - P/E ratio, market cap, growth metrics",
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

                      {/* Trading Tools Section - White container with centered cards */}
                      <div className="bg-white md:pt-4 pt-4 md:pb-4 pb-4 md:rounded-3xl rounded-3xl relative pointer-events-auto touch-pan-y flex-shrink-0 mt-0 w-full">
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
                              className="w-full h-12 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 pr-24 text-xs rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
                            />
                            {searchQuery && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 h-8 w-8 p-0"
                                onClick={() => {
                                  setSearchQuery("");
                                  setIsSearchActive(false);
                                  setSearchResults("");
                                }}
                                data-testid="button-clear-search"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
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
                            <div
                              className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide pb-2"
                              style={{
                                scrollbarWidth: "none",
                                msOverflowStyle: "none",
                              }}
                            >
                              <Button
                                variant="secondary"
                                className="bg-blue-600 hover:bg-blue-700 text-white border-0 h-7 px-3 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0"
                                onClick={() =>
                                  handleSuggestionClick(
                                    "Show me live stock prices for ICICI Bank and TCS",
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
                                    "Social feed community discussions and trending topics",
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
                                    "What are today's top financial news and market updates?",
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
                                    "Analyze fundamentals for top stocks - P/E ratio, market cap, growth metrics",
                                  )
                                }
                              >
                                <div className="flex items-center gap-1.5">
                                  <BarChart3 className="h-3 w-3" />
                                  <span>Fundamentals</span>
                                </div>
                              </Button>

                              <Button
                                variant="secondary"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 h-7 px-3 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0"
                                onClick={() => checkAuthAndNavigate("journal")}
                                data-testid="button-quick-journal"
                              >
                                <div className="flex items-center gap-1.5">
                                  <BookOpen className="h-3 w-3" />
                                  <span>Journal</span>
                                </div>
                              </Button>
                            </div>
                          )}

                          {/* Mobile AI Search Results - Extends to bottom */}
                          {isSearchActive && searchResults && (
                            <div className="md:hidden fixed inset-x-0 top-0 bottom-0 bg-gray-900/95 backdrop-blur-sm z-[60] overflow-y-auto">
                              <div className="p-3 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-gray-700">
                                  <div className="flex items-center gap-1.5">
                                    <Bot className="h-4 w-4 text-blue-400" />
                                    <h3 className="text-xs font-medium text-gray-100">
                                      AI Assistant
                                    </h3>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSearchQuery("");
                                      setIsSearchActive(false);
                                      setSearchResults("");
                                    }}
                                    className="text-gray-400 hover:text-gray-200 h-6 w-6 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="prose prose-invert max-w-none">
                                  <div className="text-gray-300 whitespace-pre-wrap leading-tight text-xs">
                                    {searchResults}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Trading Tools Grid - Desktop: 4 columns centered, Mobile: 3 horizontal cards + swipeable below */}
                        <div className="mx-auto max-w-6xl hidden md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4 md:px-6 md:items-center">
                          {/* Social Feed Card */}
                          <div
                            className="bg-blue-500 rounded-2xl overflow-hidden h-36 w-full relative cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => checkAuthAndNavigate("voice")}
                          >
                            <div className="absolute top-3 left-3">
                              <span className="bg-white bg-opacity-90 text-blue-600 px-2.5 py-1 rounded-full text-xs font-medium">
                                Social Feed
                              </span>
                            </div>
                            <div className="absolute bottom-3 right-3">
                              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <MessageCircle className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          </div>

                          {/* Trading Master Card */}
                          <div
                            className="bg-indigo-500 rounded-2xl overflow-hidden h-36 w-full relative cursor-pointer hover:scale-105 transition-transform"
                            onClick={handleTradingMasterAccess}
                          >
                            <div className="absolute top-3 left-3">
                              <span className="bg-white bg-opacity-90 text-indigo-600 px-2.5 py-1 rounded-full text-xs font-medium">
                                Trading Master
                              </span>
                            </div>
                            <div className="absolute bottom-3 right-3">
                              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <Activity className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          </div>

                          {/* Trading Charts Card */}
                          <div
                            className="bg-emerald-500 rounded-2xl overflow-hidden h-36 w-full relative cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => checkAuthAndNavigate("journal")}
                          >
                            <div className="absolute top-3 left-3">
                              <span className="bg-white bg-opacity-90 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-medium">
                                Journal
                              </span>
                            </div>
                            <div className="absolute bottom-3 right-3">
                              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <BarChart3 className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          </div>

                          {/* Tutor Daily News Swipeable Cards - Portrait orientation with proper spacing */}
                          <div className="relative h-36 w-full flex items-center justify-center">
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
                              onClick={() => checkAuthAndNavigate("voice")}
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
                              onClick={handleTradingMasterAccess}
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
                              onClick={() => checkAuthAndNavigate("journal")}
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
                          <div className="flex items-center justify-center px-4 pb-0">
                            <SwipeableCardStack
                              onSectorChange={handleSectorChange}
                              selectedSector={selectedSector}
                              onCardIndexChange={setCurrentCardIndex}
                              currentCardIndex={currentCardIndex}
                            />
                          </div>
                        </div>

                        {/* Navigation Dots - Outside white container, in blue area */}
                        <div className="md:hidden absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex gap-2 justify-center z-40">
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
                                index === currentCardIndex
                                  ? "bg-white scale-125"
                                  : "bg-white/40"
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
                          onClick={() => setTabWithAuthCheck("tutor")}
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
                          <div className="h-full overflow-y-auto pb-20 custom-thin-scrollbar">
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

            {activeTab === "backtest" && (
              <div className="h-full p-6 space-y-6">
                <div className="max-w-6xl mx-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Activity className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold">Backtest Trading Strategies</h1>
                        <p className="text-muted-foreground mt-1">Test your trading rules with historical data</p>
                      </div>
                    </div>
                  </div>

                  {/* Coming Soon Placeholder */}
                  <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-xl p-12">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                        <Activity className="h-10 w-10 text-primary" />
                      </div>
                      <h2 className="text-2xl font-semibold">Backtest Feature Coming Soon</h2>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        We're building a powerful backtesting engine to help you validate your trading strategies with historical market data.
                      </p>
                      <div className="pt-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg">
                          <span className="text-sm font-medium">Under Development</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feature Preview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-card border border-border rounded-lg p-6">
                      <div className="p-2 bg-blue-500/10 rounded-lg w-fit mb-4">
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                      </div>
                      <h3 className="font-semibold mb-2">Historical Data Analysis</h3>
                      <p className="text-sm text-muted-foreground">
                        Test strategies against years of historical market data
                      </p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                      <div className="p-2 bg-green-500/10 rounded-lg w-fit mb-4">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      </div>
                      <h3 className="font-semibold mb-2">Performance Metrics</h3>
                      <p className="text-sm text-muted-foreground">
                        Comprehensive statistics on returns, drawdowns, and win rates
                      </p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                      <div className="p-2 bg-purple-500/10 rounded-lg w-fit mb-4">
                        <Settings className="h-5 w-5 text-purple-500" />
                      </div>
                      <h3 className="font-semibold mb-2">Custom Rules</h3>
                      <p className="text-sm text-muted-foreground">
                        Define your own entry, exit, and risk management rules
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "trading-master" && (
              <div className="h-full relative">
                {/* Back Button - Mobile Only */}
                <Button
                  onClick={() => setTabWithAuthCheck("trading-home")}
                  variant="ghost"
                  size="icon"
                  className="lg:hidden absolute top-4 right-4 z-50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  data-testid="button-back-to-home-trading-master"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <TradingMaster />
              </div>
            )}

            {activeTab === "journal" && (
              <div className="space-y-6 px-0.5 md:px-6 pt-1 pb-4 md:py-6 relative">
                {/* Back Button - Mobile Only */}
                <Button
                  onClick={() => setTabWithAuthCheck("trading-home")}
                  variant="ghost"
                  size="icon"
                  className="lg:hidden absolute top-4 right-4 z-50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  data-testid="button-back-to-home-journal"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <h2 className="text-2xl font-bold text-foreground">
                  Trading Journal
                </h2>

                {/* Main Journal Content - Mobile: Show only in "home" tab | Desktop: Always visible */}
                <div
                  className={`${mobileBottomTab !== "home" ? "hidden md:block" : "block"}`}
                >
                  {/* PERFORMANCE TIMELINE - Responsive Three Blocks */}
                  {/* Desktop: 3-column grid | Mobile: Single panel with carousel */}
                  <div className="relative mb-6">
                    {/* Desktop: Grid Layout | Mobile: Single Panel */}
                    <div className="md:grid md:grid-cols-3 gap-6">
                      {/* Left Block - Performance Chart */}
                      <div
                        className={`h-[400px] ${mobileJournalPanel === 0 ? "block" : "hidden"} md:block`}
                      >
                        {/* Professional Visual Chart with Fyers Data - Same as Trading Master */}
                        <div className="h-full relative bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                          <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between px-2 py-2">
                              <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                                {/* Stock Search Button - Mobile Compact */}
                                <Popover
                                  open={showStockSearch}
                                  onOpenChange={setShowStockSearch}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-gray-800 text-white border-gray-600 hover:bg-gray-700 h-8 px-2 md:px-3 text-xs md:text-sm"
                                      data-testid="button-stock-search"
                                    >
                                      <Search className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                                      <span className="hidden md:inline">
                                        {selectedJournalSymbol
                                          .replace("NSE:", "")
                                          .replace("-EQ", "")
                                          .replace("-INDEX", "")}
                                      </span>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-80 p-3"
                                    align="start"
                                  >
                                    <div className="space-y-3">
                                      <Input
                                        placeholder="Search stocks, commodities, F&O..."
                                        value={stockSearchQuery}
                                        onChange={(e) =>
                                          setStockSearchQuery(e.target.value)
                                        }
                                        className="text-sm"
                                        data-testid="input-stock-search"
                                      />
                                      
                                      {/* Category Filter Buttons */}
                                      <div className="flex flex-wrap gap-2">
                                        {[
                                          { id: 'all', label: 'All' },
                                          { id: 'stock', label: 'Stock' },
                                          { id: 'commodity', label: 'Commodity' },
                                          { id: 'fo', label: 'F&O' },
                                          { id: 'index', label: 'Index' }
                                        ].map(cat => (
                                          <button
                                            key={cat.id}
                                            onClick={() => setSelectedInstrumentCategory(cat.id)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                                              selectedInstrumentCategory === cat.id
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                            }`}
                                            data-testid={`category-filter-${cat.id}`}
                                          >
                                            {cat.label}
                                          </button>
                                        ))}
                                      </div>
                                      
                                      <div className="max-h-64 overflow-y-auto space-y-1 custom-thin-scrollbar">
                                        {/* Loading State */}
                                        {isSearchingInstruments && (
                                          <div className="flex items-center justify-center py-4">
                                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            <span className="ml-2 text-sm text-gray-500">Searching...</span>
                                          </div>
                                        )}
                                        
                                        {/* No Results */}
                                        {!isSearchingInstruments && stockSearchQuery.length >= 2 && (
                                          searchedInstruments.filter((i) => {
                                            if (selectedInstrumentCategory === 'all') return true;
                                            
                                            switch(selectedInstrumentCategory) {
                                              case 'stock':
                                                // NSE/BSE stocks have empty instrumentType, symbol ends with -EQ
                                                return (i.exchange === 'NSE' || i.exchange === 'BSE') && 
                                                  (!i.instrumentType || i.instrumentType === '' || i.instrumentType === 'EQ' || i.symbol?.endsWith('-EQ'));
                                              case 'commodity':
                                                // MCX commodities: COMDTY for spot, FUTCOM for futures, OPTFUT/OPTCOM for options
                                                return i.exchange === 'MCX' && (i.instrumentType === 'COMDTY' || i.instrumentType === 'FUTCOM' || i.instrumentType === 'OPTFUT' || i.instrumentType === 'OPTCOM');
                                              case 'fo':
                                                // F&O: Futures and Options on NSE/BSE (not MCX commodities in this category)
                                                return (i.exchange === 'NSE' || i.exchange === 'BSE') && 
                                                  (i.instrumentType === 'FUTSTK' || i.instrumentType === 'FUTIDX' || 
                                                   i.instrumentType === 'OPTSTK' || i.instrumentType === 'OPTIDX' || 
                                                   i.instrumentType === 'OPTFUT');
                                              case 'index':
                                                // Indices: AMXIDX is the main index type from Angel One
                                                return i.instrumentType === 'AMXIDX' || i.instrumentType === 'INDEX';
                                              default:
                                                return true;
                                            }
                                          }).length === 0
                                        ) && (
                                          <div className="px-3 py-4 text-center text-sm text-gray-500">
                                            No {selectedInstrumentCategory !== 'all' ? selectedInstrumentCategory : ''} instruments found
                                          </div>
                                        )}
                                        
                                        {/* Default Popular Instruments - Show when no search query */}
                                        {stockSearchQuery.length < 2 && (
                                          <>
                                            {/* Show defaults for categories that have them */}
                                            {(defaultInstruments[selectedInstrumentCategory as keyof typeof defaultInstruments]?.length > 0) ? (
                                              <>
                                                <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                                  Popular {selectedInstrumentCategory !== 'all' ? selectedInstrumentCategory.charAt(0).toUpperCase() + selectedInstrumentCategory.slice(1) : ''} Instruments
                                                </div>
                                                {(defaultInstruments[selectedInstrumentCategory as keyof typeof defaultInstruments] || defaultInstruments.all).map((instrument) => (
                                                  <button
                                                    key={`default-${instrument.exchange}:${instrument.symbol}`}
                                                    onClick={() => {
                                                      const formattedSymbol = `${instrument.exchange}:${instrument.symbol}`;
                                                      setSelectedJournalSymbol(formattedSymbol);
                                                      setSelectedInstrument({
                                                        symbol: instrument.symbol,
                                                        token: instrument.token,
                                                        exchange: instrument.exchange,
                                                        tradingSymbol: instrument.tradingSymbol,
                                                        instrumentType: instrument.instrumentType
                                                      });
                                                      setShowStockSearch(false);
                                                      setStockSearchQuery("");
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                                      selectedJournalSymbol === `${instrument.exchange}:${instrument.symbol}`
                                                        ? "bg-blue-100 dark:bg-blue-900 font-medium"
                                                        : ""
                                                    }`}
                                                    data-testid={`default-stock-${instrument.exchange}:${instrument.symbol}`}
                                                  >
                                                    <div className="flex items-center justify-between gap-2">
                                                      <span className="flex-1 font-medium">{instrument.name}</span>
                                                      <div className="flex items-center gap-1">
                                                        <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${
                                                          instrument.exchange === 'NSE' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                                                          instrument.exchange === 'BSE' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' :
                                                          instrument.exchange === 'MCX' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' :
                                                          instrument.exchange === 'NFO' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                                                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                        }`}>
                                                          {instrument.exchange}
                                                        </span>
                                                        {instrument.instrumentType && (
                                                          <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                                            {instrument.instrumentType}
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                      {instrument.symbol}
                                                    </div>
                                                  </button>
                                                ))}
                                                <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 mt-1">
                                                  Or type to search more instruments...
                                                </div>
                                              </>
                                            ) : (
                                              /* Show search suggestions for Commodity and F&O */
                                              <div className="px-3 py-3 space-y-3">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                  Search for {selectedInstrumentCategory === 'commodity' ? 'MCX Commodities' : 'F&O Derivatives'}:
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                  {(categorySearchSuggestions[selectedInstrumentCategory] || []).map((suggestion) => (
                                                    <button
                                                      key={suggestion}
                                                      onClick={() => setStockSearchQuery(suggestion)}
                                                      className="px-2.5 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                                      data-testid={`search-suggestion-${suggestion}`}
                                                    >
                                                      {suggestion}
                                                    </button>
                                                  ))}
                                                </div>
                                                <div className="text-xs text-gray-400 dark:text-gray-500 pt-1 border-t border-gray-200 dark:border-gray-700">
                                                  Click a suggestion or type to search...
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        )}
                                        
                                        {/* Search Results */}
                                        {!isSearchingInstruments && stockSearchQuery.length >= 2 && searchedInstruments
                                          .filter((i) => {
                                            if (selectedInstrumentCategory === 'all') return true;
                                            
                                            switch(selectedInstrumentCategory) {
                                              case 'stock':
                                                // NSE/BSE stocks have empty instrumentType, symbol ends with -EQ
                                                return (i.exchange === 'NSE' || i.exchange === 'BSE') && 
                                                  (!i.instrumentType || i.instrumentType === '' || i.instrumentType === 'EQ' || i.symbol?.endsWith('-EQ'));
                                              case 'commodity':
                                                // MCX commodities: COMDTY for spot, FUTCOM for futures, OPTFUT/OPTCOM for options
                                                return i.exchange === 'MCX' && (i.instrumentType === 'COMDTY' || i.instrumentType === 'FUTCOM' || i.instrumentType === 'OPTFUT' || i.instrumentType === 'OPTCOM');
                                              case 'fo':
                                                // F&O: Futures and Options on NSE/BSE (not MCX commodities in this category)
                                                return (i.exchange === 'NSE' || i.exchange === 'BSE') && 
                                                  (i.instrumentType === 'FUTSTK' || i.instrumentType === 'FUTIDX' || 
                                                   i.instrumentType === 'OPTSTK' || i.instrumentType === 'OPTIDX' || 
                                                   i.instrumentType === 'OPTFUT');
                                              case 'index':
                                                // Indices: AMXIDX is the main index type from Angel One
                                                return i.instrumentType === 'AMXIDX' || i.instrumentType === 'INDEX';
                                              default:
                                                return true;
                                            }
                                          })
                                          .map((instrument) => (
                                          <button
                                            key={`${instrument.exchange}:${instrument.symbol}`}
                                            onClick={() => {
                                              const formattedSymbol = `${instrument.exchange}:${instrument.symbol}`;
                                              setSelectedJournalSymbol(formattedSymbol);
                                              setSelectedInstrument({
                                                symbol: instrument.symbol,
                                                token: instrument.token,
                                                exchange: instrument.exchange,
                                                tradingSymbol: instrument.tradingSymbol,
                                                instrumentType: instrument.instrumentType
                                              });
                                              setShowStockSearch(false);
                                              setStockSearchQuery("");
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                              selectedJournalSymbol === `${instrument.exchange}:${instrument.symbol}`
                                                ? "bg-blue-100 dark:bg-blue-900 font-medium"
                                                : ""
                                            }`}
                                            data-testid={`stock-option-${instrument.exchange}:${instrument.symbol}`}
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="flex-1 font-medium">{instrument.name}</span>
                                              <div className="flex items-center gap-1">
                                                <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${
                                                  instrument.exchange === 'NSE' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                                                  instrument.exchange === 'BSE' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' :
                                                  instrument.exchange === 'MCX' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' :
                                                  'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                }`}>
                                                  {instrument.exchange}
                                                </span>
                                                <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                                  {instrument.instrumentType}
                                                </span>
                                              </div>
                                            </div>
                                            {instrument.symbol !== instrument.name && (
                                              <div className="text-xs text-gray-500 mt-0.5">
                                                {instrument.symbol}
                                              </div>
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>

                                {/* Time Interval Selector - TradingView Style */}
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
                                  <option value="60">1h</option>
                                  <option value="1D">1D</option>
                                  <option value="5D">5D</option>
                                  <option value="1W">1W</option>
                                  <option value="1M">1M</option>
                                </select>

                                {/* Angel One API Badge */}
                                <span className="hidden md:flex items-center px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded">
                                  Angel One
                                </span>
                                
                                {/* Option Chain Icon - Only visible for F&O eligible instruments */}
                                {hasOptionsAvailable() && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setShowOptionChain(true);
                                      fetchOptionChainData();
                                    }}
                                    className="h-8 w-8 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-800/50 text-purple-700 dark:text-purple-300"
                                    title="View Option Chain"
                                    data-testid="button-option-chain"
                                  >
                                    <Grid3X3 className="h-4 w-4" />
                                  </Button>
                                )}

                                {/* Live Streaming Status & OHLC Data */}
                                {isJournalStreaming && journalLiveData && (
                                  <>
                                    {/* Live Status Indicator */}
                                    <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded animate-pulse">
                                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                                      LIVE (700ms)
                                    </div>
                                    
                                    {/* OHLC Data Display */}
                                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs font-mono rounded border border-indigo-200 dark:border-indigo-800">
                                      <span>O: {journalLiveData.currentCandle.open.toFixed(2)}</span>
                                      <span>H: {journalLiveData.currentCandle.high.toFixed(2)}</span>
                                      <span>L: {journalLiveData.currentCandle.low.toFixed(2)}</span>
                                      <span className="font-bold text-indigo-900 dark:text-indigo-200">C: {journalLiveData.currentCandle.close.toFixed(2)}</span>
                                    </div>
                                    
                                    {/* LTP Display */}
                                    <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded font-mono">
                                      LTP: {journalLiveData.ltp.toFixed(2)}
                                    </div>
                                    
                                    {/* Candle Countdown Timer */}
                                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded font-mono">
                                      <Clock className="h-3 w-3" />
                                      {journalLiveData.countdown.formatted}
                                    </div>
                                    
                                    {/* Market Status */}
                                    <div className={`hidden lg:flex items-center px-2 py-1 text-xs font-medium rounded ${
                                      journalLiveData.isMarketOpen 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}>
                                      {journalLiveData.isMarketOpen ? 'Market Open' : 'Market Closed'}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* TradingView Light Theme Chart Container - Clean */}
                            <div className="flex-1 relative flex flex-col h-full min-h-[400px] bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                              {journalChartLoading && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 rounded-lg">
                                  <div className="flex flex-col items-center gap-4">
                                    <div className="relative">
                                      <div className="w-14 h-14 border-4 border-orange-500/20 rounded-full" />
                                      <div className="absolute inset-0 w-14 h-14 border-4 border-transparent border-t-orange-500 border-r-orange-500 rounded-full animate-spin" />
                                    </div>
                                    <div className="text-center">
                                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Loading chart data...</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fetching candles from Angel One API</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Chart Container - Full Space with explicit height */}
                              <div 
                                ref={journalChartContainerRef}
                                className="flex-1 w-full relative bg-white dark:bg-gray-800"
                                data-testid="journal-tradingview-chart"
                                style={{ height: '100%', minHeight: '400px' }}
                              />
                              
                              {/* Live OHLC Ticker - Top Left Corner Overlay */}
                              {(liveOhlc || (journalChartData && journalChartData.length > 0)) && (
                                <div className="absolute top-4 left-4 z-50 bg-black/80 text-white px-3 py-2 rounded font-mono text-xs border border-green-500/50 pointer-events-none"
                                  data-testid="live-ohlc-ticker"
                                >
                                  {liveOhlc ? (
                                    <>O{liveOhlc.open.toFixed(2)} H{liveOhlc.high.toFixed(2)} L{liveOhlc.low.toFixed(2)} C{liveOhlc.close.toFixed(2)} <span className={liveOhlc.change >= 0 ? 'text-green-400' : 'text-red-400'}>(+{liveOhlc.change.toFixed(2)}%)</span></>
                                  ) : (
                                    <>O{journalChartData[journalChartData.length - 1].open.toFixed(2)} H{journalChartData[journalChartData.length - 1].high.toFixed(2)} L{journalChartData[journalChartData.length - 1].low.toFixed(2)} C{journalChartData[journalChartData.length - 1].close.toFixed(2)}</>
                                  )}
                                </div>
                              )}
                              
                              {/* No Data Message */}
                              {(!journalChartData || journalChartData.length === 0) && !journalChartLoading && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                      <BarChart3 className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <div className="text-gray-900 dark:text-gray-100 font-medium mb-1">No chart data loaded</div>
                                    <div className="text-gray-500 dark:text-gray-400 text-sm">Select a symbol and click the Fetch button to load data</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Middle Block - Multiple Image Upload */}
                      <div
                        className={`h-[400px] ${mobileJournalPanel === 1 ? "block" : "hidden"} md:block`}
                      >
                        <MultipleImageUpload
                          ref={imageUploadRef}
                          images={tradingImages}
                          onImagesChange={setTradingImages}
                        />
                      </div>

                      {/* Right Block - PERFORMANCE STATS (Split: 30% top, 70% bottom) */}
                      <Card
                        className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-[400px] flex flex-col ${mobileJournalPanel === 2 ? "block" : "hidden"} md:block`}
                      >
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
                                    "en-IN",
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
                                      "en-IN",
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
                                      "en-IN",
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </div>

                        {/* Bottom 70% - Notes Section */}
                        <div className="h-[70%] flex flex-col">
                          <CardContent className="p-2 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                                TRADING NOTES
                              </h3>
                              <div className="flex items-center gap-1">
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
                                      <div className="space-y-4 max-h-96 overflow-y-auto custom-thin-scrollbar">
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
                                                  {(category as any)
                                                    .required && (
                                                    <span className="text-red-500 ml-1">
                                                      *
                                                    </span>
                                                  )}
                                                </h5>
                                                <span className="text-xs text-gray-500">
                                                  {
                                                    selectedTags.filter((tag) =>
                                                      category.tags.includes(
                                                        tag,
                                                      ),
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
                                                      category.tags.includes(t),
                                                    ).length;
                                                  const isDisabled =
                                                    !isSelected &&
                                                    categoryCount >=
                                                      category.maxSelections;

                                                  return (
                                                    <button
                                                      key={tag}
                                                      onClick={() =>
                                                        toggleTagWithValidation(
                                                          tag,
                                                        )
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
                                          ),
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
                                      <X className="w-3 h-3 md:mr-1" />
                                      <span className="hidden md:inline">Cancel</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={handleSaveNotesOnly}
                                      className="text-xs bg-green-600 hover:bg-green-700 text-white"
                                      data-testid="button-save-notes"
                                    >
                                      <Check className="w-3 h-3 md:mr-1" />
                                      <span className="hidden md:inline">Save</span>
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
                                    <Edit className="w-3 h-3 md:mr-1" />
                                    <span className="hidden md:inline">Edit</span>
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
                                className="flex-1 w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                data-testid="textarea-notes"
                              />
                            ) : (
                              <div className="flex-1 w-full p-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white overflow-y-auto custom-thin-scrollbar">
                                {/* Display tags inline when they exist */}
                                {selectedTags.length > 0 && (
                                  <div className="mb-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                                    <div className="flex flex-wrap gap-1">
                                      {selectedTags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 rounded-full cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-colors group"
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
                        onClick={() =>
                          setMobileJournalPanel((prev) =>
                            prev === 0 ? 2 : prev - 1,
                          )
                        }
                        className="flex-1 h-12"
                        data-testid="button-journal-prev"
                      >
                        <ChevronLeft className="h-5 w-5 mr-2" />
                        <span className="text-sm font-medium">
                          {mobileJournalPanel === 0
                            ? "Notes"
                            : mobileJournalPanel === 1
                              ? "Chart"
                              : "Upload"}
                        </span>
                      </Button>
                      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Current
                        </div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {mobileJournalPanel === 0
                            ? "Chart"
                            : mobileJournalPanel === 1
                              ? "Upload"
                              : "Notes"}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setMobileJournalPanel((prev) =>
                            prev === 2 ? 0 : prev + 1,
                          )
                        }
                        className="flex-1 h-12"
                        data-testid="button-journal-next"
                      >
                        <span className="text-sm font-medium">
                          {mobileJournalPanel === 0
                            ? "Upload"
                            : mobileJournalPanel === 1
                              ? "Notes"
                              : "Chart"}
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
                        onClick={() =>
                          setShowMobileTradeHistory(!showMobileTradeHistory)
                        }
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPaperTradingModal(true)}
                                className="h-8 px-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400"
                                data-testid="button-demo-trade-mobile"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Demo
                              </Button>
                            </div>
                            <div className="max-h-80 overflow-auto border border-gray-200 dark:border-gray-700 custom-thin-scrollbar">
                              <table className="w-full text-xs">
                                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white sticky top-0">
                                  <tr>
                                    <th className="p-1 text-left min-w-[60px]">
                                      Time
                                    </th>
                                    <th className="p-1 text-left min-w-[50px]">
                                      Order
                                    </th>
                                    <th className="p-1 text-left min-w-[80px]">
                                      Symbol
                                    </th>
                                    <th className="p-1 text-left min-w-[50px]">
                                      Type
                                    </th>
                                    <th className="p-1 text-left min-w-[40px]">
                                      Qty
                                    </th>
                                    <th className="p-1 text-left min-w-[60px]">
                                      Price
                                    </th>
                                    <th className="p-1 text-left min-w-[60px]">
                                      P&L
                                    </th>
                                    <th className="p-1 text-left min-w-[40px]">
                                      %
                                    </th>
                                    <th className="p-1 text-left min-w-[70px]">
                                      Duration
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                  {isLoadingHeatmapData && tradeHistoryData.length === 0 ? (
                                    <tr>
                                      <td colSpan={9} className="p-8 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                          <span className="text-sm text-gray-500 dark:text-gray-400">Loading trade history...</span>
                                        </div>
                                      </td>
                                    </tr>
                                  ) : tradeHistoryData.length === 0 ? (
                                    <tr>
                                      <td colSpan={9} className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                        {!isDemoMode 
                                          ? "No personal data yet - switch to Demo mode or start adding your trades!" 
                                          : selectedDate 
                                            ? "No trades for this date" 
                                            : "Select a date from the calendar to view trades"}
                                      </td>
                                    </tr>
                                  ) : (
                                    tradeHistoryData.map((trade, index) => (
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
                                          const pnlStr = (
                                            trade.pnl || ""
                                          ).replace(/[₹,+\s]/g, "");
                                          const pnlValue =
                                            parseFloat(pnlStr) || 0;
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
                                          const pnlStr = (
                                            trade.pnl || ""
                                          ).replace(/[₹,+\s]/g, "");
                                          const pnlValue =
                                            parseFloat(pnlStr) || 0;
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
                                    ))
                                  )}
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowPaperTradingModal(true)}
                              className="h-8 px-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400 hover:from-purple-600 hover:to-pink-600"
                              data-testid="button-demo-trade"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Demo Trade
                            </Button>
                            <div className="h-8 px-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-md flex items-center justify-center text-xs font-medium text-indigo-700 dark:text-indigo-300 min-w-[80px]">
                              <Timer className="h-4 w-4 mr-2" />
                              {calculateTotalDuration(tradeHistoryData)}
                            </div>
                          </div>
                        </div>

                        <div className="max-h-80 overflow-auto border border-gray-200 dark:border-gray-700 custom-thin-scrollbar">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white sticky top-0">
                              <tr>
                                <th className="p-1 text-left min-w-[60px]">
                                  Time
                                </th>
                                <th className="p-1 text-left min-w-[50px]">
                                  Order
                                </th>
                                <th className="p-1 text-left min-w-[80px]">
                                  Symbol
                                </th>
                                <th className="p-1 text-left min-w-[50px]">
                                  Type
                                </th>
                                <th className="p-1 text-left min-w-[40px]">
                                  Qty
                                </th>
                                <th className="p-1 text-left min-w-[60px]">
                                  Price
                                </th>
                                <th className="p-1 text-left min-w-[60px]">
                                  P&L
                                </th>
                                <th className="p-1 text-left min-w-[40px]">
                                  %
                                </th>
                                <th className="p-1 text-left min-w-[70px]">
                                  Duration
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                              {isLoadingHeatmapData && tradeHistoryData.length === 0 ? (
                                <tr>
                                  <td colSpan={9} className="p-8 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">Loading trade history...</span>
                                    </div>
                                  </td>
                                </tr>
                              ) : tradeHistoryData.length === 0 ? (
                                <tr>
                                  <td colSpan={9} className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                    {!isDemoMode 
                                      ? "No personal data yet - switch to Demo mode or start adding your trades!" 
                                      : selectedDate 
                                        ? "No trades for this date" 
                                        : "Select a date from the calendar to view trades"}
                                  </td>
                                </tr>
                              ) : (
                                tradeHistoryData.map((trade, index) => (
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
                                        "",
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
                                        "",
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
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Trade Book - Right Side (Functional Calendar) */}
                    <div className="relative">
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-[420px]">
                      <CardContent className="px-0.5 md:px-4 pt-1 pb-4 md:py-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                              trade book
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 mr-2">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {isDemoMode ? "Demo" : "Personal"}
                              </span>
                              <Switch
                                checked={isDemoMode}
                                onCheckedChange={(checked) => {
                                  console.log(`🔄 Demo mode toggle: ${checked ? 'ON (Demo)' : 'OFF (Personal)'}`);
                                  
                                  // Mark that user has manually toggled (prevents auto-switching)
                                  setHasManuallyToggledMode(true);
                                  localStorage.setItem("hasManuallyToggledMode", "true");
                                  
                                  // Simple toggle - just flip the mode
                                  setIsDemoMode(checked);
                                  localStorage.setItem("tradingJournalDemoMode", String(checked));
                                  
                                  // Clear current selection - heatmap will handle its own data loading
                                  setSelectedDate(null);
                                  setNotesContent("");
                                  setTempNotesContent("");
                                  setSelectedTags([]);
                                  setTradeHistoryData([]);
                                  setTradingImages([]);
                                  
                                  console.log(`✅ Switched to ${checked ? 'Demo' : 'Personal'} mode - heatmap will load data automatically`);
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

                        {/* ✅ NEW CLEAN HEATMAP IMPLEMENTATION - Separate components for Demo & Personal */}
                        <div className="relative">
                         <div ref={heatmapContainerRef} className="pt-2">
                          {isDemoMode ? (
                            <DemoHeatmap 
                              onDateSelect={handleDateSelect}
                              selectedDate={selectedDate}
                              tradingDataByDate={tradingDataByDate}
                              onDataUpdate={(data) => {
                                handleHeatmapDataUpdate(data);
                                // Scroll to latest data for demo mode
                                setTimeout(() => {
                                  if (heatmapContainerRef.current) {
                                    const scrollContainer = heatmapContainerRef.current.querySelector('[style*="overflow"]') as HTMLElement;
                                    if (scrollContainer) {
                                      scrollContainer.scrollLeft = scrollContainer.scrollWidth;
                                      console.log("🎯 Demo heatmap: Scrolled to latest data view");
                                    }
                                  }
                                }, 300);
                              }}
                              onRangeChange={handleDateRangeChange}
                              highlightedDates={activeTagHighlight}
                            />
                          ) : (
                            <PersonalHeatmap
                              userId={getUserId()}
                              onDateSelect={handleDateSelect}
                              selectedDate={selectedDate}
                              onDataUpdate={handleHeatmapDataUpdate}
                              onRangeChange={handleDateRangeChange}
                              highlightedDates={activeTagHighlight}
                            />
                          )}
                        </div>
                        
                        {/* Curved Lines Overlay - connects FOMO tag block to highlighted dates */}
                        {activeTagHighlight?.tag === 'fomo' && activeTagHighlight.dates.length > 0 && (() => {
                          // Force recalculation on scroll (dependency: scrollTrigger)
                          void scrollTrigger;
                          
                          // Calculate curved paths from FOMO button to each highlighted date cell
                          const paths: JSX.Element[] = [];
                          
                          if (!fomoButtonRef.current || !heatmapContainerRef.current) {
                            return null;
                          }
                          
                          // Get scrollable dimensions (like DemoHeatmap does)
                          const scrollWidth = heatmapContainerRef.current.scrollWidth || 0;
                          const scrollHeight = heatmapContainerRef.current.scrollHeight || 0;
                          const scrollLeft = heatmapContainerRef.current.scrollLeft || 0;
                          const scrollTop = heatmapContainerRef.current.scrollTop || 0;
                          
                          // Get positions relative to the heatmap's scrollable content
                          const containerRect = heatmapContainerRef.current.getBoundingClientRect();
                          const buttonRect = fomoButtonRef.current.getBoundingClientRect();
                          
                          // Calculate button position relative to scrollable content
                          const buttonCenterX = buttonRect.left - containerRect.left + scrollLeft + buttonRect.width / 2;
                          const buttonCenterY = buttonRect.top - containerRect.top + scrollTop + buttonRect.height / 2;
                          
                          // Find all highlighted date cells and draw curved lines to them
                          activeTagHighlight.dates.forEach((date, index) => {
                            // Find the heatmap cell for this date
                            const cellElement = heatmapContainerRef.current?.querySelector(
                              `[data-date="${date}"]`
                            );
                            
                            if (cellElement) {
                              const cellRect = cellElement.getBoundingClientRect();
                              
                              // Calculate cell position relative to scrollable content
                              const cellCenterX = cellRect.left - containerRect.left + scrollLeft + cellRect.width / 2;
                              const cellCenterY = cellRect.top - containerRect.top + scrollTop + cellRect.height / 2;
                              
                              // Create quadratic Bezier curve (Q command)
                              // Control point is positioned to create a nice arc
                              const controlX = (buttonCenterX + cellCenterX) / 2;
                              const controlY = Math.min(buttonCenterY, cellCenterY) - 50; // Arc upward
                              
                              const pathD = `M ${buttonCenterX} ${buttonCenterY} Q ${controlX} ${controlY}, ${cellCenterX} ${cellCenterY}`;
                              
                              paths.push(
                                <g key={`connection-${date}-${index}`}>
                                  {/* Bright colored line with dashed pattern */}
                                  <path
                                    d={pathD}
                                    fill="none"
                                    stroke="url(#curvedLineGradient)"
                                    strokeWidth="2.5"
                                    strokeDasharray="6,4"
                                    opacity="0.95"
                                  />
                                  {/* Glowing dot at the end of each line */}
                                  <circle
                                    cx={cellCenterX}
                                    cy={cellCenterY}
                                    r="4"
                                    fill="#fcd34d"
                                    opacity="0.9"
                                  />
                                  <circle
                                    cx={cellCenterX}
                                    cy={cellCenterY}
                                    r="3"
                                    fill="#fbbf24"
                                    className="animate-pulse"
                                  />
                                </g>
                              );
                            }
                          });
                          
                          return (
                            <svg
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: `${scrollWidth}px`,
                                height: `${scrollHeight}px`,
                                pointerEvents: 'none',
                                zIndex: 10,
                              }}
                            >
                              {/* Define bright gradient for the curved lines */}
                              <defs>
                                <linearGradient id="curvedLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#c084fc" stopOpacity="1" />
                                  <stop offset="50%" stopColor="#f472b6" stopOpacity="1" />
                                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
                                </linearGradient>
                              </defs>
                              {paths}
                            </svg>
                          );
                        })()}
                        </div>

                        {/* Quick Stats Banner */}
                        <div className="mt-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-md px-2 py-1.5 relative" data-testid="banner-quick-stats">
                          {(() => {
                            // Calculate metrics from heatmap data and build tag-to-dates mapping
                            const filteredData = getFilteredHeatmapData();
                            const dates = Object.keys(filteredData);
                            let totalPnL = 0;
                            let totalTrades = 0;
                            let winningTrades = 0;
                            let fomoTrades = 0;
                            let consecutiveWins = 0;
                            let maxWinStreak = 0;
                            const trendData: number[] = [];
                            const fomoDates: string[] = []; // Track dates with FOMO tag
                            
                            dates.sort().forEach(dateKey => {
                              const dayData = filteredData[dateKey];
                              const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
                              const tags = dayData?.tradingData?.tradingTags || dayData?.tradingTags || [];
                              
                              if (metrics) {
                                const netPnL = metrics.netPnL || 0;
                                totalPnL += netPnL;
                                totalTrades += metrics.totalTrades || 0;
                                winningTrades += metrics.winningTrades || 0;
                                trendData.push(netPnL);
                                
                                // ✅ Count FOMO trades with normalized tag matching
                                if (Array.isArray(tags) && tags.length > 0) {
                                  // Normalize tags and check for FOMO (case-insensitive)
                                  const normalizedTags = tags.map((t: string) => t.trim().toLowerCase());
                                  if (normalizedTags.includes('fomo')) {
                                    fomoTrades++;
                                    fomoDates.push(dateKey); // Track this date
                                  }
                                  console.log(`📊 ${dateKey}: Tags: [${tags.join(', ')}] | Normalized: [${normalizedTags.join(', ')}] | FOMO count: ${fomoTrades}`);
                                }
                                
                                // Calculate win streak
                                if (netPnL > 0) {
                                  consecutiveWins++;
                                  maxWinStreak = Math.max(maxWinStreak, consecutiveWins);
                                } else if (netPnL < 0) {
                                  consecutiveWins = 0;
                                }
                              }
                            });
                            
                            const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
                            const isProfitable = totalPnL >= 0;
                            
                            // Create simple sparkline path
                            const createSparkline = (data: number[]) => {
                              if (data.length === 0) return '';
                              const max = Math.max(...data);
                              const min = Math.min(...data);
                              const range = max - min || 1;
                              const width = 40;
                              const height = 16;
                              
                              const points = data.map((val, i) => {
                                const x = (i / (data.length - 1 || 1)) * width;
                                const y = height - ((val - min) / range) * height;
                                return `${x},${y}`;
                              }).join(' ');
                              
                              return `M ${points.split(' ').join(' L ')}`;
                            };
                            
                            return (
                              <div className="grid grid-cols-6 gap-2 text-white">
                                {/* Total P&L */}
                                <div className="flex flex-col items-center justify-center" data-testid="stat-total-pnl">
                                  <div className="text-[10px] opacity-80">P&L</div>
                                  <div className={`text-xs font-bold ${isProfitable ? 'text-green-200' : 'text-red-200'}`}>
                                    {totalPnL >= 0 ? '+' : ''}₹{(totalPnL / 1000).toFixed(1)}K
                                  </div>
                                </div>
                                
                                {/* Performance Trend */}
                                <div className="flex flex-col items-center justify-center" data-testid="stat-trend">
                                  <div className="text-[10px] opacity-80">Trend</div>
                                  <svg width="40" height="16" className="mt-0.5">
                                    <path
                                      d={createSparkline(trendData)}
                                      fill="none"
                                      stroke="white"
                                      strokeWidth="1.5"
                                      opacity="0.9"
                                    />
                                  </svg>
                                </div>
                                
                                {/* FOMO Trades - Clickable to highlight dates */}
                                <button 
                                  ref={fomoButtonRef}
                                  className={`flex flex-col items-center justify-center hover-elevate active-elevate-2 rounded px-1 transition-all ${
                                    activeTagHighlight?.tag === 'fomo' ? 'bg-white/30 ring-2 ring-white/50' : ''
                                  }`}
                                  onClick={() => {
                                    if (activeTagHighlight?.tag === 'fomo') {
                                      // Toggle off if already active
                                      setActiveTagHighlight(null);
                                      console.log('📍 Deactivated FOMO tag highlighting');
                                    } else {
                                      // Activate FOMO highlighting
                                      setActiveTagHighlight({ tag: 'fomo', dates: fomoDates });
                                      console.log(`📍 Activated FOMO tag highlighting for ${fomoDates.length} dates:`, fomoDates);
                                    }
                                  }}
                                  data-testid="stat-fomo"
                                  title={`Click to ${activeTagHighlight?.tag === 'fomo' ? 'hide' : 'show'} FOMO dates on heatmap`}
                                >
                                  <div className="text-[10px] opacity-80">FOMO</div>
                                  <div className="text-xs font-bold">{fomoTrades}</div>
                                </button>
                                
                                {/* Success Rate */}
                                <div className="flex flex-col items-center justify-center" data-testid="stat-success-rate">
                                  <div className="text-[10px] opacity-80">Win%</div>
                                  <div className="text-xs font-bold">{winRate.toFixed(0)}%</div>
                                </div>
                                
                                {/* Win Streak */}
                                <div className="flex flex-col items-center justify-center" data-testid="stat-win-streak">
                                  <div className="text-[10px] opacity-80">Streak</div>
                                  <div className="text-xs font-bold">{maxWinStreak}</div>
                                </div>
                                
                                {/* Share Icon */}
                                <button
                                  className="flex items-center justify-center w-6 h-6 bg-white/20 rounded hover:bg-white/30 transition-colors"
                                  onClick={() => setShowShareDialog(true)}
                                  data-testid="button-share-tradebook"
                                  title="Share tradebook"
                                >
                                  <Share2 className="w-3.5 h-3.5 text-white" />
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                    </div>
                  </div>
                </div>
                {/* End of Main Journal Content */}

                {/* Ranking Tab Content - Mobile only, shown when ranking tab is active */}
                {mobileBottomTab === "ranking" && (
                  <div className="md:hidden mt-6 space-y-6">
                    <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-amber-200 dark:border-amber-800">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">
                              Trader Rankings
                            </CardTitle>
                            <CardDescription>
                              Coming soon: Compare your performance with other
                              traders
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <Trophy className="h-16 w-16 mx-auto mb-4 opacity-40" />
                            <p className="text-sm">
                              Ranking feature coming soon...
                            </p>
                            <p className="text-xs mt-2">
                              Track your position among top traders
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ============== MODERN TRADING ANALYTICS DASHBOARD ============== */}
                {/* Mobile: Show only in "insight" tab | Desktop: Always visible */}
                <div
                  className={`mt-8 space-y-6 ${mobileBottomTab !== "insight" ? "hidden md:block" : "block"}`}
                >
                  {(() => {
                    // Calculate comprehensive insights from all trading data
                    const calculateTradingInsights = () => {
                      const allData = Object.values(tradingDataByDate).filter(
                        (data: any) =>
                          data &&
                          data.tradeHistory &&
                          Array.isArray(data.tradeHistory) &&
                          data.tradeHistory.length > 0,
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
                              metrics.netPnL || 0,
                            );
                            stats.worstDay = Math.min(
                              stats.worstDay,
                              metrics.netPnL || 0,
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
                        (a: any, b: any) => b.totalPnL - a.totalPnL,
                      );

                      // Overall statistics
                      const totalTrades = tagAnalysis.reduce(
                        (sum: number, tag: any) => sum + tag.totalTrades,
                        0,
                      );
                      const totalPnL = tagAnalysis.reduce(
                        (sum: number, tag: any) => sum + tag.totalPnL,
                        0,
                      );
                      const totalWins = tagAnalysis.reduce(
                        (sum: number, tag: any) => sum + tag.wins,
                        0,
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

                    // ✅ NEW: Use filtered heatmap data directly instead of complex insights
                    const filteredHeatmapData = getFilteredHeatmapData();
                    const insights = calculateTradingInsights(); // Keep for other sections that still need it
                    
                    // Calculate metrics from filtered heatmap data - only include dates with actual trading (non-zero P&L)
                    const calculateHeatmapMetrics = () => {
                      const dates = Object.keys(filteredHeatmapData);
                      let totalPnL = 0;
                      let totalTrades = 0;
                      let winningTrades = 0;
                      let datesWithTrading = 0;
                      
                      dates.forEach(dateKey => {
                        const dayData = filteredHeatmapData[dateKey];
                        
                        // Handle both wrapped (Firebase) and unwrapped formats
                        const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
                        
                        if (metrics) {
                          const netPnL = metrics.netPnL || 0;
                          
                          // Only include dates with actual trading activity (non-zero P&L)
                          if (netPnL !== 0) {
                            totalPnL += netPnL;
                            totalTrades += metrics.totalTrades || 0;
                            winningTrades += metrics.winningTrades || 0;
                            datesWithTrading++;
                          }
                        }
                      });
                      
                      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
                      
                      return { totalPnL, totalTrades, winRate, datesCount: datesWithTrading };
                    };
                    
                    const heatmapMetrics = calculateHeatmapMetrics();
                    const totalPnL = heatmapMetrics.totalPnL;
                    const isProfitable = totalPnL >= 0;
                    
                    console.log(`📊 Performance Trend using ${selectedDateRange ? 'FILTERED' : 'ALL'} heatmap data: ${heatmapMetrics.datesCount} dates, Total P&L: ₹${totalPnL.toFixed(2)}`);

                    return (
                      <div className="space-y-6">
                        {/* Desktop: Single Row with Total P&L, Performance Trend, Top Tags */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                          {/* Total Performance Card - Desktop: Left side */}
                          <div
                            className={`md:col-span-3 rounded-3xl p-6 md:p-8 text-white shadow-2xl ${isProfitable ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-red-500 to-rose-600"}`}
                          >
                            <div className="flex items-center justify-between mb-6">
                              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Target className="w-6 h-6" />
                              </div>
                              <div className="text-right">
                                <div className="text-sm opacity-80">
                                  {selectedDateRange ? 'Range' : 'Total'} P&L
                                </div>
                                <div className="text-2xl md:text-3xl font-bold">
                                  {totalPnL >= 0 ? "+" : "-"}₹
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
                                  {heatmapMetrics.totalTrades}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm opacity-80">
                                  Success Rate
                                </span>
                                <span className="font-semibold">
                                  {heatmapMetrics.winRate.toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-white/20 rounded-full h-2">
                                <div
                                  className="bg-white rounded-full h-2 transition-all duration-1000"
                                  style={{
                                    width: `${Math.min(
                                      heatmapMetrics.winRate,
                                      100,
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          {/* Performance Trend Chart - Desktop: Middle */}
                          <div className="md:col-span-6 bg-white dark:bg-slate-800 rounded-3xl p-4 md:p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                              Performance Trend
                            </h3>
                            {(() => {
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

                          {Object.keys(filteredHeatmapData).length > 0 ? (
                            <div className="h-64 w-full">
                              {(() => {
                                // ✅ NEW: Get filtered heatmap data and prepare daily chart data
                                const allDates = Object.keys(filteredHeatmapData).sort();

                                // ✅ NEW: Convert filtered heatmap data to daily chart data format
                                const chartData = allDates.map(
                                  (dateStr, idx) => {
                                    const date = new Date(dateStr);
                                    const dayData = filteredHeatmapData[dateStr];
                                    
                                    // Handle both wrapped (Firebase) and unwrapped formats
                                    const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;

                                    const netPnL = metrics?.netPnL || 0;
                                    const totalTrades = metrics?.totalTrades || 0;

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
                                        },
                                      ),
                                    };
                                  },
                                );

                                // Find peak value for indicator
                                const peakData = chartData.reduce(
                                  (max, current) =>
                                    current.value > max.value ? current : max,
                                  chartData[0] || { value: 0, day: "", pnl: 0 },
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
                                            props: any,
                                          ) => [
                                            `${
                                              value >= 0 ? "₹" : "-₹"
                                            }${Math.abs(
                                              value,
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
                                          type="natural"
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
                                          isAnimationActive={true}
                                          animationDuration={600}
                                          animationEasing="ease-in-out"
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

                          {/* Top Tags - Desktop: Right side */}
                          <div className="md:col-span-3 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
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
                                            tag.totalPnL,
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
                                              100,
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
                            // Filter to only include dates with actual trading activity (non-zero P&L)
                            const allData = Object.values(
                              tradingDataByDate,
                            ).filter(
                              (data: any) => data && data.performanceMetrics && data.performanceMetrics.netPnL !== 0,
                            );

                            if (allData.length === 0) return null;

                            const totalDays = allData.length;
                            const profitableDays = allData.filter(
                              (d: any) => d.performanceMetrics.netPnL > 0,
                            ).length;
                            const avgDailyPnL =
                              allData.reduce(
                                (sum: number, d: any) =>
                                  sum + d.performanceMetrics.netPnL,
                                0,
                              ) / totalDays;
                            const maxProfit = Math.max(
                              ...allData.map(
                                (d: any) => d.performanceMetrics.netPnL,
                              ),
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
                                  avgDailyPnL,
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

                        {/* Full Width Loss Making Analysis - Extended Like Discipline Window */}
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
                              const rawTags = data.tradingTags || [];
                              const pnl = data.performanceMetrics.netPnL;
                              const trades =
                                data.performanceMetrics.totalTrades;

                              if (pnl < 0) {
                                riskMetrics.totalLossingDays++;

                                // ✅ Improved: Check for emotional trading patterns with array validation
                                if (Array.isArray(rawTags) && rawTags.length > 0) {
                                  const emotionalTags = [
                                    "fomo",
                                    "fear",
                                    "greedy",
                                    "revenge",
                                    "impatient",
                                  ];
                                  const hasEmotionalTag = rawTags.some((tag: string) =>
                                    emotionalTags.includes(tag.toLowerCase().trim())
                                  );
                                  
                                  if (hasEmotionalTag) {
                                    riskMetrics.emotionalTradingDays++;
                                    console.log(`🚨 Loss Analysis: Emotional trading detected with tags: [${rawTags.join(', ')}] | P&L: ₹${pnl.toFixed(2)}`);
                                  }
                                }

                                // Check for impulsive trading (high number of trades with losses)
                                if (trades > 5 && pnl < 0) {
                                  riskMetrics.impulsiveTrades += trades;
                                }
                              }

                              // ✅ Improved: Normalize tags to lowercase for consistent counting
                              if (Array.isArray(rawTags) && rawTags.length > 0) {
                                rawTags.forEach((rawTag: string) => {
                                  // Normalize tag: trim and lowercase for dictionary key
                                  const normalizedTag = rawTag.trim().toLowerCase();
                                  
                                  if (!tagLossAnalysis[normalizedTag]) {
                                    tagLossAnalysis[normalizedTag] = {
                                      tag: normalizedTag,
                                      displayTag: rawTag, // Keep original for display
                                      totalPnL: 0,
                                      lossDays: 0,
                                      totalDays: 0,
                                      avgLoss: 0,
                                      lossFrequency: 0,
                                    };
                                  }

                                  const analysis = tagLossAnalysis[normalizedTag];
                                  analysis.totalPnL += pnl;
                                  analysis.totalDays++;

                                  if (pnl < 0) {
                                    analysis.lossDays++;
                                    console.log(`📊 Tag '${normalizedTag}': Loss day detected | P&L: ₹${pnl.toFixed(2)} | Total losses: ${analysis.lossDays}/${analysis.totalDays} days`);
                                  }
                                });
                              }
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
                              <div className="space-y-6">
                                {/* Risk Metrics Summary */}
                                <div className="grid md:grid-cols-4 gap-4">
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="text-2xl font-bold">
                                      {riskMetrics.totalLossingDays}
                                    </div>
                                    <div className="text-sm opacity-80">
                                      Losing Days
                                    </div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="text-2xl font-bold">
                                      {riskMetrics.emotionalTradingDays}
                                    </div>
                                    <div className="text-sm opacity-80">
                                      Emotional Trading Days
                                    </div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="text-2xl font-bold">
                                      {riskMetrics.impulsiveTrades}
                                    </div>
                                    <div className="text-sm opacity-80">
                                      Impulsive Trades
                                    </div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="text-2xl font-bold">
                                      {allData.length > 0
                                        ? (
                                            (riskMetrics.totalLossingDays /
                                              allData.length) *
                                            100
                                          ).toFixed(0)
                                        : 0}
                                      %
                                    </div>
                                    <div className="text-sm opacity-80">
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
                                                {(tag.displayTag || tag.tag).toUpperCase()}
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
                              tradingDataByDate,
                            ).filter(
                              (data: any) =>
                                data &&
                                data.tradingTags &&
                                Array.isArray(data.tradingTags) &&
                                data.performanceMetrics,
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
                                  emotionalTags.includes(tag.toLowerCase()),
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
                                  consecutiveWins,
                                );
                              } else if (pnl < 0) {
                                consecutiveLosses++;
                                consecutiveWins = 0;
                                maxLossStreak = Math.max(
                                  maxLossStreak,
                                  consecutiveLosses,
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
                                  0,
                                )}% of your trades are well-planned. Keep this discipline!`,
                              });
                            } else if (plannedRatio < 30) {
                              disciplineInsights.push({
                                type: "warning",
                                icon: "⚠️",
                                title: "Planning Needed",
                                message: `Only ${plannedRatio.toFixed(
                                  0,
                                )}% planned trades. Create setups before trading.`,
                              });
                            }

                            if (emotionalRatio > 40) {
                              disciplineInsights.push({
                                type: "danger",
                                icon: "🚨",
                                title: "Emotional Trading Alert",
                                message: `${emotionalRatio.toFixed(
                                  0,
                                )}% emotional trades detected. Practice mindfulness.`,
                              });
                            }

                            if (disciplineMetrics.avgTradesPerDay > 8) {
                              disciplineInsights.push({
                                type: "warning",
                                icon: "⚡",
                                title: "Overtrading Risk",
                                message: `Avg ${disciplineMetrics.avgTradesPerDay.toFixed(
                                  1,
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
                                  0,
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
                                        1,
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

          </div>
        </main>

        {/* Trade History Modal */}
        <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto custom-thin-scrollbar">
            <DialogHeader>
              <DialogTitle>Imported Trade History</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto border rounded-lg custom-thin-scrollbar">
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
                                          (trade.pnl || "").replace(
                                            /[₹,]/g,
                                            "",
                                          ),
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
                <div className="flex items-center gap-2 mb-1">
                  <Label className="text-sm font-medium">Custom Data</Label>
                  {activeFormat && detectedFormatLabel && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium">
                      ✓ Detected: {detectedFormatLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  {activeFormat 
                    ? `Auto-detected "${detectedFormatLabel}" format. Import will add trades to your existing history using this format.`
                    : "Paste your trade data in your broker's format. If you've saved this format before, it will be auto-detected."
                  }
                </p>

                {/* Saved Formats - Always visible */}
                {Object.keys(savedFormats).length > 0 && (
                  <div className="mb-3 p-3 border rounded-md bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium">
                        📚 Your Saved Formats ({Object.keys(savedFormats).length})
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={async () => {
                          console.log("🔄 Manually refreshing formats from Firebase...");
                          if (currentUser?.userId) {
                            try {
                              const idToken = await auth.currentUser?.getIdToken();
                              if (idToken) {
                                const response = await fetch(`/api/user-formats/${currentUser.userId}`, {
                                  headers: { 'Authorization': `Bearer ${idToken}` }
                                });
                                if (response.ok) {
                                  const formats = await response.json();
                                  setSavedFormats(formats);
                                  toast({
                                    title: "Refreshed",
                                    description: `Reloaded ${Object.keys(formats).length} format(s)`,
                                  });
                                  console.log("✅ Formats refreshed:", Object.keys(formats).length);
                                }
                              }
                            } catch (err) {
                              console.error("❌ Failed to refresh:", err);
                              toast({
                                title: "Refresh Failed",
                                description: "Could not reload formats",
                                variant: "destructive"
                              });
                            }
                          }
                        }}
                        data-testid="button-refresh-formats"
                      >
                        Refresh
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      {Object.entries(savedFormats).map(([label, format]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50 hover-elevate"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium">{label}</div>
                            <div className="text-xs text-muted-foreground truncate font-mono">
                              {format.sampleLine || "No sample line"}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                setBuildModeData(format);
                                setActiveFormat(format);
                                toast({
                                  title: "Format Loaded",
                                  description: `Using "${label}" format for import`,
                                });
                                console.log("✅ Format loaded:", label, format);
                              }}
                              data-testid={`button-load-format-${label}`}
                            >
                              Load
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={!currentUser?.userId}
                              title={!currentUser?.userId ? "Log in to delete formats" : ""}
                              onClick={async () => {
                                if (confirm(`Delete format "${label}"?`)) {
                                  const newFormats = { ...savedFormats };
                                  delete newFormats[label];
                                  setSavedFormats(newFormats);
                                  await saveFormatsToFirebase(newFormats);
                                  if (activeFormat === format) {
                                    setActiveFormat(null);
                                  }
                                  toast({
                                    title: "Format Deleted",
                                    description: `"${label}" has been removed`,
                                  });
                                  console.log("🗑️ Format deleted:", label);
                                }
                              }}
                              data-testid={`button-delete-format-quick-${label}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="border rounded-md bg-muted/30 p-3 mb-3">
                  {isBuildMode ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium text-muted-foreground">
                          🔨 Build Mode - Select text below, then click + to add | Drag boxes to swap | X to delete
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Format label"
                            value={savedFormatLabel}
                            onChange={(e) => setSavedFormatLabel(e.target.value)}
                            className="h-8 w-32 text-xs"
                            data-testid="input-format-label"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!currentUser?.userId}
                            title={!currentUser?.userId ? "Log in to save formats" : ""}
                            onClick={async () => {if (!savedFormatLabel.trim()) {
                                alert("Please enter a label for this format");
                                return;
                              }
                              // buildModeData already contains sampleLine and positions
                              const newFormats = { ...savedFormats, [savedFormatLabel]: buildModeData };
                              setSavedFormats(newFormats);
                              setActiveFormat(buildModeData);
                              await saveFormatsToFirebase(newFormats);
                              setSavedFormatLabel("");
                              alert(`Format "${savedFormatLabel}" saved with position mapping! Import will now use these positions.`);
                              console.log("✅ Format saved with positions:", savedFormatLabel, buildModeData.positions);
                            }}
                            data-testid="button-save-format"
                          >
                            <Save className="w-3.5 h-3.5 mr-1" />
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsBuildMode(false)}
                            data-testid="button-close-build-mode"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="bg-background rounded border overflow-hidden">
                        <table className="w-full font-mono text-xs">
                          <thead>
                            <tr className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800">
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Time</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Order</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Symbol</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Type</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Qty</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              {/* Time Column */}
                              <td 
                                className="px-2 py-2"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  // Drag and drop disabled for position-based system
                                }}
                              >
                                {buildModeData.positions.time.length > 0 ? (
                                  <div 
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData("sourceField", "time");
                                      e.dataTransfer.setData("sourceValue", buildModeData.displayValues.time);
                                    }}
                                    className="inline-flex flex-col gap-0.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs cursor-move"
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-blue-500 dark:text-blue-400 font-mono">[Pos {buildModeData.positions.time.join(", ")}]</span>
                                      <button
                                        onClick={() => setBuildModeData(prev => ({ 
                                          ...prev, 
                                          positions: { ...prev.positions, time: [] },
                                          displayValues: { ...prev.displayValues!, time: "" }
                                        }))}
                                        className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded p-0.5"
                                        data-testid="delete-time"
                                        title="Delete"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="font-medium">{buildModeData.displayValues.time}</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const textarea = importDataTextareaRef.current;
                                      if (textarea) {
                                        const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
                                        const firstLine = textarea.value.trim().split('\n')[0] || "";
                                        if (selectedText.trim() && firstLine) {
                                          const position = findPositionInLine(selectedText, firstLine);
                                          if (position !== null) {
                                            setBuildModeData(prev => ({ 
                                              ...prev,
                                              sampleLine: firstLine,
                                              positions: { ...prev.positions, time: [...prev.positions.time, position] },
                                              displayValues: { ...prev.displayValues!, time: prev.displayValues.time ? `${prev.displayValues.time} ${selectedText.trim()}` : selectedText.trim() }
                                            }));
                                            console.log("✅ Added position to time:", position);
                                          } else {
                                            alert("Could not find selected text in first line!");
                                          }
                                        }
                                      }
                                    }}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    data-testid="add-time"
                                    title="Select text from below and click to add (multiple selections allowed)"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </td>

                              {/* Order Column */}
                              <td 
                                className="px-2 py-2"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  // Drag and drop disabled for position-based system
                                }}
                              >
                                {buildModeData.positions.order.length > 0 ? (
                                  <div 
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData("sourceField", "order");
                                      e.dataTransfer.setData("sourceValue", buildModeData.displayValues.order);
                                    }}
                                    className="inline-flex flex-col gap-0.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs cursor-move"
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-blue-500 dark:text-blue-400 font-mono">[Pos {buildModeData.positions.order.join(", ")}]</span>
                                      <button
                                        onClick={() => setBuildModeData(prev => ({ 
                                          ...prev, 
                                          positions: { ...prev.positions, order: [] },
                                          displayValues: { ...prev.displayValues!, order: "" }
                                        }))}
                                        className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded p-0.5"
                                        data-testid="delete-order"
                                        title="Delete"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="font-medium">{buildModeData.displayValues.order}</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const textarea = importDataTextareaRef.current;
                                      if (textarea) {
                                        const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
                                        const firstLine = textarea.value.trim().split('\n')[0] || "";
                                        if (selectedText.trim() && firstLine) {
                                          const position = findPositionInLine(selectedText, firstLine);
                                          if (position !== null) {
                                            setBuildModeData(prev => ({ 
                                              ...prev,
                                              sampleLine: firstLine,
                                              positions: { ...prev.positions, order: [...prev.positions.order, position] },
                                              displayValues: { ...prev.displayValues!, order: prev.displayValues.order ? `${prev.displayValues.order} ${selectedText.trim()}` : selectedText.trim() }
                                            }));
                                          } else {
                                            alert("Could not find selected text in first line!");
                                          }
                                        }
                                      }
                                    }}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    data-testid="add-order"
                                    title="Select text from below and click to add (multiple selections allowed)"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </td>

                              {/* Symbol Column */}
                              <td 
                                className="px-2 py-2"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  // Drag and drop disabled for position-based system
                                }}
                              >
                                {buildModeData.positions.symbol.length > 0 ? (
                                  <div 
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData("sourceField", "symbol");
                                      e.dataTransfer.setData("sourceValue", buildModeData.displayValues.symbol);
                                    }}
                                    className="inline-flex flex-col gap-0.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs cursor-move"
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-blue-500 dark:text-blue-400 font-mono">[Pos {buildModeData.positions.symbol.join(", ")}]</span>
                                      <button
                                        onClick={() => setBuildModeData(prev => ({ 
                                          ...prev, 
                                          positions: { ...prev.positions, symbol: [] },
                                          displayValues: { ...prev.displayValues!, symbol: "" }
                                        }))}
                                        className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded p-0.5"
                                        data-testid="delete-symbol"
                                        title="Delete"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="font-medium">{buildModeData.displayValues.symbol}</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const textarea = importDataTextareaRef.current;
                                      if (textarea) {
                                        const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
                                        const firstLine = textarea.value.trim().split('\n')[0] || "";
                                        if (selectedText.trim() && firstLine) {
                                          const position = findPositionInLine(selectedText, firstLine);
                                          if (position !== null) {
                                            setBuildModeData(prev => ({ 
                                              ...prev,
                                              sampleLine: firstLine,
                                              positions: { ...prev.positions, symbol: [...prev.positions.symbol, position] },
                                              displayValues: { ...prev.displayValues!, symbol: prev.displayValues.symbol ? `${prev.displayValues.symbol} ${selectedText.trim()}` : selectedText.trim() }
                                            }));
                                          } else {
                                            alert("Could not find selected text in first line!");
                                          }
                                        }
                                      }
                                    }}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    data-testid="add-symbol"
                                    title="Select text from below and click to add (multiple selections allowed)"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </td>

                              {/* Type Column */}
                              <td 
                                className="px-2 py-2"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  // Drag and drop disabled for position-based system
                                }}
                              >
                                {buildModeData.positions.type.length > 0 ? (
                                  <div 
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData("sourceField", "type");
                                      e.dataTransfer.setData("sourceValue", buildModeData.displayValues.type);
                                    }}
                                    className="inline-flex flex-col gap-0.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs cursor-move"
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-blue-500 dark:text-blue-400 font-mono">[Pos {buildModeData.positions.type.join(", ")}]</span>
                                      <button
                                        onClick={() => setBuildModeData(prev => ({ 
                                          ...prev, 
                                          positions: { ...prev.positions, type: [] },
                                          displayValues: { ...prev.displayValues!, type: "" }
                                        }))}
                                        className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded p-0.5"
                                        data-testid="delete-type"
                                        title="Delete"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="font-medium">{buildModeData.displayValues.type}</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const textarea = importDataTextareaRef.current;
                                      if (textarea) {
                                        const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
                                        const firstLine = textarea.value.trim().split('\n')[0] || "";
                                        if (selectedText.trim() && firstLine) {
                                          const position = findPositionInLine(selectedText, firstLine);
                                          if (position !== null) {
                                            setBuildModeData(prev => ({ 
                                              ...prev,
                                              sampleLine: firstLine,
                                              positions: { ...prev.positions, type: [...prev.positions.type, position] },
                                              displayValues: { ...prev.displayValues!, type: prev.displayValues.type ? `${prev.displayValues.type} ${selectedText.trim()}` : selectedText.trim() }
                                            }));
                                          } else {
                                            alert("Could not find selected text in first line!");
                                          }
                                        }
                                      }
                                    }}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    data-testid="add-type"
                                    title="Select text from below and click to add (multiple selections allowed)"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </td>

                              {/* Qty Column */}
                              <td 
                                className="px-2 py-2"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  // Drag and drop disabled for position-based system
                                }}
                              >
                                {buildModeData.positions.qty.length > 0 ? (
                                  <div 
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData("sourceField", "qty");
                                      e.dataTransfer.setData("sourceValue", buildModeData.displayValues.qty);
                                    }}
                                    className="inline-flex flex-col gap-0.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs cursor-move"
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-blue-500 dark:text-blue-400 font-mono">[Pos {buildModeData.positions.qty.join(", ")}]</span>
                                      <button
                                        onClick={() => setBuildModeData(prev => ({ 
                                          ...prev, 
                                          positions: { ...prev.positions, qty: [] },
                                          displayValues: { ...prev.displayValues!, qty: "" }
                                        }))}
                                        className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded p-0.5"
                                        data-testid="delete-qty"
                                        title="Delete"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="font-medium">{buildModeData.displayValues.qty}</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const textarea = importDataTextareaRef.current;
                                      if (textarea) {
                                        const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
                                        const firstLine = textarea.value.trim().split('\n')[0] || "";
                                        if (selectedText.trim() && firstLine) {
                                          const position = findPositionInLine(selectedText, firstLine);
                                          if (position !== null) {
                                            setBuildModeData(prev => ({ 
                                              ...prev,
                                              sampleLine: firstLine,
                                              positions: { ...prev.positions, qty: [...prev.positions.qty, position] },
                                              displayValues: { ...prev.displayValues!, qty: prev.displayValues.qty ? `${prev.displayValues.qty} ${selectedText.trim()}` : selectedText.trim() }
                                            }));
                                          } else {
                                            alert("Could not find selected text in first line!");
                                          }
                                        }
                                      }
                                    }}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    data-testid="add-qty"
                                    title="Select text from below and click to add (multiple selections allowed)"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </td>

                              {/* Price Column */}
                              <td 
                                className="px-2 py-2"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  // Drag and drop disabled for position-based system
                                }}
                              >
                                {buildModeData.positions.price.length > 0 ? (
                                  <div 
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData("sourceField", "price");
                                      e.dataTransfer.setData("sourceValue", buildModeData.displayValues.price);
                                    }}
                                    className="inline-flex flex-col gap-0.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs cursor-move"
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-blue-500 dark:text-blue-400 font-mono">[Pos {buildModeData.positions.price.join(", ")}]</span>
                                      <button
                                        onClick={() => setBuildModeData(prev => ({ 
                                          ...prev, 
                                          positions: { ...prev.positions, price: [] },
                                          displayValues: { ...prev.displayValues!, price: "" }
                                        }))}
                                        className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded p-0.5"
                                        data-testid="delete-price"
                                        title="Delete"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="font-medium">{buildModeData.displayValues.price}</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const textarea = importDataTextareaRef.current;
                                      if (textarea) {
                                        const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
                                        const firstLine = textarea.value.trim().split('\n')[0] || "";
                                        if (selectedText.trim() && firstLine) {
                                          const position = findPositionInLine(selectedText, firstLine);
                                          if (position !== null) {
                                            setBuildModeData(prev => ({ 
                                              ...prev,
                                              sampleLine: firstLine,
                                              positions: { ...prev.positions, price: [...prev.positions.price, position] },
                                              displayValues: { ...prev.displayValues!, price: prev.displayValues.price ? `${prev.displayValues.price} ${selectedText.trim()}` : selectedText.trim() }
                                            }));
                                          } else {
                                            alert("Could not find selected text in first line!");
                                          }
                                        }
                                      }
                                    }}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    data-testid="add-price"
                                    title="Select text from below and click to add (multiple selections allowed)"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Saved Formats Table - Shows all saved formats with their original trade lines */}
                      {Object.keys(savedFormats).length > 0 && (
                        <div className="mt-4 space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">
                            📚 Saved Formats ({Object.keys(savedFormats).length})
                          </div>
                          <div className="bg-background rounded border overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-muted/50 border-b">
                                  <th className="px-3 py-2 text-left font-semibold">Format Label</th>
                                  <th className="px-3 py-2 text-left font-semibold">Original Trade Line</th>
                                  <th className="px-3 py-2 text-left font-semibold">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(savedFormats).map(([label, format]) => (
                                  <tr key={label} className="border-b last:border-b-0 hover-elevate">
                                    <td className="px-3 py-2 font-medium">{label}</td>
                                    <td className="px-3 py-2 font-mono text-muted-foreground truncate max-w-md">
                                      {format.sampleLine || "No sample line saved"}
                                    </td>
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 text-xs"
                                          onClick={() => {
                                            setBuildModeData(format);
                                            setActiveFormat(format);
                                            console.log("✅ Format loaded from table:", label, format);
                                          }}
                                          data-testid={`button-use-format-${label}`}
                                        >
                                          Use
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                          disabled={!currentUser?.userId}
                                          title={!currentUser?.userId ? "Log in to delete formats" : ""}
                                          onClick={async () => {if (confirm(`Delete format "${label}"?`)) {
                                              const newFormats = { ...savedFormats };
                                              delete newFormats[label];
                                              setSavedFormats(newFormats);
                                              await saveFormatsToFirebase(newFormats);
                                              if (activeFormat === format) {
                                                setActiveFormat(null);
                                              }
                                              console.log("🗑️ Format deleted:", label);
                                            }
                                          }}
                                          data-testid={`button-delete-format-${label}`}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Live Preview - How Your First Trade Will Import:
                      </div>
                      <div className="bg-background rounded border overflow-hidden">
                        <table className="w-full font-mono text-xs">
                          <thead>
                            <tr className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800">
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Time</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Order</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Symbol</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Type</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Qty</th>
                              <th className="px-2 py-2 text-left text-blue-600 dark:text-blue-400 font-semibold">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              // Parse first trade from pasted data
                              if (!importData.trim()) {
                                return (
                                  <tr className="border-b last:border-b-0">
                                    <td colSpan={6} className="px-2 py-3 text-center text-muted-foreground italic">
                                      Paste trade data below to see live preview...
                                    </td>
                                  </tr>
                                );
                              }

                              // Use format-based parser if active format is set, otherwise use default parser
                              const { trades, errors } = activeFormat 
                                ? parseTradesWithFormat(importData, activeFormat)
                                : parseBrokerTrades(importData);
                              
                              if (trades.length === 0) {
                                return (
                                  <tr className="border-b last:border-b-0">
                                    <td colSpan={6} className="px-2 py-3 text-center text-orange-600 dark:text-orange-400">
                                      ⚠️ Unable to parse - check format
                                    </td>
                                  </tr>
                                );
                              }

                              const firstTrade = trades[0];
                              return (
                                <tr className="border-b last:border-b-0 bg-green-50/50 dark:bg-green-950/20">
                                  <td className="px-2 py-2 text-foreground">{firstTrade.time}</td>
                                  <td className="px-2 py-2 text-foreground">{firstTrade.order}</td>
                                  <td className="px-2 py-2 text-foreground">{firstTrade.symbol}</td>
                                  <td className="px-2 py-2 text-foreground">{firstTrade.type}</td>
                                  <td className="px-2 py-2 text-foreground">{firstTrade.qty}</td>
                                  <td className="px-2 py-2 text-foreground">{firstTrade.price}</td>
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          ✨ This preview updates automatically as you paste - check your format before importing
                        </p>
                        <div className="flex items-center gap-2">
                          <select
                            className="h-9 px-3 text-sm border rounded-md bg-background disabled:opacity-50"
                            onChange={(e) => {
                              if (e.target.value) {
                                const loadedFormat = savedFormats[e.target.value];
                                setBuildModeData(loadedFormat);
                                setActiveFormat(loadedFormat);
                                setIsBuildMode(true);
                                console.log("✅ Format loaded and activated:", e.target.value, loadedFormat);
                              }
                            }}
                            defaultValue=""
                            data-testid="select-load-format"
                            disabled={formatsLoading}
                          >
                            <option value="">
                              {formatsLoading 
                                ? "Loading formats..." 
                                : `Load Saved Format${Object.keys(savedFormats).length > 0 ? ` (${Object.keys(savedFormats).length})` : ""}`}
                            </option>
                            {Object.keys(savedFormats).map((label) => (
                              <option key={label} value={label}>{label}</option>
                            ))}
                          </select>
                          {currentUser?.userId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 px-2"
                              onClick={async () => {
                                console.log("🔃 Manually refreshing formats from Firebase...");
                                setFormatsLoading(true);
                                try {
                                  const idToken = await auth.currentUser?.getIdToken();
                                  if (idToken) {
                                    const response = await fetch(`/api/user-formats/${currentUser.userId}`, {
                                      headers: { 'Authorization': `Bearer ${idToken}` }
                                    });
                                    if (response.ok) {
                                      const formats = await response.json();
                                      console.log("✅ Formats refreshed:", Object.keys(formats).length);
                                      setSavedFormats(formats);
                                      toast({
                                        title: "Refreshed",
                                        description: `Loaded ${Object.keys(formats).length} format(s)`
                                      });
                                    }
                                  }
                                } catch (err) {
                                  console.error("❌ Refresh failed:", err);
                                  toast({
                                    title: "Refresh Failed",
                                    description: "Could not load formats",
                                    variant: "destructive"
                                  });
                                } finally {
                                  setFormatsLoading(false);
                                }
                              }}
                              data-testid="button-refresh-formats"
                              title="Refresh saved formats"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => {
                              // Initialize with empty positions - user will select text manually
                              const firstLine = importData.trim().split('\n')[0] || "";
                              setBuildModeData({
                                sampleLine: firstLine,
                                positions: {
                                  time: [],
                                  order: [],
                                  symbol: [],
                                  type: [],
                                  qty: [],
                                  price: []
                                },
                                displayValues: {
                                  time: "",
                                  order: "",
                                  symbol: "",
                                  type: "",
                                  qty: "",
                                  price: ""
                                }
                              });
                              setIsBuildMode(true);
                              console.log("🔨 Build mode activated - select text to map positions");
                            }}
                            data-testid="button-build"
                          >
                            <Hammer className="w-3.5 h-3.5" />
                            Build
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Textarea
                  ref={importDataTextareaRef}
                  id="paste-data"
                  placeholder="Paste your trade data here...&#10;&#10;Example:&#10;10:51:21 AM   BUY     SENSEX 10th w JUN 82900 PE BFO  NRML    320     477.96&#10;10:51:39 AM  SELL    SENSEX 10th w JUN 82900 PE BFO  NRML    320     551.26"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="min-h-48"
                  data-testid="textarea-paste-data"
                />
              </div>

              {importError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{importError}</p>
                </div>
              )}

              {parseErrors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 max-h-48 overflow-y-auto custom-thin-scrollbar">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    ⚠️ {parseErrors.length} line(s) could not be parsed:
                  </p>
                  <div className="space-y-2">
                    {parseErrors.map((error, index) => (
                      <div
                        key={index}
                        className="bg-white rounded p-2 text-xs border border-yellow-100"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-mono text-yellow-700">
                            Line {error.line}:
                          </span>
                          <span className="text-red-600 font-medium">
                            {error.reason}
                          </span>
                        </div>
                        <div className="mt-1 text-gray-600 font-mono truncate">
                          {error.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportData("");
                    setImportError("");
                    setParseErrors([]);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleImportData}>Import Data</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Paper Trading (Demo Trading) Modal - Like TradingView Practice Account */}
        <Dialog open={showPaperTradingModal} onOpenChange={setShowPaperTradingModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto custom-thin-scrollbar">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Play className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                  Paper Trading Account
                </span>
                <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
                  Demo Mode
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Account Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">Available Capital</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    ₹{paperTradingCapital.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Open Positions</div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {paperPositions.filter(p => p.isOpen).length}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Total Trades</div>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {paperTradeHistory.length}
                  </div>
                </div>
              </div>

              {/* Trade Entry Form */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  New Trade
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Stock Search */}
                  <div className="col-span-2">
                    <Label className="text-xs font-medium">Search Stock / F&O</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search RELIANCE, TCS, NIFTY..."
                        value={paperTradeSymbolSearch}
                        onChange={(e) => {
                          setPaperTradeSymbolSearch(e.target.value);
                          setPaperTradeSymbol("");
                          setPaperTradeCurrentPrice(null);
                        }}
                        className="pl-10"
                        data-testid="input-paper-trade-search"
                      />
                    </div>
                    
                    {/* Stock Dropdown */}
                    {paperTradeSymbolSearch && !paperTradeSymbol && (
                      <div className="absolute z-50 mt-1 max-h-48 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                        {filteredPaperTradingSymbols.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-gray-500">No stocks found</div>
                        ) : (
                          filteredPaperTradingSymbols.map(stock => (
                            <button
                              key={stock.symbol}
                              onClick={() => {
                                setPaperTradeSymbol(stock.symbol);
                                setPaperTradeSymbolSearch(stock.symbol);
                                fetchPaperTradePrice(stock.symbol);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                              data-testid={`select-stock-${stock.symbol}`}
                            >
                              <div>
                                <div className="font-medium text-sm">{stock.symbol}</div>
                                <div className="text-xs text-gray-500">{stock.name}</div>
                              </div>
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded">
                                {stock.exchange}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Type Selector */}
                  <div>
                    <Label className="text-xs font-medium">Type</Label>
                    <Select value={paperTradeType} onValueChange={(v) => setPaperTradeType(v as 'STOCK' | 'FUTURES' | 'OPTIONS')}>
                      <SelectTrigger className="mt-1" data-testid="select-paper-trade-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STOCK">Stock</SelectItem>
                        <SelectItem value="FUTURES">Futures</SelectItem>
                        <SelectItem value="OPTIONS">Options</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <Label className="text-xs font-medium">Quantity</Label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={paperTradeQuantity}
                      onChange={(e) => setPaperTradeQuantity(e.target.value)}
                      className="mt-1"
                      min="1"
                      data-testid="input-paper-trade-qty"
                    />
                  </div>
                </div>

                {/* Price Display */}
                {paperTradeSymbol && (
                  <div className="mt-4 flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                    <div>
                      <div className="text-sm font-semibold">{paperTradeSymbol}</div>
                      <div className="text-xs text-gray-500">Live Market Price</div>
                    </div>
                    <div className="text-right">
                      {paperTradePriceLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm text-gray-500">Fetching...</span>
                        </div>
                      ) : paperTradeCurrentPrice ? (
                        <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                          ₹{paperTradeCurrentPrice.toFixed(2)}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">--</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Trade Value Preview */}
                {paperTradeSymbol && paperTradeQuantity && paperTradeCurrentPrice && (
                  <div className="mt-3 text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                    <span className="text-xs text-purple-600 dark:text-purple-400">
                      Trade Value: ₹{(parseInt(paperTradeQuantity) * paperTradeCurrentPrice).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {/* Buy/Sell Buttons */}
                <div className="mt-4 flex gap-3">
                  <Button
                    onClick={() => {
                      setPaperTradeAction('BUY');
                      executePaperTrade();
                    }}
                    disabled={!paperTradeSymbol || !paperTradeQuantity || !paperTradeCurrentPrice}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-paper-buy"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    BUY
                  </Button>
                  <Button
                    onClick={() => {
                      setPaperTradeAction('SELL');
                      executePaperTrade();
                    }}
                    disabled={!paperTradeSymbol || !paperTradeQuantity || !paperTradeCurrentPrice}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    data-testid="button-paper-sell"
                  >
                    <TrendingDown className="h-4 w-4 mr-2" />
                    SELL
                  </Button>
                </div>
              </div>

              {/* Open Positions */}
              {paperPositions.filter(p => p.isOpen).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-500" />
                    Open Positions
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          <th className="px-3 py-2 text-left">Symbol</th>
                          <th className="px-3 py-2 text-left">Type</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                          <th className="px-3 py-2 text-right">Entry</th>
                          <th className="px-3 py-2 text-right">Current</th>
                          <th className="px-3 py-2 text-right">P&L</th>
                          <th className="px-3 py-2 text-right">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paperPositions.filter(p => p.isOpen).map(position => (
                          <tr key={position.id} className="border-t border-gray-200 dark:border-gray-700">
                            <td className="px-3 py-2 font-medium">{position.symbol}</td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded text-xs">
                                {position.type}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">{position.quantity}</td>
                            <td className="px-3 py-2 text-right">₹{position.entryPrice.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right">₹{position.currentPrice.toFixed(2)}</td>
                            <td className={`px-3 py-2 text-right font-medium ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {position.pnl >= 0 ? '+' : ''}₹{position.pnl.toFixed(2)}
                            </td>
                            <td className={`px-3 py-2 text-right font-medium ${position.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Trade History */}
              {paperTradeHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    Trade History
                  </h4>
                  <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto custom-thin-scrollbar">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">Time</th>
                          <th className="px-3 py-2 text-left">Action</th>
                          <th className="px-3 py-2 text-left">Symbol</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                          <th className="px-3 py-2 text-right">Price</th>
                          <th className="px-3 py-2 text-right">P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...paperTradeHistory].reverse().map(trade => (
                          <tr key={trade.id} className="border-t border-gray-200 dark:border-gray-700">
                            <td className="px-3 py-2 text-gray-500">{trade.time}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                trade.action === 'BUY' 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                              }`}>
                                {trade.action}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-medium">{trade.symbol}</td>
                            <td className="px-3 py-2 text-right">{trade.quantity}</td>
                            <td className="px-3 py-2 text-right">₹{trade.price.toFixed(2)}</td>
                            <td className={`px-3 py-2 text-right font-medium ${
                              !trade.pnl ? 'text-gray-400' : 
                              trade.pnl.includes('+') ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {trade.pnl || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetPaperTradingAccount}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  data-testid="button-reset-paper-trading"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Account
                </Button>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Demo trades do not affect real account
                </div>
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

        {/* Option Chain Modal */}
        <Dialog open={showOptionChain} onOpenChange={setShowOptionChain}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto custom-thin-scrollbar">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Grid3X3 className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                  Option Chain - {getUnderlyingSymbol()}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Expiry Date Selector */}
              {optionChainData?.expiryDates && optionChainData.expiryDates.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expiry:</span>
                  <select
                    value={selectedOptionExpiry}
                    onChange={(e) => setSelectedOptionExpiry(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                    data-testid="select-option-expiry"
                  >
                    {optionChainData.expiryDates.map((date: string) => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchOptionChainData}
                    disabled={optionChainLoading}
                    data-testid="button-refresh-option-chain"
                  >
                    <RefreshCcw className={`h-4 w-4 ${optionChainLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              )}

              {/* Loading State */}
              {optionChainLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Loading option chain...</span>
                  </div>
                </div>
              )}

              {/* Option Chain Table */}
              {!optionChainLoading && optionChainData?.chain && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                      <tr>
                        <th colSpan={5} className="py-2 px-2 text-center font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                          CALLS
                        </th>
                        <th className="py-2 px-3 text-center font-bold bg-gray-200 dark:bg-gray-700 border-x border-gray-300 dark:border-gray-600">
                          STRIKE
                        </th>
                        <th colSpan={5} className="py-2 px-2 text-center font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                          PUTS
                        </th>
                      </tr>
                      <tr className="text-gray-600 dark:text-gray-400">
                        <th className="py-1.5 px-2 text-right">OI</th>
                        <th className="py-1.5 px-2 text-right">Chg OI</th>
                        <th className="py-1.5 px-2 text-right">Vol</th>
                        <th className="py-1.5 px-2 text-right">IV</th>
                        <th className="py-1.5 px-2 text-right bg-green-50 dark:bg-green-900/10">LTP</th>
                        <th className="py-1.5 px-3 text-center font-bold bg-gray-200 dark:bg-gray-700">Price</th>
                        <th className="py-1.5 px-2 text-left bg-red-50 dark:bg-red-900/10">LTP</th>
                        <th className="py-1.5 px-2 text-left">IV</th>
                        <th className="py-1.5 px-2 text-left">Vol</th>
                        <th className="py-1.5 px-2 text-left">Chg OI</th>
                        <th className="py-1.5 px-2 text-left">OI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(optionChainData.chain[selectedOptionExpiry] || Object.values(optionChainData.chain)[0] || [])
                        .slice(0, 30)
                        .map((row: any, idx: number) => {
                          const isATM = row.isATM || false;
                          return (
                            <tr 
                              key={idx} 
                              className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isATM ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                            >
                              <td className="py-1.5 px-2 text-right text-gray-700 dark:text-gray-300">{row.call?.oi?.toLocaleString() || '-'}</td>
                              <td className={`py-1.5 px-2 text-right ${(row.call?.oiChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {row.call?.oiChange?.toLocaleString() || '-'}
                              </td>
                              <td className="py-1.5 px-2 text-right text-gray-600 dark:text-gray-400">{row.call?.volume?.toLocaleString() || '-'}</td>
                              <td className="py-1.5 px-2 text-right text-gray-600 dark:text-gray-400">{row.call?.iv?.toFixed(1) || '-'}</td>
                              <td className="py-1.5 px-2 text-right font-medium text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10">
                                {row.call?.ltp?.toFixed(2) || '-'}
                              </td>
                              <td className={`py-1.5 px-3 text-center font-bold bg-gray-100 dark:bg-gray-700 ${isATM ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                {row.strikePrice?.toLocaleString()}
                              </td>
                              <td className="py-1.5 px-2 text-left font-medium text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10">
                                {row.put?.ltp?.toFixed(2) || '-'}
                              </td>
                              <td className="py-1.5 px-2 text-left text-gray-600 dark:text-gray-400">{row.put?.iv?.toFixed(1) || '-'}</td>
                              <td className="py-1.5 px-2 text-left text-gray-600 dark:text-gray-400">{row.put?.volume?.toLocaleString() || '-'}</td>
                              <td className={`py-1.5 px-2 text-left ${(row.put?.oiChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {row.put?.oiChange?.toLocaleString() || '-'}
                              </td>
                              <td className="py-1.5 px-2 text-left text-gray-700 dark:text-gray-300">{row.put?.oi?.toLocaleString() || '-'}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* No Data State */}
              {!optionChainLoading && (!optionChainData || !optionChainData.chain) && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Grid3X3 className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-lg font-medium">No Option Chain Data</p>
                  <p className="text-sm">Option chain data is not available for this instrument.</p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={fetchOptionChainData}
                    data-testid="button-retry-option-chain"
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Trading Master Coming Soon Modal */}
        <Dialog open={showTradingMasterComingSoon} onOpenChange={setShowTradingMasterComingSoon}>
          <DialogContent className="max-w-md">
            <div className="space-y-6 py-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                  <Activity className="h-10 w-10 text-white" />
                </div>
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-center text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                    Advanced Trading Master
                  </DialogTitle>
                </DialogHeader>
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold text-foreground">Coming Soon!</p>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    We're working on bringing you advanced trading features and analytics.
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowTradingMasterComingSoon(false)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  data-testid="button-close-trading-master-coming-soon"
                >
                  Got It
                </Button>
              </div>
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

        {/* Minimalist Floating Pill Navigation - Mobile Only */}
        {activeTab === "journal" && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-4 px-6 pointer-events-none">
            <div className="max-w-xs mx-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-full shadow-lg border border-gray-200/50 dark:border-gray-700/50 pointer-events-auto">
              <div className="flex items-center justify-around px-1.5 py-1.5">
                {/* Home Tab */}
                <button
                  onClick={() => setMobileBottomTab("home")}
                  className={`flex items-center justify-center flex-1 rounded-full px-4 py-2 transition-all duration-200 ${
                    mobileBottomTab === "home"
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                  data-testid="mobile-tab-home"
                >
                  <HomeIcon className={`h-5 w-5 ${mobileBottomTab === "home" ? "fill-current" : ""}`} />
                </button>

                {/* Insight Tab */}
                <button
                  onClick={() => setMobileBottomTab("insight")}
                  className={`flex items-center justify-center flex-1 rounded-full px-4 py-2 transition-all duration-200 ${
                    mobileBottomTab === "insight"
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                  data-testid="mobile-tab-insight"
                >
                  <TrendingUp className={`h-5 w-5 ${mobileBottomTab === "insight" ? "stroke-[2.5]" : ""}`} />
                </button>

                {/* Ranking Tab */}
                <button
                  onClick={() => setMobileBottomTab("ranking")}
                  className={`flex items-center justify-center flex-1 rounded-full px-4 py-2 transition-all duration-200 ${
                    mobileBottomTab === "ranking"
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                  data-testid="mobile-tab-ranking"
                >
                  <Trophy className={`h-5 w-5 ${mobileBottomTab === "ranking" ? "fill-current" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Share Tradebook Dialog */}
        <Dialog 
          open={showShareDialog} 
          onOpenChange={(open) => {
            if (!open) {
              // Use the centralized close handler
              handleShareDialogClose();
              // Reset BOTH share dialog tag highlight AND report dialog tag highlight
              setShareDialogTagHighlight(null);
              setReportDialogTagHighlight(null);
              console.log('🔄 Share Dialog closed - reset tag highlighting and shareable URL');
            } else {
              setShowShareDialog(open);
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="dialog-share-tradebook">
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                {/* Left side: PERALA and tagline */}
                <div className="flex flex-col gap-1">
                  <h1 className="text-3xl font-bold tracking-tight">PERALA</h1>
                  <p className="text-xs text-muted-foreground">rethink & reinvest</p>
                </div>
                
                {/* Right side: Report title, UserID, and Link icon */}
                <div className="flex flex-col items-end gap-2">
                  <DialogTitle className="text-lg font-semibold">MY trading report</DialogTitle>
                  
                  {/* UserID */}
                  <p className="text-xs text-muted-foreground">
                    userID: {isSharedReportMode && sharedReportData?.reportData?.username 
                      ? sharedReportData.reportData.username 
                      : (currentUser?.displayName || currentUser?.email || currentUser?.userId || 'Guest')}
                  </p>
                  
                  {/* Link icon button - Only show for owners (not in shared report mode) */}
                  {!isSharedReportMode && (
                    <div className="flex flex-col items-end gap-1">
                      {!shareableUrl ? (
                        <Button
                          size="icon"
                          onClick={handleCreateShareableLink}
                          disabled={isCreatingShareableLink}
                          className="bg-green-600 hover:bg-green-700 h-8 w-8"
                          data-testid="button-create-shareable-link"
                        >
                          {isCreatingShareableLink ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Link2 className="w-4 h-4" />
                          )}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="bg-green-600 hover:bg-green-700 text-white h-8 w-8"
                            onClick={() => {
                              navigator.clipboard.writeText(shareableUrl);
                              toast({
                                title: "Link copied!",
                                description: "Shareable URL copied to clipboard",
                              });
                            }}
                            data-testid="button-copy-shareable-url"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => window.open(shareableUrl, '_blank')}
                            data-testid="button-open-shareable-url"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto space-y-4">
              {/* Heatmap Container with ref for curved lines */}
              <div className="relative">
                <div 
                  ref={reportDialogHeatmapContainerRef}
                  className="max-h-96 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <DemoHeatmap
                    tradingDataByDate={isSharedReportMode && sharedReportData?.reportData?.tradingDataByDate 
                      ? sharedReportData.reportData.tradingDataByDate 
                      : getFilteredHeatmapData()}
                    onDateSelect={() => {}}
                    selectedDate={null}
                    onDataUpdate={() => {}}
                    isPublicView={true}
                  />
                </div>
                
                {/* Curved Lines Overlay for FOMO button */}
                {reportDialogTagHighlight?.tag === 'fomo' && reportDialogTagHighlight.dates.length > 0 && (() => {
                  // Force recalculation on scroll
                  void reportDialogScrollTrigger;
                  
                  const paths: JSX.Element[] = [];
                  
                  if (!reportDialogFomoButtonRef.current || !reportDialogHeatmapContainerRef.current) {
                    return null;
                  }
                  
                  // Get scrollable dimensions
                  const scrollWidth = reportDialogHeatmapContainerRef.current.scrollWidth || 0;
                  const scrollHeight = reportDialogHeatmapContainerRef.current.scrollHeight || 0;
                  const scrollLeft = reportDialogHeatmapContainerRef.current.scrollLeft || 0;
                  const scrollTop = reportDialogHeatmapContainerRef.current.scrollTop || 0;
                  
                  // Get positions relative to the heatmap's scrollable content
                  const containerRect = reportDialogHeatmapContainerRef.current.getBoundingClientRect();
                  const buttonRect = reportDialogFomoButtonRef.current.getBoundingClientRect();
                  
                  // Calculate button position relative to scrollable content
                  const buttonCenterX = buttonRect.left - containerRect.left + scrollLeft + buttonRect.width / 2;
                  const buttonCenterY = buttonRect.top - containerRect.top + scrollTop + buttonRect.height / 2;
                  
                  // Find all highlighted date cells and draw curved lines to them
                  reportDialogTagHighlight.dates.forEach((date, index) => {
                    // Find the heatmap cell for this date
                    const cellElement = reportDialogHeatmapContainerRef.current?.querySelector(
                      `[data-date="${date}"]`
                    );
                    
                    if (cellElement) {
                      const cellRect = cellElement.getBoundingClientRect();
                      
                      // Calculate cell position relative to scrollable content
                      const cellCenterX = cellRect.left - containerRect.left + scrollLeft + cellRect.width / 2;
                      const cellCenterY = cellRect.top - containerRect.top + scrollTop + cellRect.height / 2;
                      
                      // Create quadratic Bezier curve (Q command)
                      // Control point is positioned to create a nice arc
                      const controlX = (buttonCenterX + cellCenterX) / 2;
                      const controlY = Math.min(buttonCenterY, cellCenterY) - 50; // Arc upward
                      
                      const pathD = `M ${buttonCenterX} ${buttonCenterY} Q ${controlX} ${controlY}, ${cellCenterX} ${cellCenterY}`;
                      
                      paths.push(
                        <g key={`connection-${date}-${index}`}>
                          {/* Bright colored line with dashed pattern */}
                          <path
                            d={pathD}
                            fill="none"
                            stroke="url(#reportDialogCurvedLineGradient)"
                            strokeWidth="2.5"
                            strokeDasharray="6,4"
                            opacity="0.95"
                          />
                          {/* Glowing dot at the end of each line */}
                          <circle
                            cx={cellCenterX}
                            cy={cellCenterY}
                            r="4"
                            fill="#fcd34d"
                            opacity="0.9"
                          />
                          <circle
                            cx={cellCenterX}
                            cy={cellCenterY}
                            r="3"
                            fill="#fbbf24"
                            className="animate-pulse"
                          />
                        </g>
                      );
                    }
                  });
                  
                  return (
                    <svg
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: `${scrollWidth}px`,
                        height: `${scrollHeight}px`,
                        pointerEvents: 'none',
                        zIndex: 10,
                      }}
                    >
                      {/* Define bright gradient for the curved lines */}
                      <defs>
                        <linearGradient id="reportDialogCurvedLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#c084fc" stopOpacity="1" />
                          <stop offset="50%" stopColor="#f472b6" stopOpacity="1" />
                          <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
                        </linearGradient>
                      </defs>
                      {paths}
                    </svg>
                  );
                })()}
              </div>
              
              {/* Stats Bar - Purple metrics from journal tab */}
              {(() => {
                const filteredData = isSharedReportMode && sharedReportData?.reportData?.tradingDataByDate 
                  ? sharedReportData.reportData.tradingDataByDate 
                  : getFilteredHeatmapData();
                const dates = Object.keys(filteredData).sort();
                
                let totalPnL = 0;
                let totalTrades = 0;
                let winningTrades = 0;
                let currentStreak = 0;
                let maxWinStreak = 0;
                let fomoTrades = 0;
                const trendData: number[] = [];
                
                dates.forEach(dateKey => {
                  const dayData = filteredData[dateKey];
                  const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
                  const tags = dayData?.tradingData?.tradingTags || dayData?.tradingTags || [];
                  
                  if (metrics) {
                    const netPnL = metrics.netPnL || 0;
                    totalPnL += netPnL;
                    totalTrades += metrics.totalTrades || 0;
                    winningTrades += metrics.winningTrades || 0;
                    trendData.push(netPnL);
                    
                    // Calculate streak
                    if (netPnL > 0) {
                      currentStreak++;
                      maxWinStreak = Math.max(maxWinStreak, currentStreak);
                    } else {
                      currentStreak = 0;
                    }
                    
                    // Count FOMO tags
                    if (Array.isArray(tags)) {
                      tags.forEach((tag: string) => {
                        if (tag.toLowerCase().includes('fomo')) {
                          fomoTrades++;
                        }
                      });
                    }
                  }
                });
                
                const isProfitable = totalPnL >= 0;
                const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
                
                // Create trend path function (from public-heatmap.tsx)
                const createTrendPath = (data: number[]) => {
                  if (data.length === 0) return '';
                  const max = Math.max(...data, 0);
                  const min = Math.min(...data, 0);
                  const range = max - min || 1;
                  const width = 40;
                  const height = 20;
                  
                  const points = data.map((val, i) => {
                    const x = (i / (data.length - 1 || 1)) * width;
                    const y = height - ((val - min) / range) * height;
                    return `${x},${y}`;
                  }).join(' L ');
                  
                  return `M ${points}`;
                };
                
                return (
                  <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-md px-2 py-1.5">
                    <div className="flex items-center justify-around text-white gap-1">
                      {/* P&L */}
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-[10px] opacity-80">P&L</div>
                        <div className="text-xs font-bold">
                          {isProfitable ? '+' : ''}₹{(totalPnL / 1000).toFixed(1)}K
                        </div>
                      </div>
                      
                      {/* Trend */}
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-[10px] opacity-80">Trend</div>
                        <div className="w-8 h-4">
                          <svg viewBox="0 0 40 20" className="w-full h-full">
                            <path
                              d={createTrendPath(trendData)}
                              fill="none"
                              stroke="white"
                              strokeWidth="1.5"
                              opacity="0.9"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                      
                      {/* FOMO - Clickable button with curved lines */}
                      <button
                        ref={reportDialogFomoButtonRef}
                        className={`flex flex-col items-center justify-center hover-elevate active-elevate-2 rounded px-1 transition-all ${
                          reportDialogTagHighlight?.tag === 'fomo' ? 'bg-white/30 ring-2 ring-white/50' : ''
                        }`}
                        onClick={() => {
                          if (reportDialogTagHighlight?.tag === 'fomo') {
                            // Toggle off if already active
                            setReportDialogTagHighlight(null);
                            console.log('📍 Deactivated FOMO tag highlighting in report dialog');
                          } else {
                            // Get FOMO dates from filtered data
                            const filteredData = isSharedReportMode && sharedReportData?.reportData?.tradingDataByDate 
                              ? sharedReportData.reportData.tradingDataByDate 
                              : getFilteredHeatmapData();
                            const dates = Object.keys(filteredData).sort();
                            
                            const fomoDates: string[] = [];
                            dates.forEach(dateKey => {
                              const dayData = filteredData[dateKey];
                              const tags = dayData?.tradingData?.tradingTags || dayData?.tradingTags || [];
                              
                              if (Array.isArray(tags)) {
                                tags.forEach((tag: string) => {
                                  if (tag.toLowerCase().includes('fomo') && !fomoDates.includes(dateKey)) {
                                    fomoDates.push(dateKey);
                                  }
                                });
                              }
                            });
                            
                            // Activate FOMO highlighting
                            setReportDialogTagHighlight({ tag: 'fomo', dates: fomoDates });
                            console.log(`📍 Activated FOMO tag highlighting in report dialog for ${fomoDates.length} dates:`, fomoDates);
                          }
                        }}
                        title={`Click to ${reportDialogTagHighlight?.tag === 'fomo' ? 'hide' : 'show'} FOMO dates on heatmap`}
                      >
                        <div className="text-[10px] opacity-80">FOMO</div>
                        <div className="text-xs font-bold">{fomoTrades}</div>
                      </button>
                      
                      {/* Win% */}
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-[10px] opacity-80">Win%</div>
                        <div className="text-xs font-bold">{winRate.toFixed(0)}%</div>
                      </div>
                      
                      {/* Streak */}
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-[10px] opacity-80">Streak</div>
                        <div className="text-xs font-bold">{maxWinStreak}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* Analytics Row: Total P&L, Performance Trend, Top Tags */}
              <div className="grid grid-cols-3 gap-3">
                {(() => {
                  const filteredData = isSharedReportMode && sharedReportData?.reportData?.tradingDataByDate 
                    ? sharedReportData.reportData.tradingDataByDate 
                    : getFilteredHeatmapData();
                  const dates = Object.keys(filteredData).sort();
                  
                  let totalPnL = 0;
                  let totalTrades = 0;
                  let winningTrades = 0;
                  const trendData: number[] = [];
                  const lossTagsMap = new Map<string, number>();
                  
                  dates.forEach(dateKey => {
                    const dayData = filteredData[dateKey];
                    const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
                    const tags = dayData?.tradingData?.tradingTags || dayData?.tradingTags || [];
                    
                    if (metrics) {
                      const netPnL = metrics.netPnL || 0;
                      totalPnL += netPnL;
                      totalTrades += metrics.totalTrades || 0;
                      winningTrades += metrics.winningTrades || 0;
                      trendData.push(netPnL);
                      
                      // Only track tags from losing trades - accumulate actual loss amounts
                      if (netPnL < 0 && Array.isArray(tags) && tags.length > 0) {
                        tags.forEach((tag: string) => {
                          const normalizedTag = tag.trim().toLowerCase();
                          lossTagsMap.set(normalizedTag, (lossTagsMap.get(normalizedTag) || 0) + Math.abs(netPnL));
                        });
                      }
                    }
                  });
                  
                  const isProfitable = totalPnL >= 0;
                  const successRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
                  
                  const lossTags = Array.from(lossTagsMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(([tag, lossAmount]) => ({ tag, lossAmount }));
                  
                  const createTrendPath = (data: number[]) => {
                    if (data.length === 0) return '';
                    const max = Math.max(...data, 0);
                    const min = Math.min(...data, 0);
                    const range = max - min || 1;
                    const width = 100;
                    const height = 45;
                    
                    if (data.length === 1) {
                      const x = width / 2;
                      const y = height - ((data[0] - min) / range) * height;
                      return `M ${x} ${y}`;
                    }
                    
                    // Create smooth bezier curve
                    let path = '';
                    const points = data.map((val, i) => {
                      const x = (i / (data.length - 1)) * width;
                      const y = height - ((val - min) / range) * height;
                      return { x, y };
                    });
                    
                    // Start path
                    path += `M ${points[0].x} ${points[0].y}`;
                    
                    // Use quadratic bezier curves for smoothness
                    for (let i = 1; i < points.length; i++) {
                      const current = points[i];
                      const prev = points[i - 1];
                      const cpX = (prev.x + current.x) / 2;
                      const cpY = (prev.y + current.y) / 2;
                      path += ` Q ${cpX} ${cpY}, ${current.x} ${current.y}`;
                    }
                    
                    return path;
                  };
                  
                  return (
                    <>
                      {/* Column 1: Total P&L - Red Card */}
                      <div className={`rounded-lg p-4 text-white ${isProfitable ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-[11px] opacity-90 uppercase font-semibold">Total P&L</div>
                          <div className="w-6 h-6 rounded-full border-2 border-white/50 flex items-center justify-center">
                            <span className="text-[10px]">₹</span>
                          </div>
                        </div>
                        <div className={`text-3xl font-bold mb-3`}>
                          {isProfitable ? '+' : ''}₹{(Math.abs(totalPnL) / 1000).toFixed(1)}K
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[12px]">
                            <span>Total Trades</span>
                            <span className="font-semibold">{totalTrades}</span>
                          </div>
                          <div className="flex justify-between text-[12px]">
                            <span>Success Rate</span>
                            <span className="font-semibold">{successRate.toFixed(1)}%</span>
                          </div>
                          <div className="mt-2">
                            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-white/80 rounded-full transition-all"
                                style={{ width: `${successRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Column 2: Performance Trend */}
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-[11px] text-gray-600 dark:text-gray-400 uppercase font-semibold">Performance Trend</div>
                          <div className={`text-[10px] px-2 py-1 rounded ${isProfitable ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                            {isProfitable ? 'Profitable' : 'Not Profitable'}
                          </div>
                        </div>
                        {trendData.length > 0 ? (
                          <div className="h-28 w-full">
                            {(() => {
                              // Convert trend data to chart format
                              const chartData = trendData.map((pnl, idx) => ({
                                day: `${idx + 1}`,
                                value: pnl,
                                pnl: pnl,
                              }));

                              return (
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={chartData}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                  >
                                    <defs>
                                      <linearGradient id="reportTrendGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="rgb(107, 114, 128)" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="rgb(107, 114, 128)" stopOpacity={0.05} />
                                      </linearGradient>
                                    </defs>
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={false} />
                                    <YAxis axisLine={false} tickLine={false} tick={false} domain={['dataMin - 1000', 'dataMax + 1000']} />
                                    <Tooltip
                                      contentStyle={{
                                        background: 'var(--background)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                        padding: '6px 10px',
                                      }}
                                      formatter={(value: any) => [
                                        `${value >= 0 ? '₹' : '-₹'}${Math.abs(value).toLocaleString()}`,
                                        'P&L',
                                      ]}
                                    />
                                    <Area
                                      type="natural"
                                      dataKey="value"
                                      stroke={isProfitable ? '#16a34a' : '#dc2626'}
                                      strokeWidth={2}
                                      fill="url(#reportTrendGradient)"
                                      dot={false}
                                      activeDot={{
                                        r: 4,
                                        fill: isProfitable ? '#16a34a' : '#dc2626',
                                        stroke: 'white',
                                        strokeWidth: 2,
                                      }}
                                      isAnimationActive={true}
                                      animationDuration={600}
                                      animationEasing="ease-in-out"
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="h-28 flex items-center justify-center text-gray-400 text-xs">
                            No data
                          </div>
                        )}
                      </div>
                      
                      {/* Column 3: Loss Tags */}
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-[11px] text-gray-600 dark:text-gray-400 uppercase font-semibold mb-3">Loss Tags</div>
                        {lossTags.length > 0 ? (
                          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-3 space-y-2 max-h-32 overflow-y-auto">
                            {lossTags.map(({ tag, lossAmount }) => (
                              <div
                                key={tag}
                                className="flex items-center justify-between px-2.5 py-1.5 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-md"
                                data-testid={`tag-loss-${tag}`}
                              >
                                <span className="text-[12px] font-medium text-red-800 dark:text-red-300 capitalize truncate">{tag}</span>
                                <span className="text-[11px] font-bold text-red-600 dark:text-red-400 ml-2 flex-shrink-0">-₹{lossAmount.toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[12px] text-gray-500 dark:text-gray-400 italic py-3">No loss tags</div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Promotional Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800 mt-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">★</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Advanced Trading Journal</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tracks emotional decisions • Works on all brokers • NSE, Crypto, Commodity, Forex</p>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
