import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Calendar,
  TrendingUp,
  Zap,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import bannerImage from '@assets/image_1757245857707.png';

interface BannerContent {
  id: string;
  type: 'live_stream' | 'ad' | 'update' | 'content';
  title: string;
  description: string;
  imageUrl?: string;
  date?: string;
  isLive?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

const sampleBannerContent: BannerContent[] = [
  {
    id: '1',
    type: 'content',
    title: 'Market Analysis Update',
    description: 'Latest market trends and analysis',
    imageUrl: bannerImage,
    date: '9 Sep 2024'
  },
  {
    id: '2', 
    type: 'live_stream',
    title: 'Live Market Analysis',
    description: 'Real-time market discussion with experts',
    isLive: true,
    priority: 'high'
  },
  {
    id: '3',
    type: 'update',
    title: 'Important Trading Update',
    description: 'New features and market alerts now available',
    priority: 'high'
  },
  {
    id: '4',
    type: 'ad',
    title: 'Premium Trading Tools',
    description: 'Upgrade to access advanced analytics and insights',
    priority: 'medium'
  }
];

export function LiveBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  const currentContent = sampleBannerContent[currentIndex];

  // Auto-rotate content every 5 seconds when playing
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sampleBannerContent.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  const navigateLeft = () => {
    setCurrentIndex((prev) => prev > 0 ? prev - 1 : sampleBannerContent.length - 1);
  };

  const navigateRight = () => {
    setCurrentIndex((prev) => (prev + 1) % sampleBannerContent.length);
  };

  const getBadgeStyle = (type: string, priority?: string) => {
    switch (type) {
      case 'live_stream':
        return 'bg-red-500 text-white animate-pulse';
      case 'update':
        return priority === 'high' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white';
      case 'ad':
        return 'bg-green-500 text-white';
      default:
        return 'bg-indigo-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'live_stream':
        return <Zap className="w-3 h-3" />;
      case 'update':
        return <Bell className="w-3 h-3" />;
      case 'ad':
        return <TrendingUp className="w-3 h-3" />;
      default:
        return <Calendar className="w-3 h-3" />;
    }
  };

  return (
    <Card className="w-full h-48 relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 border-2 border-indigo-400/30">
      {/* Background Image/Content */}
      <div className="absolute inset-0">
        {currentContent.imageUrl ? (
          <img
            src={currentContent.imageUrl}
            alt={currentContent.title}
            className="w-full h-full object-cover opacity-70"
            data-testid="banner-background-image"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-blue-600/20" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6">
        {/* Top Bar with Type Badge and Controls */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Badge className={`flex items-center gap-1 ${getBadgeStyle(currentContent.type, currentContent.priority)}`}>
              {getTypeIcon(currentContent.type)}
              {currentContent.type === 'live_stream' && currentContent.isLive ? 'LIVE' : 
               currentContent.type.toUpperCase().replace('_', ' ')}
            </Badge>
            
            {currentContent.isLive && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-sm">Live Stream Active</span>
              </div>
            )}
          </div>

          {/* Media Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              onClick={() => setIsPlaying(!isPlaying)}
              data-testid="button-banner-play-pause"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              onClick={() => setIsMuted(!isMuted)}
              data-testid="button-banner-mute"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              data-testid="button-banner-fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-between">
          {/* Navigation Left */}
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20 h-10 w-10 p-0"
            onClick={navigateLeft}
            data-testid="button-banner-nav-left"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* Content Info */}
          <div className="text-center text-white max-w-2xl">
            <h2 className="text-2xl font-bold mb-2" data-testid="banner-title">
              {currentContent.title}
            </h2>
            <p className="text-white/80 text-sm mb-3" data-testid="banner-description">
              {currentContent.description}
            </p>
            
            {currentContent.date && (
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs">
                <Calendar className="w-3 h-3" />
                <span data-testid="banner-date">{currentContent.date}</span>
              </div>
            )}
          </div>

          {/* Navigation Right */}
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20 h-10 w-10 p-0"
            onClick={navigateRight}
            data-testid="button-banner-nav-right"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Bottom Progress Indicators */}
        <div className="flex items-center justify-center gap-2">
          {sampleBannerContent.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-6' : 'bg-white/40'
              }`}
              onClick={() => setCurrentIndex(index)}
              data-testid={`banner-indicator-${index}`}
            />
          ))}
        </div>
      </div>

      {/* Live Streaming Indicator */}
      {currentContent.isLive && (
        <div className="absolute top-4 right-20 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold animate-pulse">
          ● LIVE
        </div>
      )}
    </Card>
  );
}