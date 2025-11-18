import { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Play, 
  Pause,
  Calendar,
  TrendingUp,
  Zap,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface BannerContent {
  id: string;
  type: 'live_stream' | 'ad' | 'update' | 'content';
  title: string;
  description: string;
  imageUrl?: string;
  youtubeEmbedUrl?: string;
  date?: string;
  isLive?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

const getDefaultBannerContent = (youtubeUrl?: string | null): BannerContent[] => {
  return [
    {
      id: '1', 
      type: 'live_stream',
      title: 'CNBC Live Stream',
      description: 'Watch live market analysis and trading strategies',
      youtubeEmbedUrl: youtubeUrl || 'https://www.youtube.com/embed/0AzLJkgUtAo?enablejsapi=1&modestbranding=1&controls=0&showinfo=0&rel=0&pp=ygUJY25iYyBsaXZl',
      isLive: true,
      priority: 'high'
    },
    {
      id: '2',
      type: 'content',
      title: 'Market Analysis Update',
      description: 'Latest market trends and analysis',
      date: '9 Sep 2024'
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
};

export function LiveBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCarouselPlaying, setIsCarouselPlaying] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [youtubeUrl, setYoutubeUrl] = useState<string>('https://www.youtube.com/embed/0AzLJkgUtAo?enablejsapi=1&modestbranding=1&controls=0&showinfo=0&rel=0&pp=ygUJY25iYyBsaXZl');

  // Load saved URL from localStorage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('youtube_banner_url');
    if (savedUrl) {
      const cleanUrl = savedUrl.includes('?') 
        ? `${savedUrl}&modestbranding=1&controls=0&showinfo=0&rel=0`
        : `${savedUrl}?modestbranding=1&controls=0&showinfo=0&rel=0`;
      setYoutubeUrl(cleanUrl);
    }
  }, []);

  // Listen for URL updates from LivestreamAdsControl
  useEffect(() => {
    const handleUrlUpdate = (event: CustomEvent) => {
      const newUrl = event.detail.url;
      if (newUrl) {
        const cleanUrl = newUrl.includes('?') 
          ? `${newUrl}&modestbranding=1&controls=0&showinfo=0&rel=0`
          : `${newUrl}?modestbranding=1&controls=0&showinfo=0&rel=0`;
        setYoutubeUrl(cleanUrl);
        setCurrentIndex(0);
      } else {
        setYoutubeUrl('https://www.youtube.com/embed/0AzLJkgUtAo?enablejsapi=1&modestbranding=1&controls=0&showinfo=0&rel=0&pp=ygUJY25iYyBsaXZl');
        setCurrentIndex(0);
      }
    };

    window.addEventListener('livestream-url-updated', handleUrlUpdate as EventListener);
    return () => {
      window.removeEventListener('livestream-url-updated', handleUrlUpdate as EventListener);
    };
  }, []);

  const bannerContent = useMemo(() => {
    return getDefaultBannerContent(youtubeUrl);
  }, [youtubeUrl]);
  
  const currentContent = bannerContent[currentIndex];

  // Carousel auto-rotation - STOPS when video is playing
  useEffect(() => {
    if (!isCarouselPlaying) return;
    
    // STOP carousel if YouTube video is playing
    if (currentContent.youtubeEmbedUrl && isVideoPlaying) {
      console.log('⏸️ Carousel PAUSED - YouTube video is playing');
      return;
    }
    
    // Run carousel normally when video is NOT playing
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerContent.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isCarouselPlaying, isVideoPlaying, currentContent.youtubeEmbedUrl, bannerContent.length]);

  // Handle scroll - pause video when scrolling
  useEffect(() => {
    if (!currentContent.youtubeEmbedUrl) return;

    const handleScroll = () => {
      if (isVideoPlaying && iframeRef.current) {
        // Pause YouTube video
        iframeRef.current.contentWindow?.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}', 
          '*'
        );
        setIsVideoPlaying(false);
        console.log('⏸️ Video paused due to scroll');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentContent.youtubeEmbedUrl, isVideoPlaying]);

  const pauseYouTube = () => {
    if (iframeRef.current && currentContent.youtubeEmbedUrl) {
      iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    }
  };

  (window as any).pauseBannerYouTube = pauseYouTube;

  const navigateLeft = () => {
    setCurrentIndex((prev) => prev > 0 ? prev - 1 : bannerContent.length - 1);
  };

  const navigateRight = () => {
    setCurrentIndex((prev) => (prev + 1) % bannerContent.length);
  };

  const getBadgeStyle = (type: string, priority?: string) => {
    switch (type) {
      case 'live_stream':
        return 'bg-red-600 hover:bg-red-700';
      case 'update':
        if (priority === 'high') {
          return 'bg-orange-600 hover:bg-orange-700';
        }
        return 'bg-blue-600 hover:bg-blue-700';
      case 'ad':
        return 'bg-purple-600 hover:bg-purple-700';
      default:
        return 'bg-indigo-600 hover:bg-indigo-700';
    }
  };

  const getBadgeIcon = (type: string) => {
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

  const toggleYouTubePlayback = () => {
    if (!iframeRef.current || !currentContent.youtubeEmbedUrl) return;
    
    if (isVideoPlaying) {
      // Pause video
      iframeRef.current.contentWindow?.postMessage(
        '{"event":"command","func":"pauseVideo","args":""}', 
        '*'
      );
      setIsVideoPlaying(false);
      console.log('⏸️ Video PAUSED - Carousel will RESUME');
    } else {
      // Play video
      iframeRef.current.contentWindow?.postMessage(
        '{"event":"command","func":"playVideo","args":""}', 
        '*'
      );
      setIsVideoPlaying(true);
      console.log('▶️ Video PLAYING - Carousel will STOP');
    }
  };

  return (
    <Card className="w-full h-32 md:h-48 relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 border-2 border-indigo-400/30">
      <div className="absolute inset-0 flex items-center justify-center">
        {currentContent.youtubeEmbedUrl ? (
          <div className="relative w-full h-full">
            {/* Clean YouTube Video */}
            <iframe
              ref={iframeRef}
              className="absolute inset-0 w-full h-full"
              src={currentContent.youtubeEmbedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              data-testid="youtube-iframe"
            />
            
            {/* Top-left corner controls */}
            <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleYouTubePlayback}
                className="h-8 w-8 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
                data-testid="button-youtube-toggle"
              >
                {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              
              {currentContent.isLive && (
                <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-0.5 flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center px-4 md:px-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge 
                className={`${getBadgeStyle(currentContent.type, currentContent.priority)} text-white flex items-center gap-1`}
                data-testid={`badge-${currentContent.type}`}
              >
                {getBadgeIcon(currentContent.type)}
                <span>{currentContent.type.replace('_', ' ').toUpperCase()}</span>
              </Badge>
              {currentContent.date && (
                <span className="text-xs text-indigo-300">{currentContent.date}</span>
              )}
            </div>
            <h2 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2">
              {currentContent.title}
            </h2>
            <p className="text-sm md:text-base text-indigo-200 line-clamp-2">
              {currentContent.description}
            </p>
          </div>
        )}
      </div>

      {/* Navigation arrows */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none">
        <Button
          size="icon"
          variant="ghost"
          onClick={navigateLeft}
          className="pointer-events-auto h-8 w-8 md:h-10 md:w-10 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white"
          data-testid="button-banner-left"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={navigateRight}
          className="pointer-events-auto h-8 w-8 md:h-10 md:w-10 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white"
          data-testid="button-banner-right"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </Button>
      </div>

      {/* Progress indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {bannerContent.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex 
                ? 'w-6 bg-white' 
                : 'w-1.5 bg-white/40 hover:bg-white/60'
            }`}
            data-testid={`button-indicator-${index}`}
          />
        ))}
      </div>
    </Card>
  );
}
